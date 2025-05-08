// script.js (デバッグ用 - パーティクル表示最優先！)

document.addEventListener('DOMContentLoaded', () => {
    // --- 他の処理は一旦コメントアウト ---
    // fetchCmcDataViaProxy();
    // fetchDefiLlamaTvl();
    // setupSmoothScrolling();
    // setupMobileMenu();
    // setupScrollAnimations();

    // --- ★★★ パーティクル背景の初期化のみ実行 ★★★ ---
    loadParticlesForDebug();

}); // End of DOMContentLoaded

// ===== パーティクル表示テスト用関数 =====
async function loadParticlesForDebug() {
     if (typeof tsParticles === "undefined") {
        console.log("Waiting for tsParticles...");
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof tsParticles === "undefined") {
             console.error("tsParticles library not loaded.");
             return;
         }
    }

    try {
        // ★★★ 最もシンプルな設定で試す ★★★
        await tsParticles.load({
            id: "tsparticles",
            options: {
                fullScreen: { enable: true, z-index: -1 }, // 画面全体、最背面
                particles: {
                    number: { value: 80 }, // 数を少し増やす
                    color: { value: "#ff0000" }, // ★色を赤一色にして目立たせる★
                    shape: { type: "circle" }, // ★形を円だけにする★
                    opacity: { value: 0.8 }, // 透明度を固定
                    size: { value: 3 }, // サイズを固定
                    links: { enable: false },
                    move: {
                        enable: true,
                        speed: 2, // 少し速度アップ
                        direction: "none",
                        random: true,
                        straight: false,
                        outModes: { default: "bounce" } // 端で跳ね返る
                    }
                },
                detectRetina: true
            }
        });
        console.log("tsParticles DEBUG loaded!");
    } catch (error) {
        console.error("Error loading tsParticles DEBUG:", error);
    }
}

// --- 他の関数はコメントアウト ---
// function setupSmoothScrolling() { ... }
// function setupMobileMenu() { ... }
// function closeMobileMenu() { ... }
// function setupScrollAnimations() { ... }
// async function fetchCmcDataViaProxy() { ... }
// async function fetchDefiLlamaTvl() { ... }
// let tvlChartInstance = null;