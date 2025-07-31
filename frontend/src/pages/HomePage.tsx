import React from 'react';
import { useNavigate } from 'react-router-dom';
import illustrationImage from '../assets/images/HomePage-img.png';

function HomePage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/terms');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Hiragino Sans", sans-serif'
    }}>
      {/* メインコンテナ */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        
        {/* タイトル */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#2c3e50',
          margin: '0 0 40px 0',
          lineHeight: '1.2',
          letterSpacing: '0.5px'
        }}>
          メガネレンズカラー試着アプリ
        </h1>

        {/* イラスト画像 */}
        <div style={{
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img 
            src={illustrationImage} 
            alt="メガネをかけた女性のイラスト"
            style={{
              maxWidth: '280px',
              width: '100%',
              height: 'auto',
              maxHeight: '35vh',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))'
            }}
          />
        </div>

        {/* 説明文 */}
        <div style={{
          marginBottom: '40px',
          maxWidth: '320px'
        }}>
          <p style={{
            fontSize: '18px',
            color: '#5d6d7e',
            lineHeight: '1.6',
            margin: '0',
            fontWeight: '400',
            letterSpacing: '0.3px'
          }}>
            お気に入りのフレームに<br />
            <span style={{ fontWeight: '600', color: '#4a5568' }}>
              アリアーテ レスのカラーレンズ
            </span><br />
            を合わせましょう
          </p>
        </div>

        {/* CTAボタン */}
        <button
          onClick={handleStart}
          style={{
            backgroundColor: '#4a5568',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '16px 48px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(74, 85, 104, 0.3)',
            letterSpacing: '0.5px',
            minWidth: '200px',
            outline: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#2d3748';
            target.style.transform = 'translateY(-2px)';
            target.style.boxShadow = '0 6px 20px rgba(74, 85, 104, 0.4)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#4a5568';
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 4px 12px rgba(74, 85, 104, 0.3)';
          }}
          onMouseDown={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(-2px) scale(1)';
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
          体験を始める
        </button>
      </div>

      {/* CSS Media Queries for responsive design */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 480px) {
            h1 {
              font-size: 24px !important;
              margin-bottom: 30px !important;
            }
            
            img {
              max-width: 240px !important;
            }
            
            p {
              font-size: 16px !important;
            }
            
            button {
              padding: 14px 40px !important;
              font-size: 16px !important;
              min-width: 180px !important;
            }
          }
          
          @media (max-height: 700px) {
            h1 {
              margin-bottom: 20px !important;
            }
            
            img {
              max-height: 25vh !important;
            }
            
            div:last-of-type {
              margin-bottom: 20px !important;
            }
          }
          
          @media (max-height: 600px) {
            h1 {
              font-size: 22px !important;
              margin-bottom: 15px !important;
            }
            
            img {
              max-height: 20vh !important;
            }
            
            p {
              font-size: 14px !important;
              margin-bottom: 20px !important;
            }
            
            button {
              padding: 12px 36px !important;
              font-size: 15px !important;
            }
          }
        `
      }} />
    </div>
  );
}

export default HomePage;