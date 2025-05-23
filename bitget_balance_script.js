// bitget_balance_script.js (エラーハンドリングとログ強化版)
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[BitgetBalanceScript] DOMContentLoaded event fired. Script starting...');

    const loadingEl = document.getElementById('bitget-loading-message');
    const errorEl = document.getElementById('bitget-error-message');
    const dataEl = document.getElementById('bitget-data-display');
    const totalJpyEl = document.getElementById('total-jpy-balance-value');
    const totalUsdtEl = document.getElementById('total-usdt-balance-value');
    const goalPercentageEl = document.getElementById('goal-progress-percentage');
    const goalChartCanvas = document.getElementById('goalProgressChart');

    const requiredElements = {
        loadingEl, errorEl, dataEl, totalJpyEl, totalUsdtEl, goalPercentageEl, goalChartCanvas
    };

    for (const key in requiredElements) {
        if (!requiredElements[key]) {
            const errorMessage = `[BitgetBalanceScript] Critical Error: HTML element with ID "${getElementIdFromName(key)}" not found. Script cannot proceed.`;
            console.error(errorMessage);
            if (errorEl) {
                errorEl.textContent = `ページ表示エラー: 必要な要素(${getElementIdFromName(key)})が見つかりません。`;
                errorEl.style.display = 'block';
                if (loadingEl) loadingEl.style.display = 'none';
                if (dataEl) dataEl.style.display = 'none';
            } else {
                alert(`ページ表示エラー: 必要な要素(${getElementIdFromName(key)})が見つかりません。開発者コンソールを確認してください。`);
            }
            return; 
        }
    }
    console.log('[BitgetBalanceScript] All required HTML elements found.');

    const GOAL_AMOUNT_JPY = 100000000; 
    const proxyApiUrl = '/api/getBitgetBalance';

    function getElementIdFromName(elementVarName) {
        if (elementVarName === 'loadingEl') return 'bitget-loading-message';
        if (elementVarName === 'errorEl') return 'bitget-error-message';
        if (elementVarName === 'dataEl') return 'bitget-data-display';
        if (elementVarName === 'totalJpyEl') return 'total-jpy-balance-value';
        if (elementVarName === 'totalUsdtEl') return 'total-usdt-balance-value';
        if (elementVarName === 'goalPercentageEl') return 'goal-progress-percentage';
        if (elementVarName === 'goalChartCanvas') return 'goalProgressChart';
        return elementVarName;
    }
    
    function displayLoading(show) {
        if (loadingEl) loadingEl.style.display = show ? 'block' : 'none';
        if (dataEl) dataEl.style.display = show ? 'none' : dataEl.style.display; 
        if (errorEl) errorEl.style.display = 'none'; 
        console.log(`[BitgetBalanceScript] Loading display: ${show}`);
    }

    function displayError(message) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (dataEl) dataEl.style.display = 'none';
        if (errorEl) {
            errorEl.textContent = `エラー: ${message}`;
            errorEl.style.display = 'block';
        }
        console.error('[BitgetBalanceScript] Displaying Error:', message);
    }

    function numberWithCommas(x) {
        if (x === null || typeof x === 'undefined' || isNaN(x)) return '---';
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    try {
        displayLoading(true);
        console.log(`[BitgetBalanceScript] Attempting to fetch balance from: ${proxyApiUrl}`);
        
        const response = await fetch(proxyApiUrl);
        console.log(`[BitgetBalanceScript] Proxy response status: ${response.status}`);

        let result;
        try {
            result = await response.json();
            console.log('[BitgetBalanceScript] Proxy response JSON parsed:', result);
        } catch (jsonError) {
            console.error('[BitgetBalanceScript] Failed to parse proxy response as JSON.', jsonError);
            const errorText = await response.text(); 
            console.error('[BitgetBalanceScript] Raw proxy response text (on JSON parse fail):', errorText.substring(0, 500));
            throw new Error(`サーバーからの応答が不正です (Status: ${response.status})。詳細はコンソールを確認してください。`);
        }

        if (!response.ok || !result.success) {
            const errorMessage = result.error || `残高データの取得に失敗しました。サーバー応答ステータス: ${response.status}`;
            console.error(`[BitgetBalanceScript] Error from proxy or API: ${errorMessage}`, result);
            throw new Error(errorMessage);
        }

        displayLoading(false);
        dataEl.style.display = 'block';

        const totalJpy = parseFloat(result.totalJpy) || 0;
        const totalUsdt = parseFloat(result.totalUsdt) || 0;
        
        totalJpyEl.textContent = `${numberWithCommas(Math.round(totalJpy))} JPY`;
        totalUsdtEl.textContent = `(${numberWithCommas(totalUsdt.toFixed(2))} USDT)`;

        const percentage = Math.min(100, (totalJpy / GOAL_AMOUNT_JPY) * 100); 
        goalPercentageEl.textContent = `達成率: ${percentage.toFixed(2)} %`;

        if (typeof Chart !== 'undefined') {
            console.log('[BitgetBalanceScript] Chart.js found. Rendering chart.');
            if (window.myGoalChart instanceof Chart) {
                window.myGoalChart.destroy();
            }
            window.myGoalChart = new Chart(goalChartCanvas, { 
                type: 'doughnut',
                data: {
                    labels: ['現在の資産', '目標までの残り'],
                    datasets: [{
                        data: [percentage, Math.max(0, 100 - percentage)], 
                        backgroundColor: ['#E91E63', '#e0e0e0'],
                        borderColor: ['#FFFFFF', '#FFFFFF'],
                        borderWidth: 2,
                        circumference: 180, 
                        rotation: -90,      
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, 
                    cutout: '70%', 
                    animation: {
                        animateRotate: true,
                        animateScale: true
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    const value = context.parsed;
                                    if (value !== null) {
                                        if (context.label === '現在の資産') {
                                            label += `${value.toFixed(1)}% (${numberWithCommas(Math.round(totalJpy))} JPY)`;
                                        } else {
                                            const remainingJpy = GOAL_AMOUNT_JPY - totalJpy;
                                            label += `${value.toFixed(1)}% (${numberWithCommas(Math.round(Math.max(0,remainingJpy)))} JPY)`;
                                        }
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.warn('[BitgetBalanceScript] Chart.js is not loaded. Chart will not be rendered.');
        }
        console.log('[BitgetBalanceScript] Successfully displayed balance data.');

    } catch (error) {
        console.error('[BitgetBalanceScript] Main catch block error:', error.message, error);
        displayError(error.message || '残高の読み込み中に予期せぬエラーが発生しました。コンソールで詳細を確認してください。');
    }
});