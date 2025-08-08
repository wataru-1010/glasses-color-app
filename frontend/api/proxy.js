export default async function handler(req, res) {
  console.log('🔧 Simple Proxy request:', req.method, req.url);
  
  // CORS設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
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

    // リクエストボディをそのまま転送
    const forwardHeaders = {};
    
    // 必要なヘッダーのみをコピー
    if (req.headers['content-type']) {
      forwardHeaders['content-type'] = req.headers['content-type'];
    }
    if (req.headers['content-length']) {
      forwardHeaders['content-length'] = req.headers['content-length'];
    }

    console.log('📦 Forward headers:', forwardHeaders);
    console.log('📦 Request body type:', typeof req.body);

    // リクエスト送信
    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method === 'POST' ? req.body : undefined,
    });

    console.log('📥 API Response status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('❌ API Error:', errorText);
      
      return res.status(apiResponse.status).json({
        success: false,
        error: `API Error: ${apiResponse.status}`,
        details: errorText
      });
    }

    const responseText = await apiResponse.text();
    console.log('📄 Response preview:', responseText.substring(0, 200));
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { 
        message: responseText, 
        status: apiResponse.status 
      };
    }

    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal proxy error',
      details: error.message
    });
  }
}