# UrlDelayCalculator.ts

URLを連続して開く際の遅延時間を計算するための、汎用性と堅牢性に優れたステートレス・ユーティリティです。高いパフォーマンスを発揮するように設計されており、リソースを順番に読み込む必要があるブラウザ拡張機能やWebアプリケーションに最適です。

---

## 概要

プログラムで大量のURLを開く際、サーバー側のレート制限やパフォーマンス低下に直面することがよくあります。`UrlDelayCalculator.ts`は、デフォルトの遅延時間とカスタマイズ可能なルールセットに基づき、URLリストに対する「個別」と「累積」の両方の遅延時間を計算することで、この問題を解決します。

このユーティリティは、インスタンスを必要としない静的クラス（ステートレス設計）として作られています。これにより、ブラウザ拡張機能のService Worker（Manifest V3）のような、ライフサイクルが一時的な環境でも、安全かつ予測通りに動作します。

## 主な機能

- **ステートレス設計:** インスタンス不要。すべての機能は静的メソッドを通じて提供されます。
- **カスタマイズ可能なルール:** 特定のURLパターンに一致する場合の遅延時間を個別に定義できます。
- **柔軟なパターンマッチング:** 文字列パターンに対して、`前方一致 (prefix)`、`部分一致 (substring)`、`完全一致 (exact)` をサポート。もちろん`RegExp`オブジェクトも使用可能です。
- **条件付き適用:** ルールがN回目のマッチから遅延を適用するように設定できます（例: 2回目以降の一致から適用）。
- **堅牢性と安全性:** 不正または不適切な形式のルールパターンが渡されても、エラーを発生させることなく処理を続行します。
- **ハイパフォーマンス:** 大量のURLリストを処理する際のパフォーマンスを最適化するため、正規表現ルールを事前に一括コンパイルします。
- **詳細な計算結果:** `setTimeout`に適した`累積遅延 (cumulative)`と、`async/await`ループに適した`個別遅延 (individual)`の両方を計算します。

## インストール

```bash
npm install url-delay-calculator
```
*(注: パッケージ名はデモンストレーション用です)*

## 基本的な使い方

以下に、基本的な使い方を示します。

```typescript
import { UrlDelayCalculator, type UrlDelayRule } from './UrlDelayCalculator';

const urls = [
  'https://example.com/page1',
  'https://special-site.com/resourceA',
  'https://example.com/page2',
  'https://special-site.com/resourceB'
];

const rules: UrlDelayRule[] = [
  {
    pattern: 'https://special-site.com/',
    matchType: 'prefix', // 前方一致
    delay: 1000 // このサイトには1秒の遅延を適用
  }
];

const defaultDelay = 250; // デフォルトの遅延時間は250ミリ秒

// カスタム遅延を初回から適用する（デフォルトの動作）
const results = UrlDelayCalculator.calculateDelays(urls, defaultDelay, rules);

console.log(results);

/*
出力:
[
  { url: '...', delay: { cumulative: 0, individual: 0 } },
  { url: '...', delay: { cumulative: 1000, individual: 1000 } },
  { url: '...', delay: { cumulative: 1250, individual: 250 } },
  { url: '...', delay: { cumulative: 2250, individual: 1000 } }
]
*/
```

## APIリファレンス

### `UrlDelayCalculator.calculateDelays(urls, defaultDelay, customRules, applyFrom)`

URLリスト内の各URLに対する遅延時間を計算します。

- **`urls: string[]`**: 処理対象となるURL文字列の配列。
- **`defaultDelay: number`**: カスタムルールに一致しない場合に適用される、デフォルトの遅延時間（ミリ秒）。
- **`customRules?: UrlDelayRule[]`**: (任意) カスタム遅延を適用するための`UrlDelayRule`オブジェクトの配列。
- **`applyFrom?: number`**: (任意) カスタム遅延を何回目のマッチから適用するかを指定します。`2`を指定すると2回目の一致から適用されます。デフォルトは`1`（初回から適用）です。<br>_注: この値を決定するのは、このユーティリティを呼び出す側のコードの責任です。アプリケーションの固定設定や、ユーザーが設定可能なオプションとして実装することが想定されます。_
- **戻り値**: `UrlDelayCalculationResult[]` - 計算結果オブジェクトの配列。

