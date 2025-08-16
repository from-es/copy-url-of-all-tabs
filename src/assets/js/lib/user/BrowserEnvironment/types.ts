
/**
 * @fileoverview
 * This file contains TypeScript type definitions for the BrowserEnvironment library.
 * It defines the data structures used for handling User-Agent Client Hints, User-Agent strings,
 * and the final consolidated browser environment information.
 *
 * このファイルには、BrowserEnvironmentライブラリ用のTypeScriptの型定義が含まれています。
 * User-Agent Client Hints、User-Agent文字列、および最終的に統合されたブラウザ環境情報を
 * 扱うためのデータ構造を定義します。
 */

// ----------------------------------------------------------------------------------------------------------------------------
// for "./index.ts"

/**
 * Defines the structure for metadata about the data retrieval process.
 * データ取得プロセスに関するメタデータの構造を定義します。
 */
export type CheckerInfo = {
	/**
	 * Indicates whether the data retrieval was successful.
	 * データ取得が成功したかどうかを示します。
	 */
	isSuccess  : boolean,
	/**
	 * A message providing details about the retrieval process (e.g., success, failure, method used).
	 * 取得プロセスに関する詳細を提供するメッセージ（例：成功、失敗、使用されたメソッド）。
	 */
	message    : string | undefined,
	/**
	 * The sources from which the data was obtained.
	 * データが取得されたソース。
	 */
	dataSources: {
		/**
		 * The primary source of information (e.g., 'navigator.userAgentData' or 'bowser').
		 * 情報の主要なソース（例：「navigator.userAgentData」または「bowser」）。
		 */
		primary  : string | undefined,
		/**
		 * The secondary source of information, used for supplementation.
		 * 補足のために使用される情報のセカンダリソース。
		 */
		secondary: string | undefined
	}
};

/**
 * Defines the structure for information obtained from the User-Agent Client Hints API.
 * User-Agent Client Hints APIから取得した情報の構造を定義します。
 */
export type UserAgentClientHintsInfo = {
	/**
	 * Browser information.
	 * ブラウザ情報。
	 */
	browser : {
		name   : string | undefined;
		version: string | undefined;
	};
	/**
	 * Rendering engine information.
	 * レンダリングエンジン情報。
	 */
	engine: {
		name   : string | undefined;
		version: string | undefined;
	};
	/**
	 * Device information.
	 * デバイス情報。
	 */
	device: {
		mobile: boolean | undefined;
		model : string  | undefined;
	};
	/**
	 * CPU information.
	 * CPU情報。
	 */
	cpu: {
		architecture: string | undefined;
		bitness     : string | undefined;
	};
	/**
	 * Operating system information.
	 * オペレーティングシステム情報。
	 */
	os: {
		name       : string | undefined;
		version    : string | undefined;
		versionName: string | undefined;
	};
};

/**
 * Defines the final, consolidated result object for browser environment information.
 * ブラウザ環境情報の最終的な統合結果オブジェクトを定義します。
 */
export type BrowserEnvironmentResult = {
	/**
	 * Metadata about the data retrieval process.
	 * データ取得プロセスに関するメタデータ。
	 */
	checker    : CheckerInfo;
	/**
	 * The collected environment information, including both Client Hints and other navigator properties.
	 * Client Hintsと他のナビゲータープロパティの両方を含む、収集された環境情報。
	 */
	information: UserAgentClientHintsInfo & {
		/**
		 * The full User-Agent string from `navigator.userAgent`.
		 * `navigator.userAgent` からの完全なUser-Agent文字列。
		 */
		ua      : string | undefined;
		/**
		 * The browser's configured language from `navigator.language`.
		 * `navigator.language` からのブラウザの設定言語。
		 */
		language: string | undefined;
	};
};

/**
 * Represents a brand/version pair provided by the User-Agent Client Hints API.
 * User-Agent Client Hints APIによって提供されるブランド/バージョンのペアを表します。
 */
