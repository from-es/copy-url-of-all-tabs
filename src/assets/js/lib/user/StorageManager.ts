type StorageGetKeys   = string | string[] | object | null;
type StorageRemoveKey = string | string[];

/*
	@name        StorageManager
	@description `chrome.storage.local` API を介して、ローカルストレージにアクセス
	@author      From E
	@lastupdate  2025/08/21
	@dependency  `chrome.storage.local` API

	@note
		このクラスは `chrome.storage.local` API に大きく依存しており、`get` / `set` の仕様は以下の通り

		■ get(keys) の keys 引数の仕様:
			1. 単一の文字列（例: "key"）:
				- その文字列をキーとするアイテムを取得（注: スペースのみの文字列などもキーとして扱われるが非推奨）
			2. 文字列の配列（例: [ "key1", "key2" ]）:
				- 指定されたキーに合致するすべてのアイテムを取得
				- 空の配列 [] を指定した場合、空のオブジェクト {} が返される
			3. オブジェクト（例: { key1: default1, key2: default2 }）:
				- 指定されたキーのアイテムを取得
				- ストレージにキーが存在しない場合は、オブジェクトに指定されたデフォルト値が返される
				- 空のオブジェクト {} を指定した場合、空のオブジェクト {} が返される
				- この操作はストレージへの書き込みを行わない
			4. null または undefined:
				- ストレージ内のすべてのアイテムを取得

		■ set(items) の items 引数の仕様:
			- 保存したいキーと値のペアを持つ単一のオブジェクトを指定
			- 例: set({ config: {...}, status: "active" })
			- このように、複数のアイテムを一度に保存・更新することが可能
			- 指定したキーがストレージに既に存在する場合、その値は新しい値に上書き
			- この操作は、指定したキー以外のデータには影響を与えない
			- オブジェクトの配列（例: [{ key: "value" }]）を引数として渡すことはできない
*/
export class StorageManager {
	/**
	 * テスト用メソッド
	 */
	static test(): void {
		console.log("Call, class StorageManager() >> test()");
	}

	static async view(keys?: StorageGetKeys): Promise<void> {
		try {
			const items = await this.#getStorageData(keys ?? null);

			console.log("View Local Storage items >>", items);
		} catch (error) {
			console.error("Failed to view data from Local Storage.", { keys, error });
		}
	}

	/**
	 * ローカルストレージからデータを読み込みます。
	 * @template T
	 * @param    {StorageGetKeys}    keys - 読み込むアイテムのキー。文字列、文字列配列、オブジェクト、または全件取得の場合は null を指定
	 * @returns  {Promise<T | null>}      - 読み込んだデータを返します。キーに該当するアイテムが無い場合は空のオブジェクト、エラー時は null を返す
	 */
	static async load<T>(keys: StorageGetKeys): Promise<T | null> {
		try {
			return await this.#getStorageData<T>(keys);
		} catch (error) {
			console.error("Failed to load from Local Storage.", { keys, error });
			return null; // エラー時は null を返す
		}
	}

