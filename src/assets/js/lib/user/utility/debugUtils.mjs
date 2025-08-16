/**
 * 機能      : デバッグに関するユーティリティ機能を提供します（呼び出し元関数名の取得）。
 * 依存関係  : なし
 * 最終更新日: 2025年8月12日
 */

/*
	JavaScriptで呼び出し元の関数名を取得する方法 考えてみた(https://pisuke-code.com/js-get-caller-function-name/#i)
*/
function getCallerFunctionName() {
	let callerName = null;

	try {
		throw new Error();
	} catch (e) {
		let   callerName = "None";
		const reg        = /(\w+)@|at (\w+) \(/g;
		const st         = e.stack;
		let   m;

		while ((m = reg.exec(st))) {
			callerName = (m !== null) ? m[1] || m[2] : "None";
		}
	}

	// debug
	console.log("Caller Function Name >>", callerName);

	return callerName;
}

export { getCallerFunctionName };