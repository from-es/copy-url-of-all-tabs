/**
 * Provides static methods to interact with the system clipboard.
 * @lastupdate 2025/10/15
 */
export class ClipboardManager {
	/**
	 * A private wrapper for handling errors in clipboard operations.
	 * @param   {string}             methodName   - The name of the calling method for logging.
	 * @param   {() => Promise<any>} fn           - The async function to execute.
	 * @param   {any}                failureValue - The value to return on failure.
	 * @returns {Promise<any>}
	 */
	static async #withErrorHandling(methodName: string, fn: () => Promise<any>, failureValue: any): Promise<any> {
		try {
			const result = await fn();
			// write operations resolve to undefined, so we return true for them on success.
			return result === undefined ? true : result;
		} catch (error) {
			console.error(`Error in ClipboardManager.${methodName}():`, { error });
			return failureValue;
		}
	}

	/**
	 * Reads text from the clipboard.
	 * @returns {Promise<string | false>} - A promise that resolves with the text from the clipboard, or `false` if an error occurs.
	 */
	static readText(): Promise<string | false> {
		const func = () => navigator.clipboard.readText();

		return this.#withErrorHandling("readText", func, false);
	}

	/**
	 * Writes data to the clipboard with a specified MIME type.
	 * @param   {any}              data     - The data to write to the clipboard.
	 * @param   {string}           mimetype - The MIME type of the data.
	 * @returns {Promise<boolean>}          - A promise that resolves with `true` on success, or `false` if an error occurs.
	 */
	static write(data: any, mimetype: string): Promise<boolean> {
		const func = async () => {
			const blob = new Blob([ data ], { type : mimetype });
			const item = [ new ClipboardItem({ [ blob.type ]: blob }) ];

			await navigator.clipboard.write(item);
		};

		return this.#withErrorHandling("write", func, false);
	}

	/**
	 * Writes text to the clipboard.
	 * @param   {string}           text - The text to write to the clipboard.
	 * @returns {Promise<boolean>}      - A promise that resolves with `true` on success, or `false` if an error occurs.
	 */
	static writeText(text: string): Promise<boolean> {
		const func = () => navigator.clipboard.writeText(text);

		return this.#withErrorHandling("writeText", func, false);
	}

	/**
	 * Clears the clipboard content.
	 * @returns {Promise<boolean>} - A promise that resolves with `true` on success, or `false` if an error occurs.
	 */
	static clear(): Promise<boolean> {
		const func = () => navigator.clipboard.writeText("");

		return this.#withErrorHandling("clear", func, false);
	}
}