import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";



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
		plugins: {
			import: importPlugin,
			jsdoc : jsdoc
		},
		settings: {
			// Import 関連
			"import/internal-regex": "^@/",  // tsconfig.json で定義した "@/" エイリアスを "internal" グループとして識別する

			// jsdoc 関連
			"jsdoc": {
				"tagNamePreference": {
					"overview"    : "file",         // file に統一
					"fileoverview": "file",         // file に統一
					"constructor" : "class",        // class に統一
					"return"      : "returns",      // returns に統一
					"lastupdate"  : "lastModified", // lastModified に統一
					"exception"   : "throws",       // throws に統一
					"arg"         : "param",        // param に統一
					"argument"    : "param",        // param に統一
					"desc"        : "description",  // description に統一
					"const"       : "constant",     // constant に統一
					"prop"        : "property",     // property に統一
					"on"          : "listens",      // listens に統一
					"emits"       : "fires",        // fires に統一
					"func"        : "function",     // function に統一（クラス内は手動で method 推奨）
					"method"      : "method",       // method をそのまま許可する
					"augments"    : "extends",      // extends に統一
					"var"         : "variable"      // variable に統一
				}
			},
		},
		rules: {
			// File Rules
			"eol-last"       : [ "error", "never" ],  // ファイル末尾に少なくとも 1つの改行 (または改行がない) を強制
			"linebreak-style": [ "error", "unix" ],   // 改行コードの指定

			// Possible Errors
			"no-fallthrough"  : "error",  // case ステートメントのフォールスルーを禁止
			"no-return-assign": "error",  // return ステートメントで代入演算子を使用禁止
			"no-unreachable"  : "error",  // return, throw, continue, break ステートメントの後に到達不能なコードは不許可

			// Best Practices
			"eqeqeq"          : "error",  // タイプセーフでない比較演算子の使用を禁止
			"curly"           : "error",  // ブロック ステートメントの中括弧は省略禁止
			"yoda"            : "error",  // 条件比較時、条件のリテラル値が最初に、変数が2番目に来る
			"no-throw-literal": "error",  // 例外をスローする際、リテラルやその他表現のスローは不許可

			// Variable Declaration & Assignment
			"no-unused-vars": "warn",  // 宣言されているがコード内で未使用の変数がある場合に警告
			"prefer-const"  : "warn",  // 「const ではないが再割り当てされない変数」に警告

			// Stylistic Issues
			"comma-style"       : [ "error", "last" ],                      // 配列要素、オブジェクトプロパティ、または変数宣言と同じ行の後ろ or 上にカンマを置く
			"semi"              : [ "error", "always" ],                    // ステートメントの末尾にセミコロンを置く
			"no-inline-comments": "off",                                    // コードと同じ行へのコメントを許可
			"indent"            : [ "error", "tab", { "SwitchCase": 1 } ],  // コードのインデントタイプとサイズを指定
			"max-len"           : "off",                                    // コードの一行辺りの文字数制限を無効

			// Spacing
			"array-bracket-spacing": [ "error", "always" ],                            // 配列の括弧と他のトークンの間にスペースを入れる
			"block-spacing"        : [ "error", "always" ],                            // ブロックと同じ行上の次のトークンの内側にスペースを入れる
			"func-call-spacing"    : [ "error", "never" ],                             // 関数名とそれを呼び出すかっこの間のスペースは不許可
			"no-trailing-spaces"   : "error",                                          // 行末に空白文字 (スペース、タブ、その他の Unicode 空白文字) は不許可
			"space-before-blocks"  : [ "error", "always" ],                            // ブロックの前には常に少なくとも1つのスペースを入れる
			"spaced-comment"       : [ "error", "always" ],                            // // または /* で始まるコメント後にスペースを強制
			"keyword-spacing"      : [ "error", { "before": true, "after": true } ],   // キーワードの前後に一貫したスペースを入れる
			"space-infix-ops"      : [ "error", { "int32Hint": false } ],              // 挿入演算子の周囲にスペースが必要
			"comma-spacing"        : [ "error", { "before": false, "after": true } ],  // カンマ前後のスペース有無を指定
			"semi-spacing"         : [ "error", { "before": false, "after": true } ],  // セミコロン前後のスペース有無を指定
			"space-unary-ops"      : [ 2, { "words": true, "nonwords": false } ],      // words 単項演算子の後と nonwords 単項演算子の前後のスペースに関する一貫性を強制

			// Import
			"import/order": [
				"error", {
					"groups": [
						"builtin",   // Node.js 組み込みモジュール
						"external",  // 外部ライブラリ（npm package）
						[  // "internal（lib > util） > parent > sibling > index" の順で手動配置
							"internal",  // 内部モジュール（`@/` 等）
							"parent",    // 親ディレクトリ
							"sibling",   // 同じディレクトリ
							"index",     // index ファイル
						],
						"object",  // 変数・オブジェクト・定数定義
						"type",    // 型定義
					],
					pathGroups: [
						// WXT 関連のインポートは builtin の次に配置
						{
							pattern : "wxt{,/**}",
							group   : "builtin",
							position: "after",
						},
						// Vitest 関連のインポートは builtin の次に配置
						{
							pattern : "vitest{,/**}",
							group   : "builtin",
							position: "after",
						},
						// Svelte 関連のインポートは builtin の次に配置
						{
							pattern : "{svelte,**/*.svelte,**/*.svelte.*,./**/*.svelte,./**/*.svelte.*,../**/*.svelte,../**/*.svelte.*,@/**/*.svelte,@/**/*.svelte.*}",
							group   : "builtin",
							position: "after",
						}
					],
					pathGroupsExcludedImportTypes: [],  // builtin, external 等の特定グループが pathGroups から除外されるのを防ぐ（svelte 等を builtin グループとして扱う為に必要）
					"newlines-between": "ignore"        // グループ毎の改行ルールは無効化（カテゴリ分けの為の空行を許可）
				}
			],
			"import/newline-after-import": "error",  // 最後の import の後に空行を強制

			// Export
			"import/group-exports": "error",  // export を一箇所にまとめる
			"import/exports-last" : "error",  // export をファイル末尾に配置する

			// JSDoc: JSDoc ブロック内の アスタリスク（*）の縦の揃え
			"jsdoc/check-alignment": "warn",

			// JSDoc: 付与の推奨
			"jsdoc/require-jsdoc": [
				"warn", {
					"require": {
						"ClassDeclaration"   : true,  // クラス定義
						"MethodDefinition"   : true,  // クラス内メソッド
						"FunctionDeclaration": true   // 関数定義
					},
					"checkConstructors": false  // コンストラクタである事は自明な為、付与を任意（除外）とする
				}
			],

			// JSDoc: @param の説明前にハイフンを強制 (Google TS Style 準拠)
			"jsdoc/require-hyphen-before-param-description": [ "warn", "always" ],

			// JSDoc: 空行（グルーピング）の制御
			"jsdoc/tag-lines": [
				"warn", "any", {
					"startLines"          : 1,  // タグがある時は説明文との間に1行空ける
					"startLinesWithNoTags": 0,  // タグがない時は説明文の直ぐ後で閉じる
					"endLines"            : 0   // 最後のタグと閉じ記号の間は0行とする
				}
			],

			// JSDoc: 独自タグの許可設定
			"jsdoc/check-tag-names": [
				"warn", {
					"definedTags": [
						"lastModified",  // 最終更新日
						"dependency",    // 外部依存関係
						"support"        // 対応ブラウザや API バージョンの明記
					]
				}
			],

			// JSDoc: タグ順序の正規化
			"jsdoc/sort-tags": [
				"warn", {
					"linesBetween": 1,
					"tagSequence": [
						// Group 1: Info
						{ "tags": [ "file", "author", "version", "lastModified" ] },

						// Group 2: Status
						{ "tags": [ "deprecated" ] },

						// Group 3: Context
						{ "tags": [ "dependency", "support", "remarks" ] },

						// Group 4: Behavior
						{ "tags": [ "async", "generator", "fires", "listens" ] },

						// Group 5: Definition
						{
							"tags": [
								"public", "private", "protected", "static", "readonly",
								"class", "function", "method", "constructor", "interface", "property"
							]
						},

						// Group 6: Signature
						{ "tags": [ "template", "type", "param", "returns", "yields", "throws" ] },

						// Group 7: Reference
						{ "tags": [ "see", "example" ] }
					]
				}
			]
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
			"quotes": [ "error", "double", { avoidEscape: true, "allowTemplateLiterals": true } ]  // 可能な限り二重引用符を使用
		}
	},
	{
		// テストコード用のルール緩和
		files: [
			"tests/**/*.test.ts",
			"tests/**/*.test.js",
			"src/**/*.test.ts",
			"src/**/*.test.js"
		],
		rules: {
			// テスト内のヘルパー関数等では JSDoc を必須としない
			"jsdoc/require-jsdoc": "off",
			// テストの可読性を優先し、export の位置やまとめ方の制約を緩和
			"import/group-exports": "off",
			"import/exports-last" : "off"
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
		files: [
			"**/*.ts",
			"**/*.mts"
		],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
	},
	{
		files: [
			"**/*.d.ts"  // .d.ts ファイル用の設定
		],
		languageOptions: {
			// .d.ts ファイルには parser と parserOptions を指定しない
		},
	},

	// Rules for Svelte
	{
		files: [
			"**/*.svelte"
		],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				projectService: true,
				tsconfigRootDir: import.meta.dirname, extraFileExtensions: [ ".svelte" ]
			}
		}
	},

	// Add, Custom Rules
	...customRules,

	// Override or add specific rules for TypeScript after recommended configs
	{
		files: [
			"**/*.ts",
			"**/*.mts",
			"**/*.svelte"
		],
		plugins: {
			import: importPlugin
		},
		rules: {
			"@typescript-eslint/no-unused-vars": "warn",   // 宣言されているがコード内で未使用の変数がある場合に警告
			"@typescript-eslint/no-explicit-any": "warn",  // any 型の使用を許可しない (例外的に警告)

			// TypeScript 用の import ルール設定
			"import/no-unresolved": "off",  // TypeScript が解決するため無効化
		}
	}
];