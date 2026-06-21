# SequenceProcessor 動作仕様

**最終更新日:** 2026年6月20日

`SequenceProcessor` クラスは、データオブジェクトを加工する一連のステップ（ルール）を管理・実行するためのコアコンポーネントです。

## 設計思想

### 汎用性と型安全

`SequenceProcessor<T, C>` はジェネリクスを採用しており、以下の型を自由に定義できます。
- **`T` (Target):** 処理対象となるデータの型。
- **`C` (Context):** 実行時に参照されるコンテキスト（環境情報や外部状態）の型。

これにより、データの移行（Migration）だけでなく、汎用的なデータ変換、状態管理、多段階バリデーションなど、多様なパイプラインとして利用可能です。

### トランザクショナルな実行

処理はルールごとに段階的に進みますが、致命的なエラーが発生した場合には、データ全体を入力時の状態にロールバックする機能を備えています。これにより、データの整合性を保ち、不完全な状態のデータがアプリケーションに残ることを防ぎます。

## 実行プロセス (`process` メソッド)

`process(data, context, options)` が呼び出されると、以下のステップで処理が実行されます。

1. **初期化とバックアップ:**
	- オプション (`immutableInput`) に基づき、入力データのコピーを作成します。これは失敗時のロールバック用「原形」として保持されます。
2. **ルールの反復処理:**
	- 登録されたすべてのルール（`order` 順）を順番に評価します。
3. **ルールのフィルタリング (`shouldExecute`):**
	- ルールの `spec`（enabled, platforms, lifecycle）と現在の `context` を比較し、実行すべきかどうかを判定します。環境に適合しないルールは自動的にスキップされます。
4. **個別ルールの実行 (`executeRuleStep`):**
	- **条件判定 (`condition`):** ルールの実行が必要か判定します（例：特定のプロパティが存在するか）。
	- **実行 (`execute`):** データを加工します。
	- **エラーハンドリング:** 実行中にエラーが発生した場合、ルールの `critical` フラグを確認します。
	  - **Critical (true):** 処理を直ちに中断し、データ全体を「原形」にロールバックします。
	  - **Non-Critical (false):** そのルールの変更のみを破棄（直前のルール終了時の状態へ復帰）し、次のルールへ進みます。
5. **結果の構築:**
	- 最終的なデータ、実行ステータス (`success`, `partial_success`, `failed`)、適用されたルールの履歴、発生したエラーのレポートを返却します。

## 実行オプション (`SequenceOptions`)

- **`failFast` (boolean):** `true` の場合、非致命的なエラーであっても最初の失敗で処理を中断します。
- **`captureErrorSnapshots` (boolean):** `true` の場合、エラーレポートに失敗直前のデータ状態を含めます。
- **`immutableInput` (boolean):** `false` の場合、入力データに対して直接クローンを作成せず、参照を保持します（メモリ節約用。通常は `true` 推奨）。
- **`cloneFn` (function):** オブジェクトのディープコピーに使用する関数を指定します（デフォルトは `structuredClone` です）。

## 注意事項

### オブジェクトのディープコピー

本ライブラリは、デフォルトのディープコピー処理にネイティブの `structuredClone` メソッドを使用しています。このメソッドで用いられている「構造化複製アルゴリズム」には、以下の制限事項があります。

- **未対応の型**:
  - `Function` (関数)
  - `DOMノード` (Element など)
  - `Symbol`
  - オブジェクトのプロトタイプチェーン、記述子 (descriptors)、ゲッター/セッターなどは複製されません。
- **エラー**: 上記の未対応の型が含まれるオブジェクトを複製しようとすると、`DataCloneError` 例外が発生します。

`structuredClone` で未対応の型を含んだデータのディープコピーが必要な場合は、`options.cloneFn` を利用して、自前で実装したディープコピー関数や、外部ライブラリ（例: `lodash-es` の `cloneDeep` など）を渡すように設計してください。

### 巨大なバイナリデータの取り扱い

本ライブラリは、画像・動画などのメディアデータ（数MB〜数百MB規模の `Blob`、`File`、`Uint8Array` など）を処理する汎用パイプラインとしても設計されています。

デフォルト設定（「3xモデル（メモリ消費が元の約3倍になるクローン処理）」＋エラースナップショット有効）では、データの不変性とロールバックの安全性を最大限保証するため、処理中に複数回のディープクローンが発生します。そのため、数百MBクラスのデータを扱うと、メモリ消費量が元のサイズの約3倍以上に膨張し、ブラウザや拡張機能のメモリ上限（OOMクラッシュ）や深刻なガベージコレクション（GC）によるフリーズを引き起こす危険性があります。

巨大なバイナリデータを処理する場合は、以下のオプションを組み合わせてメモリ消費とクローン負荷を抑えることを強く推奨します。

- **`options.immutableInput: false`**
  入力データの初期クローンをスキップし、参照のまま処理を開始します。
- **`options.captureErrorSnapshots: false`**
  エラー発生時の履歴用スナップショットの保存を無効化し、メモリの肥大化を防ぎます。
- **`options.cloneFn: (d) => d`**
  データのディープコピーを無効化し、完全なインプレース加工（直接変異）を許容します。これにより毎ステップごとのリストア用クローン処理もスキップされ、CPU・メモリ負荷を最小限に抑えられます（※各ルール内での副作用の漏洩に注意してください）。

## 参照

- [Web APIs: structuredClone() method -  MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- [Web APIs: The structured clone algorithm - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
- [Glossary: Deep copy - MDN](https://developer.mozilla.org/en-US/docs/Glossary/Deep_copy)

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
