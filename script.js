document.addEventListener('DOMContentLoaded', () => {
    // Bithomp APIキー (これはフロントエンドにあっても大きな問題にはなりにくいですが、
    // もし気になるなら、これもプロキシ経由にすることも可能です)
    const BITHOMP_API_KEY = 'd952a638-37c6-43e7-8aa0-f2a827acdc67'; 

    // CoinMarketCapのデータはVercelのプロキシ経由で取得します
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
            fetchXrplAccountData(BITHOMP_API_KEY); 
        } else if (!nftContainer.querySelector('.nft-item')) {
            // アドレスがなく、NFTもまだ表示されていなければプレースホルダーを表示
            nftContainer.innerHTML = '<p class="gallery-placeholder">まず、上のセクションでXRP Ledgerアドレスを入力してくださいね！</p>';
        }
    });
    
    // --- XRPLアドレス検索ボタンのイベントリスナー ---
    document.getElementById('fetch-xrpl-data-btn').addEventListener('click', () => fetchXrplAccountData(BITHOMP_API_KEY));
    document.getElementById('xrpl-address-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            fetchXrplAccountData(BITHOMP_API_KEY);
        }
    });
});

// --- CoinMarketCap API (Vercel プロキシ経由) ---
async function fetchCmcDataViaProxy() {
    // Vercelのapiフォルダ内のファイル名がパスになります (例: api/cmc.js なら /api/cmc)
    const proxyUrl = '/api/cmc'; 

    const container = document.getElementById('cmc-data-container');
    container.innerHTML = '<p class="loading-message">価格情報を読み込み中...</p>';

    try {
        const response = await fetch(proxyUrl); // プロキシ(通訳さん)を呼び出す

        if (!response.ok) {
            // プロキシやAPIからのエラーレスポンスを処理
            const errorData = await response.json().catch(() => ({ message: response.statusText })); // エラー本文の取得を試みる
            console.error('CMC Proxy Response Error:', response.status, errorData);
            let errorMessage = `CMCデータ取得エラー: ${response.status}`;
            // CoinMarketCapからの具体的なエラーメッセージがあればそれを優先
            if (errorData && errorData.status && errorData.status.error_message) {
                errorMessage += ` - ${errorData.status.error_message}`;
            } else if (errorData && errorData.message) { // プロキシサーバーからのエラーなど
                errorMessage += ` - ${errorData.message}`;
            } else if (errorData && errorData.error) { // プロキシサーバーからの独自エラー形式など
                errorMessage += ` - ${errorData.error}`;
            }
             else {
                errorMessage += ' - 詳細不明';
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();

        if (data && data.data) { // CoinMarketCap APIの成功時のレスポンス構造を期待
            container.innerHTML = ''; // ローディングメッセージをクリア
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
        } else if (data.error) { // プロキシ自体がエラーを返した場合 (api/cmc.js で定義したエラー形式など)
             throw new Error(`プロキシエラー: ${data.error}`);
        } else if (data.status && data.status.error_message) { // CMC APIからのエラーが直接返ってきた場合
            throw new Error(`CMC APIエラー: ${data.status.error_message}`);
        } else {
            // 予期せぬ成功レスポンス構造の場合
            console.warn("CMC APIからの予期せぬデータ構造:", data);
            throw new Error('CMC API: 無効なデータ構造です。');
        }
    } catch (error) {
        console.error('CoinMarketCapデータ(プロキシ経由)の取得エラー:', error);
        container.innerHTML = `<p class="error-message">あらら！価格情報が取れなかったみたい… メイフラちゃんが確認するね！<br>(詳細: ${error.message})</p>`;
    }
}

// --- Bithomp API ---
const RIPPLE_EPOCH_OFFSET = 946684800000; // リップルエポックとUNIXエポックの差（ミリ秒）

async function fetchXrplAccountData(bithompApiKey) {
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

    const headers = {
        'Accept': 'application/json'
    };
    if (bithompApiKey) {
        headers['X-Bithomp-Key'] = bithompApiKey;
    }

    try {
        // 1. アカウント情報を取得 (残高、作成日など)
        const infoUrl = `https://bithomp.com/api/v2/account/${address}/info`;
        const infoResponse = await fetch(infoUrl, { headers });
        if (!infoResponse.ok) {
             const errorText = await infoResponse.text().catch(() => "エラー詳細不明");
             console.error("Bithomp Info API Error:", infoResponse.status, errorText);
             throw new Error(`アカウント情報の取得に失敗: ${infoResponse.status} ${infoResponse.statusText}`);
        }
        const accountInfo = await infoResponse.json();

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
            <div id="transactions-list"><h3>トランザクション履歴 (直近5件)</h3><p class="loading-message">読み込み中...</p></div>
        `;

        // 2. トランザクション履歴を取得
        const txUrl = `https://bithomp.com/api/v2/account/${address}/transactions?limit=5&type=Payment,OfferCreate,NFTokenMint,NFTokenCreateOffer,NFTokenAcceptOffer`;
        const txResponse = await fetch(txUrl, { headers });
        const transactionsListEl = document.getElementById('transactions-list');
        if (txResponse.ok) {
            const txData = await txResponse.json();
            if (txData.transactions && txData.transactions.length > 0) {
                transactionsListEl.innerHTML = '<h3>トランザクション履歴 (直近5件)</h3>';
                txData.transactions.forEach(tx => {
                    const txDate = new Date((tx.date * 1000) + RIPPLE_EPOCH_OFFSET).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    let txDetails = `タイプ: ${tx.tx.TransactionType}`;
                    if (tx.tx.Amount && typeof tx.tx.Amount === 'object' && tx.tx.Amount.currency) { // IOUの場合
                        txDetails += `, 金額: ${parseFloat(tx.tx.Amount.value).toLocaleString()} ${tx.tx.Amount.currency}`;
                    } else if (tx.tx.Amount) { // XRPの場合
                         txDetails += `, 金額: ${(parseFloat(tx.tx.Amount) / 1000000).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 6})} XRP`;
                    }
                     if(tx.tx.NFTokenID) { // NFT関連の場合
                        txDetails += `, NFT ID: ${tx.tx.NFTokenID.slice(0,10)}...${tx.tx.NFTokenID.slice(-4)}`
                    }

                    const txItem = document.createElement('div');
                    txItem.className = 'transaction-item';
                    txItem.innerHTML = `<p><strong>日時:</strong> ${txDate}</p><p>${txDetails}</p>`;
                    transactionsListEl.appendChild(txItem);
                });
            } else {
                transactionsListEl.innerHTML = '<h3>トランザクション履歴 (直近5件)</h3><p>トランザクションは見つかりませんでした。</p>';
            }
        } else {
            const errorText = await txResponse.text().catch(() => "エラー詳細不明");
            console.error("Bithomp Transactions API Error:", txResponse.status, errorText);
            transactionsListEl.innerHTML = '<h3>トランザクション履歴 (直近5件)</h3><p class="error-message">トランザクションの取得に失敗しました。</p>';
        }

        // 3. NFTを取得
        const nftsUrl = `https://bithomp.com/api/v2/account/${address}/nfts?limit=20`; // 取得するNFTの上限
        const nftsResponse = await fetch(nftsUrl, { headers });
        if (!nftsResponse.ok) {
            const errorText = await nftsResponse.text().catch(() => "エラー詳細不明");
            console.error("Bithomp NFTs API Error:", nftsResponse.status, errorText);
            nftContainer.innerHTML = `<p class="error-message">NFTデータの取得に失敗しました: ${nftsResponse.status}</p>`;
        } else {
            const nftsData = await nftsResponse.json();
            if (nftsData.nfts && nftsData.nfts.length > 0) {
                nftContainer.innerHTML = ''; // ローディングメッセージをクリア
                const nftPromises = nftsData.nfts.slice(0, 12).map(async (nft) => { // 表示するNFTの上限 (例: 12件)
                    const nftItem = document.createElement('div');
                    nftItem.className = 'nft-item';
                    let nftImageUrl = 'studio4.jpg'; // デフォルトのプレースホルダー画像
                    let nftName = `NFT ID: ${nft.NFTokenID.slice(0, 8)}...${nft.NFTokenID.slice(-4)}`;
                    
                    if (nft.uri) {
                        try {
                            const decodedUri = hexToString(nft.uri);
                            let metadataUrl = convertIpfsUrl(decodedUri);
                           
                            if (metadataUrl && !metadataUrl.startsWith('http') && !metadataUrl.startsWith('ipfs:')) {
                                console.warn("相対パスまたは不明な形式のメタデータURI:", metadataUrl, "デコード元:", decodedUri, "NFT ID:", nft.NFTokenID);
                                // ここでURIの形式に応じて適切な処理を行う (例: ベースURLを付加)
                                // 今回はそのまま進めますが、実際のNFTではより複雑な処理が必要な場合があります
                            }
                            
                            if (metadataUrl && (metadataUrl.startsWith('http') || metadataUrl.startsWith('ipfs:'))) {
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 7000); // 7秒でタイムアウト

                                const metaResponse = await fetch(metadataUrl, { 
                                    headers: { 'Accept': 'application/json' }, // JSONメタデータを期待
                                    signal: controller.signal 
                                });
                                clearTimeout(timeoutId);

                                if (metaResponse.ok) {
                                    const metadata = await metaResponse.json();
                                    // 一般的な画像キーと言語ごとの名前キーを試す
                                    nftImageUrl = convertIpfsUrl(metadata.image || metadata.image_url || metadata.Image || metadata.imageUrl || metadata.uri || nftImageUrl);
                                    nftName = metadata.name || metadata.Name || metadata.title || metadata.Title || (metadata.name_ja || metadata.name_en) || nftName;
                                } else {
                                    console.warn(`NFTメタデータの取得失敗 (URL: ${metadataUrl}, Status: ${metaResponse.status}, NFT ID: ${nft.NFTokenID})`);
                                }
                            } else {
                                console.log(`処理できないメタデータURI形式またはURIなし (NFT ID: ${nft.NFTokenID}, Decoded URI: ${decodedUri})`);
                            }
                        } catch (e) {
                            if (e.name === 'AbortError') {
                                console.warn(`NFTメタデータの取得タイムアウト (URI: ${nft.uri}, NFT ID: ${nft.NFTokenID})`);
                            } else {
                                console.warn(`NFTメタデータの解析エラー (URI: ${nft.uri}, NFT ID: ${nft.NFTokenID}):`, e);
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
                    return nftItem; // Promise<HTMLElement> を返す
                });

                // 全てのNFTアイテムのPromiseが解決されるのを待つ
                const resolvedNftItems = await Promise.all(nftPromises);
                resolvedNftItems.forEach(item => {
                    if (item) nftContainer.appendChild(item); // nullチェック
                });

            } else {
                nftContainer.innerHTML = `<p class="gallery-placeholder">このアドレスにはNFTが見つからなかったみたい。残念！</p>`;
            }
        }

    } catch (error) {
        console.error('Bithompデータの取得エラー全体:', error);
        bithompContainer.innerHTML = `<p class="error-message">あらら！アカウント情報が取れなかったみたい… (詳細: ${error.message})</p>`;
        nftContainer.innerHTML = `<p class="error-message">NFTの表示に失敗しました。(詳細: ${error.message})</p>`;
    }
}


function hexToString(hex) {
    if (!hex || typeof hex !== 'string' || hex.length % 2 !== 0) return hex; // 無効な入力はそのまま返す
    try {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            const charCode = parseInt(hex.substr(i, 2), 16);
            if (isNaN(charCode)) return hex; // 16進数でない場合は元の値を返す
            str += String.fromCharCode(charCode);
        }
        // 印字可能なASCII文字のみで構成され、URLや一般的なテキスト形式の可能性が高いかチェック
        if (/^[\x20-\x7E]*$/.test(str) && str.length > 0 &&
            (str.startsWith('http') || str.startsWith('ipfs://') || str.startsWith('data:') ||
             str.includes('.') || str.includes('/') || str.includes(':') ||
             str.match(/\.(jpeg|jpg|png|gif|svg|json|txt|html|xml)$/i) ||
             str.trim().startsWith('{') && str.trim().endsWith('}') // JSONの可能性
            )) {
            return str;
        }
        return hex; // それ以外の場合はデコードせず元の16進数文字列を返す
    } catch (e) {
        console.warn("hexToString変換エラー:", e);
        return hex; // エラー時も元の値を返す
    }
}

function convertIpfsUrl(url) {
    if (typeof url !== 'string') return url; // 文字列でない場合はそのまま返す

    if (url.startsWith('ipfs://ipfs/')) {
        return url.replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/');
    }
    if (url.startsWith('ipfs://')) {
        // IPFS CID v0 (Qm...) または v1 (bafy...)
        const cid = url.substring(7); // "ipfs://" を除去
        if (cid.match(/^[a-zA-Z0-9]{40,}$/)) { // CIDの基本的な形式チェック
             return `https://ipfs.io/ipfs/${cid}`;
        }
        // それ以外の場合は、元の形式のままか、より汎用的なゲートウェイを試す
        return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;

    }
    // CIDのみの場合 (例: Qm... や bafy...)
    if (url.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/) && !url.includes('/')) {
         return `https://ipfs.io/ipfs/${url}`;
    }
    return url; // 上記以外はそのまま返す
}

// モックデータ関数は、プロキシが失敗した場合のフォールバックやテスト用に残しておいても良いでしょう。
// function getMockCmcData() { /* ... */ }