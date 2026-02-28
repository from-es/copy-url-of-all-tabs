/**
 * @fileoverview
 * This file provides the `BrowserEnvironment` class, a utility for obtaining comprehensive browser environment information.
 * It prioritizes the User-Agent Client Hints API for modern, privacy-focused data retrieval,
 * falling back to the traditional User-Agent string when necessary. The class is designed to be robust,
 * handling various browser capabilities and potential errors gracefully.
 *
 * このファイルは、包括的なブラウザ環境情報を取得するためのユーティリティである `BrowserEnvironment` クラスを提供します。
 * プライバシーを重視した最新のデータ取得方法である User-Agent Client Hints API を優先的に使用し、
 * 必要な場合には従来の User-Agent 文字列にフォールバックします。このクラスは、さまざまなブラウザの機能や
 * 潜在的なエラーを適切に処理できるように、堅牢に設計されています。
 */

// Import Package
import { UserAgentParser }       from "./UserAgentParser";
import { UserAgentParserPlugin } from "./plugins/bowser";

// Import Types
import { type NavigatorUserAgentData }                                                                             from "./types";
import { type BrowserEnvironmentResult, type CheckerInfo, type UserAgentClientHintsInfo, type UserAgentDataBrand } from "./types";
import { type UserAgentParserPluginParseData }                                                                     from "./types";


// Extend the Navigator interface to include userAgentData
declare global {
	/**
	 * Extends the global Navigator interface to include the `userAgentData` property,
	 * which is part of the User-Agent Client Hints API.
	 *
	 * User-Agent Client Hints API の一部である `userAgentData` プロパティを含むように、
	 * グローバルな Navigator インターフェースを拡張します。
	 */
	interface Navigator {
		userAgentData?: NavigatorUserAgentData;
	}
}


/**
 * A class to retrieve and parse browser environment information from either the User-Agent Client Hints API or the traditional User-Agent string.
 * It encapsulates the logic for fetching, parsing, and consolidating browser data.
 *
 * User-Agent Client Hints API または従来の User-Agent 文字列からブラウザ環境情報を取得し、解析するクラスです。
 * ブラウザデータの取得、解析、および統合のロジックをカプセル化します。
 *
 * @version      1.0.0
 * @lastModified 2026-02-27
 */
class BrowserEnvironment {
	/**
	 * A default, empty result object used as a template for all environment information results.
	 *
	 * すべての環境情報結果のテンプレートとして使用される、デフォルトの空の結果オブジェクト。
	 */
	static readonly #defaultBrowserEnvironmentResult = BrowserEnvironment.#createDefaultBrowserEnvironmentResult();

	/**
	 * An instance of the UserAgentParser, configured with a plugin for parsing the User-Agent string.
	 * This demonstrates Dependency Injection by providing the parsing logic externally.
	 *
	 * User-Agent 文字列を解析するためのプラグインで構成された UserAgentParser のインスタンス。
	 * これは、解析ロジックを外部から提供することによる依存性の注入（Dependency Injection）を示しています。
	 */
	static readonly #parser = new UserAgentParser(UserAgentParserPlugin.execute, UserAgentParserPlugin.information.useLibrary); // この箇所で依存性の注入（Dependency Injection: DI）

	/**
	 * An array of strings representing the high-entropy values to request from the User-Agent Client Hints API.
	 * User-Agent Client Hints API から要求する高エントロピー値を表す文字列の配列。
	 */
	static readonly #highEntropyValueHints           = [ "brands", "platform", "platformVersion", "mobile", "architecture", "bitness", "model", "uaFullVersion", "fullVersionList", "formFactor", "wow64" ];  // "uaFullVersion" is deprecated

	/**
	 * Asynchronously retrieves browser environment information.
	 * This is the main public method of the class.
	 *
	 * ブラウザの環境情報を非同期で取得します。
	 * このクラスのメインの公開メソッドです。
	 *
	 * @returns {Promise<BrowserEnvironmentResult>} A promise that resolves to the browser environment information. / ブラウザ環境情報に解決される Promise。
	 */
	async get(): Promise<BrowserEnvironmentResult> {
		const result = await this.#getBrowserEnvironment();

		return result;
	}

