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
    console.log('📋 Request body:', req.body);
    
    const RENDER_API_URL = 'https://glasses-color-app.onrender.com';
    const targetPath = req.query.path || 'detect-lens';
    const targetUrl = `${RENDER_API_URL}/${targetPath}`;
    
    console.log('🎯 Proxying to:', targetUrl);
 
    // 簡単なテスト: まずは元のAPI呼び出しを試す
    if (req.method === 'POST' && req.body) {
      console.log('📦 Processing request body...');
      
      const requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('📋 Parsed data keys:', Object.keys(requestData));
      
      if (!requestData.image) {
        throw new Error('No image data found in request');
      }
      
      console.log('🖼️ Image data length:', requestData.image.length);
      
      // 一時的に、JSONでそのまま送信してみる（デバッグ用）
      const apiResponse = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: requestData.image,
          format: 'base64'
        })
      });
 
      console.log('📥 API Response status:', apiResponse.status);
      
      const responseText = await apiResponse.text();
      console.log('📄 Response text:', responseText.substring(0, 200));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText, status: apiResponse.status };
      }
 
      return res.status(apiResponse.status).json({
        success: apiResponse.ok,
        data: responseData,
        debug: {
          imageLength: requestData.image.length,
          targetUrl,
          responseStatus: apiResponse.status
        }
      });
    }
 
    return res.status(400).json({ error: 'Invalid request' });
 
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      details: error.message,
      stack: error.stack
    });
  }
 }