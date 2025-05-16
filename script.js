// script.js (API呼び出し完全復活、パーティクルなし - 本当の最終FIX版)

let tvlChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // ★★★ APIデータ取得を全て呼び出すように戻します！ ★★★
    fetchCmcDataViaProxy();
    fetchDefiLlamaTvl();
    fetchSosoValueNews(); // soso VALUEニュースも呼び出し

    // --- ページ内動作 ---
    setupSmoothScrolling();
    setupMobileMenu();
    setupScrollAnimations();
    // loadParticles(); // パーティクル初期化呼び出しは削除
});

// ===== Smooth Scrolling Function =====
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.mobile-nav a[href^="#"], .hero-buttons a[href^="#"], .footer-nav a[href^="#"], .hero-main-cta a[href^="#"]'); // メインCTAボタンも対象に
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            // 外部リンクや '#' だけのリンク、他のページへのリンクは通常の動作
            if (!targetId || targetId === '#' || targetId.startsWith('http') || targetId.startsWith('mailto') || targetId.endsWith('.html')) {
                 if(document.body.classList.contains('mobile-menu-active')){ closeMobileMenu(); }
                 // 通常のリンク動作をさせたいので、e.preventDefault() をしない
                 return;
            }
            e.preventDefault(); // ページ内リンクの場合のみデフォルト動作を抑制
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = document.querySelector('.site-header')?.offsetHeight || 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
            closeMobileMenu();
        });
    });
     const mobileNavLinks = document.querySelectorAll('.mobile-nav a[href^="#"]');
     mobileNavLinks.forEach(link => {
         link.addEventListener('click', function(e) {
             e.preventDefault();
             const targetId = this.getAttribute('href');
             const targetElement = document.querySelector(targetId);
             if (targetElement) {
                 const headerOffset = document.querySelector('.site-header')?.offsetHeight || 70;
                 const elementPosition = targetElement.getBoundingClientRect().top;
                 const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;
                 window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
             }
             closeMobileMenu();
         });
     });
}

// ===== Mobile Menu Functions =====
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav-menu');
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            const isActive = document.body.classList.toggle('mobile-menu-active');
            menuToggle.classList.toggle('active', isActive);
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            mobileNav.setAttribute('aria-hidden', !isActive);
        });
    }
}

function closeMobileMenu() {
     const menuToggle = document.getElementById('mobile-menu-toggle');
     document.body.classList.remove('mobile-menu-active');
     if (menuToggle) {
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
     }
     document.getElementById('mobile-nav-menu')?.setAttribute('aria-hidden', 'true');
}

// ===== Scroll Reveal Animation Function =====
function setupScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('active'); }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        revealElements.forEach(element => { revealObserver.observe(element); });
    } else { revealElements.forEach(element => element.classList.add('active')); }
}

// ===== API Fetching Functions =====

// --- CoinMarketCap API (Vercel プロキシ経由 /api/cmc) ---
async function fetchCmcDataViaProxy() {
    const proxyUrl = '/api/cmc';
    const container = document.getElementById('cmc-data-container');
    if (!container) { console.error("CMC data container not found!"); return; }
    container.innerHTML = '<p class="loading-message">価格情報を読み込み中...</p>';
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) { const errorData = await response.json().catch(() => ({ message: response.statusText })); console.error('CMC Proxy Response Error:', response.status, errorData); let errorMessage = `CMCデータ取得エラー: ${response.status}`; if (errorData?.status?.error_message) errorMessage += ` - ${errorData.status.error_message}`; else if (errorData?.message) errorMessage += ` - ${errorData.message}`; else if (errorData?.error) errorMessage += ` - ${errorData.error}`; else errorMessage += ' - 詳細不明'; throw new Error(errorMessage); }
        const data = await response.json();
        if (data?.data) { container.innerHTML = ''; data.data.slice(0, 10).forEach(crypto => { const price = crypto.quote.USD.price; const change24h = crypto.quote.USD.percent_change_24h; const card = document.createElement('div'); card.className = 'token-card'; card.innerHTML = `<h3>${crypto.name} (${crypto.symbol})</h3><p>価格: <span class="price">$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 0.01 ? 8 : (price < 1 ? 4 : 2) })}</span></p><p>24時間変動: <span class="${change24h >= 0 ? 'change-positive' : 'change-negative'}">${change24h?.toFixed(2) ?? 'N/A'}%</span></p>`; container.appendChild(card); }); }
        else if (data?.error) { throw new Error(`プロキシエラー: ${data.error}`); } else if (data?.status?.error_message) { throw new Error(`CMC APIエラー: ${data.status.error_message}`); } else { console.warn("CMC APIからの予期せぬデータ構造:", data); throw new Error('CMC API: 無効なデータ構造です。'); }
    } catch (error) { console.error('CoinMarketCapデータ(プロキシ経由)の取得エラー:', error); container.innerHTML = `<p class="error-message">あらら！価格情報が取れなかったみたい…<br>(詳細: ${error.message})</p>`; }
}

