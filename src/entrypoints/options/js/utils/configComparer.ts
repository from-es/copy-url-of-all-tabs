// Import NPM Package
import { isEqual } from "lodash-es";

// Import Types
import type { Config } from "@/assets/js/define";

// Types
type KeyOfConfig   = Array<keyof Config>;
type CompareResult = {
    isEqual : boolean;
    diffKeys: KeyOfConfig;
};

/**
 * 2つの設定オブジェクトのトップレベルプロパティを比較し、差分情報を返す。
 * ネストされたオブジェクトの比較には `lodash-es` の `isEqual` を使用する。
 *
 * @param   {Config}        oldConfig - 比較元の設定オブジェクト
 * @param   {Config}        newConfig - 比較先の正規化済み設定オブジェクト
 * @returns {CompareResult}           - 比較結果。isEqual が false の場合、差分があったトップレベルのキー配列を含む。
 */
export function compareConfig(oldConfig: Config, newConfig: Config): CompareResult {
	if (isEqual(oldConfig, newConfig)) {
		return { isEqual: true, diffKeys: [] };
	}

	const diffKeys: KeyOfConfig = [];
	const keys                  = Object.keys(newConfig) as KeyOfConfig;

	for (const key of keys) {
		// oldConfig にキーが存在しない場合、または値が異なる場合に差分とみなす
		if (!Object.prototype.hasOwnProperty.call(oldConfig, key) || !isEqual(oldConfig[key], newConfig[key])) {
			diffKeys.push(key);
		}
	}

	return { isEqual: diffKeys.length === 0, diffKeys };
}