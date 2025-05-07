// api/bithomp.js
const fetch = require('node-fetch');

// Bithomp APIキーを環境変数から取得
const BITHOMP_API_KEY = process.env.BITHOMP_API_KEY;
// Bithomp APIのベースURL
const BITHOMP_BASE_URL = 'https://bithomp.com/api/v2';
// リップルエポックとUNIXエポックの差（ミリ秒）
const RIPPLE_EPOCH_OFFSET = 946684800000;

export default async function handler(request, response) {
    // クライアントからのリクエストURLからパラメータを取得
    // 例: /api/bithomp?endpoint=account/ADDRESS/info や /api/bithomp?endpoint=account/ADDRESS/nfts?limit=20
    const { endpoint } = request.query;

    if (!endpoint) {
        return response.status(400).json({ error: 'エンドポイントが指定されていません。(?endpoint=... の形式で指定)' });
    }

    if (!BITHOMP_API_KEY) {
        console.error("[api/bithomp.js] Bithomp APIキーが環境変数に設定されていません。");
        return response.status(500).json({ error: 'サーバー設定エラー: Bithomp APIキーがありません。' });
    }

    const apiUrl = `${BITHOMP_BASE_URL}/${endpoint}`;
    const headers = {
        'Accept': 'application/json',
        'X-Bithomp-Key': BITHOMP_API_KEY
    };

    // console.log(`[api/bithomp.js] Fetching Bithomp URL: ${apiUrl}`); // デバッグ用

    try {
        const apiResponse = await fetch(apiUrl, { headers });
        const data = await apiResponse.json(); // まずJSONとして解析試行

        if (!apiResponse.ok) {
            console.error(`[api/bithomp.js] Bithomp API Error (URL: ${apiUrl}):`, apiResponse.status, data);
            // Bithompからのエラーをそのまま返す
            return response.status(apiResponse.status).json(data);
        }

        // オプション：日付などを変換してから返す場合
        // if (data.transactions) {
        //     data.transactions = data.transactions.map(tx => ({
        //         ...tx,
        //         date_ms: (tx.date * 1000) + RIPPLE_EPOCH_OFFSET
        //     }));
        // }
        // if (data.account_data && data.account_data.inception) {
        //     data.account_data.inception_ms = (data.account_data.inception * 1000) + RIPPLE_EPOCH_OFFSET;
        // }

        response.status(200).json(data);

    } catch (error) {
        console.error(`[api/bithomp.js] プロキシ内部エラー (URL: ${apiUrl}):`, error);
        // JSON解析エラーなどもここで捕捉される可能性がある
        // 念のためエラーレスポンスもJSON形式にする
        if (error instanceof SyntaxError) { // JSON parsing error
             return response.status(500).json({ error: 'Bithomp APIからの応答が不正な形式でした。' });
        }
        return response.status(500).json({ error: 'Bithompプロキシサーバーで内部エラーが発生しました。' });
    }
}