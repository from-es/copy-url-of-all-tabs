# ロギング・ガイドライン

**最終更新日:** 2026年2月28日

## 概要

本ドキュメントは、プロジェクトにおけるコンソール出力の標準化と正規化のためのガイドラインを定めます。

開発およびデバッグにおいて、ログの検索性、一貫性、および情報の透明性を確保することは、長期的なメンテナンス性を維持する上で不可欠です。本プロジェクトでは、以下の課題を解決するために標準化されたロギングアプローチを採用しています。

- **メソッド選択の基準明確化**: ログの重要度に応じた適切なレベル（trace/debug/info/warn/error）の厳格な使い分け。
- **フォーマットの統一**: 機械的な判別と検索を容易にするためのプレフィックス（method/scope）およびメッセージ構造の標準化。
- **追跡性の向上**: 発生箇所（コンテキスト）や処理状態（Status）を明示し、問題特定までの時間を短縮。

本ガイドラインは、`ConsoleManager` クラス（[コード](../../src/assets/js/lib/user/ConsoleManager/index.ts)、[ドキュメント](../../src/assets/js/lib/user/ConsoleManager/doc/README.ja.md)）によるログレベル管理システムの設計思想に基づき、すべてのコンソール出力を適切に分類・正規化することを目的とします。


## ログレベルとメソッドの役割

プロジェクトで定義されているログレベルに基づき、以下の基準でメソッドを使い分けます。

| メソッド | レベル | 用途・使用場面 |
| :--- | :--- | :--- |
| `trace` | 100 | 実行フローの詳細な追跡。複雑な関数呼び出しチェーンやスタックトレースが必要な調査。 |
| `debug` | 200 | 開発・デバッグ用。内部状態（変数の値、条件分岐の通過確認など）の出力。 |
| `info` | 300 | 正常な処理フローの節目（アプリケーションの起動、設定読み込み完了など）。 |
| `warn` | 400 | 警告。予期しないが継続可能な状況（無効な設定値の検出とデフォルト値の適用など）。 |
| `error` | 500 | 例外・致命的な問題。処理の中断または異常終了（API失敗、論理的矛盾など）。 |

> [!IMPORTANT]
> - `console.log` は原則**非推奨**とし、新規実装では `info` を使用してください。
> - `info` メソッドは「概要」の告知を目的とするため、詳細なデータが必要な場合は `debug` を併用してください。
> - `console.group`, `console.groupCollapsed`, `console.groupEnd` は、開発時のコンソール出力を視覚的に整理するための「ラベル」として扱い、メッセージの正規化形式 (`<method>(<scope>):`) は適用しません。

---

## 出力メッセージの標準化ガイドライン

**Commitlint (Conventional Commits)** の形式を参考に、検索性と機械的な判別を容易にするフォーマットを採用します。

### 1. メッセージフォーマット規約

```typescript
// 基本フォーマット
"<method>(<scope>): [<Status>:] <message>", argument
```

- **method**: `ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE`（大文字固定）
- **scope**: 影響範囲（後述のリストから選択）
- **Status**: 処理状態（任意。後述のリストから選択）
- **message**: 命令法による簡潔な英文（必須）
- **argument**: 補足データ（オブジェクト、Error オブジェクト等）


### メソッド文字列の重複について

`ConsoleManager` において `Add Method Label to debug log` オプションを有効している場合、自動付与するラベル（例: `[INFO]`）と `method` 文字列が重複します。ソースコード上での `grep` 効率（例：`ERROR(storage)` で検索）を優先し、この冗長性を仕様とします。

#### **発生場所の明示（オプショナル）**

ログの発生箇所をより詳細に記述する必要がある場合、メッセージの末尾に `in Location`（Location は `クラス名.メソッド名` 等）を付与する形式が推奨されます。詳細は「付録: 標準化テンプレート」の「4. 発生場所の明示」を参照してください。


### 2. メッセージ記述の原則

