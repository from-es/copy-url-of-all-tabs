// Types for Local File
const FILE_TYPE_DEFINITIONS = {
	csv : { mime: "text/csv",           extensions: [ ".csv" ] },
	ini : { mime: "application/x-ini",  extensions: [ ".ini" ] },
	json: { mime: "application/json",   extensions: [ ".json" ] },
	txt : { mime: "text/plain",         extensions: [ ".txt" ] },
	toml: { mime: "application/toml",   extensions: [ ".toml" ] },
	yaml: { mime: "application/x-yaml", extensions: [ ".yaml", ".yml" ] }
} as const;

// "FILE_TYPE_DEFINITIONS" から MIME_TYPES を動的に生成
// 例: {
//   csv : "text/csv",
//   ini : "application/x-ini",
//   json: "application/json",
//   txt : "text/plain",
//   toml: "application/toml",
//   yaml: "application/x-yaml"
// }
export const MIME_TYPES = Object.fromEntries(
	Object.entries(FILE_TYPE_DEFINITIONS).map(([ key, value ]) => [ key, value.mime ])
) as { [K in keyof typeof FILE_TYPE_DEFINITIONS]: typeof FILE_TYPE_DEFINITIONS[K]["mime"] };

// "FILE_TYPE_DEFINITIONS" から拡張子へのマッピングを動的に生成
// 例: {
//   "text/csv"          : [ ".csv" ],
//   "application/x-ini" : [ ".ini" ],
//   "application/json"  : [ ".json" ],
//   "text/plain"        : [ ".txt" ],
//   "application/toml"  : [ ".toml" ],
//   "application/x-yaml": [ ".yaml", ".yml" ]
// }
export const MIME_TO_EXT_MAP = Object.fromEntries(
	Object.values(FILE_TYPE_DEFINITIONS).map(value => [ value.mime, value.extensions ])
) as Record<string, readonly string[]> as Record<MimeType, readonly string[]>;

export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

type BaseResult = {
	success: boolean;
	message: string;
	error? : Error;
};
export type ImportResult = BaseResult & {
	action       : "import";
	content?     : string;
	isUserCancel?: boolean;
};
export type ExportResult = BaseResult & {
	action: "export";
};

/**
 * Represents an error thrown when the user cancels a file selection dialog.
 */
class UserCancelError extends Error {
	constructor(message = "File selection was canceled by the user.") {
		super(message);
		this.name = "UserCancelError";
	}
}


/**
 * Manages the import and export processes for application settings.
 *
 * This class provides static methods for file import and export operations,
 * designed to be independent of any UI framework.
 * For detailed specifications and usage examples, please refer to the documentation.
 *
 * @lastupdate 2026/02/27
 */
export class ConfigManager {
	private constructor() {
		// This is a static utility class and should not be instantiated.
	}

	/**
	 * Imports a configuration file from the user's local machine.
	 * @param   {MimeType} mimetype     - The expected MIME type of the file.
	 * @returns {Promise<ImportResult>} - A promise that resolves to an object containing the import result.
	 */
	public static async importFile(mimetype: MimeType): Promise<ImportResult> {
		try {
			const file    = await this.#showOpenFileDialog(mimetype);
			const content = await this.#readAsText(file, mimetype);

			return {
				action : "import",
				success: true,
				message: "File read successfully.",
				content,
				isUserCancel: false
			};
		} catch (e) {
			const err          = e as Error;
			const isUserCancel = e instanceof UserCancelError;

			return {
				action : "import",
				success: false,
				message: isUserCancel ? err.message : `Failed to read file: ${err.message}`,
				error  : isUserCancel ? undefined : err,
				isUserCancel
			};
		}
	}

	/**
	 * Exports a configuration string to a file and triggers a download.
	 * @param   {string}       content  - The string content to be saved to the file.
	 * @param   {string}       filename - The name of the file to be downloaded.
	 * @param   {MimeType}     mimetype - The MIME type of the file.
	 * @returns {ExportResult}          - An object containing the export result.
	 */
	public static exportFile(content: string, filename: string, mimetype: MimeType): ExportResult {
		try {
			const blob = new Blob([ content ], { type: mimetype });
			const url  = URL.createObjectURL(blob);
			const anc  = document.createElement("a");

			anc.download            = filename;
			anc.href                = url;
			anc.dataset.downloadurl = [ mimetype, anc.download, anc.href ].join(":");

			anc.click();
			URL.revokeObjectURL(url);
			anc.remove();

			return { action: "export", success: true, message: "File exported successfully." };
		} catch (error) {
			const err = error as Error;

			return { action: "export", success: false, message: `Failed to export file: ${err.message}`, error: err };
		}
	}

	/**
	 * Displays a file open dialog to the user.
	 * @param   {MimeType} mimetype - The accepted MIME type for the file dialog.
	 * @returns {Promise<File>}     - A promise that resolves with the selected file or rejects if canceled.
	 * @private
	 */
	static #showOpenFileDialog(mimetype: MimeType): Promise<File> {
		return new Promise((resolve, reject) => {
			const input = document.createElement("input");

			input.type   = "file";
			input.accept = mimetype;

			input.onchange = (event) => {
				const target = event.target as HTMLInputElement;

				if (target.files && target.files.length > 0) {
					resolve(target.files[0]);
				} else {
					reject(new Error("Failure: no file selected in ConfigManager.#showOpenFileDialog"));
				}
			};
			input.oncancel = () => {
				reject(new UserCancelError());
			};

			input.click();
		});
	}

	/**
	 * Reads the content of a file as text.
	 * @param   {File}            file     - The file to read.
	 * @param   {MimeType}        mimetype - The expected MIME type for validation.
	 * @returns {Promise<string>}          - A promise that resolves with the text content of the file.
	 * @throws  {Error}                    - If the file's MIME type does not match the expected type.
	 * @private
	 */
	static async #readAsText(file: File, mimetype: MimeType): Promise<string> {
		const expectedExtensions = MIME_TO_EXT_MAP[mimetype];
		const isMimeTypeMatch    = (mimetype === file.type);
		const isExtensionMatch   = expectedExtensions ? expectedExtensions.some(ext => file.name.endsWith(ext)) : false;

		// MIMEタイプも拡張子も一致しない場合にエラーをスローする
		if (!isMimeTypeMatch && !isExtensionMatch) {
			const message = `Invalid: a file with a different format (${file.type || "unknown"}) from "${mimetype}" was loaded, and the file extension does not match in ConfigManager.#readAsText`;
			throw new Error(message);
		}

		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = () => {
				if (typeof reader.result === "string") {
					resolve(reader.result);
				} else {
					reject(new Error("Failure: failed to read file as text in ConfigManager.#readAsText"));
				}
			};
			reader.onerror = () => {
				reject(new Error("Error: error reading file in ConfigManager.#readAsText"));
			};
			reader.readAsText(file);
		});
	}
}