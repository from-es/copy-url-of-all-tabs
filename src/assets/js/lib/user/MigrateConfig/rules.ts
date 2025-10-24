// Import Types
import { type MigrationRule } from "./types";

// Import Module
import { compareVersions } from "@/assets/js/utils/CompareVersions";



/**
 * 設定移行ルールを定義する配列。
 * 各ルールは、特定の設定変更を適用するための条件と実行ロジックをカプセル化します。
 * ルールの詳細な定義方法については、MigrationRuleDefinition.md を参照してください。
 * @see {@link ./doc/MigrationRuleDefinition.en.md}
 */
export const migrationRules: MigrationRule[] = [
	{
		rules: {
			author : "From E",
			reason : "v0.6.1.1 から v0.7.0 へのアップデート時の設定追加（Copy & Paste, それぞれ別個にURLフィルタリングを適応可能に）に伴うプロパティ名の変更、それに伴う動作互換性維持の為",
			target : "config.Filtering.enable",
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
			config.Filtering.Copy  = { enable: true };                     // デフォルト値をセット
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
			author : "From E",
			reason : "config.Format.mimetype のプロパティ名を config.Format.minetype とタイポ",
			target : "config.Format.minetype",
			action : "プロパティ名を minetype から mimetype に修正後、minetype の値をコピー。その後 minetype は削除",
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
	},
	{
		rules: {
			author : "From E",
			reason : "v1.0.0 で追加された、タブを個別に遅延させる機能（Tab.customDelay）の設定値が存在しない場合に追加する",
			target : "config.Tab.customDelay",
			action : "config.Tab.customDelay が存在しない場合に、デフォルト値を追加する",
			created: "2025/08/01",
			expires: "2026/01/31"
		},
		condition: (argument) => {
			const { config } = argument;

			return !Object.hasOwn(config?.Tab, "customDelay");
		},
		execute: (argument) => {
			const { config, define } = argument;

			// プロパティ追加 & デフォルト値適応
			config.Tab.customDelay = define.Config.Tab.customDelay;

			// debug
			console.log(`Report, Add "config.Tab.customDelay". config >>`, config);

			return config;
		}
	},
	{
		rules: {
			author : "From E",
			reason : "config.Information.date.unixtime で管理している値が 'UNIXエポック * 1000' とプロパティ名に即していない為、プロパティ名を config.Information.date.timestamp に変更",
			target : "config.Information.date.unixtime",
			action : "プロパティ unixtime の値 timestamp にコピー。その後、プロパティ unixtime を削除する",
			created: "2025/10/04",
			expires: "2025/12/31"
		},
		condition: (argument) => {
			const { config } = argument;

			return Object.hasOwn(config.Information.date, "unixtime");
		},
		execute: (argument) => {
			const { config } = argument;

			// 移行
			config.Information.date.timestamp = (config.Information.date as any).unixtime;

			// 削除
			delete (config.Information.date as any).unixtime;

			// debug
			console.log(`Report, Migrate Config of Value. Change "config.Information.date.unixtime" to "config.Information.date.timestamp". config >>`, config);

			return config;
		}
	},
	{
		rules: {
			author : "From E",
			reason : "オプションページ側の実装不具合が原因で v1.0.0 から v1.4.0 間のカスタム遅延設定追加時に発生した、データ構造の不整合による不要な `url` プロパティを削除する為",
			target : "config.Information.version, config.Tab.customDelay.list[].url",
			action : "設定バージョンが v1.4.0 以前で、カスタム遅延リストに `url` プロパティが存在する場合、その `url` プロパティを削除",
			created: "2025/10/07",
			expires: "2026/12/31"
		},
		condition: (argument) => {
			const { config } = argument;

			const isSameOrEarlier = (base: unknown, target: unknown) => {
				const comp = compareVersions(base, target);

				if (comp === 0 || comp === -1) {
					return true;
				} else {
					return false;
				}
			};

			let   isTargetVersion = false;
			const base            = "1.4.0";
			let   target          = null;
			try {
				// 設定保存時のバージョンが v1.4.0 以前であるか
				target = config.Information?.version ?? "1.0.0"; // 設定保存時のバージョン

				isTargetVersion = isSameOrEarlier(base, target);
			} catch (error) {
				console.error("Migration Rule Error: Failed to compare versions for custom delay rule.", {
					"Migration Rule": "v1.0.0 から v1.4.0 間で追加されていたカスタム遅延設定の `url` プロパティを削除",
					baseVersion     : base,
					targetVersion   : target,
					originalError   : error
				});
			}

			// customDelay.list 配列内に、一つでも 'url' プロパティを持つオブジェクトが存在するか
			const hasUrlPropertyInList = config.Tab?.customDelay?.list?.some(item => Object.hasOwn(item, "url")) ?? false;

			return isTargetVersion && hasUrlPropertyInList;
		},
		execute: (argument) => {
			const { config } = argument;

			if (config.Tab?.customDelay?.list) {
				config.Tab.customDelay.list.forEach(item => {
					if (Object.hasOwn(item, "url")) {
						delete (item as any).url;
					}
				});
			}

			// debug
			console.log(`Report, Migrate Config of Value. Remove "config.Tab.customDelay.list[].url" property. config >>`, config);

			return config;
		}
	},
	{
		rules: {
			author : "From E",
			reason : "v1.7.0 で追加された、タブ展開の動作を制御する機能（Tab.TaskControl）の設定値が存在しない場合に追加",
			target : "config.Tab.TaskControl",
			action : "config.Tab.TaskControl が存在しない場合に、デフォルト値を追加",
			created: "2025/10/18",
			expires: "2026/12/31"
		},
		condition: (argument) => {
			const { config } = argument;
			return !Object.hasOwn(config?.Tab, "TaskControl");
		},
		execute: (argument) => {
			const { config, define } = argument;

			// プロパティ追加 & デフォルト値適応
			config.Tab.TaskControl = define.Config.Tab.TaskControl;

			// debug
			console.log(`Report, Add "config.Tab.TaskControl". config >>`, config);

			return config;
		}
	},
];