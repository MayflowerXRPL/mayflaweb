// script.js (最終版 - DefiLlama TVL グラフ表示)

// グローバルスコープでChartインスタンスを保持する変数
let tvlChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // ページ読み込み時にCMCとDefiLlamaのデータを取得開始
    fetchCmcDataViaProxy();
    fetchDefiLlamaTvl();

    // --- ヒーローボタン (XRP Cafeへスクロール) ---
    const heroBtnNft = document.querySelector('.hero-buttons a[href="#xrp-cafe"]');
    if (heroBtnNft) {
        heroBtnNft.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.getElementById('xrp-cafe');
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});

// --- CoinMarketCap API (Vercel プロキシ経由 /api/cmc) ---
async function fetchCmcDataViaProxy() {
    const proxyUrl = '/api/cmc';

    const container = document.getElementById('cmc-data-container');
    if (!container) { // コンテナが存在しない場合は処理中断
        console.error("CMC data container not found!");
        return;
    }
    container.innerHTML = '<p class="loading-message">価格情報を読み込み中...</p>';

    try {
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('CMC Proxy Response Error:', response.status, errorData);
            let errorMessage = `CMCデータ取得エラー: ${response.status}`;
            if (errorData?.status?.error_message) {
                errorMessage += ` - ${errorData.status.error_message}`;
            } else if (errorData?.message) {
                errorMessage += ` - ${errorData.message}`;
            } else if (errorData?.error) {
                errorMessage += ` - ${errorData.error}`;
            } else {
                errorMessage += ' - 詳細不明';
            }
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
                card.innerHTML = `
                    <h3>${crypto.name} (${crypto.symbol})</h3>
                    <p>価格: <span class="price">$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 0.01 ? 8 : (price < 1 ? 4 : 2) })}</span></p>
                    <p>24時間変動: <span class="${change24h >= 0 ? 'change-positive' : 'change-negative'}">${change24h?.toFixed(2) ?? 'N/A'}%</span></p>
                `;
                container.appendChild(card);
            });
        } else if (data?.error) {
             throw new Error(`プロキシエラー: ${data.error}`);
        } else if (data?.status?.error_message) {
            throw new Error(`CMC APIエラー: ${data.status.error_message}`);
        } else {
            console.warn("CMC APIからの予期せぬデータ構造:", data);
            throw new Error('CMC API: 無効なデータ構造です。');
        }
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
    const chartContainer = container?.querySelector('.chart-container'); // グラフコンテナを取得

    // 必要なHTML要素が存在するか確認
    if (!container || !currentTvlContainer || !canvas || !chartContainer) {
        console.error("TVL表示に必要なHTML要素が見つかりません。 ID: defilama-tvl-container, current-tvl-display, tvlChart");
        return;
    }

    // ローディング表示を更新
    chartContainer.innerHTML = '<p class="loading-message">グラフデータを読み込み中...</p>'; // グラフエリアに表示
    currentTvlContainer.innerHTML = `<p class="loading-message">現在のTVL読み込み中...</p>`;
    // canvas自体は残しておく必要があるので、chartContainerからメッセージを消す
     chartContainer.innerHTML = '';
     chartContainer.appendChild(canvas); // canvasを再追加


    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text().catch(()=> response.statusText);
            console.error('DefiLlama API Error:', response.status, errorText);
             if(response.status === 404) {
                 throw new Error(`DefiLlama APIエラー: XRPLのチャートデータが見つかりません。`);
             } else {
                throw new Error(`DefiLlama APIエラー: ${response.status} - ${errorText}`);
             }
        }
        const chartData = await response.json();

        if (Array.isArray(chartData) && chartData.length > 0) {

            // データをChart.js用に整形
            // 最後の1年分(約365点)のデータに絞るか、データ点数で間引くなど軽量化も検討
            const recentData = chartData.slice(-365); // 例: 直近365日分
            const labels = recentData.map(item => new Date(parseInt(item.date) * 1000).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric'}));
            const tvlValues = recentData.map(item => item.totalLiquidityUSD);

            // 最新のTVLを取得して表示
            const latestTvl = tvlValues.length > 0 ? tvlValues[tvlValues.length - 1] : 0;
            currentTvlContainer.innerHTML = `
                 <h3>$${latestTvl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
                 <p>Current TVL (XRPL)</p>
            `;

            // グラフを描画
            const ctx = canvas.getContext('2d');

             // 既存のグラフがあれば破棄
             if (tvlChartInstance) {
                tvlChartInstance.destroy();
            }

            tvlChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'XRPL TVL (USD)',
                        data: tvlValues,
                        borderColor: 'var(--chart-line-color)',
                        backgroundColor: 'var(--chart-bg-color)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2, // 少し滑らかに
                        pointRadius: 0, // 点を非表示にして線を滑らかに見せる
                        pointHoverRadius: 5 // ホバー時の点
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) { // 短縮形表示
                                    if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                                    if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                                    if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                                    return value.toLocaleString();
                                },
                                font: { size: 10 } // Y軸ラベルのフォントサイズ
                            },
                             grid: {
                                color: 'var(--chart-grid-color)'
                            }
                        },
                        x: {
                             grid: {
                                display: false
                            },
                            ticks: {
                                maxTicksLimit: 8, // X軸ラベル数を調整
                                font: { size: 10 } // X軸ラベルのフォントサイズ
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                             callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    const value = context.parsed.y;
                                    if (value !== null) {
                                        if (value >= 1e9) label += '$'+(value / 1e9).toFixed(2) + 'B';
                                        else if (value >= 1e6) label += '$'+(value / 1e6).toFixed(2) + 'M';
                                        else if (value >= 1e3) label += '$'+(value / 1e3).toFixed(2) + 'K';
                                        else label += '$'+value.toLocaleString();
                                    }
                                    return label;
                                }
                             }
                        },
                        legend: {
                            display: false
                        }
                    },
                    interaction: { // ホバー時のインタラクション設定
                      intersect: false,
                      mode: 'index',
                    },
                }
            });
             // ローディングメッセージがあれば消す
             chartContainer.querySelector('.loading-message')?.remove();

        } else {
             console.warn("DefiLlama APIからのデータが空または配列ではありません:", chartData);
             throw new Error('DefiLlamaから有効なチャートデータが取得できませんでした。');
        }

    } catch (error) {
        console.error('DefiLlama TVL Chartデータの取得/処理エラー:', error);
         if (error.message.includes('Failed to fetch')) {
             error.message = 'DefiLlama APIへの接続に失敗しました。ネットワークを確認するか、CORSの問題かもしれません。';
         }
         const errorMessageHtml = `<p class="error-message">あらら！TVL情報が取れなかったみたい…<br>(詳細: ${error.message})</p>`;
         chartContainer.innerHTML = errorMessageHtml; // エラーをグラフエリアに表示
         currentTvlContainer.innerHTML = ''; // 現在TVL表示はクリア
    }
}