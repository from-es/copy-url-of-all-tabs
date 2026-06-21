# `loadRules` ユーティリティ動作仕様

**最終更新日:** 2026年6月20日

## 概要

`loadRules` ユーティリティは、複数のソース（直接の配列指定、または `import.meta.glob` によるモジュールマップ）からルールを読み込み、検証およびソートを行って `SequenceProcessor` が使用可能な形式に整える機能を提供します。

開発者が不正なルールを定義した場合、実行時ではなくロード時に問題を検知する Fail-Fast 設計を採用しています。

## 主な機能

### 1. ルールの抽出 (`extractRulesFromModules`)

- 配列形式のルールをそのまま受け取るか、あるいは `import.meta.glob` で取得したモジュール群から `rules` エクスポートを抽出してフラットな配列にします。

### 2. ルールの検証 (`partitionRules`)

すべてのルールオブジェクトに対し、構造と型が正しいかを厳密にチェックします。
- **必須チェック:** `meta.name`, `meta.description.reason`, `process.condition`, `process.execute` が存在し、正しい型であること。
- **形式チェック:** `spec` や `order` が存在する場合、その構造が定義に従っていること。
  - `spec.lifecycle` が定義されている場合、その内部の `introduced` や `obsoleted` が文字列であることを検証します。
- 不正なルールが見つかった場合、すべてのエラー内容を詳細に含んだ `Error` をスローします。

### 3. 重複チェック (`checkForDuplicateOrders`)

- ルールセット内で `order` プロパティの値が重複している場合、意図しない実行順序を防ぐためにエラーをスローします。

### 4. ソート (`sortAndCombineRules`)

- ルールを `order` プロパティに基づいて昇順（小さい順）にソートします。
- `order` が指定されていないルールは、リストの最後に配置されます。
- `order` が同じ（未指定同士など）場合は、元の入力順序を維持（安定ソート）します。

## API リファレンス

### `loadRules<T, C>(modules)`

- **ジェネリクス:**
	- **`<T>`**: 処理対象データの型。
	- **`<C>`**: コンテキストの型。
- **引数:**
	- **`modules`**: `SequenceRule<T, C>[]` または `ImportModules<T, C>`。
- **戻り値:**
	- **`SequenceRule<T, C>[]`**: 検証・ソート済みのルール配列。

## 基本的な使い方

通常、ルールを集約するファイル内で `import.meta.glob` と組み合わせて使用します。

```typescript
// rules/index.ts
import { loadRules } from "../../lib/SequenceProcessor/loadRules";
import type { Config, Context } from "../../types";

// 同期的にインポート
const modules = import.meta.glob('./*.rule.ts', { eager: true });

export const sequenceRules = loadRules<Config, Context>(modules);
```

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
