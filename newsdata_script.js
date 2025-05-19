// newsdata_script.js (修正案)
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[NewsData Script] DOMContentLoaded event fired. Script starting.');

    const newsContainer = document.getElementById('newsdata-container');
    const loadingIndicator = document.getElementById('newsdata-loading-indicator');
    const errorMessageContainer = document.getElementById('newsdata-error-message');

    // --- HTML要素の存在チェック ---
    if (!newsContainer) {
        console.error('[NewsData Script] Critical Error: HTML element with ID "newsdata-container" not found.');
        // エラーメッセージコンテナがあればそこに表示、なければアラートなど
        if (errorMessageContainer) {
            errorMessageContainer.textContent = 'エラー: ニュース表示エリアが見つかりません。(newsdata-container)';
            errorMessageContainer.style.display = 'block';
        } else {
            alert('エラー: ニュース表示エリアが見つかりません。(newsdata-container)');
        }
        if (loadingIndicator) loadingIndicator.style.display = 'none'; // ローディングは確実に消す
        return; // これ以上処理を進めない
    }
    if (!loadingIndicator) {
        console.warn('[NewsData Script] Warning: HTML element with ID "newsdata-loading-indicator" not found. Loading indication will not be shown.');
    }
    if (!errorMessageContainer) {
        console.warn('[NewsData Script] Warning: HTML element with ID "newsdata-error-message" not found. Error messages will be shown in console/alert.');
    }
    // --- ここまでHTML要素の存在チェック ---

    const proxyApiUrl = '/api/getNewsDataNews'; 
    console.log(`[NewsData Script] API Proxy URL: ${proxyApiUrl}`);

    function displayLoading(show) {
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
        console.log(`[NewsData Script] Loading indicator display: ${show ? 'block' : 'none'}`);
    }

    function displayError(message) {
        if (errorMessageContainer) {
            errorMessageContainer.textContent = message;
            errorMessageContainer.style.display = 'block';
        } else {
            // エラーメッセージコンテナがない場合はアラートで表示
            alert(`ニュースエラー: ${message}`);
        }
        if (newsContainer) {
            newsContainer.innerHTML = ''; // エラー時は既存のニュースをクリア
        }
        console.error('[NewsData Script] Displaying Error:', message);
    }

    displayLoading(true);
    if (errorMessageContainer) errorMessageContainer.style.display = 'none'; // 初期はエラー非表示

    try {
        console.log('[NewsData Script] Attempting to fetch news from proxy...');
        const response = await fetch(proxyApiUrl);
        console.log(`[NewsData Script] Proxy response status: ${response.status}`);

        // レスポンスがJSON形式であることを期待してパース
        // response.ok だけではAPIの内部エラー (success: false) を検知できないため、result.successも見る
        let result;
        try {
            result = await response.json();
            console.log('[NewsData Script] Proxy response JSON parsed:', result);
        } catch (jsonError) {
            console.error('[NewsData Script] Failed to parse proxy response as JSON:', jsonError);
            // response.text()で実際のレスポンスボディを確認する
            const errorText = await response.text();
            console.error('[NewsData Script] Raw proxy response text:', errorText.substring(0, 500)); // 長すぎる場合は一部表示
            throw new Error(`サーバーからの応答が不正です。詳細はコンソールを確認してください。(Status: ${response.status})`);
        }


        if (!response.ok || !result.success) {
            // result.error にプロキシからのエラーメッセージが入っていることを期待
            const errorMessage = result.error || `ニュースの取得に失敗しました (サーバー応答ステータス: ${response.status})`;
            console.error(`[NewsData Script] Error from proxy or API: ${errorMessage}`, result);
            throw new Error(errorMessage);
        }

        const articles = result.news || [];
        console.log(`[NewsData Script] Fetched ${articles.length} articles.`);

        if (articles.length > 0) {
            newsContainer.innerHTML = ''; // 既存の内容をクリア
            articles.forEach(article => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item p-4 border rounded-lg shadow-md bg-white mb-4';

                let imageHtml = '';
                if (article.image_url) {
                    const safeTitle = (article.title || '記事画像').replace(/"/g, '"');
                    imageHtml = `<img src="${article.image_url}" alt="${safeTitle}" class="w-full h-48 object-cover rounded-t-lg mb-3" loading="lazy">`;
                }

                const title = article.title || 'タイトルなし';
                const source = article.source_id || '提供元不明';
                const publishedDate = article.pubDate ? new Date(article.pubDate).toLocaleDateString('ja-JP') : '日付不明';
                const descriptionText = article.description || article.content || '概要はありません。';
                const description = descriptionText.substring(0,150) + (descriptionText.length > 150 ? '...' : '');
                const articleLink = article.link || '#';

                // 安全なDOM操作のためにtextContentやcreateElementを優先
                const contentDiv = document.createElement('div');
                contentDiv.className = 'p-1'; // Tailwind想定クラス

                const titleElement = document.createElement('h3');
                titleElement.className = 'text-xl font-bold text-mayfblue-500 mb-1';
                titleElement.textContent = title;

                const sourceDateElement = document.createElement('p');
                sourceDateElement.className = 'text-xs text-gray-500 mb-2';
                sourceDateElement.innerHTML = `<span>${publishedDate}</span> - <span class="font-semibold">${source}</span>`;

                const descriptionElement = document.createElement('p');
                descriptionElement.className = 'text-gray-700 text-sm mb-3';
                descriptionElement.textContent = description;
                
                const linkElement = document.createElement('a');
                linkElement.className = 'inline-block bg-mayfblue-500 hover:bg-mayfblue-600 text-white font-semibold py-2 px-3 rounded text-sm';
                linkElement.href = articleLink;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                linkElement.textContent = '続きを読む';

                if (imageHtml) {
                    // 画像はinnerHTMLで設定するが、信頼できるURLであることを前提とする
                    const imgContainer = document.createElement('div');
                    imgContainer.innerHTML = imageHtml;
                    newsItem.appendChild(imgContainer);
                }
                
                contentDiv.appendChild(titleElement);
                contentDiv.appendChild(sourceDateElement);
                contentDiv.appendChild(descriptionElement);
                contentDiv.appendChild(linkElement);
                newsItem.appendChild(contentDiv);
                
                newsContainer.appendChild(newsItem);
            });
        } else {
            displayError('表示できるニュース記事がありません。');
        }

    } catch (error) {
        console.error('[NewsData Script] Main catch block error:', error);
        displayLoading(false);
        displayError(error.message || 'ニュースの読み込み中に予期せぬエラーが発生しました。コンソールで詳細を確認してください。');
    }
});