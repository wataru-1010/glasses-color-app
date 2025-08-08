import { useCallback, useEffect, useState } from 'react';

// MediaPipe Face Mesh関連の型定義
interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

interface FaceMeshResult {
  faceLandmarks: FaceLandmark[][];
}

interface LensDetectionResult {
  left: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  right: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  ipd: number;
  confidence: number;
}

// MediaPipe Face Mesh Hook
export const useFaceMesh = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceMesh, setFaceMesh] = useState<any>(null);

  // MediaPipe初期化
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        console.log('🚀 MediaPipe Face Mesh初期化開始...');
        setIsLoading(true);
        setError(null);

        // @mediapipe/tasks-visionを動的インポート
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        
        console.log('📦 MediaPipeモジュール読み込み成功');

        // MediaPipe WASM files の設定
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
        );

        // Face Landmarker の初期化
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          numFaces: 1,
          minFaceDetectionConfidence: 0.7,
          minFacePresenceConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        console.log('✅ MediaPipe Face Mesh初期化完了');
        setFaceMesh(faceLandmarker);
        setIsInitialized(true);

      } catch (err) {
        console.error('❌ MediaPipe初期化エラー:', err);
        setError(`MediaPipe初期化失敗: ${err instanceof Error ? err.message : '不明なエラー'}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMediaPipe();
  }, []);

  // レンズ検出関数（改良版）
  const detectLenses = useCallback(async (
    videoElement: HTMLVideoElement,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<LensDetectionResult | null> => {
    if (!isInitialized || !faceMesh) {
      console.log('⚠️ MediaPipe未初期化');
      return null;
    }

    try {
      console.log('🎯 高精度Face Mesh検出開始');
      
      // MediaPipeで顔ランドマーク検出
      const faceMeshResults = faceMesh.detect(videoElement);
      
      if (!faceMeshResults.faceLandmarks || faceMeshResults.faceLandmarks.length === 0) {
        console.log('⚠️ 顔が検出されませんでした');
        return null;
      }

      const landmarks = faceMeshResults.faceLandmarks[0];
      console.log(`✅ 顔検出成功: ${landmarks.length}個のランドマーク`);

      // 重要なランドマークポイント（MediaPipe 468点モデル）
      const leftEyeCenter = landmarks[159];   // 左目中央
      const rightEyeCenter = landmarks[386];  // 右目中央
      const leftEyeInner = landmarks[133];    // 左目内側
      const rightEyeInner = landmarks[362];   // 右目内側
      const leftEyeOuter = landmarks[33];     // 左目外側
      const rightEyeOuter = landmarks[263];   // 右目外側
      const leftEyeTop = landmarks[159];      // 左目上部
      const leftEyeBottom = landmarks[145];   // 左目下部
      const rightEyeTop = landmarks[386];     // 右目上部
      const rightEyeBottom = landmarks[374];  // 右目下部

      // IPD（瞳孔間距離）計算
      const ipdNormalized = Math.sqrt(
        Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
        Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
      );
      const ipd = ipdNormalized * canvasWidth;

      console.log(`📏 IPD: ${ipd.toFixed(1)}px`);

      // 🆕 改良されたレンズ位置・サイズ計算
      const glassesConfig = calculateOptimalGlassesParams(ipd, canvasWidth, canvasHeight);
      
      // 左レンズ計算（改良版）
      const leftLens = calculateImprovedLensPosition(
        leftEyeCenter, leftEyeInner, leftEyeOuter, leftEyeTop, leftEyeBottom,
        glassesConfig, canvasWidth, canvasHeight, 'left'
      );

      // 右レンズ計算（改良版）
      const rightLens = calculateImprovedLensPosition(
        rightEyeCenter, rightEyeInner, rightEyeOuter, rightEyeTop, rightEyeBottom,
        glassesConfig, canvasWidth, canvasHeight, 'right'
      );

      // 信頼度計算（改良版）
      const confidence = calculateImprovedConfidence(landmarks, ipd);

      console.log(`🎯 信頼度: ${(confidence * 100).toFixed(1)}%`);
      console.log('👓 改良レンズ位置:', { leftLens, rightLens });

      return {
        left: leftLens,
        right: rightLens,
        ipd,
        confidence
      };

    } catch (error) {
      console.error('❌ レンズ検出エラー:', error);
      return null;
    }
  }, [isInitialized, faceMesh]);

  return {
    isInitialized,
    isLoading,
    error,
    detectLenses
  };
};

// 🆕 最適なメガネパラメータ計算
function calculateOptimalGlassesParams(ipd: number, canvasWidth: number, canvasHeight: number) {
  // IPDベースのレンズサイズ計算（実際のメガネの比率）
  const lensWidth = ipd * 0.65;  // IPDの65%（実測値ベース）
  const lensHeight = lensWidth * 0.75;  // 4:3比率（一般的なメガネ）
  
  // 垂直オフセット（目の位置からレンズ中央への調整）
  const verticalOffset = -lensHeight * 0.15; // レンズの15%上に調整
  
  // マージン（より自然な見た目）
  const horizontalMargin = lensWidth * 0.1;
  const verticalMargin = lensHeight * 0.1;

  return {
    lensWidth: lensWidth + horizontalMargin,
    lensHeight: lensHeight + verticalMargin,
    verticalOffset,
    aspectRatio: 0.75
  };
}

// 🆕 改良されたレンズ位置計算
function calculateImprovedLensPosition(
  eyeCenter: FaceLandmark,
  eyeInner: FaceLandmark,
  eyeOuter: FaceLandmark,
  eyeTop: FaceLandmark,
  eyeBottom: FaceLandmark,
  config: any,
  canvasWidth: number,
  canvasHeight: number,
  side: 'left' | 'right'
) {
  // 目のサイズを詳細計算
  const eyeWidth = Math.abs(eyeOuter.x - eyeInner.x) * canvasWidth;
  const eyeHeight = Math.abs(eyeTop.y - eyeBottom.y) * canvasHeight;
  
  // レンズ中央位置（垂直オフセット適用）
  const centerX = eyeCenter.x * canvasWidth;
  const centerY = (eyeCenter.y * canvasHeight) + config.verticalOffset;
  
  // レンズサイズ（目のサイズとIPDベース計算の最適化）
  const lensWidth = Math.max(config.lensWidth, eyeWidth * 1.3);
  const lensHeight = Math.max(config.lensHeight, eyeHeight * 1.5);
  
  // レンズ左上角の位置
  const x = centerX - (lensWidth / 2);
  const y = centerY - (lensHeight / 2);

  console.log(`👁️ ${side}目 - 実測: ${eyeWidth.toFixed(1)}x${eyeHeight.toFixed(1)}`);
  console.log(`🔍 ${side}レンズ - 最終: ${lensWidth.toFixed(1)}x${lensHeight.toFixed(1)}`);

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(lensWidth, canvasWidth - x),
    height: Math.min(lensHeight, canvasHeight - y)
  };
}

// 🆕 改良された信頼度計算
function calculateImprovedConfidence(landmarks: FaceLandmark[], ipd: number): number {
  // 基本信頼度
  let confidence = 0.8;
  
  // IPDが適切範囲内かチェック（50-80px が一般的）
  if (ipd >= 50 && ipd <= 80) {
    confidence += 0.1;
  } else {
    confidence -= 0.2;
  }
  
  // 顔の向きチェック（正面度）
  const leftEye = landmarks[159];
  const rightEye = landmarks[386];
  const noseTip = landmarks[1];
  
  // 鼻の位置が両目の中央に近いかチェック
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const noseDeviation = Math.abs(noseTip.x - eyeCenterX);
  
  if (noseDeviation < 0.05) {  // 正面向き
    confidence += 0.1;
  } else if (noseDeviation > 0.15) {  // 横向きすぎ
    confidence -= 0.3;
  }
  
  return Math.max(0.1, Math.min(1.0, confidence));
}