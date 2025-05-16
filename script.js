// script.js (DOMContentLoadedに関数呼び出しを追加)

// ... (tvlChartInstance, setupSmoothScrolling, setupMobileMenu, setupScrollAnimations, fetchCmcDataViaProxy, fetchDefiLlamaTvl は変更なし) ...

// ★★★ soso VALUEニュース取得関数 (前回と同じ内容) ★★★
async function fetchSosoValueNews() {
    const proxyUrl = '/api/soso-proxy'; // soso-proxy.jsを指す
    const container = document.getElementById('soso-news-container');

    if (!container) {
        console.error("soso VALUE news container not found!");
        return;
    }
    container.innerHTML = '<p class="loading-message">ニュースを読み込み中...</p>';

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
            throw new Error(`soso VALUEニュース取得エラー: ${response.status} - ${errorData.message || errorData.error || '詳細不明'}`);
        }
        const newsApiResponse = await response.json();
        const articles = newsApiResponse?.data?.list;

        if (articles && Array.isArray(articles) && articles.length > 0) {
            container.innerHTML = '';
            articles.slice(0, 6).forEach(article => { // 表示件数を6件に制限（例）
                const card = document.createElement('div');
                card.className = 'news-card';
                const imageUrl = article.image_url || 'studio4.jpg';
                const title = article.title || 'タイトルなし';
                const description = article.description || article.content_summary || '概要なし...';
                const sourceName = article.source_name || '提供元不明';
                const publishedAt = article.publish_ts ? new Date(article.publish_ts * 1000).toLocaleDateString('ja-JP') : '日付不明';
                const articleUrl = article.source_url || '#';

                card.innerHTML = `
                    <img src="${imageUrl}" alt="${title}" class="news-image" onerror="this.style.display='none'; this.src='studio4.jpg';">
                    <h3>${title}</h3>
                    <p class="news-source">${sourceName} - ${publishedAt}</p>
                    <p class="news-description">${description.substring(0, 120)}${description.length > 120 ? '...' : ''}</p>
                    <a href="${articleUrl}" target="_blank" class="read-more">続きを読む</a>
                `;
                container.appendChild(card);
            });
        } else if (newsApiResponse.code !== 0 && newsApiResponse.message) {
            throw new Error(`soso VALUE APIエラー: ${newsApiResponse.message} (code: ${newsApiResponse.code})`);
        } else {
            container.innerHTML = '<p>新しいニュースは見つかりませんでした。</p>';
        }
    } catch (error) {
        console.error('soso VALUE ニュースの取得エラー:', error);
        container.innerHTML = `<p class="error-message">あらら！ニュースが取れなかったみたい…<br>(詳細: ${error.message})</p>`;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    fetchCmcDataViaProxy();
    fetchDefiLlamaTvl();
    setupSmoothScrolling();
    setupMobileMenu();
    setupScrollAnimations();
    fetchSosoValueNews(); // ★★★ これが呼び出されていることを確認 ★★★
});