/**
 * Storage management module.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";



type StorageGetKeys   = string | string[] | object | null;
type StorageRemoveKey = string | string[];



/**
 * Static class that centrally manages access to the browser's `local` storage.
 *
 * Accesses local storage via the `browser.storage.local` API.
 * This class relies heavily on the `browser.storage.local` API, and the specifications for `get` / `set` are as follows:
 *
 * Specification for the keys argument in get(keys):
 *   1. A single string (e.g., "key"):
 *     - Retrieves the item with that string as the key (Note: strings containing only spaces are also treated as keys but are deprecated).
 *   2. An array of strings (e.g., [ "key1", "key2" ]):
 *     - Retrieves all items matching the specified keys.
 *     - If an empty array [] is specified, an empty object {} is returned.
 *   3. An object (e.g., { key1: default1, key2: default2 }):
 *     - Retrieves items for the specified keys.
 *     - If a key does not exist in storage, the default value specified in the object is returned.
 *     - If an empty object {} is specified, an empty object {} is returned.
 *    - This operation does not write to storage.
 *   4. null or undefined:
 *     - Retrieves all items in storage.
 *
 * Specification for the items argument in set(items):
 * - Specify a single object containing the key-value pairs you want to save.
 * - Example: set({ config: {...}, status: "active" })
 * - This allows saving/updating multiple items at once.
 * - If a specified key already exists in storage, its value is overwritten with the new value.
 * - This operation does not affect data other than the specified keys.
 * - An array of objects (e.g., [{ key: "value" }]) cannot be passed as an argument.
 *
 * @dependency `browser.storage.local` API
 */
export class StorageManager {
	/**
	 * Method for testing.
	 *
	 * @returns {void}
	 */
	static test(): void {
		console.debug("DEBUG(storage): call StorageManager test method");
	}

