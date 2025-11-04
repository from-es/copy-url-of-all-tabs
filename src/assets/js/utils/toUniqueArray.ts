type AllowedPrimitive = string | number | bigint | symbol;

/**
 * 配列から重複する要素を排除。
 * この関数はプリミティブ値の配列に対して最適に機能するが、オブジェクト参照を含む配列も使用可能。
 *
 * @template T          - 配列の要素の型
 * @param    {T[]} list - 重複排除を行う元の配列
 * @returns  {T[]}      - 重複排除された新しい配列
 */
export function toUniqueArray<T>(list: T[]): T[] {
	if (!Array.isArray(list)) {
		// 互換性のために、配列でない場合はエラーをスローする
		throw new Error(`Invalid argument: Expected an array, but received ${typeof list}.`);
	}

	return Array.from(new Set(list));
}

/**
 * 渡された配列が任意の型(string, number, bigint, symbol)のみで構成されているかを検証。
 * 配列でない場合、または任意の型以外の要素が含まれる場合、または型が混在している場合にエラーをスローする。
 *
 * @template T            - 配列の要素の型 (AllowedPrimitive)
 * @param    {T[]}   list - 検証する配列
 * @throws   {Error}      - 検証に失敗した場合
 */
export function validatePrimitiveArray<T extends AllowedPrimitive>(list: T[]): void {
	if (!Array.isArray(list)) {
		throw new Error(`Invalid argument: Expected an array, but received ${typeof list}.`);
	}

	// 空の配列は有効とする
	if (list.length === 0) {
		return;
	}

	// 任意の型(string, number, bigint, symbol)以外の型が渡されていないか
	const firstElementType  = typeof list[0];
	const reg_PrimitiveType = /string|number|bigint|symbol/i;
	const isPrimitiveType   = (reg_PrimitiveType).test(firstElementType);
	if (!isPrimitiveType) {
		throw new Error(`Invalid array element type: Expected a type (string, number, bigint, symbol), but received ${firstElementType}.`);
	}

	// 配列要素は全て同じ型か
	const isAllSameType = list.every((elm) => typeof elm === firstElementType);
	if (!isAllSameType) {
		throw new Error(`Invalid array: All elements must be of the same type. Found mixed types.`);
	}
}