export type UserAgentDataBrand = {
	readonly brand  : string;
	readonly version: string;

	readonly [key: string]: string  // For bracket-style invocation / ブラケット形式の呼び出し用
};

/**
 * Defines the structure of high-entropy values that can be requested from the User-Agent Client Hints API.
 * User-Agent Client Hints APIから要求できる高エントロピー値の構造を定義します。
 */
export type UserAgentDataValues = {
	readonly architecture   ?: string;
	readonly bitness        ?: string;
	readonly brands         ?: UserAgentDataBrand[];
	readonly formFactor     ?: string;
	readonly uaFullVersion  ?: string; // deprecated in favor of fullVersionList(https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues#uafullversion)
	readonly fullVersionList?: UserAgentDataBrand[];
	readonly model          ?: string;
	readonly mobile         ?: boolean;
	readonly platform       ?: string;
	readonly platformVersion?: string;  // detail.platformVersion would require extra processing
	readonly wow64          ?: boolean;
}

/**
 * Extends the Navigator interface to include the `userAgentData` property from the Client Hints API.
 * Client Hints APIの `userAgentData` プロパティを含むようにNavigatorインターフェースを拡張します。
 */
export type NavigatorUserAgentData = {
	readonly brands  ?: UserAgentDataBrand[];
	readonly mobile  ?: boolean;
	readonly platform?: string;

	/**
	 * Asynchronously requests high-entropy values from the browser.
	 * ブラウザから高エントロピー値を非同期に要求します。
	 *
	 * @param {string[]} hints - An array of strings specifying the high-entropy values to retrieve. / 取得する高エントロピー値を指定する文字列の配列。
	 * @returns {Promise<UserAgentDataValues>} A promise that resolves with an object containing the requested values. / 要求された値を含むオブジェクトで解決されるPromise。
	 */
	getHighEntropyValues(hints: string[]): Promise<UserAgentDataValues>;
}
// ----------------------------------------------------------------------------------------------------------------------------



// ----------------------------------------------------------------------------------------------------------------------------
// for "./plugin/*.ts"

/**
 * Defines the structure for the metadata of a User-Agent parser plugin.
 * User-Agentパーサープラグインのメタデータの構造を定義します。
 */
type UserAgentParserPluginInformation = {  // Required fields
	name      : string;  // Name of the plugin / プラグインの名前
	useLibrary: string;  // Name of the library used / 使用されるライブラリの名前
	version   : string;  // Version: in the format x.y.z / バージョン：x.y.zの形式
	lastupdate: string;  // Last update date: date format YYYY/MM/DD / 最終更新日：YYYY/MM/DD形式
	author    : string;  // The plugin author's name / プラグイン作成者の名前
};

/**
 * Defines the structure for the data returned by a User-Agent parser plugin.
 * It is a partial representation of `UserAgentClientHintsInfo` and allows for additional properties.
 *
 * User-Agentパーサープラグインによって返されるデータの構造を定義します。
 * これは `UserAgentClientHintsInfo` の部分的な表現であり、追加のプロパティを許可します。
 */
export type UserAgentParserPluginParseData = Partial<UserAgentClientHintsInfo> & { // Required fields, set to undefined if not needed or not obtainable
	// Other properties (directly under the root) can also be overwritten by spread expansion due to operational specifications.
	// 他のプロパティ（ルート直下）も運用仕様上、スプレッド展開によって上書きされる可能性がある。
	[key: string]: unknown;
};

/**
 * Defines the interface for a User-Agent parser plugin, including its metadata and execution function.
 * メタデータと実行関数を含む、User-Agentパーサープラグインのインターフェースを定義します。
 */
export type UserAgentParserPlugin = {
	/**
	 * Metadata about the plugin.
	 * プラグインに関するメタデータ。
	 */
	information: UserAgentParserPluginInformation;
	/**
	 * The function that executes the parsing logic of the plugin.
	 * プラグインの解析ロジックを実行する関数。
	 */
	execute    : () => UserAgentParserPluginParseData | null;
};
// ----------------------------------------------------------------------------------------------------------------------------