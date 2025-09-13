// Import Types
import { type Config, type Define } from "@/assets/js/define";

// Import from Script
import { ConsoleManager } from "@/assets/js/lib/user/ConsoleManager";

/**
 * デバッグロギングの有効/無効を切り替える
 * ConsoleManagerを使用し、設定に基づいてコンソール出力の有効/無効を切り替え
 *
 * @param   {Config} config
 * @param   {Define} define
 * @returns {void}
 * @see ConsoleManager
 */
export function logging(config: Config, define: Define): void {
	const isValidConfig  = validConfig(config, define);
	const loggingOptions = isValidConfig ? config.Debug : define.Config.Debug;

	// config
	if (!isValidConfig) {
		// debug
		console.log("Error, Invalid value passed to logging(config, define). { config, define } >>", { config, define });
	}

	ConsoleManager.option(loggingOptions);
	ConsoleManager.apply();
}

/**
 * define.Verification のルールに基づき、config.Debug オブジェクトの有効性を検証
 * @param   {Config}  config - 検証対象の config オブジェクト
 * @param   {Define}  define - 検証ルールを含む define オブジェクト
 * @returns {boolean}        - config.Debug が有効な場合は true, それ以外は false
 */
function validConfig(config: Config, define: Define): boolean {
	// config.Debug の存在と型を基本チェック
	if (!config?.Debug || typeof config.Debug !== "object") {
		return false;
	}

	// "Debug." で始まるルールを抽出
	const debugRules = getRulesByPrefix(define.Verification, "Debug.");

	// 抽出したルールが一つもなければ検証できない為 false を返す
	if (debugRules.length === 0) {
		console.warn("No verification rules found for 'Debug' in define.Verification.");
		return false;
	}

	// すべてのルールを適用し、一つでも失敗したら false を返す
	return debugRules.every(verificationRule => {
		// "Debug.logging" から "logging" を取り出す
		const propName = verificationRule.property.substring("Debug.".length);

		// config.Debug にプロパティが存在するかチェック
		if (!Object.hasOwn(config.Debug, propName)) {
			return false;
		}

		// config.Debug オブジェクトから実際の値を取得
		const value = config.Debug[propName as keyof Config["Debug"]];

		// v8n のルールを実行
		return verificationRule.rule(value);
	});
}

/**
 * `property` キーを持つオブジェクトの配列から、指定されたプロパティプレフィックスに一致するルールを抽出
 * @template T
 * @param   {T[]}    rules  - { property: string } を満たすオブジェクトが存在する配列
 * @param   {string} prefix - 検索するプロパティのプレフィックス (例: "Debug.")
 * @returns {T[]}           - フィルタリングされたオブジェクトの配列
 */
function getRulesByPrefix<T extends { property: string }>(rules: T[], prefix: string): T[] {
	return rules.filter(rule => rule.property.startsWith(prefix));
}