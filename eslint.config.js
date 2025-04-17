// eslint.config.js
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

// Comment out, Not used in this project
// import svelteConfig from './svelte.config.js';



/** @type {FlatConfig} */
const customRules = {
	files: [
		'**/*.js',
		'**/*.mjs',
		'**/*.json',
		'**/*.svelte',
		'**/*.svelte.js'
	],
	rules: {
		// file
		"eol-last": [ "error", "never" ],
		"linebreak-style": [ "error", "unix" ],

		// variable declaration and assignment
		"no-unused-vars": "warn",
		"prefer-const": "warn",

		// stricter comparison operators
		"eqeqeq": "error",

		// code style
		"comma-style": [ "error", "last" ],
		"semi": [ "error", "always" ],

		// indent style
		"indent": [ "error", "tab", { "SwitchCase": 1 } ],

		// space
		"array-bracket-spacing": [ "error", "always" ],
		"block-spacing": [ "error", "always" ],
		"func-call-spacing": [ "error", "never" ],
		"no-trailing-spaces": "error",
		"space-before-blocks": [ "error", "always" ],
		"spaced-comment": [ "error", "always" ],

		// disables line length check
		"max-len": "off",

		// Enforce consistent brace style for all control statements
		"curly": "error",

		// Allow inline comments after code
		"no-inline-comments": "off"
	}
};

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Ignore certain files and directories
	{
		ignores: [
			"src/public/history/js/marked.esm.js"
		]
	},

	// Config for Global Variables
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.webextensions,
				chrome: "readonly"
			}
		}
	},

	// ESLint recommended configs
	js.configs.recommended,
	...svelte.configs.recommended,

	// Rules for Svelte
	{
		files: [ '**/*.svelte', '**/*.svelte.js' ],
		languageOptions: {
			parserOptions: {
				// We recommend importing and specifying svelte.config.js.
				// By doing so, some rules in eslint-plugin-svelte will automatically read the configuration and adjust their behavior accordingly.
				// While certain Svelte settings may be statically loaded from svelte.config.js even if you don’t specify it,
				// explicitly specifying it ensures better compatibility and functionality.

				// Comment out, Not used in this project
				// svelteConfig
			}
		}
	},

	// Custom Rules
	customRules
];