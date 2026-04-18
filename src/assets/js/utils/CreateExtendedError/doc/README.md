# CreateExtendedError

**Last Updated:** April 18, 2026

A utility for creating extended error objects with additional metadata and context.

---

## Overview
`createExtendedError` allows you to instantiate standard or custom Error classes while easily attaching arbitrary metadata. It supports Error Chaining (`cause`) and provides specialized handling for stack traces to ensure they point directly to the caller.

## Features
- **Metadata Support**: Attach any JSON-serializable data to the `detail` property of the error.
- **Error Chaining**: Fully supports the standard `cause` option for error wrapping.
- **Stack Trace Optimization**: Uses `Error.captureStackTrace` (where supported) to remove the utility itself from the call stack, providing cleaner debugging information.
- **Immutability**: Metadata in the `detail` property is set as read-only at runtime.
- **Type Safety**: Built with TypeScript for full type support of error classes and metadata.
- **Fail-Fast Validation**: Validates arguments at runtime to prevent improper usage.

## Basic Usage
```typescript
import { createExtendedError } from './CreateExtendedError';

// 1. Basic usage
throw createExtendedError(Error, "Something went wrong");

// 2. With metadata
const error = createExtendedError(TypeError, "Invalid input", {
  fieldName: "email",
  value    : "invalid-email"
});
console.log(error.detail.fieldName); // "email"

// 3. With Error Chaining (cause)
try {
  // ... some code
} catch (error) {
  throw createExtendedError(Error, "Process failed", { cause: error, step: "initialization" });
}
```

## API Reference
### `createExtendedError<T, D>(ErrorType, message, options)`
- **`ErrorType`**: The constructor of the Error class to instantiate (e.g., `Error`, `TypeError`). Defaults to `Error`.
- **`message`**: The error message (must be a non-empty string).
- **`options`**: Optional object containing:
    - `cause`: The underlying error (standard Error Chaining).
- `stackStartFn`: Function to start the stack trace from.
    - Defaults to `createExtendedError`, which removes the utility's internal code from the stack trace.
    - Specify a wrapper function (e.g., `stackStartFn: myWrapper`) to remove that function and its internal calls from the stack.
    - Set to `null` to disable stack trace adjustment (keeping the full call stack).
    - Custom metadata: Any other string-keyed properties will be stored in `detail`.

## Behavioral Specifications & Notes
### Stack Trace Handling
This utility uses `Error.captureStackTrace` to ensure the stack trace begins at the point where `createExtendedError` was called, rather than inside the utility itself. Note that this is a non-standard feature supported in V8-based browsers (Chrome, Edge), Firefox (120+), and Safari (17.2+).

### Metadata (`detail`)
All additional properties passed in `options` (excluding `cause` and `stackStartFn`) are encapsulated within a `detail` property. This property is defined as read-only and non-configurable using `Object.defineProperty`.

### Execution Context
Pure logic function. Can be used in any environment (Browser/Node.js).

## License
This project is licensed under the [MIT License](../../../../../../LICENSE.md).
