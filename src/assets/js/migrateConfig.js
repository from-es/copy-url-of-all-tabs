// Import from Script
import { cloneObject    } from "@/assets/js/lib/user/CloneObject.mjs";
import { StorageManager } from "@/assets/js/lib/user/StorageManager.mjs";



/*
	# List of functions to migrate config properties

	## migration rules

	```
	{
		rules: { // ルールの説明、処理には使用しない
			reason : "なぜこのルールを適応するのかを説明",
			target : "判定対象のオブジェクト",
			action : "何をどう変更するのか",
			created: "作成日   e.x. 2025/07/12",
			expires: "有効要件 e.x. 2025/12/31 or v0.10.0" // 「指定期日 or 公開日から6ヶ月経過 or 任意バージョンに到達」後、アップデート時にルールを手動で削除
		},
		condition: <T>(argument: T): boolean => { ... }, //
		execute  : <T>(argument: T): T       => { ... }  // argument = { config, define }, return object is config
	}
	```
*/
const migrationRules = [
	{
		rules: {
			reason : "v0.6.1.1 から v0.7.0 へのアップデート時の設定追加（Copy & Paste, それぞれ別個にURLフィルタリングを適応可能に）に伴うプロパティ名の変更、それに伴う動作互換性維持の為",
			target : "has property config.Filtering.enable",
			action : "config.Filtering.enable の値を config.Filtering.Copy.enable と config.Filtering.Paste.enable を作成後、コピー。その後 config.Filtering.enable は削除",
			created: "2025/01/29",
			expires: "2025/12/31"
		},
		condition: (argument) => {
			const { config } = argument;

			return Object.hasOwn(config?.Filtering, "enable");
		},
		execute: (argument) => {
			const { config } = argument;

			// 移行
			config.Filtering.Copy  = { enable: true },                     // デフォルト値をセット
			config.Filtering.Paste = { enable: config.Filtering.enable };  // 動作互換性維持の為、以前の値をコピー

			// 削除
			delete config.Filtering.enable;

			// debug
			console.log(`Report, Migrate Config of Value. Change "config.Filtering.enable" to "config.Filtering.Copy.enable" & "config.Filtering.Paste.enable". config >>`, config);

			return config;
		}
	},
	{
		rules: {
			reason: "config.Format.mimetype のプロパティ名を config.Format.minetype とタイポ",
			target: "config.Format.minetype",
			action: "プロパティ名を minetype から mimetype に修正後、minetype の値をコピー。その後 minetype は削除",
			created: "2025/07/11",
			expires: "2025/12/31"
		},
		condition: (argument) => {
			const { config } = argument;

			return Object.hasOwn(config.Format, "minetype");
		},
		execute: (argument) => {
			const { config } = argument;

			// 移行
			config.Format.mimetype = config.Format.minetype;

			// 削除
			delete config.Format.minetype;

			// debug
			console.log(`Report, Migrate Config of Value. Change "config.Format.minetype" to "config.Format.mimetype". config >>`, config);

			return config;
		}
	}
];

function migrateConfig(_config, _define) {
	let   config     = cloneObject(_config);
	const define     = cloneObject(_define);
	const keyname    = define.Storage.key;
	let   isExecuted = false;

	for (const rule of migrationRules) {
		const execute = rule.condition({ config, define });

		if ( execute ) {
			config     = rule.execute({ config, define });
			isExecuted = true;
		}
	}

	if ( isExecuted ) {
		StorageManager.save(keyname, config);
	}

	return config;
}



export { migrateConfig };