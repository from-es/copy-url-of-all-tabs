/**
 * Provides static methods to interact with the system clipboard.
 * @lastupdate 2025/09/06
 */
class ClipboardManager {
	/**
	 * Reads text from the clipboard.
	 * @returns {Promise<string | false>} - A promise that resolves with the text from the clipboard, or `false` if an error occurs.
	 */
	static async readText() {
		try {
			const text = await navigator.clipboard.readText();
			return text;
		} catch (error) {
			console.error("Error, ClipboardManager.readText() >>", { error });
			return false;
		}
	}

	/**
	 * Writes data to the clipboard with a specified MIME type.
	 * @param   {any}    data      - The data to write to the clipboard.
	 * @param   {string} mimetype  - The MIME type of the data.
	 * @returns {Promise<boolean>} - A promise that resolves with `true` on success, or `false` if an error occurs.
	 */
	static async write(data, mimetype) {
		try {
			const blob = new Blob([ data ], { type : mimetype });
			const item = [ new ClipboardItem({ [ blob.type ] : blob }) ];

			await navigator.clipboard.write(item);
			return true;
		} catch (error) {
			console.error("Error, ClipboardManager.write(data, mimetype) >>", { data, mimetype, error });
			return false;
		}
	}

	/**
	 * Writes text to the clipboard.
	 * @param   {string}           text - The text to write to the clipboard.
	 * @returns {Promise<boolean>}      - A promise that resolves with `true` on success, or `false` if an error occurs.
	 */
	static async writeText(text) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (error) {
			console.error("Error, ClipboardManager.writeText(text) >>", { text, error });
			return false;
		}
	}

	/**
	 * Clears the clipboard content.
	 * @returns {Promise<boolean>} - A promise that resolves with `true` on success, or `false` if an error occurs.
	 */
	static async clear() {
		try {
			await navigator.clipboard.writeText("");
			return true;
		} catch (error) {
			console.error("Error, ClipboardManager.clear() >>", { error });
			return false;
		}
	}
}



export { ClipboardManager };