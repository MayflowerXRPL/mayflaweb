// api/getBitgetBalance.js
// ─────────────────────────────────────────────
// Vercel Serverless Function 版（CommonJS）
// 依存 : Node.js 標準の crypto と fetch（Node18+）のみ
// 必要な環境変数 :
//   BITGET_API_KEY
//   BITGET_SECRET_KEY
//   BITGET_API_PASSPHRASE
// ─────────────────────────────────────────────
exports.config = { runtime: 'nodejs' };      // Edge ではなく Node で実行させる

const crypto = require('crypto');

module.exports = async (req, res) => {
  // ① 環境変数を読む
  const key  = process.env.BITGET_API_KEY;
  const sec  = process.env.BITGET_SECRET_KEY;
  const pass = process.env.BITGET_API_PASSPHRASE;

  if (!key || !sec || !pass) {
    return res
      .status(500)
      .json({ success: false, error: 'env が足りません (KEY/SECRET/PASSPHRASE)' });
  }

  // ② Bitget 署名を作成
  const ts   = Date.now().toString();
  const path = '/api/v2/account/all-account-balance';   // 口座横断 USDT換算エンドポイント
  const sig  = crypto.createHmac('sha256', sec).update(ts + 'GET' + path).digest('base64');

  try {
    // ③ Bitget API 呼び出し
    const r = await fetch('https://api.bitget.com' + path, {
      method: 'GET',
      headers: {
        'ACCESS-KEY':       key,
        'ACCESS-SIGN':      sig,
        'ACCESS-TIMESTAMP': ts,
        'ACCESS-PASSPHRASE': pass,
        'locale': 'en-US',
      },
    });

    const j = await r.json();

    if (!r.ok || j.code !== '0') {
      // Bitget 側エラー
      return res
        .status(500)
        .json({ success: false, error: `Bitget: ${j.msg || j.code}` });
    }

    // ④ 成功 → 残高計算
    const usdt = parseFloat(j.data.totalEquity);   // すでに USDT 換算
    const jpy  = Math.round(usdt * 155);           // 為替レート固定

    return res.json({
      success: true,
      totalUsdt: +usdt.toFixed(2),
      totalJpy:  jpy,
      usdtToJpyRate: 155,
    });
  } catch (e) {
    // ネットワーク等の例外
    return res.status(500).json({ success: false, error: e.message });
  }
};
