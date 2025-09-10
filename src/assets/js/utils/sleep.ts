/**
 * 指定されたミリ秒数だけ非同期で処理を待機します。
 *
 * @param   {number}        msec - 待機する時間（ミリ秒）
 * @returns {Promise<void>}      - 指定時間が経過した後に解決されるPromise
 * @example
 * async function example() {
 *   console.log('Start');
 *   await sleep(2000); // 2秒待機
 *   console.log('End');
 * }
 */
export function sleep(msec: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, msec));
}