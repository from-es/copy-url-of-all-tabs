// Import NPM Package
import cloneDeep from "lodash-es/cloneDeep";



/**
 * オブジェクトをディープクローンする。
 *
 * @description
 * `structuredClone()` を優先的に使用しディープクローンを試行。
 * 関数やDOMノードなど、`structuredClone()` がサポートしない非シリアライズ可能な値が含まれている場合、
 * `DataCloneError` が発生した場合、より広範なデータ型に対応する `lodash-es/cloneDeep` にフォールバックする。
 *
 * @lastupdate 2026/02/27
 * @see https://developer.mozilla.org/ja/docs/Web/API/structuredClone
 * @see https://lodash.com/docs/#cloneDeep
 *
 * @template T
 * @param   {T} obj - クローンするオブジェクト
 * @returns {T}     - ディープクローンされた新しいオブジェクト
 */
export function cloneObject<T>(obj: T): T {
	// `structuredClone()` が利用できない環境では、最初から `cloneDeep()` を使用
	if (typeof structuredClone !== "function") {
		// console.debug("DEBUG(util): structuredClone is not available, using cloneDeep directly", { obj });
		return cloneDeep(obj);
	}

	try {
		return structuredClone(obj);
	} catch (error: unknown) {
		// `structuredClone()` が失敗した場合、`DataCloneError` かどうかを判定
		if (error instanceof DOMException && error.name === "DataCloneError") {
			// console.debug("DEBUG(util): structuredClone failed, falling back to cloneDeep", { obj });
			return cloneDeep(obj);
		}

		// `DataCloneError` 以外は予期せぬエラーとして再スロー
		console.error("ERROR(util): Exception: unexpected error occurred during object cloning", { error, obj });
		throw new Error("Exception: unexpected error occurred during object cloning", { cause: error });
	}
}