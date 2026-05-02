// api/shopee-info.js

export default async function handler(req, res) {
  // CORS - cho phép gọi từ mọi domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lấy link từ query hoặc body
  let link = req.query?.link;
  if (!link && req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      link = body?.link;
    } catch (e) {}
  }

  if (!link) {
    return res.status(400).json({ error: 'Missing link. Dùng: ?link=https://shopee.vn/...' });
  }

  try {
    const response = await fetch('https://mstm.voucher.io.vn/api/price-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Origin': 'https://mstm.voucher.io.vn',
        'Referer': 'https://mstm.voucher.io.vn/',
      },
      body: JSON.stringify({ link }),
    });

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
