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

    // シンプルにそのまま転送
    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // Content-Typeを除去（FormDataは自動設定される）
        ...Object.fromEntries(
          Object.entries(req.headers || {}).filter(
            ([key]) => !key.toLowerCase().includes('content-type') && 
                      !key.toLowerCase().includes('content-length') &&
                      !key.toLowerCase().includes('host')
          )
        )
      },
      body: req.method === 'POST' ? req.body : undefined
    });

    console.log('📥 API Response status:', apiResponse.status);
    
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