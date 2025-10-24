// Import Types
import { type Config, type Define } from "@/assets/js/types/";



type MigrationRuleMeta = {
	author : string;
	reason : string;
	target : string;
	action : string;
	created: string;
	expires: string;
}

type MigrationArgument = {
	config: Config;
	define: Define;
}

type MigrationRule = {
	rules    : MigrationRuleMeta;
	condition: (argument: MigrationArgument) => boolean;
	execute  : (argument: MigrationArgument) => Config;
}

type MigrationResult = {
	isSucceeded : boolean,   // 全ての移行処理がエラー無く完了したか
	isExecuted  : boolean,   // いずれかの移行ルールが実行されたか
	hasError    : boolean,   // 移行処理中にエラーが発生したか
	appliedRules: object[],  // 適用された移行ルール
	errorReports: object[];  // 発生したエラー情報
	config      : Config,    // 移行後の設定オブジェクト
};



export { MigrationRuleMeta, MigrationArgument, MigrationRule, MigrationResult };