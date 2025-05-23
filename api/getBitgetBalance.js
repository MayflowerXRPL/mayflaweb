// api/getBitgetBalance.js
exports.config = { runtime: 'nodejs' };   // ←そのまま書く

const crypto = require('crypto');

module.exports = async (req, res) => {
  const key  = process.env.BITGET_API_KEY;       // ①
  const sec  = process.env.BITGET_SECRET_KEY;    // ②
  const pass = process.env.BITGET_API_PASSPHRASE;// ③

  if (!key || !sec || !pass) {
    return res.status(500).json({ success:false, error:'env が足りません' });
  }

  const ts   = Date.now().toString();
  const path = '/api/v2/account/all-account-balance';
  const sig  = crypto.createHmac('sha256', sec)
                     .update(ts + 'GET' + path)
                     .digest('base64');

  const r = await fetch('https://api.bitget.com' + path, {
    method:'GET',
    headers:{
      'ACCESS-KEY':       key,
      'ACCESS-SIGN':      sig,
      'ACCESS-TIMESTAMP': ts,
      'ACCESS-PASSPHRASE':pass,
      'locale':'en-US'
    }
  });

  const j = await r.json();
  if (!r.ok || j.code !== '0') {
    return res.status(500).json({ success:false, error:`Bitget: ${j.msg||j.code}` });
  }

  const usdt = parseFloat(j.data.totalEquity);   // 口座合計 (USDT 換算)
  const jpy  = Math.round(usdt * 155);           // 為替 155 で固定

  res.json({ success:true, totalUsdt:+usdt.toFixed(2), totalJpy:jpy });
};