	/**
	 * Wraps storage operations and provides centralized error handling.
	 *
	 * @template T                                   - The type of the operation's return value on success.
	 * @template E                                   - The type of the return value on error.
	 * @param    {() => Promise<T>} operation        - The function returning a Promise to execute.
	 * @param    {E}                errorReturnValue - The value to return when an error occurs.
	 * @param    {string}           errorMessage     - The message to display on error.
	 * @param    {object}           [errorDetails]   - Additional information to include in the error log.
	 * @returns  {Promise<T | E>}                      Returns the operation's return value on success, or errorReturnValue on failure.
	 */
	static async #handleStorageOperation<T, E>(
		operation        : () => Promise<T>,
		errorReturnValue : E,
		errorMessage     : string,
		errorDetails    ?: object
	): Promise<T | E> {
		try {
			return await operation();
		} catch (error) {
			console.error("ERROR(storage): storage operation failed", { errorMessage, errorDetails, error });
			return errorReturnValue;
		}
	}

	/**
	 * Displays data for the specified key(s) (or all data) in the debug console.
	 *
	 * @param   {StorageGetKeys} [keys] - The keys to display.
	 * @returns {Promise<void>}
	 */
	static async view(keys?: StorageGetKeys): Promise<void> {
		// Return undefined on error, effectively returning nothing (void).
		const items = await this.#handleStorageOperation(
			() => this.#getStorageData(keys ?? null),
			undefined,
			"Failed to view data from Local Storage.",
			{ keys }
		);

		if (items) { // Log only if items is not undefined.
			console.debug("DEBUG(storage): view local storage items", { items });
		}
	}

	/**
	 * Loads data from local storage.
	 *
	 * @template T                          - The type of the loaded data.
	 * @param    {StorageGetKeys}    keys   - The keys of the items to load. Specify a string, array of strings, object, or null to retrieve all items.
	 * @returns  {Promise<T | null>}          Returns the loaded data. Returns an empty object if no items match the keys, or null on error.
	 */
	static async load<T>(keys: StorageGetKeys): Promise<T | null> {
		// Return null on error.
		return this.#handleStorageOperation(
			() => this.#getStorageData<T>(keys),
			null,
			"Failed to load from Local Storage.",
			{ keys }
		);
	}

	/**
	 * Saves one or more items to local storage.
	 *
	 * @param   {object}           items - An object with key-value pairs to save. Keys must be non-empty strings.
	 * @returns {Promise<boolean>}         Returns true if the save was successful, otherwise false.
	 */
	static async save(items: object): Promise<boolean> {
		if (!this.#isValidData(items) || !this.#isValidSecureKey(Object.keys(items))) {
			console.error("ERROR(storage): Failure: save to local storage, invalid argument", { items });
			return false;
		}

		// Return false on error.
		const result = await this.#handleStorageOperation(
			() => browser.storage.local.set(items),
			false,
			"Failed to save to Local Storage.",
			{ items }
		);

		// On success, the operation's return value is void (undefined), so evaluate result !== false to return true.
		return result !== false;
	}

	/**
	 * Removes one or more items from local storage.
	 *
	 * @param   {StorageRemoveKey} key - The key(s) of the items to remove (a single string or an array of strings).
	 * @returns {Promise<boolean>}       Returns true if the removal was successful, otherwise false.
	 */
	static async remove(key: StorageRemoveKey): Promise<boolean> {
		if (!this.#isValidSecureKey(key)) {
			console.error("ERROR(storage): Failure: remove from local storage, invalid key", { key });
			return false;
		}

		// Return false on error.
		const result = await this.#handleStorageOperation(
			() => browser.storage.local.remove(key),
			false,
			`Failed to remove data for key: ${key}`,
			{ key }
		);

		return result !== false;
	}

	/**
	 * Removes all items from local storage.
	 *
	 * @returns {Promise<boolean>} Returns true if the removal was successful, otherwise false.
	 */
	static async removeAll(): Promise<boolean> {
		// Return false on error.
		const result = await this.#handleStorageOperation(
			() => browser.storage.local.clear(),
			false,
			"Failed to clear all data from Local Storage."
		);

		if (result !== false) {
			console.info("INFO(storage): removed all data from local storage");
		}
		return result !== false;
	}

	/**
	 * Verifies if the key(s) are valid and suitable for the retrieval process (get).
	 *
	 * Verifies all formats allowed by the API, such as string, array, object, null, etc.
	 *
	 * @param   {unknown} keys - The key(s) to verify.
	 * @returns {boolean}        Returns true if the format is valid, otherwise false.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get#keys
	 */
	static #isValidKey(keys: unknown): boolean {
		if (keys === null || keys === undefined) {
			return true;
		}
		if (typeof keys === "object" && !Array.isArray(keys)) {
			// Empty objects return true in this check.
			return true;
		}
		if (Array.isArray(keys)) {
			return keys.every(k => typeof k === "string"); // Empty arrays return true in this check.
		}
		if (typeof keys === "string") {
			return true;
		}

		return false;
	}

	/**
	 * Verifies if the key is valid and secure, suitable for save/remove operations.
	 *
	 * Specifically, ensures that the key is a string that is not empty or whitespace only, or an array meeting that condition. Complies with string key specifications in storage.get.
	 *
	 * @param   {unknown} key - The key to verify.
	 * @returns {boolean}       Returns true if the key is a secure string, otherwise false.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get#keys
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
	 * Verifies if the data is a valid object.
	 *
	 * @param   {unknown} data - The data to verify. An object with one or more key/value pairs to save; values can be primitive types (integer, boolean, string) or arrays.
	 * @returns {boolean}        Returns true if the data is a non-null object, otherwise false.
	 */
	static #isValidData(data: unknown): data is object {
		return (typeof data === "object" && data !== null);
	}

	/**
	 * Retrieves data from storage.
	 *
	 * This method functions as a wrapper for the `browser.storage.local.get` API, returning the retrieved data on success and throwing an exception on failure.
	 * Logging and error handling are not performed here; they should be handled by the caller.
	 *
	 * @template T                     - The type of the retrieved data.
	 * @param    {StorageGetKeys} keys - The keys of the items to retrieve.
	 * @returns  {Promise<T>}            Returns the retrieved data.
	 * @throws   {Error}                 If the keys are invalid or the API call fails.
	 */
	static async #getStorageData<T>(keys: StorageGetKeys): Promise<T> {
		if (!this.#isValidKey(keys)) {
			throw new Error("Invalid: invalid key(s) provided in StorageManager.#getStorageData");
		}

		const items = await browser.storage.local.get(keys ?? null);
		return items as T;
	}
}