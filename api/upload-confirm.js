export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Visitor-Token, x-visitor-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const visitorToken = req.headers['x-visitor-token'] || req.headers['X-Visitor-Token'];
    const response = await fetch('https://storage.to/api/upload/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://storage.to',
        'Referer': 'https://storage.to/',
        ...(visitorToken ? { 'X-Visitor-Token': visitorToken } : {})
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || `Upstream returned status ${response.status}`, success: false };
    }
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('upload-confirm proxy error:', err);
    return res.status(500).json({ error: err.message || 'Internal proxy error', success: false });
  }
}