1. **言語**: メッセージ本文は簡潔な英文（命令法/Imperative mood推奨）で記述します。
2. **小文字開始**: `<message>` 部分の先頭（ステータスキーワードがある場合はその直後の動詞）は、固有名詞を除き小文字で開始します。
	- ✅ `Success: initialize configuration`
	- ❌ `Successfully Init the Config.`
3. **機密情報の保護**: 以下の項目等の**機密情報を含むテキストは、絶対に出力しないでください。**
	- 個人情報 (PII)
	- 認証トークン
	- パスワード
	- APIキー
4. **初期化前ログ**: `ConsoleManager.apply()` による設定適応前のログは装飾されませんが、フォーマット自体はこの規約に従います。

### 3. ステータス (Status) キーワードの使い分け

処理結果を強調する場合、メッセージの冒頭に以下のキーワードを付与します。

| キーワード | カテゴリ | 判定基準・用途 |
| :--- | :--- | :--- |
| `Success` | 処理成否 | **処理の成功**: 意図した操作が最終的に正常に完了した。 |
| `Invalid` | 検証 | **入力・データ不正**: 関数の引数、ユーザー入力、読み込んだデータなどが期待される型や形式を満たしていない。 |
| `Failure` | 処理成否 | **処理の失敗**: 入力は正しいが、実行した操作（ファイル操作、保存等）が期待通りに完了しなかった。 |
| `Error` | 異常 | **論理的異常**: プログラムの構造上、本来到達してはならない箇所（網羅性チェックの漏れ等）に到達した。 |
| `Exception` | 異常 | **捕捉された例外**: `try-catch` 等で捕捉された実際の `Error` オブジェクトを報告・再スローする。 |
| `Valid` | 検証 | **データの妥当性**: 検証の結果、データや設定値が期待通りであることを確認した。 |

#### **使い分けのフローチャート的イメージ**

1. **入力が変か？** → `Invalid`
2. **（入力は正しいが）やろうとした事ができなかったか？** → `Failure`
3. **プログラムのロジックとしてあり得ない状態か？** → `Error`
4. **実行中に（外部から）例外が飛んできたか？** → `Exception`

### 4. 「Error」ステータスの判断基準（補足）

捕捉された例外オブジェクト（`Error`）が存在しなくても、以下の場合は `Error` ステータスを指定します。

- **論理的な不整合**: 本来到達してはならないコードブロック（`switch` の `default` 等）に到達した。
- **実行環境の欠落**: 必須のブラウザ API（`chrome.storage` 等）が未定義、または権限が不足している。
- **致命的なデータ不備**: 検証失敗 (`Invalid`) を超え、継続するとシステムの整合性を破壊する恐れがある。
- **API 論理エラー**: 通信自体は成功したが、レスポンスが致命的な不整合を示している。

### 5. スコープ (scope) の定義

影響範囲を示す `scope` は、以下のカテゴリと**選択の優先ルール**に従って決定してください。

#### スコープ選択の優先ルール

ログの検索性と文脈の明確化を両立するため、以下の優先順位に従ってスコープを選択します。

1. **機能的スコープ (Feature/Core/User) を最優先**
	* 原則として**「最も具体的な機能スコープ」**を優先してください。
	* ログの内容が特定の機能やモジュール（`storage`, `tab`, `messaging`, `config` 等）に直接関連する場合は、そのファイルがどこ（`background`, `popup` 等）にあっても、機能名をスコープとします。
2. **エントリーポイント・スコープ (Main) は「その場特有」の場合のみ**
	* 特定の機能モジュールに属さない、エントリーポイント固有のライフサイクル（起動、終了、イベントリスナーの登録自体）や、UI固有の挙動（ポップアップの開閉等）には `Main` カテゴリを使用します。
3. **汎用スコープ (Util) は再利用可能な部品のみ**
	* `utils/` 配下などの、特定のビジネスロジックを持たない純粋なヘルパー関数内でのログに使用します。

