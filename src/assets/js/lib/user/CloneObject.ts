// Import NPM Package
import cloneDeep from "lodash-es/cloneDeep";



/**
 * オブジェクトをディープクローンします。
 *
 * @description
 * まず `structuredClone()` で試行し、
 * 関数やDOMノードなど、`structuredClone()` がサポートしない非シリアライズ可能な値がオブジェクトに含まれている場合、
 * `DataCloneError` が発生。その際は、より広範なデータ型に対応する `lodash-es/cloneDeep` にフォールバックする。
 *
 * @lastupdate 2025/11/05
 * @see https://developer.mozilla.org/ja/docs/Web/API/structuredClone
 * @see https://lodash.com/docs/4.17.15#cloneDeep
 *
 * @template T
 * @param   {T} obj - クローンするオブジェクト。
 * @returns {T}     - ディープクローンされた新しいオブジェクト。
 */
function cloneObject<T>(obj: T): T {
	try {
		// 先ず、標準的な structuredClone() を試す
		return structuredClone(obj);
	} catch (error) {
		if ( error instanceof DOMException && error.name === "DataCloneError" ) {
			console.debug("structuredClone() failed due to non-serializable data (e.g., functions). Falling back to cloneDeep(). obj >>", obj);

			return cloneDeep(obj);
		} else {
			// その他の予期せぬエラーは再度スローする
			if ( error instanceof Error ) {
				throw new Error(error.message, { cause: error });
			} else {
				throw error;
			}
		}
	}
}



export { cloneObject };