# Chrome拡張機能「Copy URL of All Tabs」ユーザーガイド

**最終更新日:** 2025年10月20日


## 概要

「Copy URL of All Tabs」は、タブのURLを簡単に管理するためのChrome拡張機能です。ワンクリックで現在開いているウィンドウの全タブのURLをクリップボードにコピーしたり、クリップボード内のURLをまとめて新しいタブで開いたりすることができます。


## 機能

この拡張機能は、以下の機能を提供します。

1. Chromeのツールバーにある**拡張機能アイコンをクリック**して、ポップアップメニューを開きます。
2.  ポップアップメニューから、実行したいアクション（Copy, Paste, Options）をクリックします。
	- **Copy**
		- アクティブなウィンドウの全タブのURLをクリップボードにコピーします。コピーするテキストの形式は設定でカスタマイズ可能です。
	- **Paste**
		 - クリップボードからURLリストを読み込み、それぞれを新しいタブで開きます。タブを開く際の挙動は設定で変更できます。
	- **Options**
		- 拡張機能の設定ページを開きます。


## 設定

あなたのワークフローに合わせて、拡張機能の動作をカスタマイズできます。変更した設定は **Save** ボタンを押し、設定が保存されるまで反映されません。

### Copy

- **Format:** クリップボードにコピーされるテキストの形式を管理します。
	- **Format Type:** `text` (URLのリスト)、`json` (タイトルとURLで構造化)、または `custom` (カスタム) から選択します。
	- **Custom Template:** `custom` を選択した場合、`$title` と `$url` をプレースホルダーとして使用し、独自の形式を定義できます。
	- **MIME Type:** `custom` フォーマットの場合、コピーするデータのMIMEタイプ (`text/plain` や `text/html` など) を設定できます。

### Paste

#### **Search**

- **Search for URLs:** この設定を有効にすると、正規表現を使用してクリップボードのテキスト全体からURLを検索します。無効の場合、各行がURLであるとみなして処理します。


#### **Tab**

新しいタブの開き方を管理します。

- **Reverse Order:** クリップボードに記載されているURLを逆順でタブで開きます。
- **Active Tab:** 新しいタブをアクティブ（フォーカスされた状態）なタブとして開きます。
- **Position:** 新しいタブを開く場所を選択します（例: 現在のタブの隣、タブリストの最初/最後）。
- **Delay:** 次のタブを開くまでの遅延時間を設定します。
- **Task Control:** 複数URLを開く際の処理方法と順序を設定します。

