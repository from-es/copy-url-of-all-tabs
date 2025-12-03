# MigrationManager 動作仕様

**最終更新日:** 2025年12月3日

`MigrationManager` ライブラリは、`MigrationManager` クラスを中核として、データオブジェクトの移行処理を管理・実行します。

## 設計思想

### アーキテクチャ

`MigrationManager` モジュールは、以下の主要なコンポーネントから構成されます。

1. **`MigrationManager<T>` クラス:**
	- 移行ロジックの中核を担うクラスです。コンストラクタでソート済みの移行ルールセットを受け取り、`migrate` メソッドを通じて実際のデータ移行を実行します。
	- ジェネリクス `<T>` により、様々な型のデータを扱えます。

2. **移行ルールファイル (`*.rule.ts`):**
	- 個々の移行ロジックをカプセル化したファイルです。各ファイルは `MigrationRule<T>` 型の配列をエクスポートします。
	- ルールは、用途に応じて複数の方法でインポートできます。
		- **直接インポート (単一ファイル):**
			特定のルールファイルのみを `import` で直接読み込む方法です。
			```typescript
			import { rules as yourRules } from './path/to/your-rule.rule.ts';

			// const manager = new MigrationManager(yourRules);
			```
			この方法は、ルールが少ない場合や、特定のルールのみを厳密に適用したい場合に有効ですが、複数のルールを効率的に管理するには柔軟性に欠けるため、通常は次の方法が推奨されます。

		- **`import.meta.glob` による一括インポート (推奨):**
			`import.meta.glob` を使用して複数のルールファイルを一括でインポートし、後述の `loadRules` ユーティリティに渡すことで、効率的にルールセットを構築できます。
			```typescript
			const modules = import.meta.glob('./rules/**/*.rule.ts', { eager: true });
			// const migrationRules = loadRules(modules); // loadRulesは同期関数です
			```
	- ルールの詳細な定義方法は、[`MigrationRule.ja.md`](./MigrationRule.ja.md) を参照してください。

3. **`loadRules<T>` ユーティリティ:**
	- `import.meta.glob` で**同期的に**読み込まれたモジュールマップを受け取り、その内容を検証し、`order` プロパティに基づいてソートされた `MigrationRule<T>` の配列として返します。
	- 不正なルールや `order` の重複を検知し、即座にエラーをスロー（Fail-Fast）することで、開発時の問題を早期に発見します。

### 実行プロセス (`migrate` メソッドの動作)

`MigrationManager` の `migrate` メソッドが呼び出されると、以下のステップで処理が実行されます。

1.  **状態初期化:** 入力された `data` と `defaultValues` のディープコピーを作成し、移行の実行状態を初期化します。元のオブジェクトは保護されます。
2. **ルールの反復処理:** コンストラクタで与えられた移行ルール配列を順番に反復処理します。
3. **ルール適用:** 各ルールに対し、`#applyRule` メソッドが呼び出されます。
	- `condition` 関数を実行し、移行が必要か判断します。
	- `condition` が `true` を返した場合、`execute` 関数を実行してデータを変更します。
	- `execute` の実行中にエラーが発生した場合、そのルールによる変更はロールバックされ、エラーがレポートされます。
	- ルールが適用された場合、その `meta` 情報が `appliedRules` リストに追加されます。
4.  **結果の構築:** すべてのルールの評価が終わった後、`#buildResult` メソッドが呼び出され、以下の情報を含む `MigrationResult<T>` オブジェクトを構築・返却します。
	- `isSucceeded`: 全ての移行処理がエラーなく完了したかどうか。
	- `isExecuted`: いずれかのルールが実行されたかどうか。
	- `hasError`: 移行処理中にエラーが発生したか。
	- `appliedRules`: 適用されたルールのメタデータ配列。
	- `errorReports`: 発生したエラーの詳細情報配列。
	- `data`: 移行後のデータオブジェクト、または処理失敗時の初期データ。

## 基本的な使い方

`MigrationManager` モジュールは、アプリケーションの起動時や設定読み込み時に使用することを想定しています。

