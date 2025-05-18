<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>メイフラニュース</title>
    <!-- Tailwind CSSなどのスタイルシートを読み込む (既存のプロジェクトに合わせてください) -->
    <!-- 例: <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet"> -->
    <link rel="stylesheet" href="style.css"> <!-- 既存のstyle.cssを想定 -->
    <link rel="stylesheet" href="news_style.css"> <!-- news専用のスタイルがあれば -->
    <style>
        /* 簡単なローディングとエラー表示のスタイル */
        #loading-indicator, #error-message {
            text-align: center;
            padding: 20px;
            font-size: 1.2em;
        }
        #error-message {
            color: red;
            border: 1px solid red;
            background-color: #ffebeb;
            margin: 10px auto;
            max-width: 600px;
            border-radius: 5px;
        }
        .news-grid { /* news_script.jsのnewsContainerのクラス名に合わせて調整 */
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem; /* 24px */
            padding: 1rem; /* 16px */
        }
        .news-item { /* news_script.jsのnewsItemのクラス名に合わせて調整 */
            border: 1px solid #e5e7eb; /* Tailwind: border-gray-200 */
            border-radius: 0.5rem; /* Tailwind: rounded-lg */
            background-color: white;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* Tailwind: shadow-md */
            overflow: hidden; /* 画像のはみ出し防止 */
        }
        .news-item img {
            width: 100%;
            height: 200px; /* Tailwind: h-48 or h-52など */
            object-fit: cover;
        }
        .news-content {
            padding: 1rem; /* Tailwind: p-4 */
        }
        .news-title {
            font-size: 1.25rem; /* Tailwind: text-xl */
            font-weight: bold;
            /* color: #your-brand-color; (text-mayfblue-500のようなクラスをCSSで定義するか、インラインで指定) */
            margin-bottom: 0.5rem; /* Tailwind: mb-2 */
        }
        .news-date {
            font-size: 0.875rem; /* Tailwind: text-sm */
            color: #6b7280; /* Tailwind: text-gray-500 */
            margin-bottom: 0.25rem; /* Tailwind: mb-1 */
        }
        .news-summary {
            font-size: 0.875rem; /* Tailwind: text-sm */
            color: #374151; /* Tailwind: text-gray-700 */
            margin-bottom: 0.75rem; /* Tailwind: mb-3 */
            line-height: 1.4;
        }
        .news-link {
            display: inline-block;
            /* background-color: #your-brand-color; (bg-mayfblue-500のようなクラスをCSSで定義) */
            color: white;
            font-weight: 600; /* Tailwind: font-semibold */
            padding: 0.5rem 1rem; /* Tailwind: py-2 px-4 */
            border-radius: 0.25rem; /* Tailwind: rounded */
            text-decoration: none;
            font-size: 0.875rem; /* Tailwind: text-sm */
        }
        /* mayfblue-500 の色を定義 (既存の style.css にあれば不要) */
        .text-mayfblue-500 { color: #3b82f6; /* 例: 青系の色 */ }
        .bg-mayfblue-500 { background-color: #3b82f6; }
        .hover\:bg-mayfblue-600:hover { background-color: #2563eb; }

    </style>
</head>
<body class="bg-gray-100"> <!-- 背景色などプロジェクトに合わせて -->

    <header class="bg-white shadow p-4 mb-4 text-center">
        <!-- ここに共通ヘッダーやナビゲーション (もしあれば) -->
        <h1 class="text-3xl font-bold text-mayfblue-500">メイフラニュース</h1>
        <p class="text-gray-600">soso VALUE提供の最新情報</p>
    </header>

    <main class="container mx-auto px-4">
        <div id="loading-indicator" style="display: none;">
            <p>ニュースを読み込んでいます...</p>
            <!-- ここにスピナー画像などを置いても良い -->
        </div>

        <div id="error-message" style="display: none;">
            <!-- エラーメッセージがここに表示されます -->
        </div>

        <div id="news-container" class="news-grid">
            <!-- ニュース記事がJavaScriptによってここに挿入されます -->
        </div>
    </main>

    <footer class="text-center p-4 mt-8 text-gray-600 text-sm">
        <!-- ここに共通フッター (もしあれば) -->
        <p>© 2024 Mayflowerプロジェクト. All rights reserved.</p>
    </footer>

    <script src="news_script.js"></script>
</body>
</html>