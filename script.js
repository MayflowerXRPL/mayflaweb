// script.js (プロ仕様デザイン対応版)

let tvlChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchCmcDataViaProxy();
    fetchDefiLlamaTvl();
    setupSmoothScrolling();
    setupMobileMenu();
    setupScrollAnimations(); // スクロールアニメーションを追加
    // setupHeaderScrollEffect(); // ヘッダースクロールエフェクト（オプション）
});

// ===== Smooth Scrolling Function (微調整) =====
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.header-nav a[href^="#"], .mobile-nav a[href^="#"], .hero-buttons a[href^="#"], .footer-nav a[href^="#"]'); // フッターも対象に
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            // 外部リンクや '#' だけのリンクは無視
            if (!targetId || targetId === '#' || targetId.startsWith('http') || targetId.startsWith('mailto')) {
                 // モバイルメニューが開いていたら閉じる（ページ内リンク以外でも）
                 if(document.body.classList.contains('mobile-menu-active')){
                     closeMobileMenu();
                 }
                 return; // 通常のリンク動作
            }

            e.preventDefault(); // ページ内リンクの場合のみデフォルト動作を抑制
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = document.querySelector('.site-header')?.offsetHeight || 70; // ヘッダーの高さを取得
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20; // オフセット調整

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
            closeMobileMenu(); // モバイルメニューを閉じる
        });
    });
}


// ===== Mobile Menu Functions (変更なし) =====
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

    if (!revealElements.length) return; // 対象要素がなければ何もしない

    // Intersection Observer をサポートしているか確認
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                     // 一度表示したら監視をやめる場合
                     // observer.unobserve(entry.target);
                } else {
                    // 画面外に出たらクラスを削除して再度アニメーションさせる場合（オプション）
                    // entry.target.classList.remove('active');
                }
            });
        }, {
            threshold: 0.15, // 要素が15%見えたらトリガー
            rootMargin: '0px 0px -50px 0px' // 画面下部から50px手前でトリガー開始
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        // Intersection Observer 非対応ブラウザ向けのフォールバック（全表示など）
        revealElements.forEach(element => element.classList.add('active'));
    }
}

// ===== Header Scroll Effect (Optional) =====
// function setupHeaderScrollEffect() {
//     const header = document.querySelector('.site-header');
//     if (!header) return;
//     let lastScrollTop = 0;
//     window.addEventListener('scroll', () => {
//         let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//         if (scrollTop > lastScrollTop && scrollTop > header.offsetHeight) {
//             // Scroll Down
//             header.style.top = `-${header.offsetHeight}px`; // Hide header
//             document.body.classList.remove('scrolled');
//         } else {
//             // Scroll Up or Top
//             header.style.top = '0';
//             if(scrollTop > 50) { // Add background after scrolling down a bit
//                 document.body.classList.add('scrolled');
//             } else {
//                 document.body.classList.remove('scrolled');
//             }
//         }
//         lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
//     }, false);
// }


// ===== API Fetching Functions (変更なし) =====

