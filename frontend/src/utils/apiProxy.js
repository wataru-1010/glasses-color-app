export const proxyApiCall = async (path = 'detect-lens', options = {}) => {
  try {
    const response = await fetch('/api/proxy?' + new URLSearchParams({ path }), {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body
    });
    
    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};