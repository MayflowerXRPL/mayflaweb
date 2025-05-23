// api/getBitgetBalance.js
// ────────────────────────────────────
// Vercel Serverless Function（CommonJS）
// 必要な環境変数：
//   BITGET_API_KEY
//   BITGET_SECRET_KEY
//   BITGET_API_PASSPHRASE
// ────────────────────────────────────
exports.config = { runtime: 'nodejs' };   // Edge でなく Node で実行

const crypto = require('crypto');

module.exports = async (req, res) => {
  /* ① 環境変数 */
  const key  = process.env.BITGET_API_KEY;
  const sec  = process.env.BITGET_SECRET_KEY;
  const pass = process.env.BITGET_API_PASSPHRASE;

  /* ★ デバッグ用：どれが undefined か確認 */
  console.log('ENV-CHECK', {
    KEY  : key  ? key.slice(0, 4)  : undefined,
    SEC  : sec  ? sec.slice(0, 4)  : undefined,
    PASS : pass ? pass.slice(0, 4) : undefined,
  });

  if (!key || !sec || !pass) {
    return res
      .status(500)
      .json({ success: false, error: 'env が足りません (KEY/SECRET/PASSPHRASE)' });
  }

  /* ② 署名 */
  const ts   = Date.now().toString();
  const path = '/api/v2/account/all-account-balance';
  const sig  = crypto
    .createHmac('sha256', sec)
    .update(ts + 'GET' + path)
    .digest('base64');

  try {
    /* ③ Bitget API 呼び出し */
    const r = await fetch('https://api.bitget.com' + path, {
      method: 'GET',
      headers: {
        'ACCESS-KEY':        key,
        'ACCESS-SIGN':       sig,
        'ACCESS-TIMESTAMP':  ts,
        'ACCESS-PASSPHRASE': pass,
        'locale':            'en-US',
      },
    });
    const j = await r.json();

    if (!r.ok || j.code !== '0') {
      return res
        .status(500)
        .json({ success: false, error: `Bitget: ${j.msg || j.code}` });
    }

    /* ④ 残高計算（USDT → 円換算は固定レート155） */
    const usdt = parseFloat(j.data.totalEquity);
    const jpy  = Math.round(usdt * 155);

    return res.json({
      success:   true,
      totalUsdt: +usdt.toFixed(2),
      totalJpy:  jpy,
      usdtToJpyRate: 155,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
