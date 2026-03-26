# ESLint: Enforcing Code Quality and Style Guides

**Last Updated:** March 25, 2026

This document outlines the ESLint configuration and coding standards for this project. Adhering to these guidelines ensures code consistency, quality, and maintainability.

## Overview

We use [ESLint](https://eslint.org/) to statically analyze our code to quickly find problems. The configuration is managed in the `eslint.config.js` file at the root of the project.

Our setup includes:
- **TypeScript Support**: Uses `typescript-eslint` to lint TypeScript code.
- **Svelte Support**: Uses `eslint-plugin-svelte` for Svelte components.
- **Import/Export Normalization**: Uses `eslint-plugin-import` to organize dependencies and consolidate exports.
- **JSDoc Normalization**: Uses `eslint-plugin-jsdoc` to maintain documentation quality and consistency.
- **Pre-defined Rules**: Extends recommended rule sets from ESLint, TypeScript ESLint, and Svelte plugins.
- **Custom Rules**: Defines a specific set of custom rules to enforce our coding style.

Please refer to the `eslint.config.js` file for the complete and definitive list of all configurations, including global settings and plugins.

## How to Run ESLint

To check the entire `src` directory for linting errors, run the following npm script:

```bash
npm run eslint
```

This script is a shortcut for `eslint src`.

To check a single file, you can pass the file path directly to the `eslint` command. It is recommended to use `npx` to ensure you are using the version of ESLint installed in the project.

```bash
npx eslint "path/to/your/file.ts"
```

## Custom Rules

Our configuration (`eslint.config.js`) enforces a strict and consistent coding style via the `customRules` object.

### Basic Rule Settings

| Category | Rule | Configuration | Description |
| :--- | :--- | :--- | :--- |
| **File Rules** | `eol-last` | `["error", "never"]` | Enforces that files do not end with a newline. |
| | `linebreak-style` | `["error", "unix"]` | Enforces Unix (LF) line endings. |
| **Error Prevention** | `no-fallthrough` | `"error"` | Disallows fall-through in `case` statements. |
| | `no-return-assign` | `"error"` | Disallows assignment operators in `return` statements. |
| | `no-unreachable` | `"error"` | Disallows unreachable code after `return`, `throw`, etc. |
| **Best Practices** | `eqeqeq` | `"error"` | Requires the use of `===` and `!==`. |
| | `curly` | `"error"` | Requires curly braces for all control statements. |
| | `yoda` | `"error"` | Disallows "Yoda" conditions. |
| **Variables** | `no-unused-vars` | `"warn"` | Warns about variables that are declared but not used. |
| | `prefer-const` | `"warn"` | Suggests `const` for variables never reassigned. |
| **Style** | `quotes` | `["error", "double", ...]` | Enforces the use of double quotes. |
| | `comma-style` | `["error", "last"]` | Enforces that commas are placed at the end of the line. |
| | `semi` | `["error", "always"]` | Requires semicolons at the end of statements. |
| | `indent` | `["error", "tab", ...]` | Enforces tab indentation. |
| | `no-inline-comments` | `"off"` | Allows inline comments after code. |
| | `max-len` | `"off"` | Disables the maximum line length check. |

### Spacing Requirements

| Rule | Configuration | Description |
| :--- | :--- | :--- |
| `array-bracket-spacing` | `["error", "always"]` | Requires spaces inside array brackets. |
| `block-spacing` | `["error", "always"]` | Requires a space inside of blocks. |
| `func-call-spacing` | `["error", "never"]` | Disallows spaces between function names and invocations. |
| `no-trailing-spaces` | `"error"` | Disallows trailing whitespace at the end of lines. |
| `space-before-blocks` | `["error", "always"]` | Requires a space before blocks. |
| `spaced-comment` | `["error", "always"]` | Enforces a space at the beginning of a comment. |
| `keyword-spacing` | `["error", { ... }]` | Enforces consistent spacing before and after keywords. |
| `space-infix-ops` | `["error", { ... }]` | Requires spacing around infix operators. |
| `comma-spacing` | `["error", { ... }]` | Enforces spacing after commas. |
| `semi-spacing` | `["error", { ... }]` | Enforces spacing after semicolons. |
| `space-unary-ops` | `[2, { ... }]` | Enforces consistency in spacing around unary operators. |

---

## Import and Export

To clarify code dependencies and improve the visibility of public interfaces, we have introduced import order normalization and export consolidation/placement rules.

### Import Order (import/order)

Import declarations must be written in the following group order (automatically sorted by ESLint). The order within groups is also fixed, and empty lines are allowed between categories.

1.  **Built-in Modules (builtin)**: Node.js standard libraries (`fs`, `path`, etc.)
    - `wxt` related (Browser compatibility APIs provided by WXT, etc.) are placed immediately after this group.
    - `svelte` related (Svelte framework, etc.) are placed next.
2.  **External Libraries (external)**: Packages installed via npm (`bowser`, etc.)
3.  **Internal Modules & Relative Paths (internal, parent, sibling, index)**:
    - Project-internal aliases (`@/`)
    - Parent directories, same directory, index files
4.  **Objects (object)**: Variable, object, and constant definitions
5.  **Type Definitions (type)**: Declarations using `import type`

### Export Consolidation and Placement (import/group-exports, import/exports-last)

- **Export Consolidation**: `export` declarations should not be written individually within a file but should be consolidated in one place whenever possible.
- **Placement at End of File**: To allow for quick identification of the interfaces exposed by a file, export declarations should generally be placed at the end of the file.

---

## JSDoc

For the purpose of improving code documentability and ensuring maintainability, we recommend providing JSDoc and have normalized its description format.

### Basic Principles
- **Language**: All descriptions within JSDoc must be written in **English**.
- **Use with TypeScript (Principle of Omission)**: Information that is obvious from TypeScript type information or language features (`async`, `class`, etc.) should generally be omitted from the JSDoc side to avoid redundancy.

### Tag Classification

| Classification | Tags | Targets / Remarks |
| :--- | :--- | :--- |
| **Required** | `@template`, `@param`, `@returns` | When there are generics, arguments, or return values. |
| **Recommended** | `@file`, `@description`, `@deprecated`, `@throws`, `@lastModified` | File overview, deprecation, exceptions, modification history (`@lastModified`). |
| **Optional** | `@example`, `@see`, `@author`, `@remarks`, `@readonly`, `@static` | Usage examples, references, author (lib/utils only), supplements, member characteristics. |
| **Omission Recommended** | `@public`, `@private`, `@protected`, `@function`, `@method`, `@class`, `@async`, `@type` | Information obvious from TypeScript or ES6+ syntax. |

### Tag Name Preference (tagNamePreference)

To prevent variations and maintain consistency, tags are automatically unified into the following recommended tags.

| Before (Alias) | After (Recommended) | Remarks |
| :--- | :--- | :--- |
| `@overview`, `@fileoverview` | **`@file`** | File overview |
| `@constructor` | **`@class`** | Class definition |
| `@return` | **`@returns`** | Return value |
| `@lastupdate` | **`@lastModified`** | Last modification date |
| `@exception` | **`@throws`** | Exception thrown |
| `@arg`, `@argument` | **`@param`** | Argument |
| `@desc` | **`@description`** | Detailed description |
| `@prop` | **`@property`** | Property |

### Tag Order

The order of tags within JSDoc is fixed to the following group order.

1.  **Info**: `@file`, `@author`, `@version`, `@lastModified`
2.  **Status**: `@deprecated`
3.  **Context**: `@dependency`, `@support`, `@remarks`
4.  **Behavior**: `@async`, `@generator`, `@fires`, `@listens`
5.  **Definition**: `@public`, `@private`, `@protected`, `@static`, `@readonly`, `@class`, `@function`, `@constructor`, `@interface`, `@property`
6.  **Signature**: `@template`, `@type`, `@param`, `@returns`, `@yields`, `@throws`
7.  **Reference**: `@see`, `@example`

### Style and Recommendations

- **Use of Hyphens**: To clearly and visually distinguish identifiers (variable names, argument names, property names, type parameter names, etc.) from their descriptions and improve documentation readability, insert a ` - ` (hyphen) between the name and the description.
  - **Target Tags**: `@param`, `@property`, `@template`
  - Example: `@param {string} name - Description`
- **Recommended Omissions**: Avoid describing the following tags if they are self-evident from the code:
  - Access modifiers (`@public`, `@private`, `@protected`)
  - Definition types (`@function`, `@method`, `@class`)
  - Asynchronous (`@async`), Type specification (`@type`)
  *Note: However, in files intended for detailed specification definition (e.g., `UrlDelayCalculator/doc`), completeness takes precedence, and these are described without omission.*
- **`@file` Tag**: In the JSDoc at the beginning of a file, write the overview as text at the top of the block, and write only the `@file` tag at the end to indicate its attribution to the entire file.

---

## Development Support Tools

In this project, we strongly recommend integrating ESLint with VSCode to maximize code quality and development efficiency.

### VSCode Extensions

| Extension Name | Description |
| :--- | :--- |
| [ESLint for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Displays ESLint warnings and errors in the editor and provides auto-fixing capabilities. |
| [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) | Provides language support for Svelte files and enhances integration with ESLint. |

### VSCode Settings

By adding the following settings to the `.vscode/settings.json` file at the root of your project, code will be automatically formatted according to ESLint rules upon saving.

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit" // Applies ESLint auto-fix on file save.
  },
  "eslint.validate": [ // Specifies language modes for which ESLint is enabled.
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "svelte"
  ]
}
```

## Official Resources

- [ESLint Official Website](https://eslint.org/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
