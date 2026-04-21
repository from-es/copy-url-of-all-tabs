# Vitest ガイド：基礎からプロジェクト標準まで

**最終更新日:** 2026年4月21日

このドキュメントは、このプロジェクトにおける [Vitest](https://vitest.dev/) を使用した単体テストおよび結合テストの包括的なガイドです。「初学者向けの基礎」「プロジェクト独自の標準ルール」「高度な使用方法」の3部構成となっています。

---

## 第1部：テストの基礎 (For Beginners)

### 1.1 テストフレームワークを使用する理由
`console.log` によるデバッグは一時的な確認には便利ですが、Vitestは以下の利点を提供します。
- **関心の分離**: テストコードが製品ロジックを汚すことがありません。
- **自動化**: 1つのコマンドで数百のチェックを数秒で実行できます。
- **ドキュメント化**: テストはコードが「どう動作すべきか」を記述した、生きた仕様書になります。
- **信頼性**: 自動化されたアサーションにより、人の解釈を通さずに「合格」を確認できます。

### 1.2 AAA パターン
読みやすいテストを書くために、私たちは **Arrange（準備）→ Act（実行）→ Assert（検証）** パターンに従います。
1.  **Arrange**: 環境、変数、モックをセットアップします。
2.  **Act**: テスト対象の関数や振る舞いを実行します。
3.  **Assert**: 結果が期待どおりか検証します。

### 1.3 基本構造 (`describe`, `it`, `expect`)
```typescript
import { describe, it, expect } from 'vitest';

describe('算術モジュール', () => {
  it('正しく加算できること（it ブロックがテストケースです）', () => {
    // 1. Arrange (準備)
    const a = 1;
    const b = 2;

    // 2. Act (実行)
    const result = a + b;

    // 3. Assert (検証)
    expect(result).toBe(3);
  });
});
```

---

## 第2部：プロジェクト標準構成 (Recommended Construction)

テストスイートの品質を維持するため、このプロジェクトの全てのテストは以下の基準に従う必要があります。

### 2.1 `TestRunner` によるデータ駆動テスト
私たちは、テストデータと実行ロジックを分離する「データ駆動テスト」を推奨しています。共通の実行サイクルを処理するために、静的クラス `TestRunner` を使用します。
- **利点**: ボイラープレートを削減し、テストを宣言的な記述にできます。「どうループさせるか」ではなく「何をテストするか」に集中できます。

### 2.2 ディレクトリ構造 (`shared/`)
テストの支援ファイルは `tests/shared/` ディレクトリに集約されています。
- **`support/TestRunner.ts`**: コアとなる実行エンジン。
- **`support/setup.ts`**: 全テストで自動実行される共通モック（例: `wxt/browser`）。
- **`fixtures/`**: 静的なJSONデータや、複雑なオブジェクトを生成するファクトリ関数。

### 2.3 インポートの正規化
可読性を高めるため、Vitest からのインポートは以下の4つのカテゴリに正規化して並べてください。
1.  **Category 1: 構造 (Structure)**: `describe`, `it`, `test`, `suite`
2.  **Category 2: ライフサイクル (Lifecycle)**: `beforeAll`, `beforeEach`, `afterEach`, `afterAll`
3.  **Category 3: 検証 (Assertion)**: `expect`, `assert`
4.  **Category 4: 補助・モック (Utility)**: `vi`

**規則**: カテゴリ番号順に並べ、各カテゴリ内はアルファベット順に並べます。
*例:* `import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";`

### 2.4 ドキュメント基準 (JSDoc)
すべてのテストファイルには `@file` ヘッダーを含めてください。また、新しい開発者がセットアップを理解しやすくするため、`@see` を使ってテスト基盤へのリンクを記述します。

### 2.5 標準テストテンプレート
新しいテストを作成する際は、このテンプレートをコピーして使用してください。

```typescript
/**
 * {{モジュール名}} のテスト
 *
 * {{テストの目的や背景を簡潔に記述。}}
 *
 * @file
 * @see {@link project/vitest.config.ts} - グローバル設定
 * @see {@link project/tests/shared/support/setup.ts} - 共通モック
 * @see {@link project/tests/shared/support/TestRunner.ts} - テスト実行エンジン
 */

import { describe, beforeEach, afterEach, expect, vi } from "vitest";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. テストデータの定義 (データとロジックの分離)
// =============================================================================

const testData = {
	successCases: [
		{ name: "ケースAの動作", input: { val: 1 }, expected: 2 },
		{ name: "ケースBの動作", input: { val: 2 }, expected: 4 }
	],
	errorCases: [
		{ name: "不正な入力でエラーを投げること", input: null, expected: "Invalid input" }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. オーケストレーション (構造定義)
// =============================================================================

describe("{{モジュール名}}", () => {
	let context: any;

	beforeEach(() => {
		// Arrange: 標準的な準備
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Cleanup: 後処理
	});

	describe("Success cases", () => {
		TestRunner.success(testData.successCases, context, (input) => {
			// return targetFunction(input);
		});
	});

	describe("Error handling", () => {
		TestRunner.error(testData.errorCases, context, (input) => {
			// targetFunction(input);
		});
	});
});
```

### 2.6 例外的なケースへの対応
厳密な非同期のシーケンス検証など、`TestRunner` のパターンが当てはまらない場合は、標準の `it` ブロックを使用できます。
- **必須要件**: 標準パターンを使用しなかった理由を、ファイル冒頭の JSDoc に明記しなければなりません。

---

## 第3部：高度な使用方法と設定

### 3.1 Svelte コンポーネントのテスト
`jsdom` と `@testing-library/svelte` を使用します。
- **Cleanup**: テスト間の状態の残留を防ぐため、常に `afterEach` で `cleanup()` を呼び出してください。

### 3.2 カバレッジ目標
測定可能なカバレッジを通じて高い信頼性を目指します。
- **短期目標**: `lib/` ディレクトリのラインカバレッジ 80% 以上。
- **プロジェクト目標**: `lib/` および `utils/` を含む全体で 75% 以上。

### 3.3 テストの実行（CLIコマンド）
- `npm run vitest:run`: プロジェクト本体の全テストを1回実行。
- `npm run vitest`: 開発中の監視（watch）モード起動。
- `npm run vitest:ui`: 結果分析用のブラウザUIを起動。
- `npm run vitest:coverage`: カバレッジレポートを生成。
- `npm run vitest:smoke`: テスト環境の検証（`tests/_vitest-check/` を使用）。

---

## 公式ドキュメント
- [Vitest 公式サイト](https://vitest.dev/)
- [Vitest ドキュメント](https://vitest.dev/guide/)