/**
 * @fileoverview
 * This file defines a plugin for the UserAgentParser that uses the 'bowser' library to parse User-Agent strings.
 * It encapsulates the functionality of the bowser library, making it easy to integrate with the main BrowserEnvironment class.
 *
 * このファイルは、'bowser'ライブラリを使用してUser-Agent文字列を解析するUserAgentParser用プラグインを定義します。
 * bowserライブラリの機能をカプセル化し、メインのBrowserEnvironmentクラスとの統合を容易にします。
 */

// Import NPM Package
import Bowser from "bowser";

// Import Types
import { type UserAgentParserPlugin, type UserAgentParserPluginParseData } from "../types";



/**
 * A User-Agent parser plugin that utilizes the Bowser library.
 * It provides metadata about the plugin and an execution function to perform the parsing.
 *
 * Bowserライブラリを利用したUser-Agentパーサープラグインです。
 * プラグインに関するメタデータと、解析を実行するための実行関数を提供します。
 *
 * @type         {UserAgentParserPlugin}
 * @version      1.0.0
 * @lastModified 2025-07-19
 * @dependency   bowser(https://github.com/bowser-js/bowser)
 */
const UserAgentParserPlugin: UserAgentParserPlugin = {
	information: {
		name      : "UserAgent parser plugin using bowser",
		useLibrary: "bowser",
		version   : "1.0.0",
		lastupdate: "2025/07/21",
		author    : "From E"
	},

	/**
	 * The main execution function for the plugin.
	 * It calls the internal `parseInformation` function to perform the parsing.
	 *
	 * プラグインのメイン実行関数です。
	 * 内部の `parseInformation` 関数を呼び出して解析を実行します。
	 *
	 * @returns {UserAgentParserPluginParseData | null} The parsed user agent data, or null if parsing fails. / 解析されたユーザーエージェントデータ。解析に失敗した場合はnull。
	 */
	execute: () => {
		return parseInformation();
	}
};

/**
 * This function is responsible for retrieving information from the library and parsing it.
 * The processing within this function is tightly coupled with the library.
 *
 * この関数は、ライブラリから情報を取得して解析する役割を担います。
 * この関数内の処理は、ライブラリと密結合しています。
 *
 * @returns {UserAgentParserPluginParseData | null} The parsed data from the User-Agent string, or null if it cannot be parsed. / User-Agent文字列から解析されたデータ。解析できない場合はnull。
 */
function parseInformation(): UserAgentParserPluginParseData | null {
	const userAgent = ("userAgent" in globalThis.navigator) ? globalThis.navigator.userAgent : undefined;

	if (!userAgent) {
		return null;
	};

	// Library dependent, start --------------------------------------------------
	const agent  = Bowser.getParser(userAgent);
	const info   = agent.getResult();

	if (!info || !(typeof info === "object" && Object.keys(info).length > 0)) {
		return null;
	}

	// Access properties using optional chaining for safety
	const result = {
		browser: {
			name   : info?.browser?.name,
			version: info?.browser?.version
		},
		engine: {
			name   : info?.engine?.name,
			version: info?.engine?.version
		},
		os: {
			name       : info?.os?.name,
			version    : info?.os?.version,
			versionName: info?.os?.versionName
		}
	};
	// Library dependent, end --------------------------------------------------

	return result;
}



export { UserAgentParserPlugin };