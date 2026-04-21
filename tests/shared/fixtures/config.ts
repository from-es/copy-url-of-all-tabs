import type { Config } from "@/assets/js/define";

/**
 * Generates a default Config object for development and testing.
 *
 * @param {Partial<Config>} overrides - Properties to add or overwrite (optional)
 * @returns {Config} Config object
 */
export const createMockConfig = (overrides: Partial<Config> = {}): Config => {
	const base: Config = {
		Information: {
			name   : "Test Extension",
			version: "1.0.0",
			date   : { timestamp: 1678886400000, iso8601: "2023-03-15T00:00:00.000Z" }
		},
		Debug: {
			logging       : false,
			loglevel      : "info",
			methodLabel   : true,
			timestamp     : false,
			timecoordinate: "UTC"
		},
		OptionsPage: {
			fontsize: 16
		},
		PopupMenu: {
			fontsize    : 16,
			ClearMessage: { enable: true, timeout: 5 },
			OnClickClose: { enable: true, timeout: 5 }
		},
		Search: {
			regex: true
		},
		Filtering: {
			Deduplicate: {
				Copy : { enable: false },
				Paste: { enable: false }
			},
			Protocol: {
				Copy : { enable: true },
				Paste: { enable: true },
				type : {
					http      : true,
					https     : true,
					file      : false,
					ftp       : false,
					data      : false,
					blob      : false,
					mailto    : false,
					javascript: false,
					about     : false,
					chrome    : false
				}
			},
			PatternMatch: {
				Copy   : { enable: false },
				Paste  : { enable: false },
				type   : "prefix",
				pattern: ""
			}
		},
		Format: {
			type    : "text",
			template: "",
			mimetype: "text/plain"
		},
		Tab: {
			reverse    : false,
			active     : false,
			delay      : 250,
			customDelay: { enable: false, list: [] },
			position   : "default",
			TaskControl: { taskMode: "unitary", openMode: "append", chunkSize: 5 }
		},
		Badge: {
			enable: false,
			theme : {
				type : "light",
				color: { text: "#ffffff", background: "#767676" }
			}
		}
	};

	// Simple merge (consider deepMerge if necessary)
	return { ...base, ...overrides };
};