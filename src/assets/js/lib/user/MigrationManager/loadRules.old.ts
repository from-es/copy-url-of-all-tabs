/**
 * @file        ルールローダーユーティリティ
 * @description 指定されたglobパターンに一致するルールファイルを動的にインポートし、ルールを処理・ソートする機能を提供。
 */

// Import NPM Package
import { get as lodashGetValue, set as lodashSetValue } from "lodash-es";

// Import Types
import type { MigrationRule, MigrationRuleMeta } from "./types";

// =================================================================================
// ローカル型定義
// =================================================================================

/**
 * `import.meta.glob` によってインポートされるモジュールが持つべきエクスポートの型。
 * 各ルールファイルは `rules` という名前で `MigrationRule<T>[]` をエクスポートする必要があります。
 */
type RuleModule<T> = {
	rules: MigrationRule<T>[];
};

/**
 * `import.meta.glob` の結果として得られるモジュールの型。
 * `eager: true` のため、ここでは同期モジュールとして扱われます。
 */
type ImportModules<T> = Record<string, RuleModule<T>>;

/**
 * ルールが有効なものと無効なものに分割された結果の型定義。
 * @template T - 移行対象となるデータの型
 */
type PartitionedRules<T> = {
    validRules  : MigrationRule<T>[];
    invalidRules: MigrationRule<T>[];
};

// =================================================================================
// ヘルパー関数
// =================================================================================

/**
 * モジュールマップからすべてのルールを抽出し、単一の配列にフラット化する。
 * @template T                         - 移行対象となるデータの型
 * @param   {ImportModules<T>} modules - `import.meta.glob` の結果 (eager: true)
 * @returns {MigrationRule<T>[]}       - 抽出されたルールの配列
 */