// --- CoinMarketCap API (Vercel プロキシ経由 /api/cmc) ---
async function fetchCmcDataViaProxy() {
    const proxyUrl = '/api/cmc';
    const container = document.getElementById('cmc-data-container');
    if (!container) { console.error("CMC data container not found!"); return; }
    container.innerHTML = '<p class="loading-message">価格情報を読み込み中...</p>';
    try {
        const response = await fetch(proxyUrl);
        // --- 省略 (前回のコードと同じ) ---
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('CMC Proxy Response Error:', response.status, errorData);
            let errorMessage = `CMCデータ取得エラー: ${response.status}`;
            if (errorData?.status?.error_message) errorMessage += ` - ${errorData.status.error_message}`;
            else if (errorData?.message) errorMessage += ` - ${errorData.message}`;
            else if (errorData?.error) errorMessage += ` - ${errorData.error}`;
            else errorMessage += ' - 詳細不明';
            throw new Error(errorMessage);
        }
        const data = await response.json();
        if (data?.data) {
            container.innerHTML = '';
            data.data.slice(0, 10).forEach(crypto => {
                const price = crypto.quote.USD.price;
                const change24h = crypto.quote.USD.percent_change_24h;
                const card = document.createElement('div');
                card.className = 'token-card';
                card.innerHTML = `<h3>${crypto.name} (${crypto.symbol})</h3><p>価格: <span class="price">$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 0.01 ? 8 : (price < 1 ? 4 : 2) })}</span></p><p>24時間変動: <span class="${change24h >= 0 ? 'change-positive' : 'change-negative'}">${change24h?.toFixed(2) ?? 'N/A'}%</span></p>`;
                container.appendChild(card);
            });
        } else if (data?.error) { throw new Error(`プロキシエラー: ${data.error}`); }
        else if (data?.status?.error_message) { throw new Error(`CMC APIエラー: ${data.status.error_message}`); }
        else { console.warn("CMC APIからの予期せぬデータ構造:", data); throw new Error('CMC API: 無効なデータ構造です。'); }
    } catch (error) {
        console.error('CoinMarketCapデータ(プロキシ経由)の取得エラー:', error);
        container.innerHTML = `<p class="error-message">あらら！価格情報が取れなかったみたい…<br>(詳細: ${error.message})</p>`;
    }
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
         // --- 省略 (前回のコードと同じ) ---
        if (!response.ok) {
             const errorText = await response.text().catch(()=> response.statusText);
            console.error('DefiLlama API Error:', response.status, errorText);
             if(response.status === 404) { throw new Error(`DefiLlama APIエラー: XRPLのチャートデータが見つかりません。`); }
             else { throw new Error(`DefiLlama APIエラー: ${response.status} - ${errorText}`); }
        }
        const chartData = await response.json();
        if (Array.isArray(chartData) && chartData.length > 0) {
            const recentData = chartData.slice(-365);
            const labels = recentData.map(item => new Date(parseInt(item.date) * 1000).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric'}));
            const tvlValues = recentData.map(item => item.totalLiquidityUSD);
            const latestTvl = tvlValues.length > 0 ? tvlValues[tvlValues.length - 1] : 0;
            currentTvlContainer.innerHTML = `<h3>$${latestTvl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3><p>Current TVL (XRPL)</p>`;
            const ctx = canvas.getContext('2d');
             if (tvlChartInstance) { tvlChartInstance.destroy(); }
            tvlChartInstance = new Chart(ctx, {
                type: 'line', data: { labels: labels, datasets: [{ label: 'XRPL TVL (USD)', data: tvlValues, borderColor: 'var(--chart-line-color)', backgroundColor: 'var(--chart-bg-color)', borderWidth: 2, fill: true, tension: 0.2, pointRadius: 0, pointHoverRadius: 5 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B'; if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M'; if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K'; return value.toLocaleString(); }, font: { size: 10 } }, grid: { color: 'var(--chart-grid-color)' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } } },
                    plugins: { tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) label += ': '; const value = context.parsed.y; if (value !== null) { if (value >= 1e9) label += '$'+(value / 1e9).toFixed(2) + 'B'; else if (value >= 1e6) label += '$'+(value / 1e6).toFixed(2) + 'M'; else if (value >= 1e3) label += '$'+(value / 1e3).toFixed(2) + 'K'; else label += '$'+value.toLocaleString(); } return label; } } }, legend: { display: false } },
                    interaction: { intersect: false, mode: 'index', },
                }
            });
             chartContainer.querySelector('.loading-message')?.remove();
        } else { console.warn("DefiLlama APIからのデータが空または配列ではありません:", chartData); throw new Error('DefiLlamaから有効なチャートデータが取得できませんでした。'); }
    } catch (error) {
        console.error('DefiLlama TVL Chartデータの取得/処理エラー:', error);
         if (error.message.includes('Failed to fetch')) { error.message = 'DefiLlama APIへの接続に失敗しました。ネットワークを確認するか、CORSの問題かもしれません。'; }
         const errorMessageHtml = `<p class="error-message">あらら！TVL情報が取れなかったみたい…<br>(詳細: ${error.message})</p>`;
         chartContainer.innerHTML = errorMessageHtml;
         currentTvlContainer.innerHTML = '';
    }
}