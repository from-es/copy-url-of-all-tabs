# BrowserEnvironment ライブラリ 技術仕様 & 動作仕様

*   作成日: 2025年7月19日
*   最終更新日: 2025年7月19日

## 概要

`BrowserEnvironment` ライブラリは、Webブラウザの環境情報（ブラウザ名、バージョン、OS、デバイス、CPU、言語など）を取得するためのユーティリティです。[User-Agent Client Hints (UA-CH)](#user-agent-client-hints) と `navigator.userAgent` (User-Agent文字列) の両方を利用して情報を取得し、より新しいAPIを優先して使用します。外部ライブラリ ([bowser](#bowser) など) との連携を考慮した設計になっており、依存関係をカプセル化することで、将来的なライブラリの変更にも対応しやすくなっています。

## 技術仕様

### クラス

#### `BrowserEnvironment`

ブラウザ環境情報を取得するためのメインクラス。

*   **プロパティ:**
    *   `static readonly #template`: `BrowserEnvironmentResult` 型のテンプレートオブジェクト。初期値やエラー時の結果のベースとして使用されます。
    *   `static readonly #parser`: `UserAgentParser` のインスタンス。User-Agent文字列の解析に使用されます。
    *   `static readonly #useLibrary`: `UserAgentParser` が使用する外部ライブラリ名 ([bowser](#bowser) など)。
    *   `static readonly #highEntropyValueHints`: [User-Agent Client Hints](#user-agent-client-hints) から取得する [高エントロピー値](#high-entropy-values) のヒントの配列。
*   **メソッド:**
    *   `async get(): Promise<BrowserEnvironmentResult>`:
        *   ブラウザ環境情報を非同期で取得します。
        *   `navigator.userAgentData` が利用可能であれば `getUserAgentClientHints()` を呼び出し、そうでなければ `getUserAgent()` を呼び出します。
        *   どちらも利用できない場合はエラー結果を返します。
        *   予期せぬエラーが発生した場合はコンソールにエラーを出力し、エラー結果を返します。
    *   `#createErrorResult(message: string): BrowserEnvironmentResult` (private):
        *   エラーメッセージを含む `BrowserEnvironmentResult` オブジェクトを作成します。
    *   `static #createChecker(isSuccess: boolean, message: string | undefined, worker: { main: string | undefined; sub: string | undefined }): CheckerInfo` (private, static):
        *   処理の成功/失敗、メッセージ、および情報源を示す `CheckerInfo` オブジェクトを作成します。
    *   `static #createInformationTemplate(): BrowserEnvironmentResult` (private, static):
        *   `BrowserEnvironmentResult` の初期テンプレートを作成します。
    *   `#createBrowserEnvironmentResult(information: BrowserEnvironmentResult, pluginInfo: PluginValue, checker: CheckerInfo): BrowserEnvironmentResult` (private):
        *   テンプレート、プラグイン情報、チェッカー情報をマージして最終的な `BrowserEnvironmentResult` を作成します。
    *   `async #getUserAgentClientHints(): Promise<BrowserEnvironmentResult>` (private):
        *   `navigator.userAgentData` を使用してブラウザ環境情報を取得します。
        *   `getHighEntropyValues` を呼び出し、[高エントロピー値](#high-entropy-values) を取得します。
        *   取得した情報を `BrowserEnvironmentResult` 形式にマッピングします。
        *   `#patchClientHintsFromUserAgent` を呼び出して、User-Agent文字列からの情報で補完します。
    *   `#getUserAgent(): BrowserEnvironmentResult` (private):
        *   `navigator.userAgent` を使用してブラウザ環境情報を取得します。
        *   `UserAgentParser` を使用してUser-Agent文字列を解析し、情報を取得します。
    *   `#patchClientHintsFromUserAgent(information: BrowserEnvironmentResult): BrowserEnvironmentResult` (private):
        *   [User-Agent Client Hints](#user-agent-client-hints) で取得した情報を、User-Agent文字列の解析結果で補完します。

#### `UserAgentParser`

User-Agent文字列を解析するためのラッパークラス。

*   **コンストラクタ:**
    *   `constructor()`: 特に初期化処理はありません。
*   **メソッド:**
    *   `parse(): PluginValue | null`:
        *   `navigator.userAgent` が存在する場合、`UserAgentParserPlugin.execute()` を呼び出してUser-Agent文字列を解析します。
        *   解析結果を `PluginValue` 形式で返します。
        *   `navigator.userAgent` が存在しない場合や、解析に失敗した場合は、未定義のプロパティを持つデフォルトのオブジェクトを返します。

### プラグイン (`plugins/bowser.ts`)

#### `UserAgentParserPlugin`

[bowser](#bowser) ライブラリを利用してUser-Agent文字列を解析するプラグイン。

*   **プロパティ:**
    *   `information`: プラグインのメタ情報 (`name`, `useLibrary`, `version`, `lastupdate`)。`useLibrary` は `"bowser"` となっています。
*   **メソッド:**
    *   `execute(): PluginValue | null`:
        *   `navigator.userAgent` が存在しない場合は `null` を返します。
        *   `bowser.getParser(userAgent)` を使用してUser-Agent文字列を解析し、`agent.getResult()` で結果を取得します。
        *   取得した結果から、`browser`, `engine`, `os` の情報を抽出し、`PluginValue` 形式で返します。
        *   解析結果が不正な場合は `null` を返します。

### 型定義 (`types.ts`)

*   `CheckerInfo`: 処理の成功/失敗、メッセージ、情報源 (`main`, `sub`) を含むオブジェクト。
*   `BrowserEnvironmentInfo`: ブラウザ、エンジン、デバイス、CPU、OS、言語などの環境情報を含むオブジェクト。
*   `BrowserEnvironmentResult`: `CheckerInfo` と `BrowserEnvironmentInfo` を組み合わせた最終的な結果オブジェクト。
*   `UserAgentDataBrand`: [User-Agent Client Hints](#user-agent-client-hints) のブランド情報 (`brand`, `version`)。
*   `UserAgentDataValues`: `navigator.userAgentData.getHighEntropyValues()` から返される詳細な [User-Agent Client Hints](#user-agent-client-hints) の値。
*   `NavigatorUserAgentData`: `Navigator` インターフェースを拡張し、`userAgentData` プロパティと `getHighEntropyValues` メソッドを定義。
*   `PluginInformation`: プラグインのメタ情報 (`name`, `useLibrary`, `version`, `lastupdate`)。
*   `PluginValue`: プラグインが返すブラウザ、エンジン、OSの情報。
*   `UserAgentParserInformation`: プラグイン情報と実行関数を含むオブジェクト。

### 依存関係

*   **内部依存:**
    *   `./UserAgentParser`: User-Agent文字列の解析を担当。
    *   `./types`: 型定義。
    *   `./plugins/bowser`: `UserAgentParser` がUser-Agent文字列の解析に利用する外部ライブラリ ([bowser](#bowser)) のラッパー。
*   **外部依存:**
    *   `bowser`: User-Agent文字列の解析に使用されます。

### ブラウザAPIの使用

*   `navigator.userAgentData`: [User-Agent Client Hints](#user-agent-client-hints) API。
*   `navigator.userAgent`: User-Agent文字列。

## 動作仕様

### 1. 環境情報の取得優先順位

`BrowserEnvironment` クラスの `get()` メソッドは、以下の優先順位でブラウザ環境情報を取得します。

1.  **[User-Agent Client Hints (UA-CH)](#user-agent-client-hints):**
    *   このAPIが利用可能な場合、まず `getHighEntropyValues()` を使用して詳細な情報を取得します。
    *   取得した情報 (`brands`, `platform`, `mobile`, `architecture`, `bitness`, `model`, `fullVersionList` など) を `BrowserEnvironmentResult` 形式にマッピングします。
    *   その後、`navigator.userAgent` からの情報を補完するために `UserAgentParser` を使用します。これは、[User-Agent Client Hints](#user-agent-client-hints) が提供しない一部の情報 (例: OSのバージョン名) を補うためです。
2.  **`navigator.userAgent` (User-Agent文字列):**
    *   `navigator.userAgentData` が利用できない場合、`navigator.userAgent` を使用します。
    *   `UserAgentParser` クラスが `UserAgentParserPlugin` を介してこのUser-Agent文字列を解析し、ブラウザ、エンジン、OSなどの情報を抽出します。
3.  **情報取得不可:**
    *   `navigator.userAgentData` と `navigator.userAgent` のどちらも利用できない場合、エラーメッセージを含む結果を返します。

### 2. 結果オブジェクトの構造

`get()` メソッドから返される `BrowserEnvironmentResult` オブジェクトは、以下の主要なプロパティを持ちます。

*   `checker`:
    *   `isSuccess`: 情報取得が成功したかどうかを示す真偽値。
    *   `message`: 情報取得に関するメッセージ (成功/失敗、使用されたAPIなど)。
    *   `worker`: 情報取得に使用された主要なAPI (`main`) と補助的な情報源 (`sub`)。
*   `ua`: `navigator.userAgent` の値 (存在する場合)。
*   `browser`: ブラウザ名とバージョン。
*   `engine`: レンダリングエンジン名とバージョン。
*   `device`: モバイルデバイスかどうか、およびモデル名。
*   `cpu`: CPUアーキテクチャとビット数。
*   `os`: OS名、バージョン、バージョン名。
*   `language`: ブラウザの言語設定。

### 3. エラーハンドリング

*   `navigator.userAgentData` または `navigator.userAgent` がサポートされていない場合、適切なエラーメッセージを含む `BrowserEnvironmentResult` が返されます。
*   `get()` メソッド内で予期せぬエラーが発生した場合、コンソールにエラーが出力され、汎用的なエラーメッセージを含む `BrowserEnvironmentResult` が返されます。

### 4. プラグインシステム

*   `UserAgentParser` クラスは、User-Agent文字列の解析に外部ライブラリ ([bowser](#bowser) など) を使用するためのラッパーとして機能します。
*   `plugins/bowser.ts` に定義されている `UserAgentParserPlugin` は、具体的な解析ライブラリである [bowser](#bowser) を使用してUser-Agent文字列を解析します。
*   これにより、User-Agent解析ロジックが `BrowserEnvironment` のコアロジックから分離され、将来的に別の解析ライブラリに切り替える際の変更が容易になります。

### 5. 情報の補完

*   [User-Agent Client Hints](#user-agent-client-hints) が利用可能な場合でも、`#patchClientHintsFromUserAgent` メソッドを通じて `UserAgentParser` によるUser-Agent文字列の解析結果が適用されます。これは、[User-Agent Client Hints](#user-agent-client-hints) が提供しない、または取得が複雑な一部の情報 (例: OSのバージョン名) を補完するためです。

---

## ファイルの役割と配置

```
.
└── BrowserEnvironment/
     ├── types.ts            <-- 型定義ファイル: ライブラリ内で使用される全てのデータ構造の型を定義
     ├── index.ts            <-- メインエントリポイント: ブラウザ環境情報の取得ロジックを統括
     ├── UserAgentParser.ts  <-- User-Agent解析ラッパー: 外部ライブラリ(bowser)をカプセル化し、User-Agent文字列を解析
     ├── plugins/            <-- プラグインディレクトリ: 実際のUser-Agent解析ライブラリ(bowser)の統合
     │    └── bowser.ts      <-- Bowserプラグイン: bowserライブラリを介してUser-Agent文字列を解析し、結果を整形
     │
     └─ doc/                 <-- ドキュメントディレクトリ: ライブラリに関する説明や補足情報
         ├── navigator.userAgentData.md
         ├── README.en.md
         └── README.ja.md

```

### ライブラリの使用例

このライブラリは、ブラウザの環境情報を非同期で取得します。

```typescript
import { BrowserEnvironment } from './BrowserEnvironment/index';

async function getBrowserInfo() {
  const browserEnv = new BrowserEnvironment();

  try {
    const info = await browserEnv.get();
    console.log('Browser Environment Information:', info);
  } catch (error) {
    console.error('Failed to get browser environment information:', error);
  }
}

getBrowserInfo();
```

### 出力されるデータの例

`browserEnv.get()` メソッドが返す `BrowserEnvironmentResult` オブジェクトの例です。
これは、`types.ts` で定義された `BrowserEnvironmentResult` 型に基づいています。

```json
{
  "checker": {
    "isSuccess": true,
    "message": "This Browser can get User-Agent Client Hints. 'navigator.userAgentData' is supported. Obtain information from navigator.userAgentData and supplement it with bowser.",
    "worker": {
      "main": "navigator.userAgentData",
      "sub": "bowser"
    }
  },
  "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "browser": {
    "name": "Chrome",
    "version": "126.0.0.0"
  },
  "engine": {
    "name": "Blink",
    "version": "126.0.0.0"
  },
  "device": {
    "mobile": false,
    "model": ""
  },
  "cpu": {
    "architecture": "x86",
    "bitness": "64"
  },
  "os": {
    "name": "Windows",
    "version": "10",
    "versionName": "" // ライブラリで取得出来ない場合や、Client Hintsで取得できない場合
  },
  "language": "ja"
}
```

---

## 用語解説

<a id="user-agent-client-hints"></a>
#### User-Agent Client Hints (UA-CH)

従来のUser-Agent文字列に代わり、ウェブサイトが必要なブラウザ環境情報（ブラウザ名、バージョン、OSなど）をより細かく、プライバシーに配慮した形で取得するための新しい仕組みです。ウェブサイトが明示的に要求しない限り、ブラウザは詳細な情報を送信しません。

*   MDN Web Docs: [User-Agent Client Hints API](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API)

<a id="high-entropy-values"></a>
#### 高エントロピー値 (High-Entropy Values)

User-Agent Client Hints において、ユーザーを識別するために利用できる可能性が高い、より詳細なブラウザ環境情報（例: OSの正確なバージョン、CPUアーキテクチャ、デバイスモデルなど）を指します。これらの情報は、ユーザーのプライバシー保護のため、ウェブサイトが明示的に「ヒント」として要求した場合にのみ提供されます。

<a id="bowser"></a>
#### bowser

User-Agent文字列を解析し、ブラウザ、OS、デバイスなどの情報を抽出するためのJavaScriptライブラリです。`BrowserEnvironment` ライブラリでは、User-Agent Client Hints が利用できない環境や、Client Hintsで取得できない情報を補完するために利用されています。

*   公式サイト: [https://bowser-js.github.io/bowser/](https://bowser-js.github.io/bowser/)
*   GitHub: [https://github.com/bowser-js/bowser](https://github.com/bowser-js/bowser)

## ライセンス

このプロジェクトは [MIT License](../../../../../../../LICENSE.md) の下で公開されています。