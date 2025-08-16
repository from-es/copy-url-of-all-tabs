/**
 * 機能      : オブジェクト操作に関するユーティリティ機能を提供します（ディープフリーズ、値のパース、型判定）。
 * 依存関係  : なし
 * 最終更新日: 2025年8月12日
 */

/*
	Deep Freeze(https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
*/
function deepFreeze(obj) {
	// オブジェクトで定義されたプロパティ名を取得
	const propNames = Object.getOwnPropertyNames(obj);

	// 自分自身を凍結する前にプロパティを凍結
	for (const name of propNames) {
		const value = obj[name];

		if (value && typeof value === "object") {
			deepFreeze(value);
		}
	}

	return Object.freeze(obj);
}

function parseObjectToValue(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function typeOf(obj) {
	return (Object.prototype.toString).call(obj).slice(8, -1).toLowerCase();
}

export { deepFreeze, parseObjectToValue, typeOf };