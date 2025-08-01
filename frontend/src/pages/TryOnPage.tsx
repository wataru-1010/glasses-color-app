import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// カラーデータの定義
const colorData = {
  fullColor: [
    { name: 'フェアオークル FAOC', color: '#5f4537' },
    { name: 'グロウオレンジ GLOR', color: '#714432' },
    { name: 'フェアブラウン FABR', color: '#6e5f57' },
    { name: 'グロウブラム GLPL', color: '#726378' },
    { name: 'フェアマロン FAMN', color: '#8a6963' },
    { name: 'グロウボルドー GLBD', color: '#8c6e70' },
    { name: 'トゥルーパープル TRPP', color: '#83617a' },
    { name: 'ブリーズグリーン BZGN', color: '#687c81' },
    { name: 'ブリーズネイビー BZNV', color: '#62707f' },
    { name: 'トゥルーグレイ TRGY', color: '#474d55' },
    { name: 'ブリーズブルー BZBL', color: '#63698f' },
    { name: 'トゥルーバイオレット TRVI', color: '#615566' }
  ],
  gradation: [
    { name: 'フェアオークル FAOC', color: '#5f4537' },
    { name: 'グロウオレンジ GLOR', color: '#714432' },
    { name: 'フェアブラウン FABR', color: '#6e5f57' },
    { name: 'グロウブラム GLPL', color: '#726378' },
    { name: 'フェアマロン FAMN', color: '#8a6963' },
    { name: 'グロウボルドー GLBD', color: '#8c6e70' },
    { name: 'トゥルーパープル TRPP', color: '#83617a' },
    { name: 'ブリーズグリーン BZGN', color: '#687c81' },
    { name: 'ブリーズネイビー BZNV', color: '#62707f' },
    { name: 'トゥルーグレイ TRGY', color: '#474d55' },
    { name: 'ブリーズブルー BZBL', color: '#63698f' },
    { name: 'トゥルーバイオレット TRVI', color: '#615566' }
  ],
  double: [
    { name: 'ブリーズブルー BZBL', color: '#63698f' },
    { name: 'トゥルーバイオレット TRVI', color: '#615566' }
  ]
};

const intensityOptions = {
  fullColor: ['10%', '15%', '25%', '35%', '50%'],
  gradation: ['15%', '25%', '35%', '50%'],
  double: ['50%/20%']
};

function TryOnPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // States
  const [activeTab, setActiveTab] = useState<'fullColor' | 'gradation' | 'double'>('fullColor');
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedIntensity, setSelectedIntensity] = useState(0);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 撮影された画像
  const capturedImage = location.state?.capturedImage;

  // カラー適用関数（useCallbackでメモ化）
  const applyColorToImage = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx || !img.complete) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    // 現在選択されているカラー
    const currentColors = colorData[activeTab];
    const selectedColorValue = currentColors[selectedColor]?.color || '#5f4537';
    const currentIntensities = intensityOptions[activeTab];
    const intensityValue = currentIntensities[selectedIntensity] || '25%';
    
    // パーセンテージを数値に変換
    let intensity = 0.25;
    if (intensityValue.includes('/')) {
      intensity = 0.5;
    } else {
      intensity = parseInt(intensityValue) / 100;
    }

    // HEXカラーをRGBに変換
    const hex = selectedColorValue.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    try {
      // バックエンドAPIでレンズ検出を試行
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('file', imageBlob, 'image.jpg');

      // Railway バックエンド API URL
      const apiUrl = process.env.REACT_APP_API_URL 
        ? `${process.env.REACT_APP_API_URL}/detect-lens`
        : 'http://localhost:8001/detect-lens';
    
      console.log('🔗 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const lensData = await response.json();
        
        if (lensData.success && lensData.lenses) {
          // 🎯 レンズ部分のみにカラー適用（高精度版）
          applyColorToLenses(ctx, canvas, lensData.lenses, r, g, b, intensity);
          console.log('✅ レンズ検出成功:', lensData);
          return;
        }
      }
    } catch (error) {
      console.log('🔄 レンズ検出API接続失敗、フォールバック実行:', error);
    }

    // フォールバック: 従来の顔全体適用（UIは変わらず動作継続）
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * (1 - intensity) + r * intensity);
      data[i + 1] = Math.min(255, data[i + 1] * (1 - intensity) + g * intensity);
      data[i + 2] = Math.min(255, data[i + 2] * (1 - intensity) + b * intensity);
    }

    ctx.putImageData(imageData, 0, 0);
  }, [selectedColor, selectedIntensity, activeTab]);

  // レンズ領域のみにカラーを適用する関数
  const applyColorToLenses = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, lenses: any, r: number, g: number, b: number, intensity: number) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // スケール計算
    const scaleX = canvas.width / 640;  // APIは640x480ベース
    const scaleY = canvas.height / 480;
    
    // 左右レンズの領域を計算
    const leftLens = {
      x: Math.round(lenses.left.x * scaleX),
      y: Math.round(lenses.left.y * scaleY),
      width: Math.round(lenses.left.width * scaleX),
      height: Math.round(lenses.left.height * scaleY)
    };
    
    const rightLens = {
      x: Math.round(lenses.right.x * scaleX),
      y: Math.round(lenses.right.y * scaleY),
      width: Math.round(lenses.right.width * scaleX),
      height: Math.round(lenses.right.height * scaleY)
    };

    // 楕円形レンズマスクでカラー適用
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        
        // 左レンズ内かチェック（楕円形）
        const leftInside = isInsideEllipse(x, y, 
          leftLens.x + leftLens.width / 2, 
          leftLens.y + leftLens.height / 2,
          leftLens.width / 2, 
          leftLens.height / 2
        );
        
        // 右レンズ内かチェック（楕円形）
        const rightInside = isInsideEllipse(x, y,
          rightLens.x + rightLens.width / 2,
          rightLens.y + rightLens.height / 2,
          rightLens.width / 2,
          rightLens.height / 2
        );

        if (leftInside || rightInside) {
          // レンズ領域のみカラー適用
          data[pixelIndex] = Math.min(255, data[pixelIndex] * (1 - intensity) + r * intensity);
          data[pixelIndex + 1] = Math.min(255, data[pixelIndex + 1] * (1 - intensity) + g * intensity);
          data[pixelIndex + 2] = Math.min(255, data[pixelIndex + 2] * (1 - intensity) + b * intensity);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // 楕円内判定関数
  const isInsideEllipse = (x: number, y: number, centerX: number, centerY: number, radiusX: number, radiusY: number): boolean => {
    const dx = x - centerX;
    const dy = y - centerY;
    return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
  };

  useEffect(() => {
    if (capturedImage && imageRef.current) {
      imageRef.current.onload = () => {
        applyColorToImage();
      };
      imageRef.current.src = capturedImage;
    }
  }, [capturedImage, selectedColor, selectedIntensity, activeTab, applyColorToImage]);

  // タブ変更時にselectedColorとselectedIntensityをリセット
  useEffect(() => {
    setSelectedColor(0);
    setSelectedIntensity(0);
  }, [activeTab]);

  const saveImage = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'glasses-color-preview.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => {
    navigate('/camera');
  };

  const getTabBackgroundColor = (tab: string) => {
    switch (tab) {
      case 'fullColor': return '#fef7ed';
      case 'gradation': return '#f0f4f0';
      case 'double': return '#f0f0f8';
      default: return '#ffffff';
    }
  };

  const currentColors = colorData[activeTab];
  const currentIntensities = intensityOptions[activeTab];

  return (
    <div style={{
      minHeight: '100dvh', // 動的ビューポート高さ対応
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Hiragino Sans", sans-serif',
      overflow: 'hidden'
    }}>
      
      {/* 画像表示エリア - 45% */}
      <div style={{
        height: '45vh',
        width: '100vw',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        flexShrink: 0
      }}>
        {/* 画像とCanvas */}
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <img
            ref={imageRef}
            style={{ display: 'none' }}
            alt="Captured"
          />
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>
      </div>

      {/* タブヘッダー - 6% */}
      <div style={{
        height: '6vh',
        display: 'flex',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: '#fff',
        margin: 0,
        padding: 0,
        flexShrink: 0
      }}>
        {[
          { key: 'fullColor', label: 'フルカラー' },
          { key: 'gradation', label: 'グラデーション' },
          { key: 'double', label: 'ダブル' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#2c3e50' : '#6c757d',
              borderBottom: activeTab === tab.key ? '2px solid #4a5568' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* カラー選択 + 濃度選択エリア - スクロール可能 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: getTabBackgroundColor(activeTab),
        transition: 'background-color 0.3s ease',
        padding: '8px 16px',
        margin: 0,
        overflowY: 'auto',
        minHeight: 0
      }}>
        {/* カラーグリッド（横スクロール） */}
        <div style={{
          position: 'relative',
          marginBottom: '8px',
          minHeight: '140px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '12px',
            paddingBottom: '8px',
            scrollBehavior: 'smooth',
            alignItems: 'center',
            justifyContent: window.innerWidth > 768 ? 'center' : 'flex-start',
            width: '100%'
          }}>
            {/* 2行×4列のグリッドを横スクロールで表示 */}
            <div style={{
              display: 'grid',
              gridTemplateRows: '1fr 1fr',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              minWidth: '280px'
            }}>
              {currentColors.slice(0, 8).map((colorItem, index) => (
                <div key={index} style={{ 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => setSelectedColor(index)}
                    style={{
                      width: '35px',
                      height: '35px',
                      borderRadius: '50%',
                      backgroundColor: colorItem.color,
                      border: selectedColor === index ? '2px solid #4a5568' : '1px solid #dee2e6',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: selectedColor === index ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: selectedColor === index ? '0 2px 8px rgba(74, 85, 104, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                      marginBottom: '3px'
                    }}
                    title={colorItem.name}
                  />
                  <div style={{
                    fontSize: '9px',
                    color: '#6c757d',
                    fontWeight: '500',
                    lineHeight: '1.1',
                    width: '35px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {colorItem.name.split(' ')[1] || colorItem.name}
                  </div>
                </div>
              ))}
            </div>

            {/* 追加のカラーがある場合の2つ目のグリッド */}
            {currentColors.length > 8 && (
              <div style={{
                display: 'grid',
                gridTemplateRows: '1fr 1fr',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                minWidth: '140px'
              }}>
                {currentColors.slice(8).map((colorItem, index) => (
                  <div key={index + 8} style={{ 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => setSelectedColor(index + 8)}
                      style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        backgroundColor: colorItem.color,
                        border: selectedColor === (index + 8) ? '2px solid #4a5568' : '1px solid #dee2e6',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: selectedColor === (index + 8) ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: selectedColor === (index + 8) ? '0 2px 8px rgba(74, 85, 104, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                        marginBottom: '3px'
                      }}
                      title={colorItem.name}
                    />
                    <div style={{
                      fontSize: '9px',
                      color: '#6c757d',
                      fontWeight: '500',
                      lineHeight: '1.1',
                      width: '35px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {colorItem.name.split(' ')[1] || colorItem.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 横スクロール促進アイコン */}
          {currentColors.length > 8 && (
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '12px', color: '#4a5568' }}>→</span>
            </div>
          )}
        </div>

        {/* 濃度選択 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          paddingBottom: '8px',
          paddingTop: '4px'
        }}>
          {currentIntensities.map((intensity, index) => (
            <button
              key={index}
              onClick={() => setSelectedIntensity(index)}
              style={{
                padding: '6px 12px',
                borderRadius: '15px',
                border: 'none',
                backgroundColor: selectedIntensity === index ? '#4a5568' : '#fff',
                color: selectedIntensity === index ? 'white' : '#4a5568',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedIntensity === index ? '0 2px 6px rgba(74, 85, 104, 0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
                minWidth: '50px'
              }}
            >
              {intensity}
            </button>
          ))}
        </div>
      </div>

      {/* アクションボタン - 固定 */}
      <div style={{
        height: '70px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e9ecef',
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 20px',
        margin: 0,
        flexShrink: 0
      }}>
        <button
          onClick={handleRetake}
          style={{
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '2px solid #dee2e6',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '120px',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#f8f9fa';
            target.style.borderColor = '#adb5bd';
            target.style.color = '#495057';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = 'transparent';
            target.style.borderColor = '#dee2e6';
            target.style.color = '#6c757d';
          }}
          onTouchStart={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#f8f9fa';
            target.style.transform = 'scale(0.98)';
          }}
          onTouchEnd={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = 'transparent';
            target.style.transform = 'scale(1)';
          }}
        >
          再撮影
        </button>
        <button
          onClick={saveImage}
          style={{
            backgroundColor: '#4a5568',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(74, 85, 104, 0.3)',
            minWidth: '120px',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#2d3748';
            target.style.transform = 'translateY(-1px)';
            target.style.boxShadow = '0 6px 16px rgba(74, 85, 104, 0.4)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#4a5568';
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 4px 12px rgba(74, 85, 104, 0.3)';
          }}
          onTouchStart={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#2d3748';
            target.style.transform = 'scale(0.98)';
          }}
          onTouchEnd={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#4a5568';
            target.style.transform = 'scale(1)';
          }}
        >
          画像を保存
        </button>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          
          @media (max-width: 480px) {
            .color-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
            
            .color-button {
              width: 50px !important;
              height: 50px !important;
            }
          }
        `
      }} />
    </div>
  );
}

export default TryOnPage;