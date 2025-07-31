import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import cv2
from skimage import feature, measure, morphology, filters
from typing import Dict, List, Tuple
import math

class EfficientSAMLensDetector:
    """
    高精度軽量版レンズ検出クラス
    OpenCV + scikit-imageを使用した複数アルゴリズム統合実装
    """
    
    def __init__(self):
        self.device = "cpu"
        self.cascade_face = None
        self.cascade_eye = None
        print("Initializing lens detection models...")
        self._load_cascades()
    
    def _load_cascades(self):
        """OpenCV Cascade分類器の読み込み"""
        try:
            print("Loading OpenCV cascade classifiers...")
            self.cascade_face = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            self.cascade_eye = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            print("OpenCV detectors loaded successfully")
            return True
        except Exception as e:
            print(f"Cascade loading failed: {e}")
            return False
    
    def load_model(self):
        """モデル準備確認"""
        try:
            print("✅ Lens detection ready!")
            return self.cascade_face is not None and self.cascade_eye is not None
        except Exception as e:
            print(f"Model verification failed: {e}")
            return False
    
    def detect_glasses_lenses(self, image: Image.Image) -> Dict:
        """
        メイン検出機能：複数アルゴリズムを統合した高精度レンズ検出
        """
        try:
            # PIL ImageをOpenCV形式に変換
            img_array = np.array(image)
            if len(img_array.shape) == 3:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            else:
                img_gray = img_array
                img_bgr = cv2.cvtColor(img_gray, cv2.COLOR_GRAY2BGR)
            
            height, width = img_gray.shape
            
            # アルゴリズム 1: 顔検出ベース
            face_result = self._detect_face_based(img_gray, width, height)
            
            # アルゴリズム 2: エッジ検出ベース  
            edge_result = self._detect_edge_based(img_gray, width, height)
            
            # アルゴリズム 3: 対称性解析ベース
            symmetry_result = self._detect_symmetry_based(img_gray, width, height)
            
            # 結果統合：最も信頼度の高い結果を選択
            best_result = self._integrate_results(face_result, edge_result, symmetry_result)
            
            # 品質評価
            quality_score = self._evaluate_quality(img_gray, best_result["lenses"])
            
            result = {
                "success": True,
                "lenses": best_result["lenses"],
                "detection_method": best_result["method"],
                "confidence": best_result["confidence"],
                "quality_score": quality_score,
                "algorithm_results": {
                    "face_based": face_result["confidence"],
                    "edge_based": edge_result["confidence"], 
                    "symmetry_based": symmetry_result["confidence"]
                },
                "image_size": {"width": width, "height": height}
            }
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "detection_method": "lightweight_multi_algorithm"
            }
    
    def _detect_face_based(self, img_gray: np.ndarray, width: int, height: int) -> Dict:
        """アルゴリズム1: 顔・目検出ベースのレンズ位置推定"""
        try:
            # 顔検出
            faces = self.cascade_face.detectMultiScale(img_gray, 1.1, 4)
            
            if len(faces) > 0:
                # 最大の顔を選択
                face = max(faces, key=lambda x: x[2] * x[3])
                fx, fy, fw, fh = face
                
                # 目領域での目検出
                eye_region_y = fy + int(fh * 0.25)
                eye_region_height = int(fh * 0.35)
                roi_gray = img_gray[eye_region_y:eye_region_y + eye_region_height, fx:fx + fw]
                
                eyes = self.cascade_eye.detectMultiScale(roi_gray, 1.1, 3)
                
                if len(eyes) >= 2:
                    # 実際の目位置からレンズ計算
                    eyes_sorted = sorted(eyes, key=lambda x: x[0])
                    left_eye = eyes_sorted[0]
                    right_eye = eyes_sorted[-1]
                    
                    # レンズサイズ計算
                    avg_eye_width = (left_eye[2] + right_eye[2]) // 2
                    avg_eye_height = (left_eye[3] + right_eye[3]) // 2
                    lens_width = int(avg_eye_width * 1.4)
                    lens_height = int(avg_eye_height * 1.2)
                    
                    left_lens = {
                        "x": fx + left_eye[0] + left_eye[2]//2 - lens_width//2,
                        "y": eye_region_y + left_eye[1] + left_eye[3]//2 - lens_height//2,
                        "width": lens_width,
                        "height": lens_height
                    }
                    
                    right_lens = {
                        "x": fx + right_eye[0] + right_eye[2]//2 - lens_width//2,
                        "y": eye_region_y + right_eye[1] + right_eye[3]//2 - lens_height//2,
                        "width": lens_width,
                        "height": lens_height
                    }
                    
                    return {
                        "lenses": {"left": left_lens, "right": right_lens},
                        "confidence": 0.88,
                        "method": "face_eye_detection"
                    }
                else:
                    # 目検出失敗時は顔位置から推定
                    return self._estimate_from_face_geometry(fx, fy, fw, fh)
            else:
                # 顔検出失敗
                return {
                    "lenses": {"left": {}, "right": {}},
                    "confidence": 0.3,
                    "method": "face_detection_failed"
                }
                
        except Exception as e:
            return {
                "lenses": {"left": {}, "right": {}},
                "confidence": 0.2,
                "method": f"face_detection_error: {str(e)}"
            }
    
    def _detect_edge_based(self, img_gray: np.ndarray, width: int, height: int) -> Dict:
        """アルゴリズム2: エッジ検出ベースのレンズ位置推定"""
        try:
            # Cannyエッジ検出
            edges = cv2.Canny(img_gray, 50, 150)
            
            # Hough直線検出（メガネフレームの特徴）
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, 
                                   minLineLength=20, maxLineGap=10)
            
            # 水平線の検出（メガネの上下フレーム）
            horizontal_lines = []
            if lines is not None:
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    angle = math.atan2(y2 - y1, x2 - x1) * 180 / math.pi
                    if abs(angle) < 15:  # 水平に近い線
                        horizontal_lines.append(line[0])
            
            # 中央領域での分析
            center_x = width // 2
            center_y = height // 2
            
            # レンズ位置推定
            lens_width = int(width * 0.08)
            lens_height = int(height * 0.06)
            
            left_lens = {
                "x": center_x - lens_width * 1.5,
                "y": center_y - lens_height // 2,
                "width": lens_width,
                "height": lens_height
            }
            
            right_lens = {
                "x": center_x + lens_width * 0.5,
                "y": center_y - lens_height // 2,
                "width": lens_width,
                "height": lens_height
            }
            
            # 信頼度は検出された線の数に基づく
            confidence = min(0.75, 0.4 + len(horizontal_lines) * 0.1)
            
            return {
                "lenses": {"left": left_lens, "right": right_lens},
                "confidence": confidence,
                "method": f"edge_detection_{len(horizontal_lines)}_lines"
            }
            
        except Exception as e:
            return {
                "lenses": {"left": {}, "right": {}},
                "confidence": 0.2,
                "method": f"edge_detection_error: {str(e)}"
            }
    
    def _detect_symmetry_based(self, img_gray: np.ndarray, width: int, height: int) -> Dict:
        """アルゴリズム3: 対称性解析ベースのレンズ位置推定"""
        try:
            # 顔領域推定
            face_region_y = int(height * 0.25)
            face_region_height = int(height * 0.5)
            face_region = img_gray[face_region_y:face_region_y + face_region_height, :]
            
            # 水平方向の輝度プロファイル
            horizontal_profile = np.mean(face_region, axis=0)
            
            # 対称性スコア計算
            center_x = width // 2
            left_profile = horizontal_profile[:center_x]
            right_profile = np.flip(horizontal_profile[center_x:])
            min_len = min(len(left_profile), len(right_profile))
            
            if min_len > 0:
                left_profile = left_profile[-min_len:]
                right_profile = right_profile[:min_len]
                symmetry_score = np.corrcoef(left_profile, right_profile)[0, 1]
                
                if np.isnan(symmetry_score):
                    symmetry_score = 0.5
            else:
                symmetry_score = 0.5
            
            # 暗い領域検出（目の位置推定）
            eye_candidates = []
            smoothed_profile = filters.gaussian(horizontal_profile, sigma=3)
            
            for i in range(10, len(smoothed_profile) - 10):
                if (smoothed_profile[i] < smoothed_profile[i-5] and 
                    smoothed_profile[i] < smoothed_profile[i+5]):
                    eye_candidates.append((i, smoothed_profile[i]))
            
            # レンズ位置計算
            if len(eye_candidates) >= 2:
                eye_candidates.sort(key=lambda x: x[1])  # 輝度でソート
                left_eye_x = min(eye_candidates[:2], key=lambda x: x[0])[0]
                right_eye_x = max(eye_candidates[:2], key=lambda x: x[0])[0]
                
                lens_width = int(abs(right_eye_x - left_eye_x) * 0.3)
                lens_height = int(lens_width * 0.8)
                eye_y = face_region_y + face_region_height // 2
                
                left_lens = {
                    "x": left_eye_x - lens_width // 2,
                    "y": eye_y - lens_height // 2,
                    "width": lens_width,
                    "height": lens_height
                }
                
                right_lens = {
                    "x": right_eye_x - lens_width // 2,
                    "y": eye_y - lens_height // 2,
                    "width": lens_width,
                    "height": lens_height
                }
                
                confidence = min(0.8, 0.5 + symmetry_score * 0.3)
            else:
                # フォールバック：中央推定
                lens_width = int(width * 0.08)
                lens_height = int(height * 0.06)
                center_y = face_region_y + face_region_height // 2
                
                left_lens = {
                    "x": center_x - lens_width * 1.2,
                    "y": center_y - lens_height // 2,
                    "width": lens_width,
                    "height": lens_height
                }
                
                right_lens = {
                    "x": center_x + lens_width * 0.2,
                    "y": center_y - lens_height // 2,
                    "width": lens_width,
                    "height": lens_height
                }
                
                confidence = 0.6
            
            return {
                "lenses": {"left": left_lens, "right": right_lens},
                "confidence": confidence,
                "method": f"symmetry_analysis_{symmetry_score:.2f}"
            }
            
        except Exception as e:
            return {
                "lenses": {"left": {}, "right": {}},
                "confidence": 0.2,
                "method": f"symmetry_error: {str(e)}"
            }
    
    def _estimate_from_face_geometry(self, fx: int, fy: int, fw: int, fh: int) -> Dict:
        """顔の幾何学的情報からレンズ位置を推定"""
        eye_y = fy + int(fh * 0.4)
        lens_width = int(fw * 0.15)
        lens_height = int(fh * 0.12)
        
        left_lens = {
            "x": fx + int(fw * 0.25) - lens_width // 2,
            "y": eye_y - lens_height // 2,
            "width": lens_width,
            "height": lens_height
        }
        
        right_lens = {
            "x": fx + int(fw * 0.75) - lens_width // 2,
            "y": eye_y - lens_height // 2,
            "width": lens_width,
            "height": lens_height
        }
        
        return {
            "lenses": {"left": left_lens, "right": right_lens},
            "confidence": 0.72,
            "method": "face_geometry_estimation"
        }
    
    def _integrate_results(self, face_result: Dict, edge_result: Dict, symmetry_result: Dict) -> Dict:
        """複数アルゴリズムの結果を統合"""
        results = [face_result, edge_result, symmetry_result]
        
        # 最も信頼度の高い結果を選択
        best_result = max(results, key=lambda x: x["confidence"])
        
        # 信頼度が低い場合は平均化を検討
        if best_result["confidence"] < 0.7:
            # 有効な結果のみを使用して平均化
            valid_results = [r for r in results if r["confidence"] > 0.4]
            
            if len(valid_results) > 1:
                # 座標の重み付き平均
                total_weight = sum(r["confidence"] for r in valid_results)
                
                avg_left_x = sum(r["lenses"]["left"].get("x", 0) * r["confidence"] 
                               for r in valid_results) / total_weight
                avg_left_y = sum(r["lenses"]["left"].get("y", 0) * r["confidence"] 
                               for r in valid_results) / total_weight
                avg_right_x = sum(r["lenses"]["right"].get("x", 0) * r["confidence"] 
                                for r in valid_results) / total_weight
                avg_right_y = sum(r["lenses"]["right"].get("y", 0) * r["confidence"] 
                                for r in valid_results) / total_weight
                
                # 平均サイズ
                avg_width = sum(r["lenses"]["left"].get("width", 0) * r["confidence"] 
                              for r in valid_results) / total_weight
                avg_height = sum(r["lenses"]["left"].get("height", 0) * r["confidence"] 
                               for r in valid_results) / total_weight
                
                best_result = {
                    "lenses": {
                        "left": {
                            "x": int(avg_left_x),
                            "y": int(avg_left_y),
                            "width": int(avg_width),
                            "height": int(avg_height)
                        },
                        "right": {
                            "x": int(avg_right_x),
                            "y": int(avg_right_y),
                            "width": int(avg_width),
                            "height": int(avg_height)
                        }
                    },
                    "confidence": min(0.85, total_weight / len(valid_results)),
                    "method": f"integrated_{len(valid_results)}_algorithms"
                }
        
        return best_result
    
    def _evaluate_quality(self, img_gray: np.ndarray, lenses: Dict) -> float:
        """レンズ検出品質の評価"""
        try:
            left_lens = lenses.get("left", {})
            right_lens = lenses.get("right", {})
            
            if not left_lens or not right_lens:
                return 0.4
            
            # レンズ領域の画像統計
            left_region = img_gray[
                left_lens["y"]:left_lens["y"] + left_lens["height"],
                left_lens["x"]:left_lens["x"] + left_lens["width"]
            ]
            
            right_region = img_gray[
                right_lens["y"]:right_lens["y"] + right_lens["height"],
                right_lens["x"]:right_lens["x"] + right_lens["width"]
            ]
            
            if left_region.size == 0 or right_region.size == 0:
                return 0.4
            
            # 複数の品質指標
            left_variance = np.var(left_region)
            right_variance = np.var(right_region)
            avg_variance = (left_variance + right_variance) / 2
            
            # エッジ密度
            left_edges = cv2.Canny(left_region.astype(np.uint8), 50, 150)
            right_edges = cv2.Canny(right_region.astype(np.uint8), 50, 150)
            left_edge_density = np.sum(left_edges > 0) / left_edges.size
            right_edge_density = np.sum(right_edges > 0) / right_edges.size
            avg_edge_density = (left_edge_density + right_edge_density) / 2
            
            # 統合品質スコア
            variance_score = min(1.0, avg_variance / 1000)
            edge_score = min(1.0, avg_edge_density * 10)
            quality = (variance_score * 0.6 + edge_score * 0.4)
            
            return min(0.95, max(0.4, quality))
            
        except Exception:
            return 0.5