# CreateExtendedError

**最終更新日:** 2026年4月18日

エラーオブジェクトに追加のメタデータやコンテキストを付与するためのユーティリティです。

---

## 概要
`createExtendedError` を使用すると、標準のエラークラスやカスタムエラークラスをインスタンス化する際、任意のメタデータを簡単に付与できます。標準の Error Chaining (`cause`) をサポートし、スタックトレースを調整して呼び出し元を正確に指し示す機能を提供します。

## 主な機能
- **メタデータサポート**: エラーの `detail` プロパティに任意のデータを添付できます。
- **Error Chaining**: 標準の `cause` オプションをフルサポートし、エラーのラップが可能です。
- **スタックトレースの最適化**: `Error.captureStackTrace` を使用して、ユーティリティ自身をスタックから除外。デバッグ時に呼び出し元を直接確認できます。
- **不変性 (Immutability)**: `detail` プロパティに格納されたメタデータは、実行時に読み取り専用として設定されます。
- **型安全**: TypeScript で構築されており、エラークラスやメタデータの型定義を完全にサポートします。
- **フェイルファスト検証**: 実行時に引数を検証し、不正な使用を早期に検出します。

## 基本的な使い方
```typescript
import { createExtendedError } from './CreateExtendedError';

// 1. 基本的な使用法
throw createExtendedError(Error, "何らかのエラーが発生しました");

// 2. メタデータの付与
const error = createExtendedError(TypeError, "不正な入力です", {
  fieldName: "email",
  value    : "invalid-email"
});
console.log(error.detail.fieldName); // "email"

// 3. Error Chaining (cause) の利用
try {
  // ... 処理
} catch (error) {
  throw createExtendedError(Error, "処理に失敗しました", { cause: error, step: "initialization" });
}
```

## APIリファレンス
### `createExtendedError<T, D>(ErrorType, message, options)`
- **`ErrorType`**: インスタンス化するエラークラスのコンストラクタ（例: `Error`, `TypeError`）。デフォルトは `Error`。
- **`message`**: エラーメッセージ（空でない文字列である必要があります）。
- **`options`**: 以下のプロパティを含むオプションオブジェクト：
    - `cause`: 原因となったエラー（標準の Error Chaining）。
    - `stackStartFn`: スタックトレースの開始地点となる関数。
        - デフォルトは `createExtendedError`。これにより、ユーティリティ内部のコードがスタックトレースから除去されます。
        - ラッパー関数を指定（例: `stackStartFn: myWrapper`）すると、その関数とその呼び出し元をスタックから除去できます。
        - `null` を指定すると調整をスキップします（完全なコールスタックが保持されます）。
    - カスタムメタデータ: それ以外の文字列キーを持つプロパティは `detail` に格納されます。

## 動作仕様・注意事項
### スタックトレースの扱い
このユーティリティは `Error.captureStackTrace` を使用し、スタックトレースがユーティリティ内部ではなく、呼び出し箇所から始まるように調整します。これは非標準機能であり、V8 ベースのブラウザ（Chrome, Edge）、Firefox (120+)、および Safari (17.2+) でサポートされています。

### メタデータ (`detail`)
`options` で渡されたプロパティ（`cause` および `stackStartFn` を除く）は `detail` プロパティにまとめられます。このプロパティは `Object.defineProperty` を使用して、読み取り専用（readonly）かつ設定変更不可（non-configurable）として定義されます。

### 実行コンテキスト
純粋なロジック関数であり、ブラウザおよび Node.js の両環境で安全に使用できます。

## ライセンス
このプロジェクトは [MIT License](../../../../../../LICENSE.md) の下で公開されています。
