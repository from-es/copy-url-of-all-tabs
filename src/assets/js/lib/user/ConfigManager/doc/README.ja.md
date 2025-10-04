# ConfigManager

**最終更新日:** 2025年10月3日

アプリケーションの設定ファイルのインポートおよびエクスポートを処理するユーティリティクラスです。

## 概要

`ConfigManager` は、設定データを管理するための静的メソッドを提供します。UIフレームワークから独立して設計されており、ファイル操作のみに焦点を当てています。データの処理やUIの更新は、呼び出し元の責任となります。

- **インポート**: ユーザーが選択したテキストファイル（例: JSON）を読み込み、その内容を文字列として返します。
- **エクスポート**: 文字列（例: JSON文字列）を受け取り、ユーザーがファイルとして保存できるようにブラウザのダウンロードをトリガーします。

## メソッド

### `importFile(mimetype)`

ユーザーが設定ファイルを選択するためのファイルダイアログを表示します。`ImportResult` オブジェクトで解決されるPromiseを返します。

- **`mimetype`**: `MimeType` - 読み込むファイル形式を指定（例: `"application/json"`）。

**戻り値**: `Promise<ImportResult>`

#### `ImportResult` オブジェクト

| プロパティ     | 型        | 説明                                                              |
| :------------- | :-------- | :---------------------------------------------------------------- |
| `action`       | `"import"`  | 実行されたアクションの種類を示します。                            |
| `success`      | `boolean` | ファイルの読み込みに成功した場合は `true`、それ以外は `false`。     |
| `message`      | `string`  | 操作の結果を説明するメッセージ。                                  |
| `content`      | `string`  | 成功した場合のファイル内容のテキスト。それ以外は `undefined`。    |
| `isUserCancel` | `boolean` | ユーザーがファイルダイアログをキャンセルした場合は `true`。       |
| `error`        | `Error`   | エラーが発生した場合の `Error` オブジェクト（ユーザーキャンセルを除く）。 |

### `exportFile(content, filename, mimetype)`

提供されたコンテンツのブラウザダウンロードをトリガーします。

- **`content`**: `string` - ファイルに保存するコンテンツ。
- **`filename`**: `string` - ダウンロードされるファイルのデフォルト名。
- **`mimetype`**: `MimeType` - ファイルのMIMEタイプ。

**戻り値**: `ExportResult`

#### `ExportResult` オブジェクト

| プロパティ | 型         | 説明                                                              |
| :--------- | :--------- | :---------------------------------------------------------------- |
| `action`   | `"export"` | 実行されたアクションの種類を示します。                            |
| `success`  | `boolean`  | エクスポートが正常に開始された場合は `true`、それ以外は `false`。 |
| `message`  | `string`   | 操作の結果を説明するメッセージ。                                  |
| `error`    | `Error`    | エラーが発生した場合の `Error` オブジェクト。                     |

## カスタムエラー

### `UserCancelError`

このエラーは、ユーザーがファイルを選択せずにファイル選択ダイアログを閉じたときにスローされます。`importFile` メソッドはこのエラーをキャッチし、`ImportResult` オブジェクトの `isUserCancel` フラグを `true` に設定します。

## 型

### `MimeType`

以下のMIMEタイプがサポートされています:

- `"text/csv"`
- `"application/x-ini"`
- `"application/json"`
- `"text/plain"`
- `"application/toml"`
- `"application/x-yaml"`

## 使用例

```typescript
import { ConfigManager } from "./ConfigManager";

async function handleImport() {
  const result = await ConfigManager.importFile("application/json");

  if (result.isUserCancel) {
    console.log("ユーザーはファイルのインポートをキャンセルしました。");
    return;
  }

  if (result.success && result.content) {
    console.log("インポートされたコンテンツ:", result.content);
    // 設定コンテンツを処理...
  } else {
    console.error("インポートに失敗しました:", result.message, result.error);
  }
}

function handleExport() {
  const myConfig = { theme: "dark", notifications: true };
  const content = JSON.stringify(myConfig, null, 2);
  const result = ConfigManager.exportFile(content, "my-config.json", "application/json");

  if (result.success) {
    console.log("エクスポートが正常に開始されました。");
  } else {
    console.error("エクスポートに失敗しました:", result.message, result.error);
  }
}
```