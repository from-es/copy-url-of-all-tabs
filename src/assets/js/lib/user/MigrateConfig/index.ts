// Import Types
import { type Config, type Define }                     from "@/assets/js/types/";
import { type MigrationArgument, type MigrationResult } from "./types";

// Import Module
import { cloneObject    } from "@/assets/js/lib/user/CloneObject";
import { migrationRules } from "./rules";



/**
 * @param   {Config}          config - 移行対象の設定オブジェクト
 * @param   {Define}          define - 移行ルールで使用される定義オブジェクト
 * @returns {MigrationResult}        - 移行処理の結果。移行後の設定、適用されたルール、エラー情報などが含まれる
 */
export function migrateConfig(config: Config, define: Define): MigrationResult {
	const argument: MigrationArgument = {
		config: cloneObject(config), // 元の設定オブジェクトを破壊しないよう、ディープコピーを作成
		define: cloneObject(define)  // 同上
	};
	let   isExecuted  : boolean  = false; // いずれかの移行ルールが実行されたかを追跡するフラグ
	let   hasError    : boolean  = false; // ルール実行中にエラーが発生したかを追跡するフラグ
	const appliedRules: object[] = [];    // 適用された移行ルールを格納する配列
	const errorReports: object[] = [];

	for (const rule of migrationRules) {
		try {
			// 移行条件を評価
			const execute = rule.condition(argument);

			if ( execute ) {
				// 条件を満たす場合、移行処理を実行
				argument.config = rule.execute(argument);
				isExecuted      = true;

				appliedRules.push(rule.rules);
			}
		} catch (e) {
			const error = e as Error;

			// 特定のルールでエラーが発生しても処理を中断せず、エラー情報をログに出力
			const errorReport = {
				rule  : rule.rules,      // 問題が発生したルール
				error : error,           // エラーオブジェクト
				config: argument.config  // エラー発生時の設定オブジェクト
			};

			console.error("An error occurred while executing a configuration migration rule.", errorReport);

			hasError = true;
			errorReports.push(errorReport);

			// このルールの実行はスキップし、次のルール評価に進む
		}
	}

	// 移行が実行され、かつエラーが発生していないかを判定
	const isSucceeded = isExecuted && !hasError;

	return {
		isSucceeded,
		isExecuted,
		hasError,
		appliedRules,
		errorReports,
		config: argument.config
	};
}