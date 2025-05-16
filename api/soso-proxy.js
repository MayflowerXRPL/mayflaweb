// api/soso-proxy.js (環境変数名を SOSO_API_KEY に変更)
const fetch = require('node-fetch');

export default async function handler(request, response) {
    // ★★★ 環境変数名を SOSO_API_KEY に変更 ★★★
    const SOSO_API_KEY_FROM_ENV = process.env.SOSO_API_KEY;
    console.log("[soso-proxy.js] SOSO_API_KEY from env:", SOSO_API_KEY_FROM_ENV); // 読み込めているかログで確認

    const {
        page = 1,
        page_size = 6,
        lang = 'ja',
        currency_symbol
    } = request.query;

    let API_ENDPOINT;

    if (currency_symbol) {
        API_ENDPOINT = `https://pro-api.sosovalue.xyz/api/v1/news/list_by_currency?currency_symbol=${currency_symbol}&page=${page}&page_size=${page_size}&lang=${lang}`;
    } else {
        API_ENDPOINT = `https://pro-api.sosovalue.xyz/api/v1/news/list?page=${page}&page_size=${page_size}&lang=${lang}`;
    }

    // ★★★ 環境変数名が正しく読み込めているかチェック ★★★
    if (!SOSO_API_KEY_FROM_ENV) {
        console.error("[soso-proxy.js] 環境変数 SOSO_API_KEY が設定されていません。");
        return response.status(500).json({ error: 'サーバー設定エラー: soso VALUE APIキーが環境変数にありません。' });
    }

    console.log(`[soso-proxy.js] Fetching soso VALUE URL: ${API_ENDPOINT}`);

    try {
        const apiResponse = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: {
                'X-API-KEY': SOSO_API_KEY_FROM_ENV, // ★★★ ここで使う変数を変更 ★★★
                'Accept': 'application/json',
            },
        });

        const responseText = await apiResponse.text();
        // console.log("[soso-proxy.js] soso VALUE API Response Text:", responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("[soso-proxy.js] soso VALUE API JSON Parse Error:", e, "Response Text:", responseText);
            return response.status(500).json({ error: 'soso VALUE APIからの応答が不正な形式でした。' });
        }

        if (!apiResponse.ok) {
            console.error('[soso-proxy.js] soso VALUE API Error:', apiResponse.status, data);
            const errorMessage = data?.message || data?.error || `soso VALUE API returned status ${apiResponse.status}`;
            return response.status(apiResponse.status).json({ error: errorMessage, details: data });
        }

        response.status(200).json(data);

    } catch (error) {
        console.error('[soso-proxy.js] プロキシ内部エラー:', error);
        response.status(500).json({ error: 'soso VALUE プロキシサーバーで内部エラーが発生しました。' });
    }
}