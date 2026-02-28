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
				throw new Error(`Error: module at "${path}" does not have a valid "rules" export in extractRulesFromModules`);
			}
			allRules.push(...module.rules);
		} catch (error) {
			// ルールのロード中にエラーが発生した場合、即座にエラーを投げる
			throw new Error(`Failure: failed to load rules from "${path}" in extractRulesFromModules`, { cause: error });
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
 * @template T                          - 移行対象となるデータの型
 * @param    {MigrationRule<T>[]} rules - 検証および振り分け対象のルール配列
 * @returns  {PartitionedRules<T>}      - 有効なルール配列 (`validRules`) と、Fail-Fast のため通常は空となる無効なルール配列 (`invalidRules`) を含むオブジェクト
 */
function partitionRules<T>(rules: MigrationRule<T>[]): PartitionedRules<T> {
	const validRules      : MigrationRule<T>[] = [];
	const invalidRules    : MigrationRule<T>[] = [];
	const errorDetailsList: object[]           = []; // 各ルール検証中に検出されたエラーの詳細リスト

	rules.forEach((rule) => {
		// `validateRule` を用いてルールを検証し、結果（レポート）を取得
		const { report } = validateRule(rule);

		// `warningReport` があればコンソールに出力 (既存の振る舞いを踏襲)
		if (report.warningReport.length > 0) {
			report.warningReport.forEach(warning => {
				// `meta` と `order` の欠損に関する警告を `console.warn` に出力
				if (warning.reason.includes("this property is optional")) {
					console.warn("WARN(migration): optional property missing in migration rule", { reason: warning.reason, rule });
				}
			});
		}

		// `errorReport` にエラーが含まれているかチェック
		if (report.errorReport.length > 0) {
			// エラーがある場合、無効なルールとして処理
			invalidRules.push(rule);
			// エラー詳細を `errorDetailsList` に追加
			errorDetailsList.push({
				rule, // エラーのあったルールオブジェクト全体を格納
				errors: report.errorReport // `validateRule` からの詳細なエラーレポート
			});
		} else {
			// エラーがない場合、有効なルールとして追加
			validRules.push(rule);
		}
	});

	console.debug("DEBUG(migration): validate migration rules", { validRules, invalidRules });

	// エラーの有無を確認し、Fail-Fast 処理
	if (errorDetailsList.length > 0) {
		const details = JSON.stringify(errorDetailsList, null, "\t");
		throw new Error(`Invalid: invalid rules detected in partitionRules. Details:\n${details}`);
	}

	// Fail-Fast 戦略により、この時点では invalidRules は常に空配列となる
	return { validRules, invalidRules };
}

/**
 * 単一の移行ルールオブジェクトの構造と型を検証。
 * この関数は `partitionRules` から内部的に呼び出されることを想定しています。
 *
 * @template T                      - 移行対象となるデータの型
 * @param   {MigrationRule<T>} rule - 検証対象の単一移行ルール
 * @returns {{ rule: MigrationRule<T>, report: { warningReport: Report[], errorReport: Report[] } }} - 検証結果のレポートを含むオブジェクト
 */
function validateRule<T>(rule: MigrationRule<T>) {
	/**
	 * 検証ロジックが返す多値論理の状態を定義します。
	 * 各値は検証結果の特定の状態を示し、後続処理のフロー制御に利用されます。
	 *
	 * true                        : 対象のプロパティが存在し、かつ正規の型である
	 * false                       : 対象のプロパティが存在するが、不正な型である
	 * undefined                   : 対象のプロパティが存在しない
	 * "Optional Property"         : 対象のプロパティは存在しなくとも良い（存在しない場合は警告とする）
	 * "Pass Through"              : `true` 判定と同じ扱い。特定の条件で検証をスキップし、結果を通過させる場合に使用
	 * "Skip to Next Validate Rule": 現在のルールオブジェクトに対するそれ以降の検証処理を中断し、次のルールオブジェクトの検証へ移行する
	 */
	type ValidationStatus = boolean | "Optional Property" | undefined | "Pass Through" | "Skip to Next Validate Rule";
	type ValidationList = {
		/**
		 * 検証対象プロパティへのパス文字列。`lodash.get` メソッドに渡す形式です。
		 */
		target: string;

		/**
		 * 検証ロジックを実装した関数。
		 * 渡されたオブジェクトが期待される状態にあるかを評価し、`ValidationStatus` 型の値を返します。
		 * 返される値によって、検証の成否や処理の継続が判断されます。
		 */
		validate: (obj: any) => ValidationStatus;

		/**
		 * 検証結果のフラグ、プロパティパス、およびプロパティ情報に基づいて、人間が読めるメッセージを生成する関数です。
		 * 主にエラーや警告の詳細を伝えるために使用されます。
		 */
		message: (flag: ValidationStatus, target: string, property: any) => string;

		/**
		 * (オプション) 特定の検証結果に基づいてカスタム例外処理や特殊なアクションを行うための情報。
		 * 現在は未使用ですが、将来的な拡張のために残されています。
		 */
		except?: any;
	};
	type ValidationReport = {
		target  : string;
		property: unknown;
		reason  : string;
	};

	/**
	 * 検証ステータスフラグに基づいて、人間が読めるメッセージ文字列を生成。
	 *
	 * @param   {ValidationStatus} flag
	 * @param   {string}          target
	 * @param   {any}             property
	 * @returns {string}
	 * @throws  実装レベルで発生する事はあっても、ルール検証ではスルーは投げない
	 */
	const createMessage = (flag: ValidationStatus, target: string, property: any): string => {
		switch (flag) {
			case VALIDATION_STATUS.OptionalProperty:
				return `Property '${target}' does not exist in rule. But, this property is optional.`;
			case VALIDATION_STATUS.NonExistentProperty:
				return `Property '${target}' does not exist in rule.`;
			case VALIDATION_STATUS.ValidProperty:
				return `Property '${target}' is valid.`;
			case VALIDATION_STATUS.InValidProperty:
				return `Property '${target}' exist in rule. But, the property type is invalid. typeof: ${typeof property}, property: ${property.toString()}.`;
			case VALIDATION_STATUS.SkipToNextValidateRule:
				return `rule object is invalid. typeof: ${typeof property}.`;
			default: {
				throw new Error(`Error: unknown ValidationStatus "${flag}" for property "${target}" in validateRule.createMessage`);
			}
		}
	};

	const VALIDATION_STATUS = {
		ValidProperty         : true,
		InValidProperty       : false,
		OptionalProperty      : "Optional Property",
		NonExistentProperty   : undefined,
		PassThrough           : "Pass Through",
		SkipToNextValidateRule: "Skip to Next Validate Rule"
	};
	const validationContext                  = {}; // 検証コンテキストの記録用
	const warningReport : ValidationReport[] = [];
	const errorReport   : ValidationReport[] = [];
	const validationList: ValidationList[]   = [
		// meta: 'meta' プロパティの検証 (推奨)
		// 'meta' は開発者向け情報であり、必須ではない。
		// 存在する場合のみ構造を検証し、不正であればエラーとし、存在しない場合は警告のみで処理を続行。
		{
			target  : "meta",
			validate: (obj) => {
				if (obj === undefined) {
					lodashSetValue(validationContext, "meta.exist", false);
					return VALIDATION_STATUS.OptionalProperty;
				}

				lodashSetValue(validationContext, "meta.exist", true);
				return obj && obj !== null && typeof obj === "object" && Object.keys(obj).length > 0;
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target : "meta.author",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				} else {
					return obj && obj !== null && typeof obj === "string";
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target : "meta.reason",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				} else {
					return obj && obj !== null && typeof obj === "string";
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target : "meta.target",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				} else {
					return obj && obj !== null && typeof obj === "string";
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target : "meta.action",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				} else {
					return obj && obj !== null && typeof obj === "string";
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target : "meta.authored",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				} else {
					return obj && obj !== null && typeof obj === "string" && /^(2[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(obj);
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target : "meta.version",
			validate: (obj) => {
				if (obj === undefined) {
					lodashSetValue(validationContext, "meta.version.exist", false);
					return VALIDATION_STATUS.NonExistentProperty;
				}

				lodashSetValue(validationContext, "meta.version.exist", true);
				return obj && obj !== null && typeof obj === "object"	&& Object.hasOwn(obj, "introduced") && Object.hasOwn(obj, "obsoleted");
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.version.introduced",
			validate: (obj) => {
				if (!validationContext.meta.version.exist) {
					return VALIDATION_STATUS.PassThrough;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				} else {
					return obj && obj !== null && typeof obj === "string";
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.version.obsoleted",
			validate: (obj) => {
				if (!validationContext.meta.version.exist) {
					return VALIDATION_STATUS.PassThrough;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				} else {
					return (obj === null || typeof obj === "string") ? true : false;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},

		// order: 'order' プロパティの検証 (任意)
		// 'order' はルールの適用順序を制御し、必須ではない。存在する場合のみ型を検証し、不正であればエラーとする。
		// 存在しない場合は警告のみで処理を続行。
		{
			target  : "order",
			validate: (obj) => {
				if (obj === undefined) {
					return VALIDATION_STATUS.OptionalProperty;
				}

				return (typeof obj === "number" && !isNaN(obj) && obj >= 0);
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},

		// condition: 'condition' プロパティの検証 (必須)
		// 'condition' はルールの適用条件を定義するため、必須。
		{
			target  : "condition",
			validate: (obj) => {
				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				}

				return typeof obj === "function";
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},

		// validate: 'execute' プロパティの検証 (必須)
		// 'execute' はルールが適用された際の処理を定義するため、必須。
		{
			target  : "execute",
			validate: (obj) => {
				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty;
				}

				return typeof obj === "function";
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		}
	];

	for (const validation of validationList) {
		// rule: ルールオブジェクト自体の妥当性を検証
		if (!rule || typeof rule !== "object" || Object.keys(rule).length === 0) {
			// エラーレポートに追加し、これ以降の検証処理は中断する（早期リターン）
			errorReport.push({
				target  : "rule",
				property: rule,
				reason  : "Rule object is invalid (null, undefined, not an object, or empty)."
			});

			return {
				rule,
				report: {
					warningReport: [],
					errorReport  : errorReport
				}
			};
		}

		/*
			rule.*: ルールオブジェクト配下のプロパティについて検証
		*/
		const propertyValue = lodashGetValue(rule, validation.target);
		const validate      = validation.validate(propertyValue);
		const message       = validation.message(validate, validation.target, propertyValue);
		const report        = {
			target  : validation.target,
			property: propertyValue,
			reason  : message
		};

		switch (validate) {
			case VALIDATION_STATUS.SkipToNextValidateRule:
				// When executing something, use the `except` property.
				break;
			case VALIDATION_STATUS.OptionalProperty:
				(warningReport).push(report);
				break;
			case VALIDATION_STATUS.NonExistentProperty:
				(errorReport).push(report);
				break;
			case VALIDATION_STATUS.ValidProperty:
				// do nothing
				break;
			case VALIDATION_STATUS.InValidProperty:
				(errorReport).push(report);
				break;
			case VALIDATION_STATUS.PassThrough:
				// do nothing
				break;
			default:
				break;
		}
	}

	const result = {
		rule,
		report: {
			warningReport,
			errorReport
		}
	};

	return result;
}

/**
 * 有効なルールセット内で 'order' プロパティの一意性を検証し、重複が見つかった場合はエラーを投げる（Fail-Fast）。
 *
 * @template T                          - 移行対象となるデータの型
 * @param    {MigrationRule<T>[]} rules - 一意性チェック対象のルール配列
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
				`Error: duplicate order value "${order}" found in ${entry.count} rules in checkForDuplicateOrders. This can lead to unpredictable execution order. Involved rules: [${entry.ruleIdentifiers.join(", ")}]. Please ensure all rule "order" properties are unique.`
			);
		}
	});
}

/**
 * 有効なルールをソートし、無効なルールと結合する。
 * (Fail-Fast の場合、invalidRules は常に空配列になる)
 *
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

	console.debug("DEBUG(migration): successfully loaded and sorted migration rules", { count: allRules.length });

	return allRules;
}