// --- DefiLlama API (XRPL TVL グラフ) ---
async function fetchDefiLlamaTvl() {
    const url = 'https://api.llama.fi/charts/xrpl';
    const container = document.getElementById('defilama-tvl-container');
    const currentTvlContainer = document.getElementById('current-tvl-display');
    const canvas = document.getElementById('tvlChart');
    const chartContainer = container?.querySelector('.chart-container');
    if (!container || !currentTvlContainer || !canvas || !chartContainer) { console.error("TVL表示に必要なHTML要素が見つかりません。"); return; }
    chartContainer.innerHTML = ''; chartContainer.appendChild(canvas); currentTvlContainer.innerHTML = `<p class="loading-message">現在のTVL読み込み中...</p>`;
    try {
        const response = await fetch(url);
        if (!response.ok) { const errorText = await response.text().catch(()=> response.statusText); console.error('DefiLlama API Error:', response.status, errorText); if(response.status === 404) { throw new Error(`DefiLlama APIエラー: XRPLのチャートデータが見つかりません。`); } else { throw new Error(`DefiLlama APIエラー: ${response.status} - ${errorText}`); } }
        const chartData = await response.json();
        if (Array.isArray(chartData) && chartData.length > 0) { const recentData = chartData.slice(-365); const labels = recentData.map(item => new Date(parseInt(item.date) * 1000).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric'})); const tvlValues = recentData.map(item => item.totalLiquidityUSD); const latestTvl = tvlValues.length > 0 ? tvlValues[tvlValues.length - 1] : 0; currentTvlContainer.innerHTML = `<h3>$${latestTvl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3><p>Current TVL (XRPL)</p>`; const ctx = canvas.getContext('2d'); if (tvlChartInstance) { tvlChartInstance.destroy(); } tvlChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'XRPL TVL (USD)', data: tvlValues, borderColor: 'var(--chart-line-color)', backgroundColor: 'var(--chart-bg-color)', borderWidth: 2, fill: true, tension: 0.2, pointRadius: 0, pointHoverRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B'; if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M'; if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K'; return value.toLocaleString(); }, font: { size: 10 } }, grid: { color: 'var(--chart-grid-color)' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } } }, plugins: { tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) label += ': '; const value = context.parsed.y; if (value !== null) { if (value >= 1e9) label += '$'+(value / 1e9).toFixed(2) + 'B'; else if (value >= 1e6) label += '$'+(value / 1e6).toFixed(2) + 'M'; else if (value >= 1e3) label += '$'+(value / 1e3).toFixed(2) + 'K'; else label += '$'+value.toLocaleString(); } return label; } } }, legend: { display: false } }, interaction: { intersect: false, mode: 'index', }, } }); chartContainer.querySelector('.loading-message')?.remove(); }
        else { console.warn("DefiLlama APIからのデータが空または配列ではありません:", chartData); throw new Error('DefiLlamaから有効なチャートデータが取得できませんでした。'); }
    } catch (error) { console.error('DefiLlama TVL Chartデータの取得/処理エラー:', error); if (error.message.includes('Failed to fetch')) { error.message = 'DefiLlama APIへの接続に失敗しました。ネットワークを確認するか、CORSの問題かもしれません。'; } const errorMessageHtml = `<p class="error-message">あらら！TVL情報が取れなかったみたい…<br>(詳細: ${error.message})</p>`; chartContainer.innerHTML = errorMessageHtml; currentTvlContainer.innerHTML = ''; }
}

// --- soso VALUE News API (Vercel プロキシ経由 /api/soso-proxy) ---
async function fetchSosoValueNews() {
    const proxyUrl = '/api/soso-proxy'; // Vercelのapiフォルダ内のsoso-proxy.jsを指す
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
            articles.slice(0, 6).forEach(article => { // 表示件数を6件に制限
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