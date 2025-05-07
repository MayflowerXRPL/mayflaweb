// script.js

// ... (DOMContentLoadedやBithomp関連のコードはそのまま) ...

// --- CoinMarketCap API (Vercel プロキシ経由) ---
async function fetchCmcDataViaProxy() {
    // Vercelの場合、apiフォルダ内のファイル名がそのままパスになる
    const proxyUrl = '/api/cmc'; // 例: api/cmc.js なら /api/cmc

    const container = document.getElementById('cmc-data-container');
    container.innerHTML = '<p class="loading-message">価格情報を読み込み中...</p>';

    try {
        const response = await fetch(proxyUrl); // プロキシを呼び出す

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('CMC Proxy Response Error:', response.status, errorData);
            let errorMessage = `CMCデータ取得エラー: ${response.status}`;
            if (errorData && errorData.status && errorData.status.error_message) {
                errorMessage += ` - ${errorData.status.error_message}`;
            } else if (errorData && errorData.message) {
                errorMessage += ` - ${errorData.message}`;
            } else {
                errorMessage += ' - 詳細不明';
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();

        if (data && data.data) { // CoinMarketCap APIの成功時のレスポンス構造
            container.innerHTML = '';
            data.data.slice(0, 10).forEach(crypto => {
                const price = crypto.quote.USD.price;
                const change24h = crypto.quote.USD.percent_change_24h;

                const card = document.createElement('div');
                card.className = 'token-card';
                card.innerHTML = `
                    <h3>${crypto.name} (${crypto.symbol})</h3>
                    <p>価格: <span class="price">$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 0.01 ? 8 : (price < 1 ? 4 : 2) })}</span></p>
                    <p>24時間変動: <span class="${change24h >= 0 ? 'change-positive' : 'change-negative'}">${change24h.toFixed(2)}%</span></p>
                `;
                container.appendChild(card);
            });
        } else if (data.error) { // プロキシ自体がエラーを返した場合 (api/cmc.js で定義したエラー)
             throw new Error(`プロキシエラー: ${data.error}`);
        } else if (data.status && data.status.error_message) { // CMC APIからのエラーが直接返ってきた場合
            throw new Error(`CMC APIエラー: ${data.status.error_message}`);
        }
        else {
            console.warn("CMC APIからの予期せぬデータ構造:", data);
            throw new Error('CMC API: 無効なデータ構造です。');
        }
    } catch (error) {
        console.error('CoinMarketCapデータ(プロキシ経由)の取得エラー:', error);
        container.innerHTML = `<p class="error-message">あらら！価格情報が取れなかったみたい… メイフラちゃんが確認するね！<br>(詳細: ${error.message})</p>`;
    }
}

// ... (getMockCmcData, fetchXrplAccountData, hexToString, convertIpfsUrl は変更なし) ...