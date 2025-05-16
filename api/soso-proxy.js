// api/soso-proxy.js (soso VALUEニュース取得用プロキシ)
const fetch = require('node-fetch');

export default async function handler(request, response) {
    const SOSO_VALUE_API_KEY = process.env.SOSO_VALUE_API_KEY; // Vercelの環境変数から取得

    // クライアントから渡されるパラメータ (デフォルト値を設定)
    // news_script.js からは page_size=12&lang=ja で呼び出しています
    const {
        page = 1,
        page_size = 12, // デフォルト12件取得
        lang = 'ja',     // デフォルト日本語
        currency_symbol // オプション: 通貨で絞り込む場合 (今回は未使用だが、将来的に使うかも)
    } = request.query;

    let API_ENDPOINT;

    // currency_symbol が指定されていれば、通貨別ニュースエンドポイントを使用
    if (currency_symbol) {
        API_ENDPOINT = `https://pro-api.sosovalue.xyz/api/v1/news/list_by_currency?currency_symbol=${currency_symbol}&page=${page}&page_size=${page_size}&lang=${lang}`;
    } else {
        // 指定されていなければ、通常のニュースリストエンドポイントを使用
        API_ENDPOINT = `https://pro-api.sosovalue.xyz/api/v1/news/list?page=${page}&page_size=${page_size}&lang=${lang}`;
    }

    if (!SOSO_VALUE_API_KEY) {
        console.error("[soso-proxy.js] soso VALUE APIキーが環境変数に設定されていません。");
        return response.status(500).json({ error: 'サーバー設定エラー: soso VALUE APIキーがありません。' });
    }

    console.log(`[soso-proxy.js] Fetching soso VALUE URL: ${API_ENDPOINT}`); // どのURLを叩いているかログ出力

    try {
        const apiResponse = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: {
                'X-API-KEY': SOSO_VALUE_API_KEY,
                'Accept': 'application/json',
            },
        });

        const responseText = await apiResponse.text(); // まずテキストで取得
        // console.log("[soso-proxy.js] soso VALUE API Response Text:", responseText); // レスポンス内容をログ出力

        let data;
        try {
            data = JSON.parse(responseText); // JSONとして解析
        } catch (e) {
            console.error("[soso-proxy.js] soso VALUE API JSON Parse Error:", e, "Response Text:", responseText);
            return response.status(500).json({ error: 'soso VALUE APIからの応答が不正な形式でした。' });
        }


        if (!apiResponse.ok) {
            console.error('[soso-proxy.js] soso VALUE API Error:', apiResponse.status, data);
            // soso VALUE APIからのエラーメッセージがあればそれを優先
            const errorMessage = data?.message || data?.error || `soso VALUE API returned status ${apiResponse.status}`;
            return response.status(apiResponse.status).json({ error: errorMessage, details: data });
        }

        // console.log("[soso-proxy.js] Successfully fetched data from soso VALUE.");
        response.status(200).json(data);

    } catch (error) {
        console.error('[soso-proxy.js] プロキシ内部エラー:', error);
        response.status(500).json({ error: 'soso VALUE プロキシサーバーで内部エラーが発生しました。' });
    }
}