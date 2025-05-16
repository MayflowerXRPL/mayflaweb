// news_script.js (メイフラニュース専用ページ用)

document.addEventListener('DOMContentLoaded', () => {
    fetchSosoValueNewsForNewsPage(); // ニュースページ用の関数を呼び出し
    setupMobileMenuNews(); // ニュースページ用モバイルメニュー
    setupScrollAnimationsNews(); // スクロールアニメーション
});

// ===== Mobile Menu Functions (ニュースページ用) =====
function setupMobileMenuNews() {
    const menuToggle = document.getElementById('mobile-menu-toggle-news'); // IDを変更
    const mobileNav = document.getElementById('mobile-nav-menu-news'); // IDを変更

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            const isActive = document.body.classList.toggle('mobile-menu-active');
            menuToggle.classList.toggle('active', isActive);
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            mobileNav.setAttribute('aria-hidden', !isActive);
        });
    }
}

function closeMobileMenuNews() { // ニュースページ用
     const menuToggle = document.getElementById('mobile-menu-toggle-news');
     document.body.classList.remove('mobile-menu-active');
     if (menuToggle) {
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
     }
     document.getElementById('mobile-nav-menu-news')?.setAttribute('aria-hidden', 'true');
}
// モバイルナビ内のリンクがクリックされたらメニューを閉じる
const mobileNavLinksNews = document.querySelectorAll('#mobile-nav-menu-news a');
mobileNavLinksNews.forEach(link => {
    link.addEventListener('click', closeMobileMenuNews);
});


// ===== Scroll Reveal Animation Function (ニュースページ用) =====
function setupScrollAnimationsNews() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('active'); }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(element => { revealObserver.observe(element); });
    } else { revealElements.forEach(element => element.classList.add('active')); }
}


// --- soso VALUE News API (ニュースページ用) ---
async function fetchSosoValueNewsForNewsPage() {
    const proxyUrl = '/api/soso-proxy'; // プロキシは共通
    const container = document.getElementById('soso-news-container-page'); // ニュースページのコンテナID

    if (!container) {
        console.error("soso VALUE news container (news page) not found!");
        return;
    }
    container.innerHTML = '<p class="loading-message">ニュースを読み込み中...</p>';

    try {
        // ニュースページではより多くの記事を表示する例 (例: 12件)
        const response = await fetch(`${proxyUrl}?page_size=12&lang=ja`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
            throw new Error(`soso VALUEニュース取得エラー: ${response.status} - ${errorData.message || errorData.error || '詳細不明'}`);
        }
        const newsApiResponse = await response.json();
        const articles = newsApiResponse?.data?.list;

        if (articles && Array.isArray(articles) && articles.length > 0) {
            container.innerHTML = '';
            articles.forEach(article => {
                const card = document.createElement('div');
                card.className = 'news-card';
                const imageUrl = article.image_url || 'studio4.jpg'; // studio4.jpg を代替画像に
                const title = article.title || 'タイトルなし';
                const description = article.description || article.content_summary || '概要なし...';
                const sourceName = article.source_name || '提供元不明';
                const publishedAt = article.publish_ts ? new Date(article.publish_ts * 1000).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '日付不明';
                const articleUrl = article.source_url || '#';

                card.innerHTML = `
                    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="news-image" onerror="this.style.display='none'; this.src='studio4.jpg';">` : ''}
                    <h3><a href="${articleUrl}" target="_blank">${title}</a></h3>
                    <p class="news-source">${sourceName} - ${publishedAt}</p>
                    <p class="news-description">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                    <a href="${articleUrl}" target="_blank" class="read-more">続きを読む →</a>
                `;
                container.appendChild(card);
            });
        } else if (newsApiResponse.code !== 0 && newsApiResponse.message) {
            throw new Error(`soso VALUE APIエラー: ${newsApiResponse.message} (code: ${newsApiResponse.code})`);
        } else {
            container.innerHTML = '<p>新しいニュースは見つかりませんでした。</p>';
        }
    } catch (error) {
        console.error('soso VALUE ニュースの取得エラー (news page):', error);
        container.innerHTML = `<p class="error-message">あらら！ニュースが取れなかったみたい…<br>(詳細: ${error.message})</p>`;
    }
}