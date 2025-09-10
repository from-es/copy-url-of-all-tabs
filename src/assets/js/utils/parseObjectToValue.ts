/**
 * オブジェクトをJSON文字列に変換し、再度JSONとしてパースすることで、リアクティブなプロキシなどを解除し、純粋な値としてのオブジェクトを返します。
 * オブジェクトのディープコピーを作成する目的でも使用できます。
 *
 * @template T - パースするオブジェクトの型。
 * @param   {T} obj - 値に変換するオブジェクト。
 * @returns {T}     - プロキシなどが解除された、純粋な値としてのオブジェクト。
 */
export function parseObjectToValue<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}