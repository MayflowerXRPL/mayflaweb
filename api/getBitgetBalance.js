// api/getBitgetBalance.js
import crypto from 'crypto';

const BITGET_API_BASE_URL = 'https://api.bitget.com'; 

// Bitget API V2 の署名生成関数
function createBitgetSignature(timestamp, method, requestPath, body, secretKey) {
  let prehashString = timestamp + method.toUpperCase() + requestPath;
  if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'DELETE')) {
    prehashString += (typeof body === 'string' ? body : JSON.stringify(body));
  }
  return crypto.createHmac('sha256', secretKey).update(prehashString).digest('base64');
}

export default async function handler(request, response) {
  const apiKey = process.env.BITGET_API_KEY;
  const secretKey = process.env.BITGET_SECRET_KEY;
  // const passphrase = process.env.BITGET_PASSPHRASE; // パスフレーズは使用しない前提でコメントアウト

  if (!apiKey || !secretKey) {
    console.error('[getBitgetBalance] Critical Error: Bitget API Key or Secret Key is not set in env vars.');
    return response.status(500).json({
      success: false,
      error: 'サーバー設定エラー: 取引所APIキー情報が設定されていません。'
    });
  }

  const timestamp = Date.now().toString();
  const method = 'GET';

  try {
    // --- 1. アカウントの全スポット資産を取得 ---
    const assetsRequestPath = '/api/v2/spot/account/assets';
    const assetsSignature = createBitgetSignature(timestamp, method, assetsRequestPath, null, secretKey);

    const commonHeaders = { // パスフレーズなしのヘッダー
      'B-ACCESS-KEY': apiKey,
      'B-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json; charset=utf-8',
      'locale': 'en-US',
    };
    // if (passphrase) { // パスフレーズ関連のifブロックは削除
    //   commonHeaders['B-ACCESS-PASSPHRASE'] = passphrase;
    // }

    const assetsHeaders = {
      ...commonHeaders,
      'B-ACCESS-SIGN': assetsSignature,
    };
    
    console.log(`[getBitgetBalance] Fetching spot assets from Bitget...`);
    const assetsResponse = await fetch(`${BITGET_API_BASE_URL}${assetsRequestPath}`, { 
      method: method, 
      headers: assetsHeaders 
    });
    const assetsResult = await assetsResponse.json();

    if (!assetsResponse.ok || (assetsResult.code && assetsResult.code !== "0")) {
      console.error('[getBitgetBalance] Error fetching Bitget spot assets:', assetsResult);
      throw new Error(assetsResult.msg || `Bitgetから資産情報の取得に失敗しました (Code: ${assetsResult.code || assetsResponse.status})`);
    }
    
    const spotAssets = assetsResult.data || [];
    console.log(`[getBitgetBalance] Fetched ${spotAssets.length} spot assets.`);

    let totalUsdtValue = 0;

    const usdtAsset = spotAssets.find(asset => asset.coin === 'USDT');
    if (usdtAsset) {
        totalUsdtValue += parseFloat(usdtAsset.available) || 0;
    }

    const coinsToPrice = spotAssets.filter(asset => asset.coin !== 'USDT' && (parseFloat(asset.available) || 0) > 0.00001); 

    for (const asset of coinsToPrice) {
      const coin = asset.coin;
      const availableBalance = parseFloat(asset.available);
      const symbol = `${coin}USDT`; 
      const tickerRequestPath = `/api/v2/spot/market/tickers?symbol=${symbol}`;
      
      const tickerTimestamp = Date.now().toString(); 
      const tickerSignature = createBitgetSignature(tickerTimestamp, method, tickerRequestPath, null, secretKey);
      
      // ティッカー取得時のヘッダーもパスフレーズなしのcommonHeadersをベースにする
      const tickerHeaders = {
        ...commonHeaders, // APIキー、ロケールなど
        'B-ACCESS-TIMESTAMP': tickerTimestamp,
        'B-ACCESS-SIGN': tickerSignature,
      };
      
      try {
        const tickerResponse = await fetch(`${BITGET_API_BASE_URL}${tickerRequestPath}`, { 
            method: method, 
            headers: tickerHeaders 
        });
        const tickerResult = await tickerResponse.json();

        if (tickerResponse.ok && tickerResult.code === "0" && tickerResult.data && tickerResult.data.length > 0) {
          const price = parseFloat(tickerResult.data[0].lastPr); 
          if (!isNaN(price)) {
            totalUsdtValue += availableBalance * price;
          }
        }
      } catch (priceError) {
        console.warn(`[getBitgetBalance] Error fetching price for ${symbol}:`, priceError.message);
      }
    }
    console.log(`[getBitgetBalance] Calculated Total USDT value: ${totalUsdtValue.toFixed(2)}`);

    const usdtToJpyRate = 155.00; 
    const totalJpyValue = totalUsdtValue * usdtToJpyRate;
    console.log(`[getBitgetBalance] Calculated Total JPY value (rate ${usdtToJpyRate}): ${totalJpyValue.toFixed(0)}`);

    response.status(200).json({
      success: true,
      totalUsdt: parseFloat(totalUsdtValue.toFixed(2)), 
      totalJpy: parseFloat(totalJpyValue.toFixed(0)),   
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