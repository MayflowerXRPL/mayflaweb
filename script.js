// script.js (DefiLlama TVL グラフ表示バージョン)

// グローバルスコープでChartインスタンスを保持する変数 (初期化は後で)
let tvlChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchCmcDataViaProxy();
    fetchDefiLlamaTvl(); // TVLとグラフデータを取得する関数に変更

    // ヒーローボタン (XRP Cafeへスクロール)
    const heroBtnNft = document.querySelector('.hero-buttons a[href="#xrp-cafe"]'); // セレクタ変更
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
// fetchCmcDataViaProxy 関数は変更なし (前回のコードのまま)
async function fetchCmcDataViaProxy() {
    const proxyUrl = '/api/cmc';

    const container = document.getElementById('cmc-data-container');
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
                    <p>24時間変動: <span class="${change24h >= 0 ? 'change-positive' : 'change-negative'}">${change24h.toFixed(2)}%</span></p>
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
        container.innerHTML = `<p class="error-message">あらら！価格情報が取れなかったみたい… メイフラちゃんが確認するね！<br>(詳細: ${error.message})</p>`;
    }
}


// --- DefiLlama API (XRPL TVL グラフ) ---
async function fetchDefiLlamaTvl() {
    // 変更: グラフデータを取得するエンドポイントに変更
    const url = 'https://api.llama.fi/charts/xrpl';
    const container = document.getElementById('defilama-tvl-container');
    const currentTvlContainer = document.getElementById('current-tvl-display');
    const canvas = document.getElementById('tvlChart');

    if (!container || !currentTvlContainer || !canvas) {
        console.error("TVL表示に必要なHTML要素が見つかりません。");
        return;
    }

    // ローディング表示を更新
    container.querySelector('.loading-message')?.remove(); // ローディングメッセージ削除
    currentTvlContainer.innerHTML = `<p class="loading-message">現在のTVL読み込み中...</p>`;


    try {
        const response = await fetch(url); // 直接APIを叩く

        if (!response.ok) {
            const errorText = await response.text().catch(()=> response.statusText);
            console.error('DefiLlama API Error:', response.status, errorText);
             if(response.status === 404) {
                 throw new Error(`DefiLlama APIエラー: XRPLのチャートデータが見つかりません。`);
             } else {
                throw new Error(`DefiLlama APIエラー: ${response.status} - ${errorText}`);
             }
        }
        // データをJSONとして解析 (配列を期待)
        const chartData = await response.json();

        if (Array.isArray(chartData) && chartData.length > 0) {

            // データをChart.js用に整形
            const labels = chartData.map(item => new Date(parseInt(item.date) * 1000).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric'}));
            const tvlValues = chartData.map(item => item.totalLiquidityUSD);

            // 最新のTVLを取得して表示
            const latestTvl = tvlValues[tvlValues.length - 1];
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
                type: 'line', // 線グラフ
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'XRPL TVL (USD)',
                        data: tvlValues,
                        borderColor: 'var(--chart-line-color)', // CSS変数を使用
                        backgroundColor: 'var(--chart-bg-color)', // CSS変数を使用
                        borderWidth: 2,
                        fill: true, // 線の下を塗りつぶす
                        tension: 0.1 // 線の滑らかさ
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // コンテナに合わせて伸縮させる
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                // 数値を短縮形 (例: 1M, 100K) で表示
                                callback: function(value, index, values) {
                                    if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                                    if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                                    if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                                    return value;
                                }
                            },
                             grid: {
                                color: 'var(--chart-grid-color)' // CSS変数
                            }
                        },
                        x: {
                             grid: {
                                display: false // X軸のグリッド線は非表示
                            },
                            ticks: {
                                maxTicksLimit: 10 // X軸ラベル数を制限して見やすく
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                             callbacks: {
                                // ツールチップの数値も短縮形に
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        const value = context.parsed.y;
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
                            display: false // 凡例は非表示
                        }
                    }
                }
            });

        } else {
             console.warn("DefiLlama APIからのデータが空または配列ではありません:", chartData);
             throw new Error('DefiLlamaから有効なチャートデータが取得できませんでした。');
        }

    } catch (error) {
        console.error('DefiLlama TVL Chartデータの取得/処理エラー:', error);
         if (error.message.includes('Failed to fetch')) {
             error.message = 'DefiLlama APIへの接続に失敗しました。ネットワークを確認するか、CORSの問題かもしれません。';
         }
         // エラーメッセージをグラフエリアと現在のTVLエリアの両方に表示することも検討
         const errorMessageHtml = `<p class="error-message">あらら！TVL情報が取れなかったみたい…<br>(詳細: ${error.message})</p>`;
         container.querySelector('.chart-container').innerHTML = errorMessageHtml; // グラフエリアに表示
         currentTvlContainer.innerHTML = ''; // 現在TVL表示はクリア
    }
}