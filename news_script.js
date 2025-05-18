// news_script.js
document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('news-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageContainer = document.getElementById('error-message'); // ID修正

    // APIプロキシのエンドポイントURL
    const proxyApiUrl = '/api/sosoProxy'; 
    // もしクエリパラメータで取得件数などを変えたい場合は、ここでURLを組み立てる
    // 例: const proxyApiUrl = '/api/sosoProxy?lang=ja&page_size=10';

    function displayLoading(show) {
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    function displayError(message) {
        if (errorMessageContainer) {
            errorMessageContainer.textContent = message;
            errorMessageContainer.style.display = 'block';
        }
        if (newsContainer) { // エラー時はニュースコンテナをクリア
            newsContainer.innerHTML = '';
        }
        console.error('ニュース表示エラー:', message); // コンソールにもエラー出力
    }

    displayLoading(true);
    errorMessageContainer.style.display = 'none'; // 初期はエラー非表示

    try {
        const response = await fetch(proxyApiUrl);
        const result = await response.json(); // プロキシからのレスポンスは常にJSONと期待

        displayLoading(false);

        if (!response.ok || !result.success) {
            // プロキシ自体がエラーを返したか、プロキシ経由でAPIエラーが発生した場合
            throw new Error(result.error || `ニュースの取得に失敗しました (Status: ${response.status})`);
        }
        
        const articles = result.data && result.data.list ? result.data.list : [];

        if (articles.length > 0) {
            if (newsContainer) {
                newsContainer.innerHTML = ''; // 既存の内容をクリア
                articles.forEach(article => {
                    const newsItem = document.createElement('div');
                    // クラス名は mayfla_news.html の CSS 定義や Tailwind CSS に合わせる
                    newsItem.className = 'news-item'; 
                    
                    let imageHtml = '';
                    if (article.cover_image) {
                        // alt属性のテキストをエスケープ (簡易的)
                        const safeTitle = article.title.replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
                        imageHtml = `<img src="${article.cover_image}" alt="${safeTitle}" loading="lazy">`;
                    }

                    // 記事コンテンツ部分 (XSSに注意し、textContentを優先する)
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'news-content';

                    const titleElement = document.createElement('h3');
                    titleElement.className = 'news-title text-mayfblue-500'; // 既存のクラスを参考に
                    titleElement.textContent = article.title;

                    const dateElement = document.createElement('p');
                    dateElement.className = 'news-date';
                    dateElement.textContent = `公開日: ${new Date(article.published_at * 1000).toLocaleDateString('ja-JP')}`;
                    
                    const summaryElement = document.createElement('p');
                    summaryElement.className = 'news-summary';
                    summaryElement.textContent = article.summary || '概要はありません。';

                    const linkElement = document.createElement('a');
                    linkElement.className = 'news-link bg-mayfblue-500 hover:bg-mayfblue-600'; // 既存のクラスを参考に
                    linkElement.href = article.url;
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                    linkElement.textContent = '続きを読む';

                    contentDiv.appendChild(titleElement);
                    contentDiv.appendChild(dateElement);
                    contentDiv.appendChild(summaryElement);
                    contentDiv.appendChild(linkElement);
                    
                    if (imageHtml) {
                        newsItem.innerHTML = imageHtml; // 画像はinnerHTMLで先に追加
                    }
                    newsItem.appendChild(contentDiv); // テキストコンテンツはappendChildで

                    newsContainer.appendChild(newsItem);
                });
            } else {
                console.error('HTML内に news-container 要素が見つかりません。');
                displayError('ニュースを表示するためのコンテナが見つかりません。');
            }
        } else {
            displayError('表示できるニュース記事がありません。');
        }

    } catch (error) {
        displayLoading(false);
        displayError(error.message || 'ニュースの読み込み中に予期せぬエラーが発生しました。');
    }
});