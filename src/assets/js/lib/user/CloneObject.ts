// Import NPM Package
import cloneDeep from "lodash-es/cloneDeep";



/**
 * ディープクローン関数、 structuredClone() を試行し、失敗した場合（関数などが含まれる場合）は lodash の cloneDeep() にフォールバックする
 * @param   {T} obj - クローンするオブジェクト
 * @returns {T}     - クローンされたオブジェクト
 * @template T
 */
function cloneObject<T>(obj: T): T {
	try {
		// 先ず、標準的な structuredClone() を試す
		return structuredClone(obj);
	} catch (error) {
		/*
			structuredClone() が失敗（Function or DOM ノード複製時）した場合、 "DataCloneError" が発生。
			その後、 lodash の cloneDeep() にフォールバックする
		*/
		if ( error instanceof DOMException && error.name === "DataCloneError" ) {
			// これは動作仕様内の想定動作、エラーでは無い
			console.log("structuredClone() failed due to non-serializable data (e.g., functions). Falling back to cloneDeep(). obj >>", obj);

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