# ESLint: コード品質とスタイルガイドの強制

**最終更新日:** 2025年8月16日

このドキュメントでは、このプロジェクトにおけるESLintの設定とコーディング規約について概説します。これらのガイドラインに従うことで、コードの一貫性、品質、保守性を確保します。

## 概要

当プロジェクトでは、コードを静的に解析して問題を迅速に発見するために [ESLint](https://eslint.org/) を使用しています。設定は、プロジェクトのルートにある `eslint.config.js` ファイルで管理されています。

現在の設定には以下が含まれます：
- **TypeScriptサポート**: `typescript-eslint` を使用してTypeScriptコードをリントします。
- **Svelteサポート**: `eslint-plugin-svelte` を使用してSvelteコンポーネントをリントします。
- **定義済みルール**: ESLint、TypeScript ESLint、Svelteプラグインの推奨ルールセットを継承しています。
- **カスタムルール**: 私たちのコーディングスタイルを強制するための特定のカスタムルールセットを定義しています。

グローバル設定やプラグインを含むすべての設定の完全かつ決定的なリストについては、`eslint.config.js` ファイルを参照してください。

## ESLintの実行方法

`src` ディレクトリ全体でリントエラーをチェックするには、次のnpmスクリプトを実行します：

```bash
npm run eslint
```

このスクリプトは `eslint src` のショートカットです。

単一のファイルをチェックしたい場合は、`eslint` コマンドに直接ファイルパスを渡します。プロジェクトにインストールされたESLintを使用するために `npx` を使うことが推奨されます。

```bash
npx eslint "path/to/your/file.ts"
```

例：
```bash
npx eslint "src/entrypoints/popup/js/main.ts"
```

## カスタムルール

設定ファイル (`eslint.config.js`) では、`customRules` オブジェクトを介して厳格で一貫性のあるコーディングスタイルを強制しています。以下は、これらのルールをカテゴリ別にグループ化した完全なリストです。

### ファイル関連

| ルール名 | 設定 | 説明 |
| :--- | :--- | :--- |
| `eol-last` | `["error", "never"]` | ファイルが改行で終わらないように強制します。 |
| `linebreak-style` | `["error", "unix"]` | Unix (LF) の改行コードを強制します。 |

### 潜在的なエラーの防止 (Possible Errors)

| ルール名 | 設定 | 説明 |
| :--- | :--- | :--- |
| `no-fallthrough` | `"error"` | `case` ステートメントでのフォールスルーを禁止します。 |
| `no-return-assign` | `"error"` | `return` ステートメントでの代入演算子を禁止します。 |
| `no-unreachable` | `"error"` | 到達不能なコードを記述することを禁止します。 |

### ベストプラクティス (Best Practices)

| ルール名 | 設定 | 説明 |
| :--- | :--- | :--- |
| `eqeqeq` | `"error"` | `===` と `!==` の使用を要求します。 |
| `curly` | `"error"` | すべての制御構文で波括弧を要求します。 |
| `yoda` | `"error"` | 「ヨーダ記法」の条件式を禁止します。 |

### 変数宣言と代入

| ルール名 | 設定 | 説明 |
| :--- | :--- | :--- |
| `no-unused-vars` | `"warn"` | 宣言されているが使用されていない変数について警告します。 |
| `prefer-const` | `"warn"` | 再代入されない変数に `const` を使用するよう警告します。 |

### コードスタイル (Stylistic Issues)

| ルール名 | 設定 | 説明 |
| :--- | :--- | :--- |
| `quotes` | `["error", "double", ...]` | ダブルクォートの使用を強制します。 |
| `comma-style` | `["error", "last"]` | カンマを常に行の後ろに置くように強制します。 |
| `semi` | `["error", "always"]` | ステートメントの末尾にセミコロンを要求します。 |
| `no-inline-comments` | `"off"` | コードの後にインラインコメントを許可します。 |
| `indent` | `["error", "tab", ...]` | タブによるインデントを強制します。 |
| `max-len` | `"off"` | 1行の最大長のチェックを無効にします。 |

### スペース（空白）

| ルール名 | 設定 | 説明 |
| :--- | :--- | :--- |
| `array-bracket-spacing` | `["error", "always"]` | 配列の角括弧の内側にスペースを要求します。 |
| `block-spacing` | `["error", "always"]` | ブロックの内側にスペースを要求します。 |
| `func-call-spacing` | `["error", "never"]` | 関数名と呼び出しの間にスペースを入れません。 |
| `no-trailing-spaces` | `"error"` | 行末の不要な空白を禁止します。 |
| `space-before-blocks` | `["error", "always"]` | ブロックの前にスペースを要求します。 |
| `spaced-comment` | `["error", "always"]` | コメントの先頭にスペースを強制します。 |
| `keyword-spacing` | `["error", { ... }]` | キーワードの前後に一貫したスペースを要求します。 |
| `space-infix-ops` | `["error", { ... }]` | 中置演算子の周りにスペースを要求します。 |
| `comma-spacing` | `["error", { ... }]` | カンマの後にスペースを要求します。 |
| `semi-spacing` | `["error", { ... }]` | セミコロンの後にスペースを要求します。 |
| `space-unary-ops` | `[2, { ... }]` | 単項演算子の周りのスペースの一貫性を強制します。 |

## 開発の支援ツール

このプロジェクトでは、コード品質と開発効率を最大化するために、ESLintとVSCodeの連携を強く推奨しています。ESLintはコードの静的解析を行い、問題をリアルタイムで検出・修正することで、一貫性のあるコーディングスタイルとバグの早期発見に貢献します。

### VSCode拡張機能

ESLintの機能をVSCodeで最大限に活用するには、以下の拡張機能のインストールが必要です。これらはコードのリアルタイムなフィードバック、自動修正、Svelteファイルの適切な処理を可能にします。

| 拡張機能名 | 説明 |
| :--- | :--- |
| [ESLint for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | ESLintの警告やエラーをエディタに表示し、自動修正機能を提供します。 |
| [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) | Svelteファイルの言語サポートを提供し、ESLintとの連携を強化します（Svelte開発の場合に推奨）。 |

### VSCode設定

プロジェクトのルートにある `.vscode/settings.json` ファイルに以下の設定を追加することで、ファイル保存時にESLintのルールに基づいて自動的にコードがフォーマットされるようになります。これにより、手動で `npm run eslint` を実行する手間が省け、コーディングに集中できます。

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit" // ファイル保存時にESLintの自動修正を適用します。
  },
  "eslint.validate": [ // ESLintを有効にする言語モードを指定します。
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "svelte"
  ]
}
```

## 公式サイトとドキュメント

より詳細な情報については、ESLintの公式サイトとドキュメントを参照してください。

- [ESLint 公式サイト](https://eslint.org/)
- [ESLint ドキュメント](https://eslint.org/docs/latest/)