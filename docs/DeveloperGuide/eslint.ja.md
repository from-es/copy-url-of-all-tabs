# ESLint: コード品質とスタイルガイドの強制

**最終更新日:** 2026年3月25日

このドキュメントでは、このプロジェクトにおけるESLintの設定とコーディング規約について概説します。これらのガイドラインに従うことで、コードの一貫性、品質、保守性を確保します。

## 概要

当プロジェクトでは、コードを静的に解析して問題を迅速に発見するために [ESLint](https://eslint.org/) を使用しています。設定は、プロジェクトのルートにある `eslint.config.js` ファイルで管理されています。

現在の設定には以下が含まれます：
- **TypeScriptサポート**: `typescript-eslint` を使用してTypeScriptコードをリントします。
- **Svelteサポート**: `eslint-plugin-svelte` を使用してSvelteコンポーネントをリントします。
- **インポート/エクスポートの正規化**: `eslint-plugin-import` を使用して、依存関係の整理とエクスポートの集約を行います。
- **JSDocの正規化**: `eslint-plugin-jsdoc` を使用して、ドキュメントの品質と一貫性を維持します。
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

## カスタムルール

設定ファイル (`eslint.config.js`) では、`customRules` オブジェクトを介して厳格で一貫性のあるコーディングスタイルを強制しています。

### 基本ルール設定

| カテゴリ | ルール名 | 設定 | 説明 |
| :--- | :--- | :--- | :--- |
| **ファイル関連** | `eol-last` | `["error", "never"]` | ファイルが改行で終わらないように強制します。 |
| | `linebreak-style` | `["error", "unix"]` | Unix (LF) の改行コードを強制します。 |
| **エラー防止** | `no-fallthrough` | `"error"` | `case` ステートメントでのフォールスルーを禁止します。 |
| | `no-return-assign` | `"error"` | `return` ステートメントでの代入演算子を禁止します。 |
| | `no-unreachable` | `"error"` | 到達不能なコードを記述することを禁止します。 |
| **ベストプラクティス** | `eqeqeq` | `"error"` | `===` と `!==` の使用を要求します。 |
| | `curly` | `"error"` | すべての制御構文で波括弧を要求します。 |
| | `yoda` | `"error"` | 「ヨーダ記法」の条件式を禁止します。 |
| **変数** | `no-unused-vars` | `"warn"` | 宣言されているが使用されていない変数について警告します。 |
| | `prefer-const` | `"warn"` | 再代入されない変数に `const` を使用するよう警告します。 |
| **スタイル** | `quotes` | `["error", "double", ...]` | ダブルクォートの使用を強制します。 |
| | `comma-style` | `["error", "last"]` | カンマを常に行の後ろに置くように強制します。 |
| | `semi` | `["error", "always"]` | ステートメントの末尾にセミコロンを要求します。 |
| | `indent` | `["error", "tab", ...]` | タブによるインデントを強制します。 |
| | `no-inline-comments` | `"off"` | コードの後にインラインコメントを許可します。 |
| | `max-len` | `"off"` | 1行の最大長のチェックを無効にします。 |

### スペース（空白）の強制

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

---

## インポートとエクスポート

コードの依存関係を明確にし、公開インターフェースの視認性を高めるため、インポートの順序正規化とエクスポートの集約・配置ルールを導入しています。

### インポートの順序 (import/order)

インポート宣言は以下のグループ順に記述します（ESLint により自動整列されます）。グループ内での順序も固定され、カテゴリの境目には空行を許可しています。

1.  **組み込みモジュール (builtin)**: Node.js 標準ライブラリ（`fs`, `path` など）
    - `wxt` 関連 (WXT 提供のブラウザ互換 API など) をこのグループの直後に配置
    - `svelte` 関連 (Svelte フレームワークなど) をその次に配置
2.  **外部ライブラリ (external)**: npm インストールされたパッケージ（`bowser` など）
3.  **内部モジュール・相対パス (internal, parent, sibling, index)**:
    - プロジェクト内エイリアス（`@/`）
    - 親ディレクトリ、同ディレクトリ、index ファイル
4.  **オブジェクト (object)**: 変数・オブジェクト・定数定義
5.  **型定義 (type)**: `import type` による宣言

### エクスポートの集約と配置 (import/group-exports, import/exports-last)

- **エクスポートの集約**: `export` 宣言はファイル内で個別に記述せず、可能な限り一箇所にまとめて記述します。
- **ファイル末尾への配置**: そのファイルが外部に公開しているインターフェースを一目で確認できるようにするため、エクスポート宣言は原則としてファイル末尾に配置します。

---

## JSDoc

コードのドキュメント性向上と保守性の確保を目的に、JSDoc 付与の推奨および記述の正規化を行っています。

### 基本原則
- **言語**: JSDoc 内の説明はすべて **英語** で記述します。
- **TypeScript との併用（省略の原則）**: TypeScript の型情報や言語機能（`async`, `class` 等）から明白な情報は、冗長さを避けるため原則として JSDoc 側では省略します。

### タグの分類定義

| 分類 | タグ | 適用対象・備考 |
| :--- | :--- | :--- |
| **必須** | `@template`, `@param`, `@returns` | ジェネリック、引数、戻り値がある場合。 |
| **推奨** | `@file`, `@description`, `@deprecated`, `@throws`, `@lastModified` | ファイル概要、非推奨、例外、修正履歴（`@lastModified`）。 |
| **任意** | `@example`, `@see`, `@author`, `@remarks`, `@readonly`, `@static` | 使用例、参照、作者（lib/utils のみ）、補足、メンバ特性。 |
| **省略推奨** | `@public`, `@private`, `@protected`, `@function`, `@method`, `@class`, `@async`, `@type` | TypeScript や ES6+ の構文から明白な情報。 |

### タグの表記統一 (tagNamePreference)

表記揺れを防ぎ、一貫性を保つため、以下の通り推奨タグへ自動統一されます。

| 統一前（エイリアス） | 統一後（推奨） | 備考 |
| :--- | :--- | :--- |
| `@overview`, `@fileoverview` | **`@file`** | ファイル概要 |
| `@constructor` | **`@class`** | クラス定義 |
| `@return` | **`@returns`** | 戻り値 |
| `@lastupdate` | **`@lastModified`** | 最終修正日 |
| `@exception` | **`@throws`** | 例外スロー |
| `@arg`, `@argument` | **`@param`** | 引数 |
| `@desc` | **`@description`** | 詳細説明 |
| `@prop` | **`@property`** | プロパティ |

### タグの記述順序

JSDoc 内でのタグの並び順は、以下のグループ順に固定します。

1.  **Info**: `@file`, `@author`, `@version`, `@lastModified`
2.  **Status**: `@deprecated`
3.  **Context**: `@dependency`, `@support`, `@remarks`
4.  **Behavior**: `@async`, `@generator`, `@fires`, `@listens`
5.  **Definition**: `@public`, `@private`, `@protected`, `@static`, `@readonly`, `@class`, `@function`, `@constructor`, `@interface`, `@property`
6.  **Signature**: `@template`, `@type`, `@param`, `@returns`, `@yields`, `@throws`
7.  **Reference**: `@see`, `@example`

### 記述スタイルと推奨事項

- **ハイフンの使用**: 識別子（変数名、引数名、プロパティ名、型パラメータ名等）と説明文を視覚的に明確に区別し、ドキュメントの読みやすさを向上させるため、名前と説明の間には ` - ` (ハイフン) を挿入します。
  - **対象タグ**: `@param`, `@property`, `@template`
  - 例: `@param {string} name - Description`
- **省略の推奨**: 以下のタグは、コードから自明な場合は記述を避けます。
  - アクセス修飾子 (`@public`, `@private`, `@protected`)
  - 定義種別 (`@function`, `@method`, `@class`)
  - 非同期 (`@async`)、型指定 (`@type`)
  ※ただし、詳細な仕様定義を目的とするファイル（`UrlDelayCalculator/doc` 等）では、網羅性を優先し省略せずに記述します。
- **`@file` タグ**: ファイル冒頭の JSDoc では、概要をブロック上部に文章として記載し、末尾にタグのみの `@file` を記述することでファイル全体への帰属を示します。

---

## 開発の支援ツール

このプロジェクトでは、コード品質と開発効率を最大化するために、ESLintとVSCodeの連携を強く推奨しています。

### VSCode拡張機能

| 拡張機能名 | 説明 |
| :--- | :--- |
| [ESLint for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | ESLintの警告やエラーをエディタに表示し、自動修正機能を提供します。 |
| [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) | Svelteファイルの言語サポートを提供し、ESLintとの連携を強化します。 |

### VSCode設定

プロジェクトのルートにある `.vscode/settings.json` ファイルに以下の設定を追加することで、ファイル保存時に自動的にコードがフォーマットされます。

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

- [ESLint 公式サイト](https://eslint.org/)
- [ESLint ドキュメント](https://eslint.org/docs/latest/)
