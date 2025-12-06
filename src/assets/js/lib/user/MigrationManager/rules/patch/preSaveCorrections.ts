// Import Module
import { cloneObject } from "@/assets/js/lib/user/CloneObject";

// Import Types
import type { Config }        from "@/assets/js/types";
import type { MigrationRule } from "@/assets/js/lib/user/MigrationManager/types";

/**
 * 設定移行ルールを定義する配列。
 * 各ルールは、特定の設定変更を適用するための条件と実行ロジックをカプセル化します。
 * ルールの詳細な定義方法については、MigrationRuleDefinition.md を参照してください。
 * @see {@link ../../doc/MigrationRule.ja.md}
 */
export const rules: MigrationRule<Config>[] = [
	{
		meta: {
			author  : "From E",
			reason  : "`config.Tab.customDelay.list` 配列内オブジェクトの `pattern` プロパティに空文字列や空白のみの文字列が含まれると、設定保存時の検証で不要な警告を発生させる為。",
			target  : "config.Tab.customDelay.list",
			action  : "`config.Tab.customDelay.list` から、`pattern` プロパティが空文字列や空白のみのオブジェクトを除去する。",
			authored: "2025-12-05",
			version : {
				introduced: "1.14.0",
				obsoleted : null
			}
		},
		order: 1,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data?.Tab?.customDelay, "list") && Array.isArray(data.Tab.customDelay.list) && (data.Tab.customDelay.list).length > 0;
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			newData.Tab.customDelay.list = (newData.Tab.customDelay.list).filter(
				(obj) => {
					const str = (obj.pattern).replace(/^(\s+)$/g, "");

					return (str.length > 0) ? true : false;
				}
			);

			console.debug("[PreSave Corrections: config.Tab.customDelay.list]", { before: data, after: newData });

			return newData;
		}
	}
];