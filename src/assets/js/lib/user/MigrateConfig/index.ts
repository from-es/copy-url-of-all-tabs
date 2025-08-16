// Import Types
import { type MigrationArgument, type MigrationResult } from "./types";

// Import from Script
import { cloneObject    } from "@/assets/js/lib/user/CloneObject";
import { migrationRules } from "./rules";



function migrateConfig(config: MigrationArgument["config"], define: MigrationArgument["define"]): MigrationResult {
	const argument: MigrationArgument = {
		config: cloneObject(config), // 元の設定オブジェクトを破壊しないよう、ディープコピーを作成
		define: cloneObject(define)
	};
	let isExecuted: boolean = false; // いずれかの移行ルールが実行されたかを追跡するフラグ
	let hasError: boolean   = false; // ルール実行中にエラーが発生したかを追跡するフラグ

	for (const rule of migrationRules) {
		try {
			// 移行条件を評価
			const execute = rule.condition(argument);

			if ( execute ) {
				// 条件を満たす場合、移行処理を実行
				argument.config = rule.execute(argument);
				isExecuted      = true;
			}
		} catch (error) {
			hasError = true;

			// 特定のルールでエラーが発生しても処理を中断せず、エラー情報をログに出力
			console.error(
				"設定移行ルールの実行中にエラーが発生しました。",
				{
					rule  : rule.rules,      // 問題が発生したルール
					error : error,           // エラーオブジェクト
					config: argument.config  // エラー発生時の設定オブジェクト
				}
			);

			// このルールの実行はスキップし、次のルール評価に進む
		}
	}

	// 移行が実行され、かつエラーが発生していないかを判定
	const isMigrated = isExecuted && !hasError;

	return {
		isMigrated: isMigrated,
		config    : argument.config
	};
}



export { migrateConfig };