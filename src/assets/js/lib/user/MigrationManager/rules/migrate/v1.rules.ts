// Import Module
import { cloneObject }     from "@/assets/js/lib/user/CloneObject";
import { compareVersions } from "@/assets/js/utils/CompareVersions";

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
			reason  : "v0.6.1.1 から v0.7.0 へのアップデート時の設定追加（Copy & Paste, それぞれ別個にURLフィルタリングを適応可能に）に伴うプロパティ名の変更、それに伴う動作互換性維持の為",
			target  : "config.Filtering.enable",
			action  : "config.Filtering.enable の値を config.Filtering.Copy.enable と config.Filtering.Paste.enable を作成後、コピー。その後 config.Filtering.enable は削除",
			authored: "2025-01-29",
			version : {
				introduced: "0.7.0",
				obsoleted : null
			}
		},
		order: 1,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data?.Filtering, "enable");
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			// 移行
			newData.Filtering.Copy  = { enable: true };                     // デフォルト値をセット
			newData.Filtering.Paste = { enable: newData.Filtering.enable };  // 動作互換性維持の為、以前の値をコピー

			// 削除
			delete newData.Filtering.enable;

			console.info("INFO(migration): migrate config of value: change data.filtering.enable to data.filtering.copy.enable and data.filtering.paste.enable", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "config.Format.mimetype のプロパティ名を config.Format.minetype とタイポ",
			target  : "config.Format.minetype",
			action  : "プロパティ名を minetype から mimetype に修正後、minetype の値をコピー。その後 minetype は削除",
			authored: "2025-07-11",
			version : {
				introduced: "1.0.0",
				obsoleted : null
			}
		},
		order: 2,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data.Format, "minetype");
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			// 移行
			newData.Format.mimetype = newData.Format.minetype;

			// 削除
			delete newData.Format.minetype;

			console.info("INFO(migration): migrate config of value: change data.format.minetype to data.format.mimetype", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "v1.0.0 で追加された、タブを個別に遅延させる機能（Tab.customDelay）の設定値が存在しない場合に追加する",
			target  : "config.Tab.customDelay",
			action  : "config.Tab.customDelay が存在しない場合に、デフォルト値を追加する",
			authored: "2025-08-01",
			version : {
				introduced: "1.0.0",
				obsoleted : null
			}
		},
		order: 3,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Tab, "customDelay");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// プロパティ追加 & デフォルト値適応
			newData.Tab.customDelay = defaultValues.Tab.customDelay;

			console.info("INFO(migration): add data.tab.customdelay", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "config.Information.date.unixtime で管理している値が 'UNIXエポック * 1000' とプロパティ名に即していない為、プロパティ名を config.Information.date.timestamp に変更",
			target  : "config.Information.date.unixtime",
			action  : "プロパティ unixtime の値 timestamp にコピー。その後、プロパティ unixtime を削除する",
			authored: "2025-10-04",
			version : {
				introduced: "1.4.0",
				obsoleted : null
			}
		},
		order: 4,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data.Information.date, "unixtime");
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			// 移行
			newData.Information.date.timestamp = (newData.Information.date as any).unixtime;

			// 削除
			delete (newData.Information.date as any).unixtime;

			console.info("INFO(migration): migrate config of value: change data.information.date.unixtime to data.information.date.timestamp", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "オプションページ側の実装不具合が原因で v1.0.0 から v1.4.0 間のカスタム遅延設定追加時に発生した、データ構造の不整合による不要な `url` プロパティを削除する為",
			target  : "config.Information.version, config.Tab.customDelay.list[].url",
			action  : "設定バージョンが v1.4.0 以前で、カスタム遅延リストに `url` プロパティが存在する場合、その `url` プロパティを削除",
			authored: "2025-10-07",
			version : {
				introduced: "1.5.0",
				obsoleted : null
			}
		},
		order: 5,
		condition: (argument) => {
			const { data } = argument;

			const isSameOrEarlier = (base: unknown, target: unknown) => {
				const comp = compareVersions(base, target);

				return comp === 0 || comp === -1;
			};

			let   isTargetVersion = false;
			const base            = "1.4.0";
			let   target          = null;
			try {
				// 設定保存時のバージョンが v1.4.0 以前であるか
				target = data.Information?.version ?? "1.0.0"; // 設定保存時のバージョン

				isTargetVersion = isSameOrEarlier(base, target);
			} catch (error) {
				console.error("ERROR(migration): migration rule error: failed to compare versions for custom delay rule", {
					"Migration Rule": "v1.0.0 から v1.4.0 間で追加されていたカスタム遅延設定の `url` プロパティを削除",
					baseVersion     : base,
					targetVersion   : target,
					originalError   : error
				});
			}

			// customDelay.list 配列内に、一つでも 'url' プロパティを持つオブジェクトが存在するか
			const hasUrlPropertyInList = data.Tab?.customDelay?.list?.some(item => Object.hasOwn(item, "url")) ?? false;

			return isTargetVersion && hasUrlPropertyInList;
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			if (newData.Tab?.customDelay?.list) {
				newData.Tab.customDelay.list.forEach(item => {
					if (Object.hasOwn(item, "url")) {
						delete (item as any).url;
					}
				});
			}

			console.info("INFO(migration): migrate config of value: remove data.tab.customdelay.list.url property", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "v1.7.0 で追加された、タブ展開の動作を制御する機能（Tab.TaskControl）の設定値が存在しない場合に追加",
			target  : "config.Tab.TaskControl",
			action  : "config.Tab.TaskControl が存在しない場合に、デフォルト値を追加",
			authored: "2025-10-18",
			version : {
				introduced: "1.8.0",
				obsoleted : null
			}
		},
		order: 6,
		condition: (argument) => {
			const { data } = argument;
			return !Object.hasOwn(data?.Tab, "TaskControl");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// プロパティ追加 & デフォルト値適応
			newData.Tab.TaskControl = defaultValues.Tab.TaskControl;

			console.info("INFO(migration): add data.tab.taskcontrol", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "v1.11.0 で追加された、URLの重複除去の設定追加に伴う `config.Filtering 構造変更` への対応",
			target  : "config.Filtering",
			action  : "Filtering 設定を新しい構造（Deduplicate と Protocol）に再構成し、Deduplicate 設定を初期化",
			authored: "2025-11-01",
			version : {
				introduced: "1.12.0",
				obsoleted : null
			}
		},
		order: 7,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Filtering, "Deduplicate");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// 移行元の値を取得（存在しない場合は undefined）
			const oldCopyEnable  = newData.Filtering?.Copy?.enable;
			const oldPasteEnable = newData.Filtering?.Paste?.enable;
			const oldProtocol    = newData.Filtering?.Protocol;

			// 新しい構造を defaultValues からディープコピーして作成
			newData.Filtering = cloneObject(defaultValues.Filtering);

			// 古い値が存在すれば、新しい構造に上書き
			newData.Filtering.Protocol.Copy.enable  = (oldCopyEnable !== undefined) ? oldCopyEnable : defaultValues.Filtering.Protocol.Copy.enable;
			newData.Filtering.Protocol.Paste.enable = (oldPasteEnable !== undefined) ? oldPasteEnable : defaultValues.Filtering.Protocol.Paste.enable;

			// 古い Protocol がオブジェクトで、httpプロパティを持つ（プロトコル定義オブジェクトである）ことを確認
			if (typeof oldProtocol === "object" && oldProtocol !== null && Object.hasOwn(oldProtocol, "http")) {
				// 古いプロトコル設定で新しい `type` オブジェクトを上書き（設定を移行）
				Object.assign(newData.Filtering.Protocol.type, oldProtocol);
			}

			console.info("INFO(migration): migrate config of value: restructure data.filtering", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "v1.12.0 で追加された、拡張機能アイコンに「待機中URL数」を表示するバッジ機能（Badge）の設定値が存在しない場合に追加",
			target  : "config.Badge",
			action  : "config.Badge が存在しない場合、プロパティ追加し、デフォルト値を適応",
			authored: "2025-11-10",
			version : {
				introduced: "1.12.0",
				obsoleted : null
			}
		},
		order: 8,
		condition: (argument) => {
			const { data } = argument;
			return !Object.hasOwn(data, "Badge");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// プロパティ追加 & デフォルト値適応
			newData.Badge = defaultValues.Badge;

			console.info("INFO(migration): add data.badge", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "v1.18.0 で CustomDelay の各項目に有効/無効フラグを追加する為",
			target  : "config.Tab.customDelay.list[].enable",
			action  : "config.Tab.customDelay.list の各項目に `enable: true` を追加する（プロパティが存在しない場合）",
			authored: "2026-01-16",
			version : {
				introduced: "1.18.0",
				obsoleted : null
			}
		},
		order: 9,
		condition: (argument) => {
			const { data }      = argument;
			const configVersion = data.Information?.version ?? "0.0.0";

			// configVersion が "1.18.0" より小さい場合でなければ、移行対象外
			if (compareVersions("1.18.0", configVersion) !== -1) {
				return false;
			}

			// `customDelay.list` が配列として存在し、かつその中に「`enable` プロパティを持ち、その値は boolean 値である（不正書き換え対策）」ではない項目が1つでもあれば移行対象とする
			return data.Tab?.customDelay?.list?.some(item => !(Object.hasOwn(item, "enable") && typeof item.enable === "boolean")) ?? false;
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			if (newData.Tab?.customDelay?.list) {
				newData.Tab.customDelay.list.forEach(item => {
					// 「`enable` プロパティを持ち、その値は boolean 値である」ではない項目にデフォルト値 `true` を設定
					if (!(Object.hasOwn(item, "enable") && typeof item.enable === "boolean")) {
						item.enable = true;
					}
				});
			}

			console.info("INFO(migration): add enable property to data.tab.customdelay.list items", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "v1.20.0 で追加された、デバッグ用のコンソール出力にログレベル（config.Debug.loglevel）を制御する機能の設定値が存在しない場合に追加する為",
			target  : "config.Debug.loglevel",
			action  : "config.Debug.loglevel が存在しない場合に、デフォルト値 `warn` を追加",
			authored: "2026-02-01",
			version : {
				introduced: "1.20.0",
				obsoleted : null
			}
		},
		order: 10,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Debug, "loglevel");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// プロパティ追加 & デフォルト値適応
			newData.Debug.loglevel = defaultValues.Debug.loglevel;

			console.info("INFO(migration): add data.debug.loglevel", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "v1.20.0 で追加された、デバッグ用のコンソール出力にメソッドラベル（config.Debug.methodLabel）を表示/非表示する機能の設定値が存在しない場合に追加する為",
			target  : "config.Debug.methodLabel",
			action  : "config.Debug.methodLabel が存在しない場合に、デフォルト値 `true` を追加",
			authored: "2026-02-03",
			version : {
				introduced: "1.20.0",
				obsoleted : null
			}
		},
		order: 11,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Debug, "methodLabel");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// プロパティ追加 & デフォルト値適応
			newData.Debug.methodLabel = defaultValues.Debug.methodLabel;

			console.info("INFO(migration): add data.debug.methodlabel", newData);

			return newData;
		}
	}
];