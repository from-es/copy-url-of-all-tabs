/**
 * オブジェクトとそのすべてのネストされたプロパティを再帰的に凍結し、不変にします。
 *
 * @template T - 凍結するオブジェクトの型。
 * @param   {T}           obj - 凍結するオブジェクト。
 * @returns {Readonly<T>}     - すべてのプロパティが読み取り専用になったオブジェクト。
 * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
	// オブジェクトで定義されたプロパティ名を取得
	const propNames = Object.getOwnPropertyNames(obj);

	// 自分自身を凍結する前にプロパティを凍結
	for (const name of propNames) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const value = (obj as any)[name];

		if (value && typeof value === "object") {
			deepFreeze(value);
		}
	}

	return Object.freeze(obj);
}