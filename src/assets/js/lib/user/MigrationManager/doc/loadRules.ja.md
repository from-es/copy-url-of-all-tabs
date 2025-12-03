# `loadRules` ユーティリティ動作仕様

**最終更新日:** 2025年12月3日

## 概要

`loadRules` ユーティリティは、`import.meta.glob` を用いて**同期的**にインポートされた移行ルールモジュール群を処理し、検証・ソート済みの移行ルール配列を構築する機能を提供します。

このユーティリティの主な目的は、`MigrationManager` に渡されるルールセットの有効性を保証し、開発者が不正なルールを定義した際に即座に問題を検知できるようにすることです（Fail-Fast設計）。

> [!IMPORTANT]
> **実行環境の制約（特に Service Worker）**
> 詳細は後述の「[実行環境に関する注意事項](#実行環境に関する注意事項)」セクションを参照してください。本ライブラリを Chrome 拡張機能の Service Worker など、`window` オブジェクトが存在しない環境で利用する場合、モジュールの読み込み方法に厳密な制約があります。

> [!WARNING]
> **Vite 依存機能について**
> このユーティリティが依存している `import.meta.glob` 関数は、ブラウザネイティブの標準機能ではなく、**Vite** が提供する独自の機能です。そのため、本ライブラリを Vite 以外のビルド環境で使用する場合は、`import.meta.glob` と同等の機能（特定パターンの複数モジュールを一括で動的にインポートする仕組み）を別途用意する必要があります。

## 主な機能と責務

`loadRules` 関数は、内部で以下の処理を段階的に実行します。

### 1. ルールの抽出

- `import.meta.glob` の結果として得られるモジュールマップ（`Record<string, RuleModule<T>>`）を引数に取ります。
- 各モジュールから `rules` プロパティ（`MigrationRule<T>[]`）を抽出し、単一のルール配列にフラット化します。
- モジュールが `rules` 配列を正しくエクスポートしていない場合は、エラーをスローします。

### 2. ルールの検証 (Fail-Fast)

抽出された各ルールオブジェクトの構造を厳格に検証します。一つでも不正なルールが見つかった場合、処理を中断して詳細なエラーをスローします。

- **必須プロパティ:**
	- `condition`: `function` 型でない場合はエラー。
	- `execute`: `function` 型でない場合はエラー。
- **任意プロパティ:**
	- `meta`: 存在する場合、その構造（`author`, `reason` などの必須フィールド）と `authored` の日付フォーマット (`YYYY-MM-DD`) を検証します。不正な場合はエラー。
	- `order`: 存在する場合、`number` 型でない場合はエラー。

### 3. `order` プロパティの重複チェック (Fail-Fast)

- ルールセット内で `order` プロパティの値が重複している場合、意図しない実行順序を防ぐためにエラーをスローします。
- エラーメッセージには、どのルールで `order` が重複しているかの詳細が含まれます。
- `order` プロパティを持たないルールは、このチェックの対象外です。

### 4. ルールのソート

- 検証を通過したすべてのルールを、`order` プロパティに基づいて昇順（小さい順）にソートします。
- `order` プロパティを持たないルールは、`order` を持つすべてのルールの後に配置されます。これらのルール間の順序は保証されません。

## APIリファレンス

### `loadRules<T>(modules)`

- **ジェネリクス:**
	- **`<T>`**: 移行対象となるデータの型。
- **引数:**
	- **`modules: Record<string, { rules: MigrationRule<T>[] }>`**: `import.meta.glob` の実行結果（モジュールマップ）。**Service Worker 環境での互換性を確保するため、必ず `{ eager: true }` オプションを指定して同期的にモジュールをインポートする必要があります。**
- **戻り値:**
	- **`MigrationRule<T>[]`**: 検証およびソートが完了した移行ルールの配列。この配列は `MigrationManager` のコンストラクタに直接渡すことができます。

## 基本的な使い方

`loadRules` は、ルールを集約するファイル（例: `v1.rules.ts`）内で `import.meta.glob` と組み合わせて使用します。

```typescript
// file: src/path/to/rules/v1.rules.ts

import { loadRules } from '@/assets/js/lib/user/MigrationManager/loadRules';
import type { Config } from '@/assets/js/types';

// v1系のルールファイルをすべて【同期的に】インポート
const modules = import.meta.glob('./v1/*.rule.ts', { eager: true });

// ルールをロードし、検証・ソートしてエクスポート (同期処理)
export const migrationRules = loadRules<Config>(modules);
```

## エラー処理 (Fail-Fast 設計)

`loadRules` は、開発段階でルール定義の問題を即座に発見できるよう、Fail-Fastの設計思想に基づいています。以下のような不正な状態が検出されると、コンソールに詳細なエラーを出力し、例外をスローして処理を中断します。

- `import.meta.glob` でインポートしたモジュールに `rules` 配列がエクスポートされていない。
- ルールオブジェクトの必須プロパティ (`condition`, `execute`) が欠けている、または型が不正。
- `meta` や `order` プロパティが存在するが、その構造や型が不正。
- 複数のルールで `order` プロパティの値が重複している。

これにより、実行時ではなく開発・ビルド時に問題を修正することが可能になり、システムの信頼性が向上します。

## 実行環境に関する注意事項

### Service Worker 環境における制約

Chrome 拡張機能の Service Worker は、`window` グローバルオブジェクトを持たない特殊な実行環境です。Vite/wxt が提供するモジュール解決の仕組みには、この環境と相性の悪い部分があります。

1.  **動的インポート (`import()`) の禁止:**
    Vite/wxt がバンドルする動的インポート (`import()` や `import.meta.glob` の `{ eager: false }` オプション) のランタイムコードは、内部で `window` オブジェクトを参照します。そのため、Service Worker 上でこれを実行すると `ReferenceError: window is not defined` というランタイムエラーが発生し、処理が停止します。

2.  **トップレベル `await` の禁止:**
    Service Worker のスクリプトは、トップレベルスコープでの `await` を許可していません。非同期でモジュールを読み込もうとすると、Service Worker の登録自体に失敗します。

### 結論: 同期インポートの徹底

上記制約のため、本ライブラリ、特に `loadRules` ユーティリティを使用する際は、**必ず `import.meta.glob` に `{ eager: true }` オプションを付与し、すべてのルールモジュールをビルド時にバンドルし、同期的に読み込む必要があります。**

このアーキテクチャ変更により、`loadRules` 関数自体も `async` ではない**同期関数**となっており、`Promise` ではなく直接ルール配列を返します。