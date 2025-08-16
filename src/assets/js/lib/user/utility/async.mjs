/**
 * 機能      : 非同期処理（スリープ）機能を提供します。
 * 依存関係  : なし
 * 最終更新日: 2025年8月12日
 */

function sleep(msec) {
	return new Promise(resolve => setTimeout(resolve, msec));
}

export { sleep };