function extractRulesFromModules<T>(modules: ImportModules<T>): MigrationRule<T>[] {
	const allRules: MigrationRule<T>[] = [];

	for (const path in modules) {
		const module = modules[path];
		try {
			if (!module || !Array.isArray(module.rules)) {
				// モジュールがルールを正しくエクスポートしていない場合もエラーを投げる
				throw new Error(`[Migration Rule Loader] Error: Module at '${path}' does not have a valid 'rules' export.`);
			}
			allRules.push(...module.rules);
		} catch (error) {
			// ルールのロード中にエラーが発生した場合、即座にエラーを投げる
			throw new Error(`[Migration Rule Loader] Error: Failed to load rules from '${path}'. Original error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	return allRules;
}

/**
 * 移行ルール配列を検証し、有効なルールと無効なルールに振り分ける。
 * 各ルールの必須プロパティ（`condition`, `execute`）および推奨プロパティ（`meta`, `order`）の有効性を検査する。
 * 無効なルールが一つでも存在する場合、または`order`プロパティが重複している場合は、即座にエラーをスローする（Fail-Fast）。
 * これにより、後続処理に渡されるルールは常に有効性が保証される。
 *
 * @template T                     - 移行対象となるデータの型
 * @param    {any[]} rules         - 検証および振り分け対象のルール配列
 * @returns  {PartitionedRules<T>} - 有効なルール配列 (`validRules`) と、Fail-Fast のため通常は空となる無効なルール配列 (`invalidRules`) を含むオブジェクト
 */
function partitionRules<T>(rules: MigrationRule<T>[]): PartitionedRules<T> {
	const validRules      : MigrationRule<T>[] = [];
	const invalidRules    : MigrationRule<T>[] = [];
	const errorDetailsList: object[]           = []; // 各ルール検証中に検出されたエラーの詳細リスト

	rules.forEach((rule) => {
		const check: { [key: string]: any } = { rule: { target: rule } }; // 現在のルールのエラー情報を格納するオブジェクト
		let validationPassed = true; // 現在のルールの検証が成功したかを示すフラグ

		// rule: ルールオブジェクト自体の基本的な妥当性を検証
		if (!rule || typeof rule !== "object" || Object.keys(rule).length === 0) {
			check.rule.reason = "rule object is invalid.";
			errorDetailsList.push(check);

			// 不正なルールとして記録
			invalidRules.push(rule);

			// このルールはこれ以上検証せず、次のルール検証へ
			return;
		}

		// meta: 'meta' プロパティの検証 (推奨)
		// 'meta' は開発者向け情報であり、必須ではない。存在する場合のみ構造を検証し、不正であればエラーとする。
		// 存在しない場合は警告のみで処理を続行。
		if (Object.hasOwn(rule, "meta")) {
			const meta = rule.meta;
			const isValidMeta = meta && typeof meta === "object"
				&& (Object.hasOwn(meta, "author") && typeof meta.author === "string")
				&& (Object.hasOwn(meta, "reason") && typeof meta.reason === "string")
				&& (Object.hasOwn(meta, "target") && typeof meta.target === "string")
				&& (Object.hasOwn(meta, "action") && typeof meta.action === "string")
				&& (Object.hasOwn(meta, "authored") && typeof meta.authored === "string") && /^(2[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(meta.authored)
				&& (Object.hasOwn(meta, "version") && typeof meta.version === "object")
				&& (Object.hasOwn(meta.version, "introduced") && typeof meta.version.introduced === "string")
				&& (Object.hasOwn(meta.version, "obsoleted") && (typeof meta.version.obsoleted === "string" || meta.version.obsoleted === null));

			if (!isValidMeta) {
				validationPassed = false;
				check.meta = {
					target: meta,
					reason: "Property 'meta' has an invalid structure or is missing required fields (author, reason, authored, version.introduced, version.obsoleted, etc.)."
				};
			}
		} else {
			console.warn("Property 'meta' does not exist in rule:", rule); // 'meta' が存在しない場合の警告
		}

		// order: 'order' プロパティの検証 (任意)
		// 'order' はルールの適用順序を制御し、必須ではない。存在する場合のみ型を検証し、不正であればエラーとする。
		// 存在しない場合は警告のみで処理を続行。
		if (Object.hasOwn(rule, "order")) {
			if (typeof rule.order !== "number" || isNaN(rule.order)) {
				validationPassed = false;
				check.order = {
					target: rule.order,
					reason: "Property 'order' is invalid or not a number."
				};
			}
		} else {
			console.warn("Property 'order' does not exist in rule:", rule); // 'order' が存在しない場合の警告
		}

		// condition: 'condition' プロパティの検証 (必須)
		// 'condition' はルールの適用条件を定義するため、必須。
		if (typeof rule.condition !== "function") {
			validationPassed = false;
			check.condition = {
				target: rule.condition,
				reason: "Property 'condition' is missing or not a function."
			};
		}

		// validate: 'execute' プロパティの検証 (必須)
		// 'execute' はルールが適用された際の処理を定義するため、必須。
		if (typeof rule.execute !== "function") {
			validationPassed = false;
			check.execute = {
				target: rule.execute,
				reason: "Property 'execute' is missing or not a function."
			};
		}

		// 検証結果に基づいてルールを振り分け
		if (validationPassed) {
			validRules.push(rule);
		} else {
			errorDetailsList.push(check); // エラー情報をリストに追加
			invalidRules.push(rule);      // 無効なルールとして記録
		}
	});

	// エラーの有無を確認し、Fail-Fast 処理
	if (errorDetailsList.length > 0) {
		const details = JSON.stringify(errorDetailsList, null, "\t");
		throw new Error(`[Migration Rule Loader] Error: Invalid rules detected. Details:\n${details}`);
	}

	// Fail-Fast 戦略により、この時点では invalidRules は常に空配列となる
	return { validRules, invalidRules };
}

/**
 * 有効なルールセット内で 'order' プロパティの重複をチェックし、重複が見つかった場合、エラーを投げる（Fail-Fast）。
 * @template T                          - 移行対象となるデータの型
 * @param    {MigrationRule<T>[]} rules - 重複チェック対象のルール配列
 */
function checkForDuplicateOrders<T>(rules: MigrationRule<T>[]): void {
	const orders = new Map<number, { count: number, ruleIdentifiers: string[] }>();
	rules.forEach((rule, index) => {
		// order プロパティが存在しないルールはチェック対象外
		if (rule.order === undefined) {
			return;
		}

		const ruleIdentifier = rule.meta?.reason || `Unnamed rule at index ${index} (order: ${rule.order})`;
		let entry = orders.get(rule.order);

		if (!entry) {
			entry = { count: 0, ruleIdentifiers: [] };
			orders.set(rule.order, entry);
		}

		entry.count++;
		entry.ruleIdentifiers.push(ruleIdentifier);
	});

	orders.forEach((entry, order) => {
		if (entry.count > 1) {
			// Fail-Fast: order の重複はエラーを投げる
			throw new Error(
				`[Migration Rule Loader] Error: Duplicate order value '${order}' found in ${entry.count} rules. This can lead to unpredictable execution order. Involved rules: [${entry.ruleIdentifiers.join(", ")}]. Please ensure all rule 'order' properties are unique.`
			);
		}
	});
}

/**
 * 有効なルールをソートし、無効なルールと結合する。
 * (Fail-Fast の場合、invalidRules は常に空配列になる)
 * @template T                                - 移行対象となるデータの型
 * @param   {MigrationRule<T>[]} validRules   - ソート対象の有効なルール配列
 * @param   {MigrationRule<T>[]} invalidRules - 結合対象の無効なルール配列
 * @returns {MigrationRule<T>[]}              - 最終的なルールの配列
 */
function sortAndCombineRules<T>(validRules: MigrationRule<T>[], invalidRules: MigrationRule<T>[]): MigrationRule<T>[] {
	// 'order' プロパティに基づいて有効なルールを昇順にソート
	// 'order' プロパティを持たないルールは、持つルールの後に配置する
	validRules.sort((a, b) => {
		if (a.order !== undefined && b.order !== undefined) {
			return a.order - b.order;
		}
		if (a.order !== undefined) {
			return -1; // a を先に
		}
		if (b.order !== undefined) {
			return 1; // b を先に
		}
		return 0; // 順序変更なし
	});

	// Fail-Fast のため invalidRules は常に空になるが、関数シグネチャのため結合を維持
	return [ ...validRules, ...invalidRules ];
}

// =================================================================================
// ルールローダー: loadRules
// =================================================================================

/**
 * 指定されたモジュールマップから移行ルールを動的に読み込み、ソートして返す。
 * 不正なルールや重複する order 値が見つかった場合、エラーを投げる（Fail-Fast）。
 *
 * 注意: この関数は `import.meta.glob` と組み合わせて使用することを想定。
 * `eager: true` オプションと組み合わせて使用し、Service Workerなどの環境での
 * 非同期読み込みの問題を回避することを目的としています。
 *
 * @example
 * // rules/index.ts
 * import { loadRules } from '@/assets/js/lib/user/MigrationManager/loadRules';
 *
 * const modules = import.meta.glob('./v1/*.rule.ts', { eager: true });
 * const migrationRules = loadRules(modules);
 *
 * @template T                            - 移行対象となるデータの型
 * @param    {ImportModules<T>}   modules - `import.meta.glob` の結果 (`eager: true` のため同期モジュールマップ)
 * @returns  {MigrationRule<T>[]}         - `order` プロパティで昇順にソートされた移行ルールの配列
 */
export function loadRules<T>(modules: ImportModules<T>): MigrationRule<T>[] {
	const allRulesRaw = extractRulesFromModules(modules);
	const { validRules, invalidRules } = partitionRules<T>(allRulesRaw);

	checkForDuplicateOrders(validRules);

	const allRules = sortAndCombineRules(validRules, invalidRules);

	console.debug(`[Migration Rule Loader] Successfully loaded and sorted ${allRules.length} valid rules.`);

	return allRules;
}