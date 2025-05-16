// api/soso-proxy.js (APIキーなしでリクエストを中継するだけ)
const fetch = require('node-fetch');

export default async function handler(request, response) {
    const {
        page = 1,
        page_size = 12,
        lang = 'ja',
        currency_symbol
    } = request.query;

    let API_ENDPOINT;

    if (currency_symbol) {
        API_ENDPOINT = `https://pro-api.sosovalue.xyz/api/v1/news/list_by_currency?currency_symbol=${currency_symbol}&page=${page}&page_size=${page_size}&lang=${lang}`;
        console.log(`[soso-proxy.js] Fetching soso VALUE (by currency) URL: ${API_ENDPOINT}`);
    } else {
        API_ENDPOINT = `https://pro-api.sosovalue.xyz/api/v1/news/list?page=${page}&page_size=${page_size}&lang=${lang}`;
        console.log(`[soso-proxy.js] Fetching soso VALUE (general news) URL: ${API_ENDPOINT}`);
    }

    try {
        const apiResponse = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const responseText = await apiResponse.text();
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