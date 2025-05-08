// script.js (最終版 - パーティクル背景対応)

let tvlChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchCmcDataViaProxy();
    fetchDefiLlamaTvl();
    setupSmoothScrolling();
    setupMobileMenu();
    setupScrollAnimations();
    // ★★★ パーティクル背景の初期化を呼び出す ★★★
    loadParticles();
});

// ===== Smooth Scrolling Function =====
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.mobile-nav a[href^="#"], .hero-buttons a[href^="#"], .footer-nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#' || targetId.startsWith('http') || targetId.startsWith('mailto')) {
                 if(document.body.classList.contains('mobile-menu-active')){ closeMobileMenu(); }
                 return;
            }
            e.preventDefault();
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

// ===== ★★★ Particles Background Function ★★★ =====
async function loadParticles() {
     // tsParticles が利用可能になるまで少し待つ（CDN読み込み用）
     if (typeof tsParticles === "undefined") {
        console.log("Waiting for tsParticles...");
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof tsParticles === "undefined") {
             console.error("tsParticles library not loaded after wait.");
             return; // tsParticlesがなければ実行しない
         }
    }

    // tsParticlesの設定 (星や花びらが舞うイメージ)
    try {
        await tsParticles.load({
            id: "tsparticles", // HTMLのコンテナID
            options: {
                /* ★★★ パーティクル設定 ここから ★★★ */
                fullScreen: { enable: true, zIndex: -1 }, // 画面全体、最背面
                particles: {
                    number: { value: 60, density: { enable: true, value_area: 800 } }, // 数を調整
                    color: { value: ["#FFB6C1", "#ADD8E6", "#98FB98", "#DDA0DD", "#FFFACD", "#ffccdd"] }, // パステルカラー
                    shape: {
                        type: ["circle", "star"] // ★★★ 星と円を混ぜる ★★★
                        // 画像を使う場合:
                        // type: "image",
                        // image: [
                        //   { src: "path/to/flower1.png", height: 20, width: 20 },
                        //   { src: "path/to/star1.png", height: 20, width: 20 },
                        //   { src: "path/to/sparkle.png", height: 15, width: 15 }
                        // ]
                    },
                    opacity: { value: { min: 0.4, max: 0.9 }, anim: { enable: true, speed: 0.8, sync: false } },
                    size: { value: { min: 2, max: 6 }, anim: { enable: true, speed: 4, sync: false } }, // サイズ調整
                    links: { enable: false }, // 線はなし
                    move: {
                        enable: true,
                        speed: 1.2, // 速度を少し落とす
                        direction: "none",
                        random: true,
                        straight: false,
                        outModes: { default: "bounce" }, // ★★★ 端で跳ね返る ★★★
                        attract: { enable: false },
                        trail: { // 軌跡（オプション）
                            enable: false, // trueにすると軌跡が残る
                            //fillColor: "#000000",
                            //length: 20,
                        },
                    },
                    // 回転（オプション）
                    rotate: {
                        value: { min: 0, max: 360 },
                        direction: "random",
                        animation: {
                            enable: true,
                            speed: 5,
                            sync: false
                        }
                    },
                    // 浮遊感（オプション）
                     wobble: {
                         distance: 5,
                         enable: true,
                         speed: { min: -5, max: 5 },
                     },
                },
                 interactivity: { // マウスインタラクションは無効に
                     detectsOn: "window",
                     events: { onHover: { enable: false }, onClick: { enable: false }, resize: true },
                 },
                detectRetina: true
                 /* ★★★ パーティクル設定 ここまで ★★★ */
            }
        });
        console.log("tsParticles loaded successfully!");
    } catch (error) {
        console.error("Error loading tsParticles:", error);
    }
}


// ===== API Fetching Functions (変更なし) =====
async function fetchCmcDataViaProxy() { /* ... 前回のコードと同じ ... */
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

async function fetchDefiLlamaTvl() { /* ... 前回のコードと同じ ... */
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