export default async function handler(req, res) {
  console.log('🔧 Proxy request:', req.method, req.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '3600'
  };

  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'Preflight OK' });
  }

  try {
    const RENDER_API_URL = 'https://glasses-color-app.onrender.com';
    const targetPath = req.query.path || 'detect-lens';
    const targetUrl = `${RENDER_API_URL}/${targetPath}`;
    
    console.log('🎯 Proxying to:', targetUrl);

    // FormData形式でのプロキシ転送
    const formData = new FormData();
    
    // リクエストボディからBase64画像を取得
    if (req.method === 'POST' && req.body) {
      const requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      if (requestData.image) {
        // Base64をBlobに変換してFormDataに追加
        const base64Data = requestData.image;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        formData.append('file', blob, 'image.jpg');
        console.log('📎 FormData created with image blob');
      }
    }

    // RenderAPIにFormDataで送信
    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      body: formData
    });

    console.log('📥 API Response status:', apiResponse.status);

    let responseData;
    const contentType = apiResponse.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      responseData = await apiResponse.json();
    } else {
      const textData = await apiResponse.text();
      responseData = { 
        message: textData,
        status: apiResponse.status 
      };
    }

    return res.status(apiResponse.status).json({
      success: apiResponse.ok,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      details: error.message
    });
  }
}