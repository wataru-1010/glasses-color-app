export default async function handler(req, res) {
  console.log('Proxy request:', req.method, req.url);
  
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

    let requestBody = null;
    if (req.method === 'POST' && req.body) {
      requestBody = JSON.stringify(req.body);
    }

    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: requestBody
    });

    let responseData;
    const contentType = apiResponse.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      responseData = await apiResponse.json();
    } else {
      responseData = { 
        message: await apiResponse.text(),
        status: apiResponse.status 
      };
    }

    return res.status(apiResponse.status).json({
      success: apiResponse.ok,
      data: responseData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      details: error.message
    });
  }
}