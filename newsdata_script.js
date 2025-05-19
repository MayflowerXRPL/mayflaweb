// newsdata_script.js
document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('newsdata-container');
    const loadingIndicator = document.getElementById('newsdata-loading-indicator');
    const errorMessageContainer = document.getElementById('newsdata-error-message');

    const proxyApiUrl = '/api/getNewsDataNews'; // Serverless Functionのエンドポイント
    // 必要ならクエリパラメータで言語やカテゴリを指定:
    // const proxyApiUrl = '/api/getNewsDataNews?language=ja&category=technology';

    function displayLoading(show) {
        if (loadingIndicator) loadingIndicator.style.display = show ? 'block' : 'none';
    }

    function displayError(message) {
        if (errorMessageContainer) {
            errorMessageContainer.textContent = message;
            errorMessageContainer.style.display = 'block';
        }
        if (newsContainer) newsContainer.innerHTML = '';
        console.error('NewsData.io Display Error:', message);
    }

    displayLoading(true);
    if (errorMessageContainer) errorMessageContainer.style.display = 'none';

    try {
        const response = await fetch(proxyApiUrl);
        const result = await response.json();

        displayLoading(false);

        if (!response.ok || !result.success) {
            throw new Error(result.error || `ニュースの取得に失敗 (Status: ${response.status})`);
        }

        const articles = result.news || [];

        if (newsContainer && articles.length > 0) {
            newsContainer.innerHTML = '';
            articles.forEach(article => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item p-4 border rounded-lg shadow-md bg-white mb-4'; // Tailwind想定

                let imageHtml = '';
                if (article.image_url) { // NewsData.ioでは image_url
                    const safeTitle = (article.title || '').replace(/"/g, '"');
                    imageHtml = `<img src="${article.image_url}" alt="${safeTitle}" class="w-full h-48 object-cover rounded-t-lg mb-3" loading="lazy">`;
                }

                const title = article.title || 'タイトルなし';
                const source = article.source_id || '提供元不明'; // NewsData.ioでは source_id
                const publishedDate = article.pubDate ? new Date(article.pubDate).toLocaleDateString('ja-JP') : '日付不明'; // pubDate
                const description = article.description ? article.description.substring(0,150) + (article.description.length > 150 ? '...' : '') : (article.content ? article.content.substring(0,150) + (article.content.length > 150 ? '...' : '') : '概要はありません。'); // description or content
                const articleLink = article.link || '#'; // link

                newsItem.innerHTML = `
                    ${imageHtml}
                    <div class="p-1">
                        <h3 class="text-xl font-bold text-mayfblue-500 mb-1">${title}</h3>
                        <p class="text-xs text-gray-500 mb-2">
                            <span>${publishedDate}</span> - 
                            <span class="font-semibold">${source}</span>
                        </p>
                        <p class="text-gray-700 text-sm mb-3">${description}</p>
                        <a href="${articleLink}" target="_blank" rel="noopener noreferrer" class="inline-block bg-mayfblue-500 hover:bg-mayfblue-600 text-white font-semibold py-2 px-3 rounded text-sm">続きを読む</a>
                    </div>
                `;
                newsContainer.appendChild(newsItem);
            });
        } else if (articles.length === 0) {
            displayError('表示できるニュース記事がありません。');
        } else {
            console.error('HTML内に newsdata-container 要素が見つかりません。');
            displayError('ニュース表示エリアが見つかりません。');
        }

    } catch (error) {
        displayLoading(false);
        displayError(error.message || 'ニュースの読み込み中に予期せぬエラーが発生しました。');
    }
});