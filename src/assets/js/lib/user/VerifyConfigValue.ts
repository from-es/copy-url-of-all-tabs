// Import Types
import { type Config, type Define } from "@/assets/js/types/";

// Import NPM Package
import { get as lodashGetValue, set as lodashSetValue, has as lodashHasValue } from "lodash-es";



/*
	@dependency define.mjs
					lodash-es
*/
export class VerifyConfigValue {
	constructor() {
		//
	}

	verify(config: Config, define: Define) {
		return this.#verify(config, define);
	}

	#verify(config: Config, define: Define) {
		if ( !config || typeof config !== "object" || Object.keys(config).length === 0 ) {
			console.log("Error : class VerifyConfigValue() >> #verify(), config", { type: typeof config, value: config });

			return define.Config;
		}

		return this.#main(config, define);
	}

	#main(config: Config, define: Define) {
		const conf = config;
		const test = define.Verification;

		(test).forEach(
			(elm) => {
				const property = elm["property"];
				const rule     = elm["rule"];
				const fail     = elm["fail"];
				const hasValue = lodashHasValue(conf, property);
				const value    = lodashGetValue(conf, property);

				/* debug
				console.log(
					{
						property : {
							path    : elm["property"],
							hasValue: lodashHasValue(conf, property),
							value   : lodashGetValue(conf, property)
						},
						rule: elm['rule'],
						fail: elm['fail'],
					}
				);
				*/

				if ( hasValue && rule(value) ) {
					// pass
				} else {
					// fail
					const prop = `config.${property}`;

					console.log(`Warning, Invalid value. Overwrite "${prop}" with default settings. ${prop} >>`, lodashGetValue(conf, property));
					lodashSetValue(conf, property, fail());
				}
			}
		);

		return conf;
	}
}