**Delay** と **Task Control** の設定については、「[設定詳細 (Paste)](#設定詳細-paste)」をご覧ください。

### Filtering

- **Enable Filtering:** **Copy** と **Paste** のアクションに対して、個別にURLフィルタリングを有効または無効にできます。
- **Allowed Protocols:** フィルタリングが有効な場合、選択されたプロトコルを持つURLのみが処理されます (例: `http`, `https`, `file` など)。

### System

- **Options Page:**
	- **Font Size:** 設定ページ自体のフォントサイズを調整します。
- **Popup Menu:**
	- **Font Size:** ポップアップメニューのフォントサイズを調整します。
	- **Clear Message:** ポップアップに表示されたメッセージを、指定時間後に消去します。
	- **OnClick Close:** コピーやペーストのアクション後、ポップアップメニューを指定時間後に閉じます。

### Debug

- **Enable Logging:** ブラウザの開発者コンソールにデバッグ情報を出力します。
- **Add Timestamp:** デバッグログにタイムスタンプを追加します。
- **Time Coordinate:** タイムスタンプの時間座標 (UTC または GMT) を選択します。

### import / export

設定をファイルにエクスポート（バックアップ）、ファイルからインポート（復元）することができます。これにより、異なるブラウザやプロファイル間で設定を同期するのに役立ちます。

### Save / Reset

- **Save:** 設定ページで行ったすべての変更を保存します。このボタンを押すまで、変更は適用されません。
- **Reset:** すべての設定を初期状態（デフォルト値）に戻します。この操作を実行すると、表示されている設定は初期状態に戻りますが、Saveされるまで設定が上書きされる事はありません。

## 設定詳細 (Paste)

### Delay

- **Delay:** 次のタブを開くまでの共通の遅延時間をミリ秒単位で設定します。
- **Custom Delay:** 特定のパターンに一致するURLに対して、個別の遅延時間を設定するルールを定義できます。

### Task Control

複数URLを開く際の処理方法と順序を制御します。

- **Processing Unit:** URLをどのようにグループ化して処理するかを設定します。
	- `Unitary`: URLを**1つずつ個別のタスク**として処理します。PCへの負荷が最も軽い方法です。
	- `Batch`: URLを**指定された数のグループに分けて**処理します。
	- `Monolithic`: すべてのURLを**一つの大きなタスク**として処理します。処理中は他の操作が待たされることがあります。
- **Execution Order:** 生成されたタスクを、実行待ちのキューにどのように追加するかを設定します。
  - `Parallel`: キューをバイパスし、すべてのタブを同時に開こうとします。大量のURLには推奨されません。
  - `Append`: 新しいタスクをキューの末尾に追加します。
  - `Prepend`: 新しいタスクを待機キューの先頭に追加し、次に処理されるようにします。
  - `Insert Next`: `Prepend` と同じ動作です。**将来の機能のために予約**されています。UI上ではコメントアウトされています。

#### 動作例: Processing Unit と Execution Order の組み合わせ

この設定は、特に大量のURLを処理する際に、ブラウザの応答性やタブの開き方に大きな影響を与えます。

- **Processing Unit: `Unitary (一枚ずつ処理)` または `Batch (グループに分けて処理)` の場合:**
	- `Execution Order: Append` を選択すると、現在開いているタブの処理が完了した後、新しいタブが順番に開かれます。
	- `Execution Order: Prepend` を選択すると、現在開いているタブの処理が完了次第、次に開かれるタブのリストの先頭に新しいタブが割り込み、優先的に開かれます。これにより、緊急性の高いタブを素早く開くことができます。

- **Processing Unit: `Monolithic (すべて一括で処理)` の場合:**
	- このモードでは、すべてのURLが単一の大きなタスクとして処理されるため、`Execution Order` の `Append` や `Prepend` の効果は限定的になります。一度処理が開始されると、すべてのタブが開き終わるまで他のタスクは割り込めません。

これらの設定を組み合わせることで、ユーザーの操作感やPCへの負荷を調整できます。

## 必要な権限

この拡張機能は、その動作に以下の権限を必要とします。

| 権限             | 目的                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `tabs`           | 開いているタブのURLとタイトルにアクセスするために必要です。              |
| `storage`        | 設定を保存するために必要です。                                         |
| `clipboardRead`  | 「Paste」機能を使用する際、クリップボードからURLリストを読み取るために必要です。 |
| `clipboardWrite` | 「Copy」機能を使用する際、URLリストをクリップボードに保存するために必要です。   |

あなたのプライバシーは尊重されます。この拡張機能はすべてのデータをデバイス上でローカルに処理します。

## サポート

この拡張機能は無料提供のため、個別のサポートは行っておりません。

問題報告や機能要望は、GitHubのIssues (https://github.com/from-es/copy-url-of-all-tabs/issues) までお願いいたします。

## 関連リンク

### Browser Extension Store

- [Copy URL of All Tabs - Chrome Web Store](https://chromewebstore.google.com/detail/copy-url-of-all-tabs/glhbfaabeopieaeoojdlaboihfbdjhbm "Copy URL of All Tabs - Chrome Web Store")
- [Copy URL of All Tabs - Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/copy-url-of-all-tabs/ "Copy URL of All Tabs - Mozilla Add-ons")

### Source Code

- [from-es/copy-url-of-all-tabs - Github](https://github.com/from-es/copy-url-of-all-tabs "https://github.com/from-es/copy-url-of-all-tabs")