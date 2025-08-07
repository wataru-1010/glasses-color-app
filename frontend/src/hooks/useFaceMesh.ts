import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface LensPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LensDetectionResult {
  left: LensPosition;
  right: LensPosition;
  confidence: number;
  ipd: number; // 瞳孔間距離
}

interface UseFaceMeshReturn {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  detectLenses: (videoElement: HTMLVideoElement, canvasWidth: number, canvasHeight: number) => Promise<LensDetectionResult | null>;
  initializeFaceMesh: () => Promise<void>;
}

export const useFaceMesh = (): UseFaceMeshReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  // MediaPipe Face Mesh初期化
  const initializeFaceMesh = useCallback(async () => {
    if (isInitialized || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('🚀 MediaPipe Face Mesh初期化開始...');

      // FilesetResolverでWASMファイルを設定
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
      );

      // FaceLandmarker作成
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU' // GPU使用で高速化
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO', // ビデオモード
        numFaces: 1 // 1人の顔のみ検出
      });

      faceLandmarkerRef.current = faceLandmarker;
      setIsInitialized(true);
      console.log('✅ MediaPipe Face Mesh初期化完了');

    } catch (err) {
      console.error('❌ MediaPipe初期化エラー:', err);
      setError(`初期化エラー: ${err instanceof Error ? err.message : String(err)}`);
      
      // フォールバック: CPU版で再試行
      try {
        console.log('🔄 CPU版で再試行...');
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU' // CPU版にフォールバック
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1
        });

        faceLandmarkerRef.current = faceLandmarker;
        setIsInitialized(true);
        setError(null);
        console.log('✅ CPU版で初期化成功');

      } catch (fallbackErr) {
        console.error('❌ CPU版でも失敗:', fallbackErr);
        setError('MediaPipe初期化に失敗しました。ブラウザを更新してください。');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading]);

  // レンズ位置検出メイン関数
  const detectLenses = useCallback(async (
    videoElement: HTMLVideoElement,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<LensDetectionResult | null> => {
    if (!faceLandmarkerRef.current || !isInitialized) {
      console.log('⚠️ MediaPipe未初期化');
      return null;
    }

    try {
      // 現在時刻を取得（MediaPipe要件）
      const timestamp = performance.now();
      
      // 顔ランドマーク検出実行
      const results = faceLandmarkerRef.current.detectForVideo(videoElement, timestamp);
      
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        console.log('⚠️ 顔が検出されませんでした');
        return null;
      }

      const landmarks = results.faceLandmarks[0];
      console.log(`✅ 顔検出成功: ${landmarks.length}個のランドマーク`);

      // 重要な目のランドマーク（MediaPipe 468点モデル）
      const leftEyePoints = [
        landmarks[33],  // 左目外側
        landmarks[7],   // 左目上部
        landmarks[163], // 左目内側
        landmarks[144], // 左目下部
        landmarks[145], // 左目下部2
        landmarks[153], // 左目下部3
        landmarks[154], // 左目上部2
        landmarks[155], // 左目上部3
        landmarks[133]  // 左目外側2
      ];

      const rightEyePoints = [
        landmarks[362], // 右目外側
        landmarks[382], // 右目上部
        landmarks[381], // 右目上部2
        landmarks[380], // 右目上部3
        landmarks[374], // 右目下部
        landmarks[373], // 右目下部2
        landmarks[390], // 右目内側
        landmarks[249], // 右目下部3
        landmarks[263]  // 右目外側2
      ];

      // 目の境界計算
      const getEyeBounds = (eyePoints: any[]) => {
        const xs = eyePoints.map(p => p.x * canvasWidth);
        const ys = eyePoints.map(p => p.y * canvasHeight);
        
        return {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys)
        };
      };

      const leftBounds = getEyeBounds(leftEyePoints);
      const rightBounds = getEyeBounds(rightEyePoints);

      // IPD計算（瞳孔間距離）
      const leftPupil = landmarks[468] || landmarks[33]; // 左瞳孔位置
      const rightPupil = landmarks[473] || landmarks[263]; // 右瞳孔位置
      const ipd = Math.sqrt(
        Math.pow((rightPupil.x - leftPupil.x) * canvasWidth, 2) +
        Math.pow((rightPupil.y - leftPupil.y) * canvasHeight, 2)
      );

      // レンズサイズ計算（IPDベース + マージン）
      const lensWidth = Math.max(ipd * 0.52, Math.abs(leftBounds.maxX - leftBounds.minX) * 1.1);
      const lensHeight = lensWidth * 0.6; // 一般的なレンズ比率

      // レンズ中心位置計算
      const leftCenter = {
        x: (leftBounds.minX + leftBounds.maxX) / 2,
        y: (leftBounds.minY + leftBounds.maxY) / 2
      };

      const rightCenter = {
        x: (rightBounds.minX + rightBounds.maxX) / 2,
        y: (rightBounds.minY + rightBounds.maxY) / 2
      };

      // 最終レンズ位置
      const leftLens: LensPosition = {
        x: leftCenter.x - lensWidth / 2,
        y: leftCenter.y - lensHeight / 2,
        width: lensWidth,
        height: lensHeight
      };

      const rightLens: LensPosition = {
        x: rightCenter.x - lensWidth / 2,
        y: rightCenter.y - lensHeight / 2,
        width: lensWidth,
        height: lensHeight
      };

      const confidence = 0.85; // MediaPipeの信頼度は高め

      console.log('👓 レンズ検出結果:', {
        left: leftLens,
        right: rightLens,
        ipd: ipd.toFixed(1),
        confidence
      });

      return {
        left: leftLens,
        right: rightLens,
        confidence,
        ipd
      };

    } catch (err) {
      console.error('❌ レンズ検出エラー:', err);
      setError(`検出エラー: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }, [isInitialized]);

  // 初期化時にMediaPipeを自動読み込み
  useEffect(() => {
    initializeFaceMesh();
  }, [initializeFaceMesh]);

  return {
    isInitialized,
    isLoading,
    error,
    detectLenses,
    initializeFaceMesh
  };
};