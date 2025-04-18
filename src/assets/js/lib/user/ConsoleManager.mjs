/*
	@lastupdate 2023/03/25
	@dependency cloneDeep(lodash, https://lodash.com/)
	@reference  隠ぺいされた console.log を無理やり復活させる対症療法(https://clock-up.hateblo.jp/entry/2016/11/05/js-console-log-restore)
					Is it possible to bind a date/time to a console log?(https://stackoverflow.com/questions/18410119/is-it-possible-to-bind-a-date-time-to-a-console-log?answertab=active#tab-top)
					Restoring console.log() - Stack Overflow(https://stackoverflow.com/questions/7089443/restoring-console-log)
*/

// Import NPM Package
import { cloneDeep } from "lodash-es";



class ConsoleManager {
	// -------------------------------------------------------------------------------------------------------------------------
	// Private Property
	static #store = {};

	static get #console() {
		return cloneDeep(ConsoleManager.#store.console);
	};

	static #option  = {
		logging        : false,
		timestamp      : false,
		timecoordinate : "UTC" // "UTC" or "GMT" >> UTC : yyyy-MM-dd(T)HH:mm:ss.SSS(Z) GMT : yyyy-MM-dd(T)HH:mm:ss.SSS(+|-)NN:NN
	};
	static #methods = {
		group          : "#996600",
		groupCollapsed : "#996600",
		groupEnd       : "#996600",

		debug : "black",
		info  : "green",
		log   : "blue",
		warn  : "orange",
		error : "red"
	};

	// Initialize, Class Private Property
	static {
		if ( !ConsoleManager.#store?.console || Object.keys(ConsoleManager.#store.console).length === 0 ) {
			Object.defineProperty(
				ConsoleManager.#store,
				"console", {
					value    : ConsoleManager.#getConsoleObject(),
					writable : false
				}
			);
		}
	}
	// -------------------------------------------------------------------------------------------------------------------------



	// -------------------------------------------------------------------------------------------------------------------------
	// Public Method

	static state() {
		return {
			option : ConsoleManager.#option,
			method : ConsoleManager.#methods
		};
	}

	/**
	 * @param {object} logging
	 */
	static option(logging) {
		ConsoleManager.#option = this.#setOption(logging);
	}

	static apply() {
		ConsoleManager.#apply();
	}

	static restore() {
		globalThis.console = ConsoleManager.#console;
	}
	// -------------------------------------------------------------------------------------------------------------------------



	// -------------------------------------------------------------------------------------------------------------------------
	// Private Method

	/**
	 * @param {object} obj
	 */
	static #setOption(obj) {
		try {
			// obj
			if ( !obj || typeof obj !== "object" ) {
				throw `Invalid arguments passed for parameter to "ConsoleManager.option()". Arguments is not Object!`;
			}

			// obj.logging
			if ( !Object.hasOwn(obj, "logging") || typeof obj.logging !== "boolean" ) {
				throw `Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.logging`;
			}

			// obj.timestamp
			if ( !Object.hasOwn(obj, "timestamp") || typeof obj.timestamp !== "boolean" ) {
				throw `Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.timestamp`;
			}

			// obj.timecoordinate
			if ( !Object.hasOwn(obj, "timecoordinate") || typeof obj.timecoordinate !== "string" ) {
				throw `Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.timecoordinate`;
			}
			if ( (obj.timecoordinate).toUpperCase() !== "UTC" && (obj.timecoordinate).toUpperCase() !== "GMT" ) {
				throw `Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.timecoordinate`;
			}
		} catch (e) {
			const message = {
				message  : e,
				argument : { obj }
			};

			// debug
			console.log("Error, class ConsoleManager() >>", message);

			throw "ConsoleManager.option(), forced termination.";
		}

		const result = {
			logging        : obj.logging,
			timestamp      : obj.timestamp,
			timecoordinate : obj.timecoordinate
		};

		return result;
	}

	static #apply() {
		const _option  = ConsoleManager.#option;
		const _methods = ConsoleManager.#methods;
		const _console = ConsoleManager.#console;

		ConsoleManager.#setConsole(_option, _methods, _console);
	}

	/**
	 * @param {object} _option
	 * @param {object} _methods
	 * @param {Console} _console
	 */
	static #setConsole(_option, _methods, _console) {
		const logging        = _option.logging;
		const timestamp      = _option.timestamp;
		const timecoordinate = _option.timecoordinate;
		const time           = ConsoleManager.#setTimestampProperty(timecoordinate);
		const methods        = _methods;
		const nooutput       = () => {};

		for (const key in methods) {
			// window.console(or self.console) メソッドを上書き
			Object.defineProperty(
				console,
				key,
				{
					get: function() {
						const args    = timestamp ? [ _console, "%c%s", `color: ${ methods[ key ] }`, time.toString(), ":::" ] : [ _console ];
						const method  = _console[key] ? _console[key] : _console.log;
						const result  = logging ? (method).bind(...args) : nooutput;

						return result;
					}
				}
			);
		}
	}

	/**
	 * @param {string} timecoordinate
	 * @returns
	 */
	static #setTimestampProperty(timecoordinate) {
		const coordinate = (timecoordinate).toUpperCase();
		const timestamp  = () => {};
		const getUTC     = () => { return (new Date()).toISOString(); };                       // UTC >> ISO8601拡張フォーマット
		const getGMT     = () => { return ConsoleManager.#toISOStringWithTimezone(new Date()); }; // GMT

		switch (coordinate) {
			case "UTC":
				timestamp.toString = getUTC;
				break;
			case "GMT":
				timestamp.toString = getGMT;
				break;
			default:
				// debug
				console.error("Error, ConsoleManager.js >> class ConsoleManager() >> _setTimestampProperty(), Invalid Argument Value was passed. Argument >>", timecoordinate);

				timestamp.toString = getUTC;
				break;
		}

		return timestamp;
	}

	/**
	 * JS/TSでタイムゾーン情報付きの`Date.toISOString()`を作成する(https://qiita.com/magnoliavine/items/05139982c6fd81212b08)
	 * @param {Date} date
	 * @returns {string}
	 */
	static #toISOStringWithTimezone(date) {
		const pad = (time, digit) => {
			 return ("00" + time.toString()).slice(-digit);
		};

		const year   = (date.getFullYear()).toString();
		const month  = pad((date.getMonth() + 1),  2);
		const day    = pad(date.getDate(),         2);
		const hour   = pad(date.getHours(),        2);
		const min    = pad(date.getMinutes(),      2);
		const sec    = pad(date.getSeconds(),      2);
		const milsec = pad(date.getMilliseconds(), 3);
		const tz     = -date.getTimezoneOffset();
		const sign   = (tz >= 0) ? "+" : "-";
		const tzHour = pad((tz / 60), 2);
		const tzMin  = pad((tz % 60), 2);

		return `${year}-${month}-${day}T${hour}:${min}:${sec}.${milsec}${sign}${tzHour}:${tzMin}`;
	}

	/**
	 * Console Object の取得。globalThis.console が汚染（書き換え）されていない事を前提としている
	 * @returns {object | Console}
	 */
	static #getConsoleObject() {
		const methods        = {};
		const methodNameList = [];
		const consoleObject  = Object.create(console);

		// メソッド名一覧の取得
		for (const method in consoleObject) {
			methodNameList.push(method);
		}

		(methodNameList).forEach(
			(key) => {
				methods[key] = consoleObject[key];
			}
		);

		return methods;
	}
	// -------------------------------------------------------------------------------------------------------------------------
}



export { ConsoleManager };