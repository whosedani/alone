export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const ADMIN_HASH = process.env.ADMIN_HASH;
  const CONFIG_KEY = 'alone:config';

  if (!KV_URL || !KV_TOKEN) {
    if (req.method === 'GET') {
      return res.status(200).json({});
    }
    return res.status(500).json({ error: 'KV not configured' });
  }

  // GET — return config
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${KV_URL}/get/${CONFIG_KEY}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await response.json();
      if (data.result) {
        return res.status(200).json(JSON.parse(data.result));
      }
      return res.status(200).json({});
    } catch (e) {
      return res.status(200).json({});
    }
  }

  // POST — save config
  if (req.method === 'POST') {
    const { passwordHash, ...config } = req.body;

    if (!ADMIN_HASH || passwordHash !== ADMIN_HASH) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const value = JSON.stringify(config);
      const encoded = encodeURIComponent(value);
      const kvRes = await fetch(`${KV_URL}/set/${CONFIG_KEY}/${encoded}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const kvData = await kvRes.json();
      if (kvData.result === 'OK') {
        return res.status(200).json({ success: true });
      }
      return res.status(500).json({ error: 'Redis error', detail: kvData });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
