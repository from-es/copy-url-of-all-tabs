// eslint.config.js
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

// Comment out, Not used in this project
// import svelteConfig from './svelte.config.js';



/** @type {FlatConfig} */
const customRules = [
	{
		files: [
			"**/*.js",
			"**/*.mjs",
			"**/*.ts",
			"**/*.json",
			"**/*.svelte",
			"**/*.svelte.js"
		],
		rules: {
			// File Rules
			"eol-last": [ "error", "never" ],       // ファイル末尾に少なくとも 1つの改行 (または改行がない) を強制
			"linebreak-style": [ "error", "unix" ], // 改行コードの指定

			// Possible Errors
			"no-fallthrough": "error",   // case ステートメントのフォールスルーを禁止
			"no-return-assign": "error", // return ステートメントで代入演算子を使用禁止
			"no-unreachable": "error",   // return, throw, continue, break ステートメントの後に到達不能なコードは不許可

			// Best Practices
			"eqeqeq": "error", // タイプセーフでない比較演算子の使用を禁止
			"curly": "error",  // ブロック ステートメントの中括弧は省略禁止
			"yoda": "error",   // 条件比較時、条件のリテラル値が最初に、変数が2番目に来る

			// Variable Declaration & Assignment
			"no-unused-vars": "warn", // 宣言されているがコード内で未使用の変数がある場合に警告
			"prefer-const": "warn",   // 「const ではないが再割り当てされない変数」に警告

			// Stylistic Issues
			"comma-style": [ "error", "last" ],                // 配列要素、オブジェクトプロパティ、または変数宣言と同じ行の後ろ or 上にカンマを置く
			"semi": [ "error", "always" ],                     // ステートメントの末尾にセミコロンを置く
			"no-inline-comments": "off",                       // コードと同じ行へのコメントを許可
			"indent": [ "error", "tab", { "SwitchCase": 1 } ], // コードのインデントタイプとサイズを指定
			"max-len": "off",                                  // コードの一行辺りの文字数制限を無効

			// Spacing
			"array-bracket-spacing": [ "error", "always" ], // 配列の括弧と他のトークンの間にスペースを入れる
			"block-spacing": [ "error", "always" ],         // ブロックと同じ行上の次のトークンの内側にスペースを入れる
			"func-call-spacing": [ "error", "never" ],      // 関数名とそれを呼び出すかっこの間のスペースは不許可
			"no-trailing-spaces": "error",                  // 行末に空白文字 (スペース、タブ、その他の Unicode 空白文字) は不許可
			"space-before-blocks": [ "error", "always" ],   // ブロックの前には常に少なくとも1つのスペースを入れる
			"spaced-comment": [ "error", "always" ],
			"keyword-spacing": [ "error", { "before": true, "after": true } ], // キーワードの前後に一貫したスペースを入れる
			"space-infix-ops": [ "error", { "int32Hint": false } ],            // 挿入演算子の周囲にスペースが必要
			"comma-spacing": [ "error", { "before": false, "after": true } ],  // カンマ前後のスペース有無を指定
			"semi-spacing": [ "error", { "before": false, "after": true } ],   // セミコロン前後のスペース有無を指定
			"space-unary-ops": [ 2, { "words": true, "nonwords": false } ],    // words 単項演算子の後と nonwords 単項演算子の前後のスペースに関する一貫性を強制
		}
	},
	{
		ignores: [
			"**/*.json" // json は対象から除外
		],
		files: [
			"**/*.js",
			"**/*.mjs",
			"**/*.ts",
			"**/*.svelte",
			"**/*.svelte.js"
		],
		rules: {
			// Stylistic Issues
			"quotes": [ "error", "double", { avoidEscape: true, "allowTemplateLiterals": true } ] // 可能な限り二重引用符を使用
		}
	}
];

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Ignore certain files and directories
	{
		ignores: []
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
	...tseslint.configs.recommended,
	...svelte.configs.recommended,

	// Rules for TypeScript
	{
		files: [ "**/*.ts", "**/*.mts" ],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
	},
	{
		files: [ "**/*.d.ts" ], // .d.ts ファイル用の設定
		languageOptions: {
			// .d.ts ファイルには parser と parserOptions を指定しない
		},
	},

	// Rules for Svelte
	{
		files: [ "**/*.svelte" ],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [ ".svelte" ]
			}
		}
	},

	// Add, Custom Rules
	...customRules
];