### `UrlDelayRule` インターフェース

カスタム遅延ルールを定義するためのインターフェースです。

```typescript
interface UrlDelayRule {
  /**
   * URLと照合するためのパターン。文字列またはRegExpオブジェクト。
   */
  pattern: string | RegExp;

  /**
   * `pattern`が文字列の場合のマッチング戦略。RegExpオブジェクトの場合は無視されます。
   * - 'prefix': (デフォルト) URLがパターンで始まる場合に一致。
   * - 'substring': URLにパターンが含まれる場合に一致。
   * - 'exact': URLがパターンと完全に同一である場合に一致。
   */
  matchType?: 'prefix' | 'substring' | 'exact';

  /**
   * パターンが一致した場合に適用する遅延時間（ミリ秒）。
   */
  delay: number;
}
```

### `UrlDelayCalculationResult` インターフェース

単一のURLに対する遅延計算の結果を表すインターフェースです。

```typescript
interface UrlDelayCalculationResult {
  /**
   * 元のURL。
   */
  url: string;

  /**
   * 遅延情報を含むオブジェクト。
   */
  delay: {
    /**
     * シーケンス開始からの累積遅延（ミリ秒）。
     * `setTimeout`での利用に最適です。
     */
    cumulative: number;

    /**
     * このURLを処理する直前の個別の待機時間（ミリ秒）。
     * `async/await`ループ内で`sleep`関数と組み合わせて使う場合に最適です。
     */
    individual: number;
  };
}
```

## 高度な使い方

### 2回目以降のマッチから遅延を適用する

`applyFrom`引数を設定することで、ルールが特定の回数マッチした後にのみ遅延を適用できます。これは、同じドメインのURLが2回目以降に出現した場合にのみ遅延させたい、といったシナリオで役立ちます。

```typescript
const urls = [
  'https://x.com/user/1', // 1回目のマッチ: カスタム遅延なし
  'https://example.com/a',
  'https://x.com/user/2', // 2回目のマッチ: カスタム遅延が適用される
  'https://example.com/b',
  'https://x.com/user/3'  // 3回目のマッチ: カスタム遅延が適用される
];

const rules: UrlDelayRule[] = [
  {
    pattern: 'https://x.com',
    matchType: 'prefix',
    delay: 5000, // 5秒の遅延
  }
];

// 第4引数に `2` を渡し、2回目の一致から遅延を適用する
const results = UrlDelayCalculator.calculateDelays(urls, 250, rules, 2);

/*
期待される個別遅延 (individual delay):
- https://x.com/user/1: 0 (リストの最初のURL)
- https://example.com/a: 250
- https://x.com/user/2: 5000 (2回目のマッチ、applyFrom: 2 を満たす)
- https://example.com/b: 250
- https://x.com/user/3: 5000 (3回目のマッチ、applyFrom: 2 を満たす)
*/
```

### 無効なルールの取り扱い

この計算機は、堅牢に動作するように設計されています。もし無効なルール（例: 空文字列や不正な型のパターン）が渡された場合でも、エラーを投げて停止することはありません。代わりに、コンソールに警告を出力し、そのルールがどのURLにもマッチしないものとして扱います。これにより、アプリケーション全体の安定性が保たれます。

```typescript
const invalidRules: UrlDelayRule[] = [
  { pattern: '', delay: 1000 }, // 無効: 空文字列
  { pattern: null, delay: 1000 } // 無効: 不正な型
];

// このコードはコンソールに警告を出力しますが、クラッシュはしません。
const results = UrlDelayCalculator.calculateDelays(urls, 250, invalidRules);
```

## ライセンス

このプロジェクトは [MIT License](LICENSE.md) の下で公開されています。
