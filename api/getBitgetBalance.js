// api/getBitgetBalance.js
exports.config = { runtime: 'nodejs' };

const crypto = require('crypto');

module.exports = async (req, res) => {
  // ── 環境変数を読む ───────────────────────────────
  const key  = process.env.BITGET_API_KEY;
  const sec  = process.env.BITGET_SECRET_KEY;
  const pass = process.env.BITGET_API_PASSPHRASE;

  // デバッグ用 : URL に ?debug=1 を付けて呼ぶと値の有無を返す
  if (req.url.includes('?debug=1')) {
    return res.json({
      BITGET_API_KEY        : key  ? key.slice(0,8)  + '…' : null,
      BITGET_SECRET_KEY     : sec  ? sec.slice(0,8)  + '…' : null,
      BITGET_API_PASSPHRASE : pass ? pass.slice(0,8) + '…' : null,
    });
  }

  // １つでも欠けていればエラー終了
  if (!key || !sec || !pass) {
    return res
      .status(500)
      .json({ success:false, error:'env が足りません (KEY/SECRET/PASSPHRASE)' });
  }

  // ── 署名作成 & Bitget 呼び出し ─────────────────
  const ts   = Date.now().toString();
  const path = '/api/v2/account/all-account-balance';
  const sig  = crypto.createHmac('sha256', sec).update(ts + 'GET' + path).digest('base64');

  try {
    const rsp = await fetch('https://api.bitget.com' + path, {
      method:'GET',
      headers:{
        'ACCESS-KEY': key,
        'ACCESS-SIGN': sig,
        'ACCESS-TIMESTAMP': ts,
        'ACCESS-PASSPHRASE': pass,
        'locale':'en-US',
      },
    });
    const json = await rsp.json();

    if (!rsp.ok || json.code !== '0') {
      return res.status(500).json({ success:false, error:`Bitget: ${json.msg||json.code}` });
    }

    const usdt = parseFloat(json.data.totalEquity);
    const jpy  = Math.round(usdt * 155);

    return res.json({ success:true, totalUsdt:+usdt.toFixed(2), totalJpy:jpy, rate:155 });
  } catch (e) {
    return res.status(500).json({ success:false, error:e.message });
  }
};
