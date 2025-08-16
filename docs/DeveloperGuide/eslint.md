# ESLint: Enforcing Code Quality and Style Guides

**Last Updated:** August 16, 2025

This document outlines the ESLint configuration and coding standards for this project. Adhering to these guidelines ensures code consistency, quality, and maintainability.

## Overview

We use [ESLint](https://eslint.org/) to statically analyze our code to quickly find problems. The configuration is managed in the `eslint.config.js` file at the root of the project.

Our setup includes:
- **TypeScript Support**: Uses `typescript-eslint` to lint TypeScript code.
- **Svelte Support**: Uses `eslint-plugin-svelte` for Svelte components.
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

For example:
```bash
npx eslint "src/entrypoints/popup/js/main.ts"
```

## Custom Rules

Our configuration (`eslint.config.js`) enforces a strict and consistent coding style via the `customRules` object. Below is the complete list of these rules, grouped by category.

### File Rules

| Rule | Configuration | Description |
| :--- | :--- | :--- |
| `eol-last` | `["error", "never"]` | Enforces that files do not end with a newline. |
| `linebreak-style` | `["error", "unix"]` | Enforces Unix (LF) line endings. |

### Possible Errors

| Rule | Configuration | Description |
| :--- | :--- | :--- |
| `no-fallthrough` | `"error"` | Disallows fall-through in `case` statements. |
| `no-return-assign` | `"error"` | Disallows assignment operators in `return` statements. |
| `no-unreachable` | `"error"` | Disallows unreachable code after `return`, `throw`, `continue`, and `break`. |

### Best Practices

| Rule | Configuration | Description |
| :--- | :--- | :--- |
| `eqeqeq` | `"error"` | Requires the use of `===` and `!==` instead of `==` and `!=`. |
| `curly` | `"error"` | Requires curly braces for all control statements. |
| `yoda` | `"error"` | Disallows "Yoda" conditions (where the literal value comes first). |

### Variable Declaration & Assignment

| Rule | Configuration | Description |
| :--- | :--- | :--- |
| `no-unused-vars` | `"warn"` | Warns about variables that are declared but not used. |
| `prefer-const` | `"warn"` | Warns if a `let` variable is never reassigned, suggesting `const` instead. |

### Stylistic Issues

| Rule | Configuration | Description |
| :--- | :--- | :--- |
| `quotes` | `["error", "double", ...]` | Enforces the use of double quotes. |
| `comma-style` | `["error", "last"]` | Enforces that commas are placed at the end of the line. |
| `semi` | `["error", "always"]` | Requires semicolons at the end of statements. |
| `no-inline-comments` | `"off"` | Allows inline comments after code. |
| `indent` | `["error", "tab", ...]` | Enforces tab indentation, with a specific rule for `switch` cases. |
| `max-len` | `"off"` | Disables the maximum line length check. |

### Spacing

| Rule | Configuration | Description |
| :--- | :--- | :--- |
| `array-bracket-spacing` | `["error", "always"]` | Requires spaces inside array brackets. |
| `block-spacing` | `["error", "always"]` | Requires a space inside of blocks. |
| `func-call-spacing` | `["error", "never"]` | Disallows spaces between function identifiers and their invocations. |
| `no-trailing-spaces` | `"error"` | Disallows trailing whitespace at the end of lines. |
| `space-before-blocks` | `["error", "always"]` | Requires at least one space before blocks. |
| `spaced-comment` | `["error", "always"]` | Enforces a space at the beginning of a comment. |
| `keyword-spacing` | `["error", { ... }]` | Enforces consistent spacing before and after keywords. |
| `space-infix-ops` | `["error", { ... }]` | Requires spacing around infix operators. |
| `comma-spacing` | `["error", { ... }]` | Enforces spacing after commas, but not before. |
| `semi-spacing` | `["error", { ... }]` | Enforces spacing after semicolons, but not before. |
| `space-unary-ops` | `[2, { ... }]` | Enforces consistency in spacing around unary operators. |

## Development Support Tools

In this project, we strongly recommend integrating ESLint with VSCode to maximize code quality and development efficiency. ESLint performs static analysis of code, detecting and fixing issues in real-time, thereby contributing to consistent coding style and early bug detection.

### VSCode Extensions

To fully leverage ESLint's capabilities in VSCode, the following extensions must be installed. These enable real-time code feedback, auto-fixing, and proper handling of Svelte files.

| Extension Name | Description |
| :--- | :--- |
| [ESLint for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Displays ESLint warnings and errors in the editor and provides auto-fixing capabilities. |
| [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) | Provides language support for Svelte files and enhances integration with ESLint (recommended for Svelte development). |

### VSCode Settings

By adding the following settings to the `.vscode/settings.json` file at the root of your project, code will be automatically formatted according to ESLint rules upon saving. This eliminates the need to manually run `npm run eslint` and allows you to focus on coding.

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

For more detailed information, please refer to the official ESLint website and documentation.

- [ESLint Official Website](https://eslint.org/)
- [ESLint Documentation](https://eslint.org/docs/latest/)