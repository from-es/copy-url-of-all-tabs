/**
 * @lastupdate 2024/10/21
 */
class ClipboardManager {
	static async readText() {
		let state = null;

		await navigator.clipboard.readText()
			.then(
				// Success
				(text) => {
					state = text;
				},

				// Failure
				(err) => {
					state = false;

					console.error("Error, ClipboardManager.readText() >>", { err });
				}
			);

		return state;
	}

	/**
	 * @param   {any}    data
	 * @param   {string} mimetype
	 * @returns
	 */
	static async write(data, mimetype) {
		const blob  = new Blob([ data ], { type : mimetype });
		const item  = [ new ClipboardItem({ [ blob.type ] : blob }) ];
		let   state = null;

		await navigator.clipboard.write(item)
			.then(
				// Success
				() => {
					state = true;
				},

				// Failure
				(err) => {
					state = false;

					console.error("Error, ClipboardManager.write(data, mimetype) >>", { data, mimetype, err });
				}
			);

		return state;
	}

	static async writeText(text) {
		let state = null;

		await navigator.clipboard.writeText(text)
			.then(
				// Success
				() => {
					state = true;
				},

				// Failure
				(err) => {
					state = false;

					console.error("Error, ClipboardManager.writeText(text) >>", { text, err });
				}
			);

		return state;
	}

	static async clear() {
		return navigator.clipboard.writeText("");
	}
}



export { ClipboardManager };