# PopoverMessage.ts

**最終更新日:** 2025年9月21日

Popover API を利用して、画面上にスタッカブルなメッセージを簡易的に表示するためのユーティリティクラスです。

---

## 概要

`PopoverMessage.create()` メソッドを呼び出すだけで、画面上にメッセージを手軽に表示できます。このクラスは、複数のメッセージを同時に管理し、新しいメッセージが上に積み重なるスタッカブルなUIを提供します。表示されたメッセージは、一定時間で自動的に消滅するほか、ユーザーがダブルクリックすることで能動的に閉じることも可能です。

このユーティリティは、インスタンスを必要としない静的クラス（ステートレス設計）として作られており、どのコンポーネントからでも簡単に呼び出すことができます。

## 主な機能

- **ステートレス設計:** インスタンス不要。すべての機能は静的メソッドを通じて提供されます。
- **シンプルなAPI:** 1つのメソッド呼び出しで、複雑な設定なしにメッセージを表示できます。
- **スタッカブルUI:** 複数のメッセージを縦に整列させて表示します。
- **自動消滅と手動クローズ:** メッセージは指定時間で自動的に消えるほか、ダブルクリックで即座に閉じることができます。
- **柔軟なカスタマイズ:** メッセージの表示時間、フォントサイズ、色（文字・背景）を個別に設定可能です。
- **定義済みスタイル:** `success`, `debug`, `notice`, `warning`, `error` といった、一般的な用途に対応する5種類のメッセージタイプを標準で提供します。

## 基本的な使い方

以下に、基本的な使い方を示します。

```typescript
import { PopoverMessage } from './PopoverMessage';

// 最もシンプルな使い方
PopoverMessage.create({
  message: "処理が正常に完了しました。"
});

// 複数のメッセージとオプションを指定した例
PopoverMessage.create({
  message: [
    "警告: 必須項目が未入力です。",
    "フォームを再確認してください。"
  ],
  messagetype: "warning",
  timeout: 10000 // 10秒で消えるように設定
});

// 全てのオプションを指定した高度な使い方
PopoverMessage.create({
  message: "これは全てのオプションを指定したカスタムメッセージです。",
  timeout: 15000, // 15秒
  fontsize: "14px",
  messagetype: "debug", // 'color'オプションで上書きされる
  color: {
    font: "white",
    background: "linear-gradient(45deg, #3a7bd5, #3a6073)"
  }
});
```

## APIリファレンス

### `PopoverMessage.create(options)`

画面上に新しいポップオーバーメッセージを表示します。

- **`options: PopoverMessageOptions`**: メッセージの表示設定を含むオブジェクト。

### `PopoverMessageOptions` インターフェース

`create` メソッドに渡す設定オブジェクトのインターフェースです。

```typescript
interface PopoverMessageOptions {
  /**
   * **必須**。表示するメッセージ文字列、またはその配列。
   * HTMLは解釈されず、プレーンテキストとして扱われます。
   */
  message: string | string[];

  /**
   * (任意) メッセージが自動で消えるまでの時間（ミリ秒）。
   * デフォルト: 5000
   */
  timeout?: number;

  /**
   * (任意) メッセージのフォントサイズ。
   * デフォルト: "16px"
   */
  fontsize?: string;

  /**
   * (任意) メッセージの文字色と背景色を直接指定します。
   * この設定は `messagetype` よりも優先されます。
   */
  color?: {
    font?: string;
    background?: string;
  };

  /**
   * (任意) 定義済みのスタイルを適用します。
   * 'success' | 'debug' | 'notice' | 'warning' | 'error'
   */
  messagetype?: "success" | "debug" | "notice" | "warning" | "error";
}
```

## 動作仕様・注意事項

### メッセージのテキスト形式

**`message` プロパティに渡される文字列にはHTMLを使用できません。**
このクラスは、内部で `textContent` プロパティに値を設定することで、渡された文字列をすべてプレーンテキストとして安全に扱います。HTMLタグを含む文字列を渡した場合、タグはHTML要素として解釈されず、画面上にそのままの文字列として表示されます（例: `<b>` は `<b>` と表示されます）。これはクロスサイトスクリプティング（XSS）を防ぐための意図的な設計です。

### 依存API

このクラスは [Popover API](https://developer.mozilla.org/ja/docs/Web/API/Popover_API) に依存しており、このAPIをサポートするブラウザ環境で実行する必要があります。主要ブラウザの対応バージョンは以下の通りです（詳細はMDNの[ブラウザ互換性](https://developer.mozilla.org/ja/docs/Web/API/Popover_API#browser_compatibility)の表を参照してください）。

- **Google Chrome**: `114` 以降
- **Firefox**: `125` 以降

### 実行コンテキスト

このクラスは内部でDOM操作を行います。そのため、クライアントサイドのコンテキスト（Content Script、拡張機能のPopupページやOptionsページなど）での使用を想定しています。Background ScriptのようなDOMが存在しない環境では動作しません。
