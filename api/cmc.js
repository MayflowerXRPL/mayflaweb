// api/cmc.js
const fetch = require('node-fetch');

export default async function handler(request, response) {
    const CMC_API_KEY = process.env.CMC_PRO_API_KEY;
    const API_ENDPOINT = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
    const PARAMS = '?start=1&limit=10&convert=USD';

    if (!CMC_API_KEY) {
        console.error("APIキーが環境変数に設定されていません。ファイル: api/cmc.js"); // ログにファイル名も出すように少し変更
        response.status(500).json({ error: 'サーバー設定エラー: APIキーがありません。' });
        return;
    }

    const url = `${API_ENDPOINT}${PARAMS}`;
    // console.log(`[api/cmc.js] Fetching URL: ${url}`); // デバッグ用にURLをログに出す（必要ならコメントアウト）

    try {
        const apiResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json',
            },
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('[api/cmc.js] CoinMarketCap API Error:', apiResponse.status, data);
            response.status(apiResponse.status).json(data);
        } else {
            // console.log("[api/cmc.js] Successfully fetched data from CoinMarketCap."); // 成功ログ（必要ならコメントアウト）
            response.status(200).json(data);
        }
    } catch (error) {
        console.error('[api/cmc.js] プロキシ内部エラー:', error);
        response.status(500).json({ error: 'プロキシサーバーで内部エラーが発生しました。' });
    }
}