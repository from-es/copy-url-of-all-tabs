/**
 * 与えられたオブジェクトの具体的な型を小文字の文字列で返す
 * `typeof`演算子よりも詳細な型情報（例: 'array', 'null', 'object'）を取得
 *
 * @param   {*}      obj - 型を判定する任意のオブジェクトまたはプリミティブ値。
 * @returns {string}     - オブジェクトの型を示す小文字の文字列。
 * @example
 * typeOf([]);   // 'array'
 * typeOf(null); // 'null'
 * typeOf({});   // 'object'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typeOf(obj: any): string {
	return (Object.prototype.toString).call(obj).slice(8, -1).toLowerCase();
}