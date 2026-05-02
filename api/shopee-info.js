// api/shopee-info.js

export default async function handler(req, res) {
  const { shopId, itemId } = req.method === 'POST'
    ? await req.json?.() ?? {}
    : req.query;

  if (!shopId || !itemId) {
    return res.status(400).json({ error: 'Missing shopId or itemId' });
  }

  // Thử nhiều endpoint khác nhau
  const endpoints = [
    `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
    `https://shopee.vn/api/v2/item/get?itemid=${itemId}&shopid=${shopId}`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `https://shopee.vn/product/${shopId}/${itemId}`,
    'Origin': 'https://shopee.vn',
    'X-API-SOURCE': 'pc',
    'X-Shopee-Language': 'vi',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { headers });
      const data = await response.json();
      const item = data?.data?.item ?? data?.item;

      if (item?.name) {
        const imageHash = item.images?.[0] ?? item.image ?? null;
        return res.status(200).json({
          success: true,
          name:  item.name,
          image: imageHash ? `https://cf.shopee.vn/file/${imageHash}` : null,
          price: item.price ? item.price / 100000 : null,
        });
      }
    } catch (e) {
      continue;
    }
  }

  // Fallback: scrape Open Graph từ trang HTML
  try {
    const pageUrl = `https://shopee.vn/product/${shopId}/${itemId}`;
    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
        'Accept-Language': 'vi-VN,vi;q=0.9',
      }
    });

    const html = await pageRes.text();

    // Lấy og:title
    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
                    ?? html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);

    // Lấy og:image
    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
                    ?? html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);

    if (titleMatch || imageMatch) {
      return res.status(200).json({
        success: true,
        name:  titleMatch?.[1] ?? null,
        image: imageMatch?.[1] ?? null,
        price: null,
        source: 'og-scrape',
      });
    }

    // Debug: trả về 500 chars đầu của HTML
    return res.status(200).json({
      success: false,
      error: 'Không parse được OG tags',
      html_preview: html.substring(0, 500),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
