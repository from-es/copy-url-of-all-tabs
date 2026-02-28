// Import Package
import { type UserAgentParserPluginParseData } from "./types";



/**
 * This is an external library wrapper class that retrieves information from 'User-Agent' or 'User-Agent Client Hints'.
 * This class encapsulates dependencies on the library, thereby facilitating migration to other libraries.
 *
 * 'User-Agent' または 'User-Agent Client Hints' から情報を取得する外部ライブラリのラッパークラスです。
 * このクラスはライブラリへの依存をカプセル化し、他のライブラリへの移行を容易にします。
 *
 * @class
 * @version      1.0.0
 * @lastModified 2025-07-21
 */
class UserAgentParser {
	/**
	 * A function injected via Dependency Injection (DI) that executes the parsing process of a specific User-Agent parsing library.
	 * 依存性注入（DI）によって注入される、特定のUser-Agent解析ライブラリの解析処理を実行する関数。
	 *
	 * @private
	 * @type {function(): UserAgentParserPluginParseData | null}
	 */
	#pluginExecute: () => UserAgentParserPluginParseData | null;

	/**
	 * The name of the User-Agent parsing library currently in use.
	 * 現在使用されているUser-Agent解析ライブラリの名前。
	 *
	 * @private
	 * @type {string}
	 */
	#useLibrary   : string;

	/**
	 * @constructor
	 * @param {function(): UserAgentParserPluginParseData | null} pluginExecute - The function to execute the parsing process of the User-Agent parsing library. This is injected via DI. / User-Agent解析ライブラリの解析処理を実行する関数。DIによって注入されます。
	 * @param {string} useLibrary - The name of the library being used. / 使用されているライブラリの名前。
	 */
	constructor(pluginExecute: () => UserAgentParserPluginParseData | null, useLibrary: string) {
		this.#pluginExecute = pluginExecute;
		this.#useLibrary    = useLibrary;
	}

	/**
	 * Parses the user-agent string using an injected plugin function and returns a structured result.
	 * If parsing is not possible (e.g., user-agent is unavailable or the plugin fails), it returns a default object.
	 *
	 * 注入されたプラグイン関数を使用してUser-Agent文字列を解析し、構造化された結果を返します。
	 * 解析が不可能な場合（例：User-Agentが利用できない、プラグインが失敗したなど）、デフォルトのオブジェクトを返します。
	 *
	 * @returns {UserAgentParserPluginParseData | null} A structured object with browser, engine, and OS information, or a default object on failure. / ブラウザ、エンジン、OS情報を含む構造化されたオブジェクト。失敗した場合はデフォルトのオブジェクト。
	 */
	parse(): UserAgentParserPluginParseData | null {
		const userAgent    = ("userAgent" in globalThis.navigator) ? globalThis.navigator.userAgent : undefined;
		const failedResult = {
			browser: { name: undefined, version: undefined },
			engine : { name: undefined, version: undefined },
			os     : { name: undefined, version: undefined, versionName: undefined }
		};

		if ( !userAgent ) {
			// Return a default structure if userAgent is not available
			return failedResult;
		}

		// start: From this point onward, the code depends on external libraries
		const result = this.#pluginExecute();  // 依存性の注入（Dependency Injection: DI）で注入された関数を使用

		if ( !result ) {
			return failedResult;
		}
		// end: ----------------------------------------------------------------

		return result;
	}

	/**
	 * Returns the name of the User-Agent parsing library in use.
	 * 使用中のUser-Agent解析ライブラリの名前を返します。
	 *
	 * @type {string}
	 */
	get useLibrary(): string {
		return this.#useLibrary;
	}
}



export { UserAgentParser };