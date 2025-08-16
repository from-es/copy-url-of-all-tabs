/**
 * 機能      : 文字列の表示幅計算
 * 依存関係  : なし
 * 最終更新日: 2025年8月12日
 */

/*
	JavaScriptで半角を0.5、全角を1で文字数を計算する方法(https://zenn.dev/koojy/articles/javascript-2byte-length)
*/
function getWidthOfStringLength(str) {
	let   count = 0;
	const loop  = str.length;

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

export { getWidthOfStringLength };