// api/shopee-info.js  ← đặt file này vào thư mục /api trên Vercel

export default async function handler(req, res) {
  // Lấy shopId và itemId từ query hoặc body
  const { shopId, itemId } = req.method === 'POST'
    ? await req.json?.() ?? {}
    : req.query;

  if (!shopId || !itemId) {
    return res.status(400).json({ error: 'Missing shopId or itemId' });
  }

  try {
    const response = await fetch(
      `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36',
          'Referer': 'https://shopee.vn/',
          'Accept': 'application/json',
          'X-API-SOURCE': 'pc',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );

    const data = await response.json();
    const item = data?.data?.item;

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm', raw: data });
    }

    const imageHash = item.images?.[0] ?? item.image ?? null;

    return res.status(200).json({
      success: true,
      name:  item.name  ?? null,
      image: imageHash  ? `https://cf.shopee.vn/file/${imageHash}` : null,
      price: item.price ? item.price / 100000 : null,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
