from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from typing import Dict, List  # 追加：型ヒント用
import numpy as np
import io
import json
import time
from app.utils.efficient_sam import EfficientSAMLensDetector

app = FastAPI(
    title="Glasses Lens Detection API", 
    version="1.0.0",
    description="高精度軽量版メガネレンズ検出API - OpenCV + scikit-image統合実装"
)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://glasses-color-app.vercel.app",
        "https://glasses-color-6qaeah2zx-wataru-1010s-projects.vercel.app", 
        "https://glasses-color-app-git-main-wataru-1010s-projects.vercel.app",
        "https://*.vercel.app",
        "https://vercel.app",
        "*"
    ],
    allow_credentials=False,  # 変更: False
    allow_methods=["GET", "POST", "OPTIONS"],  # 明示的に指定
    allow_headers=[
        "accept",
        "accept-encoding", 
        "authorization",
        "content-type",
        "dnt",
        "origin",
        "user-agent",
        "x-csrftoken",
        "x-requested-with",
        "*"
    ],
    expose_headers=["*"],
    max_age=3600
)
@app.options("/detect-lens")
async def detect_lens_options():
    return {"status": "ok"}

@app.options("/apply-color") 
async def apply_color_options():
    return {"status": "ok"}

# CORS設定（フロントエンドとの通信用）


# グローバル検出器インスタンス
lens_detector = None

