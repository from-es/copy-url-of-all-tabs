/**
 * 文字列の表示幅を算出。半角文字を1、全角文字を2としてカウント、改行はカウントしない
 *
 * @param   {string} str - 幅を計算する文字列。
 * @returns {number}     - 計算された文字列の表示幅。
 * @see https://zenn.dev/koojy/articles/javascript-2byte-length
 */
export function getWidthOfStringLength(str: string): number {
	let count = 0;
	const loop = str.length;

	for (let i = 0; i < loop; i++) {
		const char = str.charCodeAt(i);

		if (!str[i].match(/\r?\n/g)) { // 改行コード判定
			if (char >= 0x0 && char <= 0x7f) { // 全角半角判定
				count += 1; // 半角 = 1 >> 表示幅換算
			} else {
				count += 2; // 全角 = 2 >> 表示幅換算
			}
		}
	}

	return count;
}