	/**
	 * 1つ以上のアイテムをローカルストレージに保存します。
	 * @param   {object}           items - 保存するキーと値のペアを持つオブジェクト。キーは空でない文字列である必要が
	 * @returns {Promise<boolean>}       - 保存が成功した場合は true、それ以外は false
	 */
	static async save(items: object): Promise<boolean> {
		const isValidItems = (this.#isValidData(items) && this.#isValidSecureKey(Object.keys(items)));
		if (!isValidItems) {
			console.error("Failed, Could not Save to Local Storage. Invalid argument. Argument must be a non-empty object with valid, non-empty string keys.", { items });
			return false;
		}

		try {
			await chrome.storage.local.set(items);
			return true;
		} catch (error) {
			console.error("Failed to save to Local Storage.", error);
			return false;
		}
	}

	/**
	 * ローカルストレージから1つ以上のアイテムを削除
	 * @param   {StorageRemoveKey} key - 削除するアイテムのキー（単一の文字列または文字列の配列）
	 * @returns {Promise<boolean>}     - 削除が成功した場合は true、それ以外は false
	 */
	static async remove(key: StorageRemoveKey): Promise<boolean> {
		if (!this.#isValidSecureKey(key)) {
			console.error("Failed, Could not Remove from Local Storage. Invalid key.", key);
			return false;
		}

		try {
			await chrome.storage.local.remove(key);
			return true;
		} catch (error) {
			console.error(`Failed to remove data for key: ${key}`, error);
			return false;
		}
	}

	/**
	 * ローカルストレージの全アイテムを削除
	 */
	static async removeAll(): Promise<boolean> {
		try {
			await chrome.storage.local.clear();
			console.log("Removed All Data from Local Storage.");
			return true;
		} catch (error) {
			console.error("Failed to clear all data from Local Storage.", error);
			return false;
		}
	}

	/**
	 * 取得処理（get）に適した、有効なキー（群）であるか検証
	 * 文字列、配列、オブジェクト、nullなど、APIが許容する全ての形式を検証
	 * @see https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get#keys
	 * @param   {unknown} keys - 検証するキー（群）
	 * @returns {boolean}      - 有効な形式の場合は true、それ以外は false
	 */
	static #isValidKey(keys: unknown): boolean {
		if (keys === null || keys === undefined) {
			return true;
		}
		if (typeof keys === "object" && !Array.isArray(keys)) {
			// 空のオブジェクトは、この判定で true を返す
			return true;
		}
		if (Array.isArray(keys)) {
			return keys.every(k => typeof k === "string"); // 空の配列は、この判定で true を返す
		}
		if (typeof keys === "string") {
			return true;
		}

		return false;
	}

	/**
	 * 保存・削除処理に適した、安全なキーであるか検証
	 * 具体的には、キーが空や空白のみでない文字列、もしくはその条件を満たす配列であることを保証。storage.getにおける文字列キーの仕様に準拠
	 * @see https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get#keys
	 * @param   {unknown} key - 検証するキー
	 * @returns {boolean}     - キーが安全な文字列の場合は true、それ以外は false
	 */
	static #isValidSecureKey(key: unknown): boolean {
		if (typeof key === "string" && key.trim() !== "") {
			return true;
		}
		if (Array.isArray(key) && key.length > 0 && key.every((k) => { return (typeof k === "string" && k.trim() !== ""); })) {
			return true;
		}

		return false;
	}

	/**
	 * データが有効なオブジェクトであるか検証
	 * @param   {unknown} data - 検証するデータ。保存したい1つ以上のキー/値ペアを持つオブジェクト、値は primitive 型 (整数型・ブール型・文字列) または配列を指定可能
	 * @returns {boolean}      - データが null でないオブジェクトの場合は true、それ以外は false
	 */
	static #isValidData(data: unknown): data is object {
		return (typeof data === "object" && data !== null);
	}

	/**
	 * ストレージからデータを取得
	 *
	 * このメソッドは、`chrome.storage.local.get` APIのラッパーとして機能し、成功時には取得したデータを、失敗時には例外をスローする
	 * ロギングやエラーハンドリングなどは行わず、該当処理は呼び出し元で
	 *
	 * @template T
	 * @param {StorageGetKeys} keys - 取得するアイテムのキー。
	 * @returns {Promise<T>}        - 取得したデータを返す。
	 * @throws {Error}              - キーが不正な場合、またはAPIの呼び出しに失敗した場合。
	 */
	static async #getStorageData<T>(keys: StorageGetKeys): Promise<T> {
		if (!this.#isValidKey(keys)) {
			throw new Error(`Invalid key(s) provided.`);
		}

		const items = await chrome.storage.local.get(keys ?? null);
		return items as T;
	}
}