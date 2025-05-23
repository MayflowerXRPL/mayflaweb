// api/getBitgetBalance.js
// (ChatGPTのコードをベースに、Vercel Serverless Function形式に適合させたもの)

// Next.js Pages API Router用のconfigですが、Vercel Serverless Functionsでは
// プロジェクト設定やファイル規約でランタイムが決まるため、この行は通常不要です。
// もしEdge Runtimeで問題が出る場合は、プロジェクト設定でNode.jsを指定するのが一般的です。
// export const config = { runtime: 'nodejs' }; 

import crypto from 'crypto';

const BITGET_API_BASE_URL = 'https://api.bitget.com';
// ChatGPT推奨の、口座横断でUSDT換算総資産を返すエンドポイント
const ALL_ACCOUNT_BALANCE_PATH = '/api/v2/account/all-account-balance';

// Bitget API V2 の署名生成関数 (ChatGPTのものを採用)
function createBitgetSignature(timestamp, method, requestPath, queryString, bodyString, secretKey) {
  // queryStringは '?' を含まないキー=バリュー&... の形式を想定
  // bodyStringはJSON文字列化されたものを想定
  const prehash =
    timestamp + 
    method.toUpperCase() + 
    requestPath + 
    (queryString ? '?' + queryString : '') + // GETリクエストでクエリがある場合
    bodyString; // POST/PUTリクエストのボディ (GETでは通常空文字)
  
  // console.log(`[BitgetSignature] Prehash for ${requestPath}: ${prehash}`); // デバッグ用
  return crypto.createHmac('sha256', secretKey).update(prehash).digest('base64');
}

export default async function handler(request, response) {
  // 環境変数からAPI情報を取得 (キー名をChatGPTの例に合わせる)
  const apiKey = process.env.BITGET_API_KEY;
  const secretKey = process.env.BITGET_API_SECRET; // ドキュメントに合わせて変更も検討 (例: BITGET_SECRET_KEY)
  const passphrase = process.env.BITGET_API_PASSPHRASE;

  if (!apiKey || !secretKey || !passphrase) { // パスフレーズも必須とする
    console.error('[getBitgetBalance] Critical Error: API Key, Secret, or Passphrase is not set in env vars.');
    return response.status(500).json({ 
        success: false, 
        error: 'サーバー設定エラー: API認証情報が完全に設定されていません。' 
    });
  }

  const timestamp = Date.now().toString();
  const method = 'GET';
  const queryString = ''; // このエンドポイントは通常クエリパラメータ不要
  const bodyString = '';    // GETリクエストなのでボディは空

  const signature = createBitgetSignature(timestamp, method, ALL_ACCOUNT_BALANCE_PATH, queryString, bodyString, secretKey);

  const headers = {
    'ACCESS-KEY': apiKey, // ★ChatGPTの指摘通り、公式ドキュメントのヘッダー名に統一
    'ACCESS-SIGN': signature,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': passphrase,
    'locale': 'en-US', // Bitget推奨
    'Content-Type': 'application/json; charset=utf-8', // Bitget推奨
  };

  try {
    console.log(`[getBitgetBalance] Calling Bitget All Account Balance API...`);
    const bitgetResponse = await fetch(BITGET_API_BASE_URL + ALL_ACCOUNT_BALANCE_PATH, { 
      method: method, 
      headers: headers 
    });
    const resultJson = await bitgetResponse.json();
    
    console.log(`[getBitgetBalance] Bitget API Status: ${bitgetResponse.status}, Response Code: ${resultJson.code}`);
    // console.log('[getBitgetBalance] Bitget API Full Response:', JSON.stringify(resultJson, null, 2)); // デバッグ用

    if (!bitgetResponse.ok || (resultJson.code && resultJson.code !== '0')) {
      console.error('[getBitgetBalance] Bitget API returned an error:', resultJson);
      throw new Error(resultJson.msg || `Bitget APIエラー (Code: ${resultJson.code || bitgetResponse.status})`);
    }

    // APIレスポンスからUSDT換算の総資産を取得
    // resultJson.data.totalEquity または類似のフィールド (APIドキュメントや実際のレスポンスで確認)
    const totalUsdtEquity = parseFloat(resultJson.data?.totalEquity); // Optional chaining
    if (isNaN(totalUsdtEquity)) {
        console.error('[getBitgetBalance] Could not parse totalEquity from Bitget response:', resultJson.data);
        throw new Error('Bitgetからの応答で総資産額(USDT)を取得できませんでした。');
    }
    
    console.log(`[getBitgetBalance] Total USDT Equity from API: ${totalUsdtEquity}`);

    // USDTをJPYに換算 (仮レート。実際にはAPIで取得推奨)
    const usdtToJpyRate = 155.00; // 最新のレートに更新するか、APIから取得
    const totalJpyValue = totalUsdtEquity * usdtToJpyRate;
    console.log(`[getBitgetBalance] Calculated Total JPY value (rate ${usdtToJpyRate}): ${totalJpyValue.toFixed(0)}`);

    response.status(200).json({
      success: true,
      totalUsdt: +totalUsdtEquity.toFixed(2),
      totalJpy: Math.round(totalJpyValue),
      usdtToJpyRate: usdtToJpyRate,
    });

  } catch (error) {
    console.error('[getBitgetBalance] Error in handler:', error.message, error.stack);
    response.status(500).json({
      success: false,
      error: error.message || '残高取得サーバーで予期せぬエラーが発生しました。'
    });
  }
}