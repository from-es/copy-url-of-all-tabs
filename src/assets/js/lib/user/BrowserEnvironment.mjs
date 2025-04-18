// Import NPM Package
import { UAParser } from 'ua-parser-js';

/**
 * @lastupdate 2025/01/20
 * @dependency UAParser.js(https://github.com/faisalman/ua-parser-js)
 */
export class BrowserEnvironment {
	constructor() {
		//
	}

	async get() {
		const result = await this._getBrowserEnvironment();

		return result;
	}

	getLegacy() {
		let useragent = null;

		if ( "userAgent" in navigator ) {
			useragent = this._getUserAgent();
		} else {
			const message = "This Browser cannot get the User-Agent. 'navigator.userAgent' is obsolete.";

			// debug
			console.log(message);

			useragent = {
				checker : "none",
				message : message
			};
		}

		return useragent;
	}

	async _getBrowserEnvironment() {
		let useragent = null;

		switch (true) {
			case ( "userAgentData" in navigator ):
				useragent = await this._getUserAgentClientHints();
				break;
			case ( "userAgent" in navigator ):
				useragent = this._getUserAgent();
				break;
			default:
				useragent = {
					checker : "none",
					message : "This Browser cannot get Browser Environment Information. 'navigator.userAgent' & 'navigator.userAgentData' are not supported."
				};
				break;
		}

		return useragent;
	}

	_getUserAgent() {
		const parser = new UAParser();
		const result = parser.getResult();

		result.checker = "navigator.userAgent";
		result.message = "This Browser can get User-Agent. 'navigator.userAgent' is supported.";

		return result;
	}

	async _getUserAgentClientHints() {
		const agent = globalThis?.navigator.userAgentData;
		/*
			const brands     = agent.brands; // [ {"brand": "Chromium","version": "92"}, {"brand": " Not A;Brand","version": "99"}, {"brand": "Google Chrome", "version": "92"} ]
			const mobileness = agent.mobile; // true or false
		*/

		const args   = ["brands", "platform", "platformVersion", "mobile", "architecture", "bitness", "model", "uaFullVersion"];
		const detail = await agent.getHighEntropyValues(args);
		/*
			getHighEntropyValues(https://wicg.github.io/ua-client-hints/#browser-os-experiments-use-case)

			const details = {
				brands          : detail.brands,                                // Google Chrome
				uaFullVersion   : detail.uaFullVersion,                         // 92.0.4515.107
				mobile          : detail.mobile ? detail.mobile : agent.mobile, // Desktop >> false, mobile >> true
				platform        : detail.platform,                              // Windows
				platformVersion : detail.platformVersion,                       // 10
				architecture    : detail.architecture,                          // x86, x64
				bitness         : detail.bitness,                               // 32, 64
				model           : detail.model                                  // Device Name >> Nexus 7, iPhone
			};
			console.log(details);
		*/

		const getBrowserName = (array) => {
			let brand = "";

			Array.from(array).forEach((item) => {
				if ( !((/ Not /i).test(item["brand"])) ) {
					brand = ( (item["brand"]).length > brand.length ) ? item["brand"] : brand;
				}
			});

			return brand;
		};

		// Convert to UAParser.js Format
		const result = {
			checker : "navigator.userAgentData",
			message : "This Browser can get User-Agent Client Hints. 'navigator.userAgentData' is supported.",

			browser : {
				name    : getBrowserName(agent.brands),
				major   : parseInt(detail.uaFullVersion, 10).toString(),
				version : detail.uaFullVersion
			},
			cpu : {
				architecture : detail.architecture
			},
			device : {
				model  : detail.model,
				type   : undefined,
				vendor : undefined
			},
			engine : {
				name    : undefined,
				version : detail.uaFullVersion
			},
			os : {
				name    : detail.platform,
				version : detail.platformVersion
			},
			ua : ("userAgent" in globalThis?.navigator) ? globalThis.navigator.userAgent : undefined,

			language : ("language" in globalThis?.navigator) ? globalThis.navigator.language : undefined
		};

		return result;
	}
}