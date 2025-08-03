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

    if (req.method === 'POST' && req.body) {
      const requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      if (!requestData.image) {
        throw new Error('No image data found in request');
      }
      
      console.log('🖼️ Converting Base64 to Buffer...');
      
      // Base64をBufferに変換
      const base64Data = requestData.image;
      const buffer = Buffer.from(base64Data, 'base64');
      
      console.log('📦 Buffer size:', buffer.length);
      
      // マルチパート形式のボディを手動で構築
      const boundary = '----formdata-proxy-' + Math.random().toString(16);
      const CRLF = '\r\n';
      
      const multipartBody = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="image.jpg"',
        'Content-Type: image/jpeg',
        '',
        buffer.toString('binary'),
        `--${boundary}--`,
        ''
      ].join(CRLF);
      
      console.log('📨 Sending multipart request...');
      
      // RenderAPIにマルチパート形式で送信
      const apiResponse = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(multipartBody)
        },
        body: multipartBody
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
          status: apiResponse.status,
          error: 'Failed to parse JSON response'
        };
      }

      return res.status(apiResponse.status).json({
        success: apiResponse.ok,
        data: responseData
      });
    }

    return res.status(400).json({ error: 'Invalid request method or missing body' });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      details: error.message
    });
  }
}