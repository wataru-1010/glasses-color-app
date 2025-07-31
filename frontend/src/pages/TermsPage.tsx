import React from 'react';
import { useNavigate } from 'react-router-dom';

function TermsPage() {
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate('/camera');
  };

  const handleDecline = () => {
    navigate('/');
  };

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Hiragino Sans", sans-serif'
    }}>
      
      {/* ヘッダー - 固定 */}
      <header style={{
        flexShrink: 0,
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#2c3e50',
          margin: '0',
          letterSpacing: '1px'
        }}>
          利用規約
        </h1>
      </header>

      {/* メインコンテンツ - スクロール可能 */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 20px',
        marginBottom: '0'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          paddingBottom: '20px'
        }}>
          
          {/* はじめに */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '24px 0 16px 0',
              letterSpacing: '0.5px'
            }}>
              はじめに
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0 0 16px 0',
              letterSpacing: '0.3px'
            }}>
              このサービスは、アリアーテ レス レンズのみでご利用いただけます。ご利用には、スマートフォンまたはタブレット端末が必要です。
            </p>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0',
              letterSpacing: '0.3px'
            }}>
              本アプリはデモンストレーションを目的に制作されており、実際のレンズの色は異なる場合があります。本アプリで表示している全てのレンズが、ユーザーの地域で入手できるわけではありません。
            </p>
          </section>

          {/* AIとサーバーの利用について */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 16px 0',
              letterSpacing: '0.5px'
            }}>
              AIとサーバーの利用について
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0',
              letterSpacing: '0.3px'
            }}>
              本アプリはAI技術とクラウドサーバーを利用しています。
            </p>
          </section>

          {/* 画像の取り扱いについて */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 16px 0',
              letterSpacing: '0.5px'
            }}>
              画像の取り扱いについて
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0 0 16px 0',
              letterSpacing: '0.3px'
            }}>
              撮影された画像は処理完了から1分以内に自動削除されます。
            </p>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0',
              letterSpacing: '0.3px'
            }}>
              画像データは保存・共有されることはありません。
            </p>
          </section>

          {/* データ保存について */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 16px 0',
              letterSpacing: '0.5px'
            }}>
              データ保存について
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0 0 16px 0',
              letterSpacing: '0.3px'
            }}>
              個人情報やユーザーデータは一切保存されません。
            </p>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0',
              letterSpacing: '0.3px'
            }}>
              完全匿名でご利用いただけます。
            </p>
          </section>

          {/* 海外サーバーの利用について */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 16px 0',
              letterSpacing: '0.5px'
            }}>
              海外サーバーの利用について
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0 0 16px 0',
              letterSpacing: '0.3px'
            }}>
              処理にはGoogle Cloud（海外サーバー）を使用しまます。
            </p>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#4a5568',
              margin: '0',
              letterSpacing: '0.3px'
            }}>
              GDPR・CCPAの国際規格に準拠しています。
            </p>
          </section>
        </div>
      </main>

      {/* フッター - 固定 */}
      <footer style={{
        flexShrink: 0,
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e9ecef'
      }}>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          {/* 同意メッセージ */}
          <p style={{
            fontSize: '14px',
            color: '#6c757d',
            textAlign: 'center',
            margin: '0 0 20px 0',
            lineHeight: '1.6',
            letterSpacing: '0.2px'
          }}>
            続行することで上記の利用規約を読み、<br />
            理解いただいたと認識します。
          </p>

          {/* ボタングループ */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* 拒否するボタン */}
            <button
              onClick={handleDecline}
              style={{
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '2px solid #dee2e6',
                borderRadius: '25px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                letterSpacing: '0.5px',
                minWidth: '120px'
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
              拒否する
            </button>

            {/* 同意するボタン */}
            <button
              onClick={handleAccept}
              style={{
                backgroundColor: '#4a5568',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(74, 85, 104, 0.3)',
                outline: 'none',
                letterSpacing: '0.5px',
                minWidth: '120px'
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
              同意する
            </button>
          </div>
        </div>
      </footer>

      {/* レスポンシブCSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 480px) {
            header {
              padding: 16px !important;
            }
            
            header h1 {
              font-size: 24px !important;
            }
            
            main {
              padding: 0 16px !important;
            }
            
            section h2 {
              font-size: 18px !important;
              margin: 20px 0 12px 0 !important;
            }
            
            section p {
              font-size: 14px !important;
              margin-bottom: 12px !important;
            }
            
            footer {
              padding: 16px !important;
            }
            
            footer p {
              font-size: 13px !important;
              margin-bottom: 16px !important;
            }
            
            footer div {
              flex-direction: column !important;
              gap: 8px !important;
            }
            
            footer button {
              padding: 10px 28px !important;
              font-size: 15px !important;
              min-width: 100px !important;
              width: 100% !important;
              max-width: 200px !important;
            }
          }
          
          @media (max-height: 700px) {
            header {
              padding: 12px 20px !important;
            }
            
            header h1 {
              font-size: 24px !important;
            }
            
            section {
              margin-bottom: 24px !important;
            }
            
            section h2 {
              margin: 16px 0 12px 0 !important;
            }
            
            footer {
              padding: 16px 20px !important;
            }
          }
          
          @media (max-height: 600px) {
            header h1 {
              font-size: 22px !important;
            }
            
            section {
              margin-bottom: 20px !important;
            }
            
            section h2 {
              font-size: 18px !important;
              margin: 12px 0 8px 0 !important;
            }
            
            section p {
              font-size: 14px !important;
              line-height: 1.6 !important;
              margin-bottom: 8px !important;
            }
            
            footer p {
              font-size: 13px !important;
              margin-bottom: 12px !important;
            }
          }
        `
      }} />
    </div>
  );
}

export default TermsPage;