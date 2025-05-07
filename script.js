// script.js (完全版 - CMCとBithompの両方をプロキシ経由)

document.addEventListener('DOMContentLoaded', () => {
    // APIキーはVercelの環境変数で管理するため、ここには書きません

    // ページ読み込み時にCoinMarketCapのデータを取得開始
    fetchCmcDataViaProxy();

    // --- ヒーローボタンのイベントリスナー ---
    document.getElementById('hero-btn-address').addEventListener('click', () => {
        document.getElementById('xrpl-address-info').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('xrpl-address-input').focus();
    });

    document.getElementById('hero-btn-nft').addEventListener('click', () => {
        document.getElementById('nft-gallery').scrollIntoView({ behavior: 'smooth' });
        const address = document.getElementById('xrpl-address-input').value.trim();
        const nftContainer = document.getElementById('nft-items-container');

        if (address) {
            // アドレスがあればアカウントデータとNFTデータを取得
            fetchXrplAccountData(); // APIキーは不要になりました
        } else if (!nftContainer.querySelector('.nft-item')) {
            // アドレスがなく、NFTもまだ表示されていなければプレースホルダーを表示
            nftContainer.innerHTML = '<p class="gallery-placeholder">まず、上のセクションでXRP Ledgerアドレスを入力してくださいね！</p>';
        }
    });

    // --- XRPLアドレス検索ボタンのイベントリスナー ---
    document.getElementById('fetch-xrpl-data-btn').addEventListener('click', fetchXrplAccountData); // APIキーは不要になりました
    document.getElementById('xrpl-address-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            fetchXrplAccountData(); // APIキーは不要になりました
        }
    });
});