#### スコープ一覧

| カテゴリ | 説明 | 例 |
| :--- | :--- | :--- |
| **Main** | エントリーポイント（UIや入口） | `background`, `content`, `popup`, `options`, `changelog` |
| **Core** | 基盤ロジック | `config`, `init`, `i18n`, `messaging`, `ui`, `api`, `state` |
| **User** | ユーザー属性・操作 | `action`, `profile`, `preference` |
| **Feature** | 特定機能モジュール | `badge`, `tab`, `filter`, `storage`, `migration`, `queue`, `clipboard` |
| **Util** | 汎用ヘルパー | `date`, `string`, `dom`, `url` |
| **Misc** | 開発・テスト・一時的 | `test`, `temp` |

> [!TIP]
> - 同一ファイル内で複数の機能が混在する場合は、そのコードブロックが責務を持つ機能名を優先します。
> - `test` は Vitest 等のテスト実行時、 `temp` はバグ追跡時の一時的な追跡に使用します。
> - `throw` メソッドは、`<method>(<scope>):` の付加を不要とします。詳細は「付録: 標準化テンプレート」の「5. 例外スロー」を参照してください。

### 6. 引数 (argument) の渡し方

動的データはメッセージ文字列に埋め込まず、必ず第2引数以降に分離します。

- **ERROR / WARN**: `Error` オブジェクトや、原因となったパラメータを渡す。
- **INFO / DEBUG / TRACE**: 状態確認に必要な変数を渡す。コンテキストを明確にするため、`{ 変数名: 値 }` の**オブジェクト形式**で渡すことを強く推奨します。具体的なコード例は「付録: 標準化テンプレート」の「3. デバッグ・イベント」を参照してください。

---

## 付録: 標準化テンプレート

### 1. 処理のライフサイクル (Lifecycle)

| 状況 | 例 |
| :--- | :--- |
| **開始** | `console.info("INFO(init): start system initialization");` |
| **完了** | `console.info("INFO(storage): finish configuration processing");` |
| **成功** | `console.info("INFO(storage): Success: save configuration");` |
| **失敗** | `console.error("ERROR(storage): Failure: save configuration", { error });` |

### 2. データ検証 (Validation)

| 状況 | 例 |
| :--- | :--- |
| **無効な値** | `console.warn("WARN(config): Invalid: 'logLevel' value, use default", { value });` |
| **引数不正** | `console.error("ERROR(api): Invalid: argument supplied to 'createTab'", { args });` |
| **項目欠如** | `console.warn("WARN(api): Invalid: 'url' is missing");` |

### 3. デバッグ・イベント (Debug & Events)

| 状況 | 例 |
| :--- | :--- |
| **値確認** | `console.debug("DEBUG(filter): check allowed protocols", { protocols: ["http", "https"] });` |
| **イベント受信** | `console.info("INFO(messaging): receive message from popup", { message, sender });` |
| **グループ化** | `console.group("Migrate v1 to v2 (Legacy Data)"); ... console.groupEnd();` |

### 4. 発生場所の明示 (Location Explicit)

ログの発生箇所をメッセージの末尾に `in Location` 形式で付与する例です。

| 状況 | 例 |
| :--- | :--- |
| **発生場所の明示** | `ERROR(init): Failure: failed to update options in ConsoleManager.option in ConsoleManager.option` |

### 5. 例外スロー (Throwing Exceptions)

`throw` メソッドはメッセージの正規化形式を適用しません。

| 状況 | 例 |
| :--- | :--- |
| **例外スロー** | `throw new Error("Invalid configuration detected.");` |

---

## Notes

- **表示制御**: デフォルト設定では `loglevel: 'warn'` のため、`info` 以下のログは本番環境では非表示となる。
- **外観**: `ConsoleManager` により、メソッドに応じたカラーコーディングとタイムスタンプが自動付与される。