```typescript
// --- 必要なモジュールをインポート ---
import { MigrationManager } from '@/assets/js/lib/user/MigrationManager';
import { loadRules } from '@/assets/js/lib/user/MigrationManager/loadRules'; // loadRules ユーティリティを使用する場合
import type { MigrationRule } from '@/assets/js/lib/user/MigrationManager/types';
import type { Config } from '@/assets/js/types';

/**
 * 設定データを受け取り、必要に応じて移行処理を適用する
 * @param data - chrome.storage から読み込んだ、またはデフォルトのユーザー設定
 * @param defaultValues - アプリケーション定義の最新のデフォルト設定
 * @returns 移行後の設定データ
 */
async function applyMigration(data: Config, defaultValues: Partial<Config>): Promise<Config> {
	const dataVersion = detectDataVersion(data); // データからメジャーバージョンを判定
	const LATEST_VERSION = 2; // アプリケーションがサポートする最新のメジャーバージョン (ここでは仮の値)
	let combinedRules: MigrationRule<Config>[] = [];

	if (dataVersion >= LATEST_VERSION || dataVersion < 1) {
		console.log(`設定の移行は不要でした (バージョン: ${dataVersion} >= 最新バージョン: ${LATEST_VERSION})。`);
		return data; // 移行不要、または不正バージョンのため処理しない
	}

	// --- 移行ルールの読み込み例 ---
	// 以下に、2通りのルール読み込み方法の例を示します。
	// アプリケーションの要件に応じて適切な方法を選択してください。

	// 例1: 直接インポート (特定のルールファイルを個別にインポートする場合)
	// この方法は、少数のルールを厳密に管理したい場合に適しています。
	// import { migrationRules as rulesV1 } from '@/assets/js/lib/user/MigrationManager/rules/v1/someRule.rule.ts';
	// combinedRules = rulesV1; // または combinedRules.concat(rulesV1);

	// 例2: `import.meta.glob` と `loadRules` ユーティリティを使用したインポート (推奨)
	// 複数のルールファイルをパターンマッチングで一括して読み込み、結合する場合に推奨されます。
	try {
		// 例えば、データバージョンに応じて動的にルールを読み込む場合
		if (dataVersion === 1) {
			const ruleModulesV1 = import.meta.glob('@/assets/js/lib/user/MigrationManager/rules/v1/*.rule.ts', { eager: true });
			combinedRules = loadRules<Config>(ruleModulesV1);
		}
		// もし新しいバージョン(v2)が存在するなら、同様に追加
		// else if (dataVersion === 2) {
		//     const ruleModulesV2 = import.meta.glob('@/assets/js/lib/user/MigrationManager/rules/v2/*.rule.ts', { eager: true });
		//     combinedRules = loadRules<Config>(ruleModulesV2);
		// }
		// もしくは、全てのルールをまとめて読み込む場合 (上記「設計思想」のコード例に合わせる)
		// const allRuleModules = import.meta.glob('@/assets/js/lib/user/MigrationManager/rules/**/*.rule.ts', { eager: true });
		// combinedRules = loadRules<Config>(allRuleModules);

	} catch (e) {
		console.error("ルールファイルの読み込みに失敗しました:", e);
		// 適切なエラーハンドリングを行う
		return data; // 移行を中止し、元のデータを返す
	}
	// -----------------------------

	const manager = new MigrationManager<Config>(combinedRules);
	const result = await manager.migrate(data, defaultValues);

	// 実行結果をログに出力
	if (result.isExecuted) {
		if (result.hasError) {
			console.error("設定の移行中にエラーが発生しました。", result.errorReports);
		} else {
			console.log("設定が移行されました。適用されたルール:", result.appliedRules);
			// 移行が成功した場合、ここで移行後の設定を永続化する処理を呼び出す
			// 例: saveConfig(result.data);
		}
	} else {
		console.log("設定の移行は不要でした。"); // 実際には上記の `if (dataVersion >= LATEST_VERSION)` で処理される
	}

	return result.data;
}

/**
 * データからバージョンを判定する仮の関数
 * (実際のデータ構造に合わせて実装が必要)
 * @param data - 設定データ
 * @returns データバージョン (数値)
 */
function detectDataVersion(data: Config): number {
	// 例: data.version が存在すればその値を返す。なければ古いデータとみなし1を返す。
	return data && typeof data.version === 'number' ? data.version : 1;
}
```

## 実行環境に関する注意事項 (特に Service Worker)

> [!WARNING]
> **ルールモジュールの読み込みは同期処理を徹底してください**
>
> Chrome 拡張機能の Service Worker 環境では、Vite/wxt が提供する**動的インポート (`import()` や `import.meta.glob` の `{ eager: false }` オプション) を使用できません。** これらは `window` オブジェクトを参照するため、ランタイムエラーを引き起こします。
>
> したがって、ルールを読み込む際は必ず `import.meta.glob` に `{ eager: true }` オプションを指定し、同期的に処理する必要があります。これにより、`loadRules` ユーティリティも `Promise` を返さない**同期関数**として動作します。
>
> 詳細は [`loadRules.ja.md`](./loadRules.ja.md) のドキュメントを参照してください。