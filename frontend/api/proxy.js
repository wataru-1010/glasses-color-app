import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // FormDataを手動で処理
  },
};

export default async function handler(req, res) {
  console.log('🔧 Proxy request:', req.method, req.url);
  
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

    let requestBody;

    if (req.method === 'POST') {
      // FormDataを正しく解析
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB
        keepExtensions: true,
      });

      try {
        const [fields, files] = await form.parse(req);
        console.log('📦 Parsed FormData:', { fields: Object.keys(fields), files: Object.keys(files) });

        // 新しいFormDataを作成
        const formData = new FormData();
        
        // フィールドを追加
        for (const [key, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            formData.append(key, value[0]);
          } else {
            formData.append(key, value);
          }
        }

        // ファイルを追加
        for (const [key, fileArray] of Object.entries(files)) {
          const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
          if (file) {
            const fileBuffer = await fetch(`file://${file.filepath}`).then(res => res.arrayBuffer());
            const blob = new Blob([fileBuffer], { type: file.mimetype });
            formData.append(key, blob, file.originalFilename || 'file');
            console.log('📎 File added:', file.originalFilename, file.mimetype, file.size);
          }
        }

        requestBody = formData;
      } catch (parseError) {
        console.error('❌ FormData parse error:', parseError);
        return res.status(400).json({
          success: false,
          error: 'FormData parsing failed',
          details: parseError.message
        });
      }
    }

    console.log('📦 Forwarding request with proper FormData...');

    // リクエスト送信
    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      body: requestBody,
      // FormDataの場合、Content-Typeは自動設定される
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