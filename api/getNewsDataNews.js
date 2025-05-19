// api/getNewsDataNews.js
// Vercel Serverless Function for NewsData.io

export default async function handler(request, response) {
  const apiKey = process.env.NEWSDATA_API_KEY; // NewsData.ioのAPIキー

  if (!apiKey) {
    console.error('[getNewsDataNews] Critical Error: NEWSDATA_API_KEY is not set.');
    return response.status(500).json({
      success: false,
      error: 'サーバー設定エラー: ニュースAPIキーが設定されていません。'
    });
  }

  // NewsData.io APIのエンドポイント
  // language=ja (日本語)
  // category=cryptocurrency (仮想通貨カテゴリ) - ドキュメントで正確なカテゴリ名を確認してください
  // country=jp (日本)
  const language = request.query.language || 'ja';
  const category = request.query.category || 'cryptocurrency'; // または 'finance' など、適切なカテゴリを調査
  const country = request.query.country || 'jp';
  // 他にも q (キーワード検索) などのパラメータが使えます

  let newsApiUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&language=${language}&country=${country}`;
  if (category) {
    newsApiUrl += `&category=${category}`;
  }
  // newsApiUrl += `&q=仮想通貨 OR 暗号資産`; // キーワードで絞り込む場合

  try {
    console.log(`[getNewsDataNews] Calling NewsData.io API: ${newsApiUrl.replace(apiKey, 'REDACTED_KEY')}`);

    const newsResponse = await fetch(newsApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // NewsData.ioはAPIキーをURLパラメータで渡すのが一般的なので、ヘッダーは特に不要かもしれません
      }
    });

    const responseBodyText = await newsResponse.text();
    let responseBodyJson;

    console.log(`[getNewsDataNews] NewsData.io API Status: ${newsResponse.status}`);

    try {
      responseBodyJson = JSON.parse(responseBodyText);
    } catch (e) {
      console.error('[getNewsDataNews] Failed to parse NewsData.io response as JSON. Raw:', responseBodyText);
      return response.status(newsResponse.status || 500).json({
        success: false,
        error: `ニュースAPIからの応答が不正です (Status: ${newsResponse.status})。`,
        rawResponsePreview: responseBodyText.substring(0, 500)
      });
    }
    
    // NewsData.ioの成功/失敗レスポンス形式を確認して調整
    // (例: responseBodyJson.status === "success")
    if (!newsResponse.ok || responseBodyJson.status !== "success") {
      console.error('[getNewsDataNews] NewsData.io API returned an error:', responseBodyJson);
      const errorMessage = responseBodyJson.results && responseBodyJson.results.message 
                            ? responseBodyJson.results.message 
                            : (responseBodyJson.message || 'N/A');
      return response.status(newsResponse.ok ? 400 : newsResponse.status).json({
        success: false,
        error: `ニュースの取得に失敗しました (API Msg: ${errorMessage})`,
        details: responseBodyJson
      });
    }

    // 成功した場合、ニュースデータ (responseBodyJson.results) を返す
    console.log('[getNewsDataNews] Successfully fetched news from NewsData.io.');
    return response.status(200).json({ success: true, news: responseBodyJson.results });

  } catch (error) {
    console.error('[getNewsDataNews] Unexpected error:', error);
    return response.status(500).json({
      success: false,
      error: 'ニュース取得サーバーで予期せぬエラーが発生しました。',
      details: error.message
    });
  }
}