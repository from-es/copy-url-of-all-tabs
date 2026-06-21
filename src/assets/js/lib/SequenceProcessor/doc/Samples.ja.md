# SequenceProcessor 実装サンプル集

**最終更新日:** 2026年6月20日

本ドキュメントでは、`SequenceProcessor` を使用した様々なユースケースの実装サンプルを紹介します。

## 1. 基本的なデータ変換

最もシンプルな、データのプロパティを変換する例です。

```typescript
import { SequenceProcessor } from "../lib/SequenceProcessor";
import { cloneObject } from "../lib/CloneObject";
import type { SequenceRule } from "../lib/SequenceProcessor/types";

type UserData   = { name: string; age: number; };
type AppContext = { timestamp: number; };

const rules: SequenceRule<UserData, AppContext>[] = [
	{
		meta: {
			name       : "UpperCaseName",
			description: { reason: "表示統一のため", target: "name", action: "名前を大文字にする" }
		},
		process: {
			condition: ({ data }) => data.name !== data.name.toUpperCase(),
			execute  : ({ data }) => {
				const next = cloneObject(data);
				next.name = next.name.toUpperCase();
				return next;
			}
		}
	}
];

const processor = new SequenceProcessor<UserData, AppContext>(rules);
const result = await processor.process({ name: "alice", age: 20 }, { timestamp: Date.now() });
console.log(result.data.name); // "ALICE"
```

## 2. プラットフォーム・バージョン依存の処理

実行環境（Chrome/Firefox）やアプリケーションのバージョンに応じて処理を切り替える例です。

### 注意事項

`SequenceProcessor` ライブラリ自身は、ブラウザ環境（`chrome` オブジェクトの有無など）やバージョンを自動検出する機能を内蔵していません（プラットフォームに依存しない汎用設計のため）。環境の自動判定や判別用オブジェクトの生成は**呼び出し側（アプリケーション側）が責任を持ち、`process()` の第2引数である `context` を通じて注入する**必要があります。

### ルール定義の例

```typescript
const rules: SequenceRule<Config, Context>[] = [
	{
		meta: {
			name       : "FirefoxSpecificFix",
			description: { reason: "Firefoxでのみ発生する挙動の修正", action: "特定フラグを有効化" }
		},
		spec: {
			platforms: ["firefox"],  // context.platform が "firefox" の場合のみ実行
			lifecycle: {
				introduced: "1.5.0",  // context.version が 1.5.0 以降で適用
				obsoleted : "2.0.0"   // context.version が 2.0.0 に達すると廃止
			}
		},
		process: {
			condition: () => true,
			execute  : ({ data }) => ({ ...data, firefoxFixApplied: true })
		}
	}
];
```

### 呼び出し側（コンテキストの注入）の例

```typescript
// 1. 呼び出し側で現在の環境やブラウザを自前で判定
const currentPlatform = typeof browser !== "undefined" ? "firefox" : "chrome";
const currentVersion  = "1.24.0";  // 拡張機能やアプリの動的バージョン

// 2. 判定した結果をコンテキストオブジェクトに含めてライブラリに渡す
const context = {
	platform: currentPlatform,
	version : currentVersion,
	// 必要に応じて追加の外部依存やステート
};

const result = await processor.process(currentData, context);
```

## 3. エラーハンドリングとロールバック

特定のルールが失敗した際に、全体をロールバックするか、あるいは継続するかを制御する例です。

```typescript
const rules: SequenceRule<Data, Context>[] = [
	{
		meta   : { name: "CriticalUpdate", description: { reason: "必須更新" } },
		spec   : { critical: true },  // 失敗すると全体が入力時の状態にロールバックされる
		process: {
			condition: () => true,
			execute  : () => { throw new Error("致命的エラー"); }
		}
	},
	{
		meta   : { name: "OptionalUpdate", description: { reason: "任意更新" } },
		spec   : { critical: false },  // 失敗してもこのルールの変更が破棄されるだけで、処理は継続する
		process: {
			condition: () => true,
			execute  : () => { throw new Error("軽微なエラー"); }
		}
	}
];
```

