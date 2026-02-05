# ConsoleManager

**最終更新日:** 2026年2月5日

## 概要

`ConsoleManager`は、アプリケーションのコンソール出力の動作を管理するための静的ユーティリティクラスです。
ログレベルに基づいた出力のフィルタリング、タイムスタンプの付与、およびコンソール出力の一括有効化/無効化機能を提供します。

## 主な機能

- **ログレベル管理**: 設定されたログレベルに基づいて、表示するコンソールログをフィルタリングします。
- **プレフィックスとスタイリング**: `methodLabel` または `timestamp` オプションが `true` の場合、ログの先頭にプレフィックス（メソッドラベルやタイムスタンプ）が付与されます。このプレフィックスは、ログレベルに応じて色分けされます。
- **柔軟なプレフィックス**: `methodLabel` と `timestamp` オプションを個別に設定することで、プレフィックスの表示内容を柔軟に制御できます。
- **一括制御**: `logging: false` または `loglevel: 'silent'` を設定することで、すべてのコンソール出力を一度に抑制できます。

## ログレベル

ログレベルは、重要度に応じて階層化されています。`loglevel` オプションに指定したレベル以上の重要度を持つログのみが出力されます。

| レベル名 | レベル値 | 説明                                     |
| :------- | :------- | :--------------------------------------- |
| `all`    | `0`      | 全てのログを出力する（最も詳細なレベル） |
| `trace`  | `100`    | `trace` レベル以上のログを出力する       |
| `debug`  | `200`    | `debug` レベル以上のログを出力する       |
| `info`   | `300`    | `info` レベル以上のログを出力する        |
| `warn`   | `400`    | `warn` レベル以上のログを出力する        |
| `error`  | `500`    | `error` レベル以上のログを出力する       |
| `silent` | `1000`   | 全てのログを抑制する                     |

`console.log` は `info` レベルとして扱われます。

## ConsoleManagerOptions

`ConsoleManager.option()` メソッドで設定できるオプションです。

| プロパティ名     | 型                                | 説明                                                                                     | デフォルト値 |
| :--------------- | :-------------------------------- | :--------------------------------------------------------------------------------------- | :----------- |
| `logging`        | `boolean`                         | `true` の場合、コンソール出力を有効にします。`false` の場合は全て抑制します。            | `true`       |
| `loglevel`       | `LogLevel`                        | 出力するログの最低レベルを指定します。                                                   | `'warn'`     |
| `methodLabel`    | `boolean`                         | `true` の場合、各ログにメソッドラベル（例: `[INFO]`）を付与します。                      | `true`       |
| `timestamp`      | `boolean`                         | `true` の場合、各ログにタイムスタンプを付与します。                                      | `true`       |
| `timecoordinate` | `'UTC' \| 'GMT'`                  | タイムスタンプのタイムゾーンを指定します。                                               | `'UTC'`      |

`LogLevel` 型: `'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'`

## 静的メソッド

### `option(newOptions: Partial<ConsoleManagerOptions>): void`

`ConsoleManager` の設定を更新します。引数に渡されたオブジェクトが現在の設定にマージされます。
`newOptions` が有効なオブジェクトでない場合、または不正なプロパティを含む場合、`TypeError` がスローされます。

```typescript
ConsoleManager.option({ loglevel: 'debug', timestamp: false });
```

### `apply(): void`

設定されたオプションに基づいて、グローバルの `console` オブジェクトの動作を上書きします。アプリケーションの初期化時に一度呼び出す必要があります。

```typescript
ConsoleManager.apply();
```

### `restore(): void`

`console` オブジェクトを元の状態に復元します。

```typescript
ConsoleManager.restore();
```

### `state(): { option: ConsoleManagerOptions; method: Record<string, string> }`

現在の設定オプションのディープコピーと、色定義オブジェクトへの参照を返します。

```typescript
const currentState = ConsoleManager.state();
console.log(currentState.option.loglevel); // 'warn'
console.log(currentState.method.error);    // 'red'
```

## 使用例

```typescript
// アプリケーションの初期化
function initializeApp() {
	// デフォルト設定 (loglevel: 'warn', timestamp: true, methodLabel: true) でコンソールを上書き
	ConsoleManager.apply();

	console.log("This will not be displayed.");   // level: 'info'
	console.info("This will not be displayed.");  // level: 'info'
	console.debug("This will not be displayed."); // level: 'debug'
	console.warn("This is a warning.");           // level: 'warn' - プレフィックスと色付きで表示される
	console.error("This is an error.");           // level: 'error' - プレフィックスと色付きで表示される
}

// 開発中に詳細なログを表示したい場合
function setupForDevelopment() {
	ConsoleManager.option({ loglevel: 'all' });
	ConsoleManager.apply();

	console.log("Now, this will be displayed."); // level: 'info' - プレフィックスと色付きで表示される
}

// タイムスタンプのみ無効にする
function disableTimestamp() {
	ConsoleManager.option({ timestamp: false });
	ConsoleManager.apply();

	console.warn("This warning has a method label, but no timestamp."); // 色付きのメソッドラベル [WARN] が表示される
}

// メソッドラベルのみ無効にする
function disableMethodLabel() {
	ConsoleManager.option({ methodLabel: false });
	ConsoleManager.apply();

	console.warn("This warning has a timestamp, but no method label."); // 色付きのタイムスタンプが表示される
}

// すべてのプレフィックスを無効にする
function disableAllPrefixes() {
	ConsoleManager.option({ timestamp: false, methodLabel: false });
	ConsoleManager.apply();

	console.warn("This is a warning without any prefix or color."); // プレフィックスも色もなしで表示される
}

initializeApp();
setupForDevelopment();
disableTimestamp();
disableMethodLabel();
disableAllPrefixes();