// api/sosoProxy.js
// Vercel Serverless Function (with debug log for API Key)

export default async function handler(request, response) {
  // ★★★ デバッグ用ログ追加点 ★★★
  // process.env全体を出力すると他のキーも出てしまう可能性があるので、
  // 対象のキーがどうなっているかを直接確認します。
  console.log('[sosoProxy] Reading environment variable SOSOVALUE_API_KEY...');
  console.log('[sosoProxy] Value of process.env.SOSOVALUE_API_KEY:', process.env.SOSOVALUE_API_KEY);
  // ★★★ ここまでデバッグ用ログ追加点 ★★★

  // Vercelの環境変数からAPIキーを取得
  const apiKey = process.env.SOSOVALUE_API_KEY;

  if (!apiKey) {
    // APIキーがサーバーに設定されていない場合はエラーを返す
    console.error('[sosoProxy] Critical Error: SOSOVALUE_API_KEY is not set or is empty in Vercel environment variables.');
    return response.status(500).json({ 
      success: false, 
      error: 'サーバー設定エラー: APIキーが設定されていません。サイト管理者にご連絡ください。' 
    });
  }

  // フロントエンドから渡される可能性のあるクエリパラメータを取得 (デフォルト値を設定)
  const lang = request.query.lang || 'ja';          // 言語 (デフォルト: 日本語)
  const pageSize = request.query.page_size || '12';   // 取得件数 (デフォルト: 12件)
  const pageNum = request.query.page_num || '1';      // ページ番号 (デフォルト: 1ページ目)

  const sosoApiUrl = `https://api.sosovalue.xyz/api/v1/article/list?lang=${lang}&page_num=${pageNum}&page_size=${pageSize}`;

  try {
    console.log(`[sosoProxy] Attempting to call soso VALUE API: ${sosoApiUrl} with API Key (first 8 chars): ${apiKey.substring(0, 8)}...`); // APIキーの一部だけログに出力（セキュリティのため）
    const sosoResponse = await fetch(sosoApiUrl, {
      method: 'GET',
      headers: {
        'api-key': apiKey, // ここでAPIキーを使用
        'Content-Type': 'application/json', 
      },
    });

    const responseBodyText = await sosoResponse.text(); // まずテキストとしてレスポンスボディを取得
    let responseBodyJson;

    console.log(`[sosoProxy] soso VALUE API Status: ${sosoResponse.status}`);
    // デバッグ用にレスポンスボディの一部を表示（長すぎる場合があるので制限）
    // console.log(`[sosoProxy] soso VALUE API Response Body (text preview): ${responseBodyText.substring(0, 300)}...`); 

    // soso VALUE APIからのレスポンスをJSONとしてパース試行
    try {
        responseBodyJson = JSON.parse(responseBodyText);
    } catch (e) {
        // JSONパースに失敗した場合 (soso VALUE APIがHTMLエラーページなどを返した場合)
        console.error('[sosoProxy] Failed to parse soso VALUE API response as JSON. Raw response preview:', responseBodyText.substring(0, 300));
        return response.status(sosoResponse.status || 500).json({
            success: false,
            error: `soso VALUE APIからの応答が期待した形式ではありません (Status: ${sosoResponse.status})。詳細はサーバーログを確認してください。`,
            rawResponsePreview: responseBodyText.substring(0, 300)
        });
    }
    
    // JSONパース成功後、APIの内部コードを確認
    // console.log(`[sosoProxy] soso VALUE API Response (parsed JSON):`, responseBodyJson);

    if (!sosoResponse.ok || (responseBodyJson && typeof responseBodyJson.code !== 'undefined' && responseBodyJson.code !== 0)) {
      // HTTPステータスがエラー、またはAPIの内部コードが0でない場合
      console.error('[sosoProxy] soso VALUE API returned an error. HTTP Status:', sosoResponse.status, 'API Response:', responseBodyJson);
      return response.status(sosoResponse.ok ? (responseBodyJson.code === 0 ? 200 : 400) : sosoResponse.status).json({
        success: false,
        error: `soso VALUEニュースの取得に失敗しました (API Code: ${responseBodyJson.code}, Msg: ${responseBodyJson.msg || 'N/A'})`,
        details: responseBodyJson
      });
    }

    // 成功した場合、soso VALUEからのデータをクライアントに返す
    console.log('[sosoProxy] Successfully fetched and processed news from soso VALUE. Returning data to client.');
    return response.status(200).json({ success: true, data: responseBodyJson.data });

  } catch (error) {
    console.error('[sosoProxy] Unexpected error during proxy request execution:', error);
    return response.status(500).json({ 
      success: false, 
      error: 'プロキシサーバーで予期せぬエラーが発生しました。詳細はサーバーログを確認してください。',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined // 開発環境以外ではスタックトレースを隠す
    });
  }
}