// src/components/ErrorBoundary.tsx (新規作成)

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MediaPipeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 MediaPipe Error Boundary caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 MediaPipe Error Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ システムエラー</h2>
            <p className="text-gray-600 mb-4">
              MediaPipe Face Meshの初期化に失敗しました。
            </p>
            <div className="bg-red-50 p-3 rounded mb-4">
              <p className="text-sm text-red-700">
                {this.state.error?.message || '不明なエラーが発生しました'}
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                🔄 再読み込み
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ← 戻る
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>💡 解決方法:</p>
              <ul className="text-left mt-2 space-y-1">
                <li>• ブラウザを更新してください</li>
                <li>• カメラへのアクセスを許可してください</li>
                <li>• 安定したネット環境で再試行してください</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}