// news_script.js (soso VALUE APIを直接呼び出す)

document.addEventListener('DOMContentLoaded', () => {
    fetchSosoValueNewsDirectly(); // 直接APIを叩く関数に変更
    setupMobileMenuNews();
    setupScrollAnimationsNews();
});

// ===== Mobile Menu Functions (変更なし) =====
function setupMobileMenuNews() {
    const menuToggle = document.getElementById('mobile-menu-toggle-news');
    const mobileNav = document.getElementById('mobile-nav-menu-news');
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            const isActive = document.body.classList.toggle('mobile-menu-active');
            menuToggle.classList.toggle('active', isActive);
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            mobileNav.setAttribute('aria-hidden', !isActive);
        });
    }
}

function closeMobileMenuNews() {
     const menuToggle = document.getElementById('mobile-menu-toggle-news');
     document.body.classList.remove('mobile-menu-active');
     if (menuToggle) {
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
     }
     document.getElementById('mobile-nav-menu-news')?.setAttribute('aria-hidden', 'true');
}
const mobileNavLinksNews = document.querySelectorAll('#mobile-nav-menu-news a');
mobileNavLinksNews.forEach(link => {
    link.addEventListener('click', closeMobileMenuNews);
});

// ===== Scroll Reveal Animation Function (変更なし) =====
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


// --- soso VALUE News API (直接呼び出し) ---
async function fetchSosoValueNewsDirectly() {
    // ★★★ 直接 soso VALUE APIのエンドポイントを叩く ★★★
    const lang = 'ja';
    const pageSize = 12; // 表示件数
    const apiUrl = `https://pro-api.sosovalue.xyz/api/v1/news/list?page=1&page_size=${pageSize}&lang=${lang}`;
    const container = document.getElementById('soso-news-container-page');

    if (!container) {
        console.error("soso VALUE news container (news page) not found!");
        return;
    }
    container.innerHTML = '<p class="loading-message">ニュースを読み込み中...</p>';

    try {
        console.log(`[news_script.js] Fetching soso VALUE URL directly: ${apiUrl}`);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // ★★★ APIキーは不要なのでヘッダーもなし ★★★
            }
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => `HTTP error! status: ${response.status}`);
            console.error('soso VALUE API Direct Error:', response.status, errorText);
            // APIからのエラーメッセージを具体的に表示しようと試みる
            let errorDetail = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson && errorJson.message) {
                    errorDetail = errorJson.message;
                }
            } catch (e) {
                // JSONパース失敗時は元のテキストを使用
            }
            throw new Error(`soso VALUEニュース取得エラー: ${response.status} - ${errorDetail}`);
        }

        const newsApiResponse = await response.json();
        const articles = newsApiResponse?.data?.list;

        if (articles && Array.isArray(articles) && articles.length > 0) {
            container.innerHTML = '';
            articles.forEach(article => {
                const card = document.createElement('div');
                card.className = 'news-card';
                const imageUrl = article.image_url || 'studio4.jpg';
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
        console.error('soso VALUE ニュースの取得エラー (direct):', error);
        container.innerHTML = `<p class="error-message">あらら！ニュースが取れなかったみたい…<br>(詳細: ${error.message})</p>`;
    }
}