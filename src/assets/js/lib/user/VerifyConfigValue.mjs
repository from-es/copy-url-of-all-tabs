import { DirectAccessThePropertiesOfObject } from "./DirectAccessThePropertiesOfObject.mjs";

/*
	@dependency define.mjs
               DirectAccessThePropertiesOfObject.mjs
*/
export class VerifyConfigValue {
	constructor() {
		//
	}

	verify(config, define) {
		return this.#verify(config, define);
	}

	#verify(config, define) {
		if ( !config || typeof config !== "object" || Object.keys(config).length === 0 ) {
			console.log("Error : class VerifyConfigValue() >> #verify(), config", { type: typeof config, value: config });

			return define.Config;
		}

		return this.#main(config, define);
	}

	#main(config, define) {
		const conf = config;
		const test = define.Verification;
		const dapo = new DirectAccessThePropertiesOfObject();

		(test).forEach(
			(elm) => {
				const property = elm["property"];
				const rule     = elm["rule"];
				const fail     = elm["fail"];
				const has      = dapo.hasValue(conf, property);
				const value    = dapo.getValue(conf, property);

				/* debug
				console.log(
					{
						property : {
							path  : elm['property'],
							has   : dapo.hasValue(conf, property),
							value : dapo.getValue(conf, property)
						},
						rule : elm['rule'],
						fail : elm['fail'],

					}
				);
				*/

				if ( has && rule(value) ) {
					// pass
				} else {
					// fail
					const prop = `config.${property}`;

					console.log(`Warning, Invalid value. Overwrite "${prop}" with default settings. ${prop} >>`, dapo.getValue(conf, property));
					dapo.setValue(conf, property, fail());
				}
			}
		);

		return conf;
	}
}