@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の初期化"""
    global lens_detector
    try:
        print("🚀 Starting Glasses Lens Detection API...")
        lens_detector = EfficientSAMLensDetector()
        
        if lens_detector.load_model():
            print("✅ Lens detection system ready!")
        else:
            print("⚠️ Lens detection system initialized with warnings")
            
    except Exception as e:
        print(f"❌ Startup error: {e}")

@app.get("/")
async def root():
    """API基本情報"""
    return {
        "message": "Glasses Lens Detection API is running!",
        "version": "1.0.0",
        "system": "lightweight_multi_algorithm",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    global lens_detector
    detector_status = "ready" if lens_detector and lens_detector.load_model() else "not_ready"
    
    return {
        "status": "healthy",
        "service": "lens-detection",
        "detector_status": detector_status,
        "timestamp": time.time()
    }

@app.post("/test-detection")
async def test_detection():
    """検出器のテスト（固定画像なし）"""
    global lens_detector
    
    if not lens_detector:
        raise HTTPException(status_code=500, detail="Detector not initialized")
    
    # テスト用のダミー画像生成
    test_image = Image.new('RGB', (640, 480), color='gray')
    
    try:
        result = lens_detector.detect_glasses_lenses(test_image)
        
        return {
            "test_status": "success",
            "detector_ready": True,
            "test_result": result,
            "message": "Detector is working properly"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@app.post("/detect-lens")
async def detect_lens(file: UploadFile = File(...)):
    """
    メイン機能：画像からメガネレンズ位置を検出
    """
    global lens_detector
    
    if not lens_detector:
        raise HTTPException(status_code=500, detail="Detector not initialized")
    
    try:
        # 処理開始時間
        start_time = time.time()
        
        # ファイル形式チェック
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an image (JPEG, PNG, etc.)"
            )
        
        # 画像読み込み
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        try:
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")
        
        # RGB変換（RGBA等の場合）
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 画像サイズチェック
        width, height = image.size
        if width < 100 or height < 100:
            raise HTTPException(status_code=400, detail="Image too small (minimum 100x100)")
        
        if width > 2000 or height > 2000:
            # 大きすぎる画像はリサイズ
            image.thumbnail((1500, 1500), Image.Resampling.LANCZOS)
            width, height = image.size
        
        # レンズ検出実行
        detection_result = lens_detector.detect_glasses_lenses(image)
        
        # 処理時間計算
        processing_time = time.time() - start_time
        
        # 結果の後処理
        if detection_result["success"]:
            # 座標の正規化チェック
            lenses = detection_result["lenses"]
            
            for lens_side in ["left", "right"]:
                lens = lenses.get(lens_side, {})
                if lens:
                    # 座標が画像範囲内に収まるように調整
                    lens["x"] = max(0, min(width - lens.get("width", 0), lens.get("x", 0)))
                    lens["y"] = max(0, min(height - lens.get("height", 0), lens.get("y", 0)))
                    
                    # サイズの妥当性チェック
                    lens["width"] = max(10, min(width // 4, lens.get("width", 50)))
                    lens["height"] = max(10, min(height // 4, lens.get("height", 50)))
            
            # 成功レスポンス
            response = {
                "success": True,
                "image_info": {
                    "filename": file.filename,
                    "size": {"width": width, "height": height},
                    "format": image.format or "Unknown"
                },
                "detection_result": {
                    "lenses": detection_result["lenses"],
                    "confidence": detection_result["confidence"],
                    "quality_score": detection_result["quality_score"],
                    "detection_method": detection_result["detection_method"]
                },
                "algorithm_details": detection_result.get("algorithm_results", {}),
                "processing_info": {
                    "processing_time": f"{processing_time:.3f}s",
                    "timestamp": time.time()
                },
                "recommendations": _generate_recommendations(detection_result)
            }
            
            return response
        else:
            # 検出失敗
            raise HTTPException(
                status_code=422, 
                detail={
                    "error": "Detection failed",
                    "details": detection_result.get("error", "Unknown error"),
                    "processing_time": f"{processing_time:.3f}s"
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal processing error: {str(e)}")

def _generate_recommendations(detection_result: Dict) -> List[str]:
    """
    検出結果に基づく改善提案を生成
    """
    recommendations = []
    
    confidence = detection_result.get("confidence", 0)
    quality = detection_result.get("quality_score", 0)
    method = detection_result.get("detection_method", "")
    
    # 信頼度に基づく提案
    if confidence < 0.5:
        recommendations.append("📸 より明るい場所で撮影してください")
        recommendations.append("👓 メガネをかけた状態で撮影してください")
        recommendations.append("📏 カメラから30-50cm離れて撮影してください")
    elif confidence < 0.7:
        recommendations.append("🎯 顔全体がフレームに収まるように撮影してください")
        recommendations.append("💡 照明を調整してください")
    else:
        recommendations.append("✅ 良好な検出結果です")
    
    # 品質に基づく提案
    if quality < 0.5:
        recommendations.append("🔍 画像の解像度を上げてください")
        recommendations.append("📱 手ブレに注意して撮影してください")
    
    # 検出方法に基づく提案
    if "face_detection_failed" in method:
        recommendations.append("👤 正面を向いて撮影してください")
        recommendations.append("🎭 顔が隠れないようにしてください")
    elif "edge_detection" in method:
        recommendations.append("🖼️ 背景をシンプルにしてください")
        recommendations.append("🔲 メガネフレームがはっきり見えるようにしてください")
    elif "symmetry" in method:
        recommendations.append("⚖️ 顔を真っ直ぐに向けてください")
        recommendations.append("📐 左右対称になるよう姿勢を調整してください")
    
    # アルゴリズム統合結果に基づく提案
    algorithm_results = detection_result.get("algorithm_results", {})
    if algorithm_results:
        face_conf = algorithm_results.get("face_based", 0)
        edge_conf = algorithm_results.get("edge_based", 0)
        symmetry_conf = algorithm_results.get("symmetry_based", 0)
        
        if face_conf > 0.8:
            recommendations.append("👁️ 顔・目検出が正常に動作しています")
        elif edge_conf > 0.7:
            recommendations.append("📏 エッジ検出によりフレームを認識しました")
        elif symmetry_conf > 0.7:
            recommendations.append("🔄 対称性解析により位置を推定しました")
    
    return recommendations

@app.get("/api-info")
async def api_info():
    """API詳細情報"""
    return {
        "api_name": "Glasses Lens Detection API",
        "version": "1.0.0",
        "description": "軽量版高精度メガネレンズ検出システム",
        "algorithms": [
            "Face & Eye Detection (OpenCV Haar Cascades)",
            "Edge Detection & Hough Line Transform",
            "Symmetry Analysis & Profile Matching",
            "Multi-Algorithm Integration"
        ],
        "supported_formats": ["JPEG", "PNG", "WEBP", "BMP"],
        "max_image_size": "2000x2000px (auto-resize)",
        "min_image_size": "100x100px",
        "expected_accuracy": "70-75% (lightweight version)",
        "processing_time": "0.1-0.5s per image",
        "features": {
            "multi_algorithm_integration": True,
            "confidence_scoring": True,
            "quality_assessment": True,
            "automatic_coordinate_normalization": True,
            "intelligent_recommendations": True
        }
    }

@app.post("/batch-detect")
async def batch_detect(files: List[UploadFile] = File(...)):
    """
    バッチ処理：複数画像の一括検出（開発・テスト用）
    """
    global lens_detector
    
    if not lens_detector:
        raise HTTPException(status_code=500, detail="Detector not initialized")
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed in batch")
    
    results = []
    total_start_time = time.time()
    
    for i, file in enumerate(files):
        try:
            # 個別ファイル処理
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # 検出実行
            detection_result = lens_detector.detect_glasses_lenses(image)
            
            results.append({
                "file_index": i,
                "filename": file.filename,
                "success": detection_result["success"],
                "result": detection_result if detection_result["success"] else {"error": detection_result.get("error")}
            })
            
        except Exception as e:
            results.append({
                "file_index": i,
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    total_processing_time = time.time() - total_start_time
    
    return {
        "batch_results": results,
        "summary": {
            "total_files": len(files),
            "successful_detections": sum(1 for r in results if r["success"]),
            "failed_detections": sum(1 for r in results if not r["success"]),
            "total_processing_time": f"{total_processing_time:.3f}s",
            "average_time_per_image": f"{total_processing_time/len(files):.3f}s"
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Glasses Lens Detection API Server...")
    print("📊 System: Lightweight Multi-Algorithm Implementation")
    print("🔧 Algorithms: Face/Eye Detection + Edge Analysis + Symmetry Detection")
    print("🎯 Expected Accuracy: 70-75%")
    print("⚡ Processing Speed: ~0.1-0.5s per image")
    print("🌐 Access: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)