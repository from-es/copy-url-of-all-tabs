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
			}
		);

		return state;
	}

	/**
	 * @param   {any}    data
	 * @param   {string} minetype
	 * @returns
	 */
	static async write(data, minetype) {
		const blob  = new Blob([ data ], { type : minetype });
		const item  = [new ClipboardItem({ [ blob.type ] : blob })];
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

					console.error("Error, ClipboardManager.write(data, minetype) >>", { data, minetype, err });
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