## 4. `import.meta.glob` によるルールの一括読み込み

ディレクトリ内の複数のルールファイルを自動的に読み込んで実行する推奨パターンです。

```typescript
// rules/index.ts
import { loadRules } from "../../lib/SequenceProcessor/loadRules";
import type { Config, Context } from "./types";

// ディレクトリ内の *.rule.ts をすべて同期的にインポート
const modules = import.meta.glob('./**/*.rule.ts', { eager: true });
export const allRules = loadRules<Config, Context>(modules);

// main.ts
import { SequenceProcessor } from "../lib/SequenceProcessor";
import { allRules } from "./rules";

const processor = new SequenceProcessor(allRules);
const result    = await processor.process(currentData, appContext);
```

## 5. 多段階バリデーションとしての利用

変換ではなく、データの整合性チェックのパイプラインとして利用する例です。

```typescript
type FormState = { email: string; acceptedTerms: boolean; };
const rules: SequenceRule<FormState, void>[] = [
	{
		meta: { name: "CheckEmail", description: { reason: "形式チェック" } },
		process: {
			condition: ({ data }) => !data.email.includes("@"),
			execute  : () => { throw new Error("Invalid Email"); }
		}
	},
	{
		meta: { name: "CheckTerms", description: { reason: "規約同意チェック" } },
		process: {
			condition: ({ data }) => !data.acceptedTerms,
			execute  : () => { throw new Error("Terms not accepted"); }
		}
	}
];

// options.failFast = false にすることで、すべてのバリデーションエラーを一度に取得可能
const result = await processor.process(formData, undefined, { failFast: false });
if (result.status === "failed") {
	console.log("Validation errors:", result.errors.map(e => e.error.message));
}
```

## 6. 動作確認・検証用サンプルルールセット

ライブラリの基本動作（プロパティの追加、削除、書き換え、移動、および条件によるスキップ）を検証するためのサンプルルールセットです。同期、非同期、およびそれらの混在パターンの3種類を提供しています。

**注意:** これら3つのパターン（同期、非同期、混在）は、内部の非同期解決制御（シリアライズ実行）により、**動作仕様および最終的なオブジェクトの処理結果がすべて完全に同じになること**が保証されています。各環境や要件に合わせて最適な実装パターンを選択してください。

これらは `doc/code/` 配下に定義されており、実際の開発における動作確認のベースとして利用できます。

### ルールセットのインポートと実行例

```typescript
import { SequenceProcessor } from "../lib/SequenceProcessor";
// 検証したいパターンをインポート
import { syncRules }  from "../lib/SequenceProcessor/doc/code/syncRules";
// import { asyncRules } from "../lib/SequenceProcessor/doc/code/asyncRules";
// import { mixedRules } from "../lib/SequenceProcessor/doc/code/mixedRules";

const processor = new SequenceProcessor(syncRules);

// 検証用データ
const testData = {
	status     : "initial",
	toBeDeleted: "existing_value",
	oldLocation: "data_to_move"
};

// 実行（context にはバージョン情報やプラットフォームを含めることが可能）
const result = await processor.process(testData, { version: "1.24.0", platform: "chrome" });

console.log(result.data);
/*
期待される出力例（syncRules, asyncRules, mixedRules いずれを実行しても処理結果は完全に同じになる）:
{
	status     : "updated",      // Rewrite成功（非同期の場合は statusAsync / statusMixed）
	addedProp  : "sync_value",   // Add成功（非同期の場合は addedPropAsync / addedPropMixed）
	newLocation: "data_to_move"  // Move成功（非同期の場合は newLocationAsync / newLocationMixed）
	// toBeDeleted... は削除済み
	// skippedProp... は存在しない（Skip成功）
}
*/
```

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
