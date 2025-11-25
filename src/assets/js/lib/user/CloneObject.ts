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
 * @lastupdate 2025/11/25
 * @see https://developer.mozilla.org/ja/docs/Web/API/structuredClone
 * @see https://lodash.com/docs/4.17.15#cloneDeep
 *
 * @template T
 * @param   {T} obj - クローンするオブジェクト
 * @returns {T}     - ディープクローンされた新しいオブジェクト
 */
export function cloneObject<T>(obj: T): T {
	// structuredClone が利用できない環境では、最初から cloneDeep を使用
	if (typeof structuredClone !== "function") {
		console.debug("structuredClone() is not available. Using cloneDeep() directly. obj >>", obj);
		return cloneDeep(obj);
	}

	try {
		return structuredClone(obj);
	} catch (error) {
		// structuredClone が失敗した場合、DataCloneError かどうかを判定
		if (error instanceof DOMException && error.name === "DataCloneError") {
			console.debug("structuredClone() failed due to non-serializable data. Falling back to cloneDeep(). obj >>", obj);
			return cloneDeep(obj);
		}
		// DataCloneError 以外は予期せぬエラーとして再スロー
		throw error;
	}
}