// --- CoinMarketCap API (Vercel プロキシ経由 /api/cmc) ---
async function fetchCmcDataViaProxy() {
    const proxyUrl = '/api/cmc'; // Vercelのapiフォルダ内のcmc.jsを指す

    const container = document.getElementById('cmc-data-container');
    container.innerHTML = '<p class="loading-message">価格情報を読み込み中...</p>';

    try {
        const response = await fetch(proxyUrl); // プロキシ(通訳さん)を呼び出す

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('CMC Proxy Response Error:', response.status, errorData);
            let errorMessage = `CMCデータ取得エラー: ${response.status}`;
            if (errorData && errorData.status && errorData.status.error_message) {
                errorMessage += ` - ${errorData.status.error_message}`;
            } else if (errorData && errorData.message) {
                errorMessage += ` - ${errorData.message}`;
            } else if (errorData && errorData.error) {
                errorMessage += ` - ${errorData.error}`;
            } else {
                errorMessage += ' - 詳細不明';
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();

        if (data && data.data) {
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
        } else if (data.error) {
             throw new Error(`プロキシエラー: ${data.error}`);
        } else if (data.status && data.status.error_message) {
            throw new Error(`CMC APIエラー: ${data.status.error_message}`);
        } else {
            console.warn("CMC APIからの予期せぬデータ構造:", data);
            throw new Error('CMC API: 無効なデータ構造です。');
        }
    } catch (error) {
        console.error('CoinMarketCapデータ(プロキシ経由)の取得エラー:', error);
        container.innerHTML = `<p class="error-message">あらら！価格情報が取れなかったみたい… メイフラちゃんが確認するね！<br>(詳細: ${error.message})</p>`;
    }
}


// --- Bithomp API (Vercel プロキシ経由 /api/bithomp) ---
const RIPPLE_EPOCH_OFFSET = 946684800000; // リップルエポックとUNIXエポックの差（ミリ秒）

async function fetchXrplAccountData() { // APIキーは引数で受け取らない
    const address = document.getElementById('xrpl-address-input').value.trim();
    const bithompContainer = document.getElementById('bithomp-data-container');
    const nftContainer = document.getElementById('nft-items-container');

    if (!address) {
        bithompContainer.innerHTML = `<p class="error-message">XRP Ledgerアドレスを入力してください。</p>`;
        nftContainer.innerHTML = `<p class="gallery-placeholder">アドレスを入力してNFTを表示してね！</p>`;
        return;
    }

    bithompContainer.innerHTML = `<p class="loading-message">アカウント情報を読み込み中...</p>`;
    nftContainer.innerHTML = `<p class="loading-message">NFTを読み込み中...</p>`;

    // プロキシ(通訳さん)を呼び出す共通関数
    async function fetchViaBithompProxy(endpoint) {
        // endpoint の例: "account/rXXXXX/info", "account/rXXXXX/transactions?limit=5&type=..."
        const proxyUrl = `/api/bithomp?endpoint=${encodeURIComponent(endpoint)}`;
        // console.log(`[script.js] Calling Bithomp proxy: ${proxyUrl}`); // デバッグ用
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status} - ${response.statusText}` }));
            console.error(`Bithomp Proxy Error (Endpoint: ${endpoint}):`, response.status, errorData);
            throw new Error(errorData.error || `Bithomp情報の取得に失敗 (${response.status})`);
        }
        return response.json();
    }

    try {
        // アカウント情報、トランザクション、NFTを並行して取得開始 (Promise.allを使う)
        // 各APIエンドポイントを組み立ててプロキシに渡す
        const [accountInfo, txData, nftsData] = await Promise.all([
            fetchViaBithompProxy(`account/${address}/info`),
            fetchViaBithompProxy(`account/${address}/transactions?limit=5&type=Payment,OfferCreate,NFTokenMint,NFTokenCreateOffer,NFTokenAcceptOffer`),
            fetchViaBithompProxy(`account/${address}/nfts?limit=20`) // NFTの取得数
        ]).catch(error => {
             // Promise.all の中のいずれか一つでも失敗したら、まとめてエラー処理
             console.error('Promise.all failed:', error);
             throw error; // エラーを再スローして下のcatchブロックで処理
        });


        // --- アカウント情報の表示 ---
        let creationDateDisplay = '不明';
        if (accountInfo.account_data && accountInfo.account_data.inception) {
            const creationTimestamp = (accountInfo.account_data.inception * 1000) + RIPPLE_EPOCH_OFFSET;
            creationDateDisplay = new Date(creationTimestamp).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        const balanceXRP = accountInfo.balance ? (parseFloat(accountInfo.balance) / 1000000) : 0;
        const balanceDisplay = balanceXRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

        bithompContainer.innerHTML = `
            <h3>アカウント概要</h3>
            <p><strong>アドレス:</strong> ${accountInfo.address || address}</p>
            <p><strong>残高:</strong> ${balanceDisplay} XRP</p>
            <p><strong>アカウント作成日:</strong> ${creationDateDisplay}</p>
            <div id="transactions-list"></div>
        `; // transactions-list の中身は後で入れる

        // --- トランザクション履歴の表示 ---
        const transactionsListEl = document.getElementById('transactions-list');
        transactionsListEl.innerHTML = '<h3>トランザクション履歴 (直近5件)</h3>'; // 見出しを先に追加
        if (txData.transactions && txData.transactions.length > 0) {
            txData.transactions.forEach(tx => {
                const txDate = new Date((tx.date * 1000) + RIPPLE_EPOCH_OFFSET).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                let txDetails = `タイプ: ${tx.tx.TransactionType}`;
                 if (tx.tx.Amount && typeof tx.tx.Amount === 'object' && tx.tx.Amount.currency) { // IOU
                    txDetails += `, 金額: ${parseFloat(tx.tx.Amount.value).toLocaleString()} ${tx.tx.Amount.currency}`;
                 } else if (tx.tx.Amount) { // XRP
                    txDetails += `, 金額: ${(parseFloat(tx.tx.Amount) / 1000000).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 6})} XRP`;
                 }
                 if(tx.tx.NFTokenID) {
                    txDetails += `, NFT ID: ${tx.tx.NFTokenID.slice(0,10)}...${tx.tx.NFTokenID.slice(-4)}`
                 }

                const txItem = document.createElement('div');
                txItem.className = 'transaction-item';
                txItem.innerHTML = `<p><strong>日時:</strong> ${txDate}</p><p>${txDetails}</p>`;
                transactionsListEl.appendChild(txItem);
            });
        } else {
            const p = document.createElement('p');
            p.textContent = 'トランザクションは見つかりませんでした。';
            transactionsListEl.appendChild(p);
        }

        // --- NFTギャラリーの表示 ---
        if (nftsData.nfts && nftsData.nfts.length > 0) {
            nftContainer.innerHTML = ''; // ローディングメッセージをクリア
            const nftPromises = nftsData.nfts.slice(0, 12).map(async (nft) => { // 表示上限
                const nftItem = document.createElement('div');
                nftItem.className = 'nft-item';
                let nftImageUrl = 'studio4.jpg';
                let nftName = `NFT ID: ${nft.NFTokenID.slice(0, 8)}...${nft.NFTokenID.slice(-4)}`;

                if (nft.uri) {
                    try {
                        const decodedUri = hexToString(nft.uri);
                        let metadataUrl = convertIpfsUrl(decodedUri);

                        if (metadataUrl && (metadataUrl.startsWith('http') || metadataUrl.startsWith('ipfs:'))) {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 7000);

                            // メタデータ取得は依然としてブラウザから直接。CORSエラーの可能性あり。
                            const metaResponse = await fetch(metadataUrl, {
                                headers: { 'Accept': 'application/json' },
                                signal: controller.signal
                            }).catch(metaFetchError => {
                                // メタデータ取得自体のネットワークエラー(CORS含む)
                                console.warn(`NFTメタデータFetchエラー (URL: ${metadataUrl}, NFT ID: ${nft.NFTokenID}):`, metaFetchError);
                                return null; // エラー時はnullを返す
                            });
                            clearTimeout(timeoutId);

                            if (metaResponse && metaResponse.ok) {
                                const metadata = await metaResponse.json().catch(parseError => {
                                    console.warn(`NFTメタデータJSON解析エラー (URL: ${metadataUrl}, NFT ID: ${nft.NFTokenID}):`, parseError);
                                    return null; // 解析エラー時もnull
                                });

                                if (metadata) {
                                    nftImageUrl = convertIpfsUrl(metadata.image || metadata.image_url || metadata.Image || metadata.imageUrl || metadata.uri || nftImageUrl);
                                    nftName = metadata.name || metadata.Name || metadata.title || metadata.Title || (metadata.name_ja || metadata.name_en) || nftName;
                                }
                            } else if (metaResponse) { // metaResponseはあるがokではない場合 (404など)
                                console.warn(`NFTメタデータの取得失敗 (URL: ${metadataUrl}, Status: ${metaResponse.status}, NFT ID: ${nft.NFTokenID})`);
                            }
                        } else if(metadataUrl) {
                            console.log(`処理できないメタデータURI形式またはURIなし (NFT ID: ${nft.NFTokenID}, Decoded URI: ${decodedUri})`);
                        }
                    } catch (e) { // その他の予期せぬエラー
                        if (e.name === 'AbortError') {
                            console.warn(`NFTメタデータの取得タイムアウト (URI: ${nft.uri}, NFT ID: ${nft.NFTokenID})`);
                        } else {
                            console.warn(`NFTメタデータ処理中のエラー (URI: ${nft.uri}, NFT ID: ${nft.NFTokenID}):`, e);
                        }
                    }
                }

                nftItem.innerHTML = `
                    <img src="${nftImageUrl}" alt="${nftName}" onerror="this.onerror=null;this.src='studio4.jpg';">
                    <p title="${nftName}">${nftName.length > 25 ? nftName.slice(0,22)+'...' : nftName}</p>
                    <p class="nft-uri" title="NFT ID: ${nft.NFTokenID}\nURI: ${nft.uri || 'URIなし'}">
                        ID: ${nft.NFTokenID.slice(0,6)}...${nft.NFTokenID.slice(-4)}
                    </p>
                `;
                return nftItem;
            });

            const resolvedNftItems = await Promise.all(nftPromises);
            resolvedNftItems.forEach(item => {
                 if (item) nftContainer.appendChild(item);
            });

        } else {
            nftContainer.innerHTML = `<p class="gallery-placeholder">このアドレスにはNFTが見つからなかったみたい。残念！</p>`;
        }

    } catch (error) {
        // Promise.all でキャッチしたエラー、またはその後の処理のエラー
        console.error('Bithompデータ(プロキシ経由)の取得または処理エラー全体:', error);
        bithompContainer.innerHTML = `<p class="error-message">あらら！アカウント情報が取れなかったみたい…<br>(詳細: ${error.message})</p>`;
        nftContainer.innerHTML = `<p class="error-message">NFTの表示に失敗しました。<br>(詳細: ${error.message})</p>`;
    }
}


// --- ヘルパー関数 ---

function hexToString(hex) {
    if (!hex || typeof hex !== 'string' || hex.length % 2 !== 0) return hex;
    try {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            const charCode = parseInt(hex.substr(i, 2), 16);
            if (isNaN(charCode)) return hex;
            str += String.fromCharCode(charCode);
        }
        if (/^[\x20-\x7E]*$/.test(str) && str.length > 0 &&
            (str.startsWith('http') || str.startsWith('ipfs://') || str.startsWith('data:') ||
             str.includes('.') || str.includes('/') || str.includes(':') ||
             str.match(/\.(jpeg|jpg|png|gif|svg|json|txt|html|xml)$/i) ||
             str.trim().startsWith('{') && str.trim().endsWith('}')
            )) {
            return str;
        }
        return hex;
    } catch (e) {
        console.warn("hexToString変換エラー:", e);
        return hex;
    }
}

function convertIpfsUrl(url) {
    if (typeof url !== 'string') return url;
    // より多くのゲートウェイや形式に対応させることも可能
    const ipfsGateway = 'https://ipfs.io/ipfs/'; // 他のゲートウェイ(cloudflare-ipfs.comなど)も検討可

    if (url.startsWith('ipfs://ipfs/')) {
        return url.replace('ipfs://ipfs/', ipfsGateway);
    }
    if (url.startsWith('ipfs://')) {
        const cid = url.substring(7);
        if (cid.match(/^[a-zA-Z0-9/?=_-]{40,}$/)) { // CIDやパスを含む可能性を考慮
             return `${ipfsGateway}${cid}`;
        }
        return `${ipfsGateway}${url.replace('ipfs://', '')}`; // フォールバック
    }
    // CID v0 or v1
    if (url.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/) && !url.includes('/')) {
         return `${ipfsGateway}${url}`;
    }
    // Arweave gateway (example, if needed)
    // if (url.startsWith('ar://')) {
    //     return `https://arweave.net/${url.substring(5)}`;
    // }
    return url;
}

// モックデータ関数はコメントアウトまたは削除
// function getMockCmcData() { ... }