	/**
	 * Determines the appropriate method for fetching browser data (Client Hints or User-Agent string) and returns the result.
	 * It handles cases where neither method is available and catches any unexpected errors.
	 *
	 * ブラウザデータを取得するための適切なメソッド（Client Hints または User-Agent 文字列）を決定し、その結果を返します。
	 * どちらのメソッドも利用できない場合を処理し、予期しないエラーをキャッチします。
	 *
	 * @private
	 * @async
	 * @returns {Promise<BrowserEnvironmentResult>} A promise that resolves to the browser environment information. / ブラウザ環境情報に解決される Promise。
	 */
	async #getBrowserEnvironment(): Promise<BrowserEnvironmentResult> {
		try {
			if ( "userAgentData" in globalThis.navigator ) {
				const result = await this.#getUserAgentClientHints();

				return this.#supplementClientHintsWithUserAgent(result);
			} else if ( "userAgent" in globalThis.navigator ) {
				return this.#getUserAgent();
			} else {
				return this.#createErrorResult("This Browser cannot get Browser Environment Information. 'navigator.userAgent' & 'navigator.userAgentData' are not supported.");
			}
		} catch (error) {
			console.error("ERROR(core): unexpected error in getBrowserEnvironment", { error });

			return this.#createErrorResult("An unexpected error occurred while retrieving browser environment information.");
		}
	}

	/**
	 * Creates a standardized error result object when browser information cannot be retrieved.
	 * ブラウザ情報が取得できない場合に、標準化されたエラー結果オブジェクトを作成します。
	 *
	 * @private
	 * @param {string} message - The error message to include in the result. / 結果に含めるエラーメッセージ。
	 * @returns {BrowserEnvironmentResult} The error result object. / エラー結果オブジェクト。
	 */
	#createErrorResult(message: string): BrowserEnvironmentResult {
		const checker = BrowserEnvironment.#createChecker(
			false,
			message,
			{
				primary  : undefined,
				secondary: undefined
			}
		);

		return {
			...BrowserEnvironment.#defaultBrowserEnvironmentResult,

			// Overwrite, failed message
			...checker
		};
	}

	/**
	 * Creates a checker object containing metadata about the data retrieval process (success, message, sources).
	 * データ取得プロセスに関するメタデータ（成功、メッセージ、ソース）を含むチェッカーオブジェクトを作成します。
	 *
	 * @private
	 * @static
	 * @param {boolean} isSuccess - Whether the data retrieval was successful. / データ取得が成功したかどうか。
	 * @param {string | undefined} message - A message about the retrieval process. / 取得プロセスに関するメッセージ。
	 * @param {{ primary: string | undefined; secondary: string | undefined }} dataSources - The primary and secondary sources of the data. / データのプライマリおよびセカンダリソース。
	 * @returns {{ checker: CheckerInfo }} An object containing the checker information. / チェッカー情報を含むオブジェクト。
	 */
	static #createChecker(isSuccess: boolean, message: string | undefined, dataSources: { primary: string | undefined; secondary: string | undefined }): { checker: CheckerInfo } {
		const result = {
			checker: {
				isSuccess,
				message,
				dataSources
			}
		};

		return result;
	}

	/**
	 * Creates a default template for the browser environment result, with all properties initialized to undefined.
	 * すべてのプロパティが未定義に初期化された、ブラウザ環境結果のデフォルトテンプレートを作成します。
	 *
	 * @private
	 * @static
	 * @returns {BrowserEnvironmentResult} - The default browser environment result object. / デフォルトのブラウザ環境結果オブジェクト。
	 */
	static #createDefaultBrowserEnvironmentResult(): BrowserEnvironmentResult {
		return {
			// checker for debugging
			checker: {
				isSuccess  : false,
				message    : undefined,
				dataSources: {
					primary  : undefined,
					secondary: undefined
				}
			},

			information : {
				// start: Data from User-Agent Client Hints -------
				browser : {
					name   : undefined,
					version: undefined
				},
				engine : {
					name   : undefined,
					version: undefined
				},
				device : {
					mobile: undefined,
					model : undefined,
				},
				cpu : {
					architecture: undefined,
					bitness     : undefined
				},
				os : {
					name       : undefined,
					version    : undefined,
					versionName: undefined
				},
				// end: Data from User-Agent Client Hints ---------

				// start: Data from User-Agent -----------------------------------------------------------
				ua: ("userAgent" in globalThis.navigator) ? globalThis.navigator.userAgent : undefined,

				language: ("language" in globalThis.navigator) ? globalThis.navigator.language : undefined
				// start: Data from User-Agent -----------------------------------------------------------
			}
		};
	}

	/**
	 * Merges information from Client Hints, a parsing plugin, and checker metadata into a single result object.
	 * Client Hints、解析プラグイン、およびチェッカーメタデータからの情報を単一の結果オブジェクトにマージします。
	 *
	 * @private
	 * @param {UserAgentClientHintsInfo | null}       clientHintsInfo - Information obtained from User-Agent Client Hints. / User-Agent Client Hints から取得した情報。
	 * @param {UserAgentParserPluginParseData | null} pluginInfo      - Information obtained from the User-Agent string parsing plugin. / User-Agent 文字列解析プラグインから取得した情報。
	 * @param {{ checker: CheckerInfo } | null}       checker         - The checker metadata object. / チェッカーメタデータオブジェクト。
	 * @returns {BrowserEnvironmentResult}                            - The final, merged browser environment result. / 最終的にマージされたブラウザ環境の結果。
	 */
	#createBrowserEnvironmentResult(clientHintsInfo: UserAgentClientHintsInfo | null, pluginInfo: UserAgentParserPluginParseData | null, checker: { checker: CheckerInfo } | null): BrowserEnvironmentResult {
		const information = {
			information: {
				...(BrowserEnvironment.#defaultBrowserEnvironmentResult).information,

				// Overwrite information from User-Agent Client Hints
				...(clientHintsInfo ? clientHintsInfo : {}),

				// Overwrite information from plugin (User Agent)
				...(pluginInfo ? pluginInfo : {})
			}
		};
		const result = {
			...BrowserEnvironment.#defaultBrowserEnvironmentResult,

			...(checker ? checker : {}),

			...information
		};

		return result;
	}

	/**
	 * Retrieves browser information using the User-Agent Client Hints API.
	 * It requests high-entropy values and formats the result.
	 *
	 * User-Agent Client Hints API を使用してブラウザ情報を取得します。
	 * 高エントロピー値を要求し、結果をフォーマットします。
	 *
	 * @returns {Promise<BrowserEnvironmentResult>} A promise that resolves to the browser environment information from Client Hints. / Client Hints からのブラウザ環境情報に解決される Promise。
	 */
	async #getUserAgentClientHints(): Promise<BrowserEnvironmentResult>  {
		/**
		 * Extracts a specific property ("brand" or "version") from a list of UserAgentDataBrand objects,
		 * ignoring any placeholder brands like "Not;A Brand".
		 *
		 * UserAgentDataBrand オブジェクトのリストから特定プロパティ（"brand" または "version"）を抽出します。
		 * "Not;A Brand" のようなプレースホルダーブランドは無視します。
		 *
		 * @param {UserAgentDataBrand[]} list   - The list of brand objects. / ブランドオブジェクトのリスト。
		 * @param {"brand" | "version"}  target - The property to extract. / 抽出するプロパティ。
		 * @returns {string}                    - The extracted value, or an empty string if not found. / 抽出された値。見つからない場合は空文字列。
		 */
		const getInfoFromList = (list: UserAgentDataBrand[], target: "brand" | "version") => {
			const regex = /Not.A.Brand/i; // pattern: "Not;A Brand" or "Not)A;Brand", Will another pattern of strings be added?

			return list.reduceRight(
				(accumulator, item) => {
					if (accumulator) {
						return accumulator;
					}
					if ( !regex.test(item.brand) && item[target] ) {
						return item[target];
					}

					return accumulator;
				},
				""
			);
		};

		const agent       = globalThis?.navigator?.userAgentData as NavigatorUserAgentData;
		const detail      = await agent.getHighEntropyValues(BrowserEnvironment.#highEntropyValueHints);
		const information = {
			browser: {
				name   : getInfoFromList(detail.brands ?? [], "brand"),
				version: getInfoFromList(detail.fullVersionList ?? [], "version")
			},
			engine : {
				name   : undefined,
				version: undefined
			},
			device : {
				mobile: detail.mobile,
				model : detail.model,
			},
			cpu : {
				architecture: detail.architecture,
				bitness     : detail.bitness
			},
			os : {
				name       : detail.platform,
				version    : undefined,       // detail.platformVersion: This will be overwritten by info from #getUserAgent(), as detail.platformVersion requires extra processing.
				versionName: undefined
			}
		};
		const checker = BrowserEnvironment.#createChecker(
			true,
			"This Browser can get User-Agent Client Hints. 'navigator.userAgentData' is supported. Obtain information from navigator.userAgentData and supplement it with bowser.",
			{
				primary  : "navigator.userAgentData",
				secondary: ""
			}
		);

		return this.#createBrowserEnvironmentResult(information, null, checker);
	}

	/**
	 * Retrieves browser information using the traditional `navigator.userAgent` string.
	 * This is used as a fallback when Client Hints are not available.
	 *
	 * 従来の `navigator.userAgent` 文字列を使用してブラウザ情報を取得します。
	 * これは、Client Hints が利用できない場合のフォールバックとして使用されます。
	 *
	 * @private
	 * @returns {BrowserEnvironmentResult} The browser environment information from the User-Agent string. / User-Agent 文字列からのブラウザ環境情報。
	 */
	#getUserAgent(): BrowserEnvironmentResult {
		if ( !("userAgent" in globalThis.navigator) ) {
			return this.#createErrorResult("'navigator.userAgent' is not supported.");
		}

		const useLibrary = BrowserEnvironment.#parser.useLibrary;
		const pluginInfo = BrowserEnvironment.#parser.parse();
		const checker    = BrowserEnvironment.#createChecker(
			true,
			`This Browser can get User-Agent. 'navigator.userAgent' is supported. Obtain information from ${useLibrary}.`,
			{
				primary  : useLibrary,
				secondary: ""
			}
		);

		return this.#createBrowserEnvironmentResult(null, pluginInfo, checker);
	}

	/**
	 * Supplements the information gathered from User-Agent Client Hints with data from the User-Agent string parser.
	 * This is useful for filling in gaps, such as OS version names, that Client Hints may not provide.
	 *
	 * User-Agent Client Hints から収集した情報を、User-Agent 文字列パーサーからのデータで補足します。
	 * これは、Client Hints が提供しない可能性のある OS のバージョン名などのギャップを埋めるのに役立ちます。
	 *
	 * @private
	 * @param   {BrowserEnvironmentResult} information - The initial information gathered from Client Hints. / Client Hints から収集された初期情報。
	 * @returns {BrowserEnvironmentResult}             - The supplemented browser environment information. / 補足されたブラウザ環境情報。
	 */
	#supplementClientHintsWithUserAgent(information: BrowserEnvironmentResult): BrowserEnvironmentResult {
		const useLibrary = BrowserEnvironment.#parser.useLibrary;
		const pluginInfo = BrowserEnvironment.#parser.parse();

		information.checker.dataSources.secondary = useLibrary;

		const clientHintsInfo = information.information;
		const checker = {
			checker: information.checker
		};

		return this.#createBrowserEnvironmentResult(clientHintsInfo, pluginInfo, checker);

	}
}



export { BrowserEnvironment };