/**
 * Configuration object verification utility.
 *
 * @file
 * @author       From E
 * @lastModified 2026-04-08
 */

// Import NPM Package
import { get as lodashGetValue, set as lodashSetValue, has as lodashHasValue } from "lodash-es";

// Import Types
import type { Config, Define } from "@/assets/js/types";



/**
 * Class that verifies each property of the configuration object and overwrites invalid values with default settings.
 *
 * @dependency define/index.ts (const define: Define)
 * @dependency lodash-es (https://www.npmjs.com/package/lodash-es)
 */
export class VerifyConfigValue {
	constructor() {
		//
	}

	/**
	 * Public verification method. Verifies the configuration object and returns the corrected settings.
	 *
	 * @param   {Config} config - The configuration object to verify.
	 * @param   {Define} define - The definition object containing default settings.
	 * @returns {Config}          The verified and corrected configuration object.
	 */
	verify(config: Config, define: Define): Config {
		return this.#verify(config, define);
	}

	/**
	 * Internal verification method. Performs validity checks on the object and then executes detailed verification processing.
	 *
	 * @param   {Config} config - The configuration object to verify.
	 * @param   {Define} define - The definition object containing default settings.
	 * @returns {Config}          The verified and corrected configuration object.
	 */
	#verify(config: Config, define: Define): Config {
		if ( !config || typeof config !== "object" || Object.keys(config).length === 0 ) {
			console.error("ERROR(config): Invalid: invalid config object", { type: typeof config, value: config });

			return define.Config;
		}

		return this.#main(config, define);
	}

	/**
	 * Main verification process. Sequentially applies defined verification rules (define.Verification).
	 *
	 * @param   {Config} config - The configuration object to verify.
	 * @param   {Define} define - The definition object containing default settings.
	 * @returns {Config}          The verified and corrected configuration object.
	 */
	#main(config: Config, define: Define): Config {
		const conf = config;
		const test = define.Verification;

		(test).forEach(
			(elm) => {
				const property = elm["property"];
				const rule     = elm["rule"];
				const fail     = elm["fail"];
				const hasValue = lodashHasValue(conf, property);
				const value    = lodashGetValue(conf, property);

				/*
				console.debug(
					"DEBUG(config): verify config value details",
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

					console.warn("WARN(config): Invalid: invalid value, overwrite with default settings", { property: prop, value: lodashGetValue(conf, property) });
					lodashSetValue(conf, property, fail());
				}
			}
		);

		return conf;
	}
}