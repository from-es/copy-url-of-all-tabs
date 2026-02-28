# Logging Guidelines

**Last Updated:** February 28, 2026

## Overview

This document defines guidelines for standardizing and normalizing console output within the project.

Ensuring searchability, consistency, and transparency of logs during development and debugging is essential for maintaining long-term maintainability. This project adopts a standardized logging approach to address the following challenges:

- **Clarification of Method Selection Criteria**: Strict differentiation of appropriate levels (trace/debug/info/warn/error) according to log importance.
- **Uniformity of Format**: Standardization of prefixes (method/scope) and message structure to facilitate mechanical identification and searchability.
- **Improved Traceability**: Explicit indication of occurrence location (context) and processing status (Status) to reduce time spent on problem identification.

These guidelines are based on the design philosophy of the `ConsoleManager` class ([code](../../src/assets/js/lib/user/ConsoleManager/index.ts), [documentation](../../src/assets/js/lib/user/ConsoleManager/doc/README.md)) log level management system, aiming to appropriately classify and normalize all console outputs.

## Log Levels and Method Roles

Based on the log levels defined in the project, methods are used according to the following criteria:

| Method | Level | Purpose / Usage Scenario |
| :--- | :--- | :--- |
| `trace` | 100 | Detailed tracking of execution flow. Investigation requiring complex function call chains or stack traces. |
| `debug` | 200 | For development and debugging. Output of internal states (variable values, confirmation of passing conditional branches, etc.). |
| `info` | 300 | Milestones in normal processing flow (application startup, configuration loading complete, etc.). |
| `warn` | 400 | Warnings. Unexpected but continuable situations (detection of invalid configuration values and application of default values, etc.). |
| `error` | 500 | Exceptions / Critical issues. Interruption of processing or abnormal termination (API failure, logical contradiction, etc.). |

> [!IMPORTANT]
> - `console.log` is **deprecated** in principle; use `info` for new implementations.
> - The `info` method is intended to announce an "overview"; if detailed data is needed, use `debug` in conjunction.
> - `console.group`, `console.groupCollapsed`, `console.groupEnd` are treated as "labels" for visually organizing console output during development and do not apply the message normalization format (`<method>(<scope>):`).

---

## Output Message Standardization Guidelines

Inspired by the **Commitlint (Conventional Commits)** format, we adopt a format that facilitates searchability and mechanical discrimination.

### 1. Message Format Convention

```typescript
// Basic Format
"<method>(<scope>): [<Status>:] <message>", argument
```

- **method**: `ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE` (uppercase fixed)
- **scope**: Area of impact (select from the list below)
- **Status**: Processing status (optional; select from the list below)
- **message**: Concise English in imperative mood (required)
- **argument**: Supplementary data (object, Error object, etc.)

### Regarding Method String Duplication

If the `Add Method Label to debug log` option is enabled in `ConsoleManager`, the automatically assigned label (e.g., `[INFO]`) will duplicate the `method` string. This redundancy is specified as a feature to prioritize `grep` efficiency in the source code (e.g., searching for `ERROR(storage)`).

#### Explicit Location (Optional)

If it is necessary to describe the log's origin in more detail, it is recommended to append `in Location` (where Location is `ClassName.MethodName`, etc.) to the end of the message. Refer to "Appendix: Standardization Template" - "4. Explicit Location" for details.

### 2. Principles of Message Description

1. **Language**: The message body should be written in concise English (imperative mood recommended).
2. **Lowercase Start**: The beginning of the `<message>` part (the verb immediately after the status keyword, if present) should start with a lowercase letter, except for proper nouns.
	- ✅ `Success: initialize configuration`
	- ❌ `Successfully Init the Config.`
3. **Protection of Sensitive Information**: **Never output text containing sensitive information** such as the following:
	- Personally Identifiable Information (PII)
	- Authentication tokens
	- Passwords
	- API keys
4.  **Pre-Initialization Logs**: Logs before `ConsoleManager.apply()` による設定適応前 will not be decorated, but the format itself should adhere to these guidelines.

### 3. Usage of Status Keywords

To emphasize the processing result, the following keywords are prepended to the message:

| Keyword | Category | Judgment Criteria / Usage |
| :--- | :--- | :--- |
| `Success` | Processing Success/Failure | **Successful processing**: The intended operation completed successfully. |
| `Invalid` | Validation | **Invalid input/data**: Function arguments, user input, read data, etc., do not meet the expected type or format. |
| `Failure` | Processing Success/Failure | **Processing failure**: Input is correct, but the executed operation (file operation, saving, etc.) did not complete as expected. |
| `Error` | Anomaly | **Logical anomaly**: Reached a code block that should not be reachable in the program's structure (e.g., missing exhaustive check in `switch` statement). |
| `Exception` | Anomaly | **Caught exception**: Reporting or re-throwing an actual `Error` object caught by `try-catch`, etc. |
| `Valid` | Validation | **Data validity**: Validation results confirm that data or settings are as expected. |

#### Flowchart-like Image for Usage Differentiation

1. **Is input abnormal?** → `Invalid`
2. **Was the intended action (despite correct input) unsuccessful?** → `Failure`
3. **Is the program logic in an impossible state?** → `Error`
4. **Was an exception thrown during execution (from external source)?** → `Exception`

### 4. Criteria for "Error" Status (Supplement)

Even if a caught exception object (`Error`) does not exist, the `Error` status should be specified in the following cases:

- **Logical inconsistency**: Reached a code block that should not be reached (e.g., `default` in a `switch` statement).
- **Missing execution environment**: Essential browser API (`chrome.storage`, etc.) is undefined, or permissions are insufficient.
- **Fatal data deficiency**: Beyond validation failure (`Invalid`), there is a risk of breaking system integrity if continued.
- **API logical error**: Communication itself succeeded, but the response indicates a fatal inconsistency.

### 5. Scope Definition

The `scope` indicating the area of impact should be determined according to the following categories and **priority rules for selection**.

#### Scope Selection Priority Rules

To achieve both log searchability and clarity of context, select the scope according to the following priority:

1. **Functional Scope (Feature/Core/User) is Highest Priority**
	* In principle, prioritize the **"most specific functional scope."**
	* If the log content is directly related to a specific function or module (`storage`, `tab`, `messaging`, `config`, etc.), use the function name as the scope, regardless of where the file is located (`background`, `popup`, etc.).
2. **Entry Point Scope (Main) is only for "Site-Specific" Cases**
	* Use the `Main` category for entry-point-specific lifecycles (startup, termination, event listener registration itself) or UI-specific behaviors (popup open/close, etc.) that do not belong to a specific functional module.
3. **General Purpose Scope (Util) is only for reusable components**
	* Used for logs within pure helper functions (e.g., under `utils/`) that do not contain specific business logic.

#### Scope List

| Category | Description | Example |
| :--- | :--- | :--- |
| **Main** | Entry Point (UI or Entrance) | `background`, `content`, `popup`, `options`, `changelog` |
| **Core** | Fundamental Logic | `config`, `init`, `i18n`, `messaging`, `ui`, `api`, `state` |
| **User** | User Attributes / Operations | `action`, `profile`, `preference` |
| **Feature** | Specific Feature Module | `badge`, `tab`, `filter`, `storage`, `migration`, `queue`, `clipboard` |
| **Util** | General Helper | `date`, `string`, `dom`, `url` |
| **Misc** | Development / Test / Temporary | `test`, `temp` |

> [!TIP]
> - If multiple functions are mixed in the same file, prioritize the function name for which that code block is responsible.
> - `test` is used during test execution (e.g., Vitest), and `temp` is used for temporary tracking during bug fixes.
> - The `throw` method does not require the `<method>(<scope>):` prefix. Refer to "Appendix: Standardization Template" - "5. Throwing Exceptions" for details.

### 6. Argument Passing

Dynamic data should not be embedded in the message string; it must always be separated into the second argument onwards.

- **ERROR / WARN**: Pass the `Error` object or the parameter that caused the issue.
- **INFO / DEBUG / TRACE**: Pass variables necessary for state confirmation. To clarify the context, it is strongly recommended to pass them in an **object format** of `{ VariableName: Value }`. Refer to "Appendix: Standardization Template" - "3. Debug Events" for specific code examples.

---

## Appendix: Standardization Template

### 1. Lifecycle of Processing

| Situation | Example |
| :--- | :--- |
| **Start** | `console.info("INFO(init): start system initialization");` |
| **Complete** | `console.info("INFO(storage): finish configuration processing");` |
| **Success** | `console.info("INFO(storage): Success: save configuration");` |
| **Failure** | `console.error("ERROR(storage): Failure: save configuration", { error });` |

### 2. Data Validation

| Situation | Example |
| :--- | :--- |
| **Invalid Value** | `console.warn("WARN(config): Invalid: 'logLevel' value, use default", { value });` |
| **Invalid Argument** | `console.error("ERROR(api): Invalid: argument supplied to 'createTab'", { args });` |
| **Missing Item** | `console.warn("WARN(api): Invalid: 'url' is missing");` |

### 3. Debug Events

| Situation | Example |
| :--- | :--- |
| **Value Check** | `console.debug("DEBUG(filter): check allowed protocols", { protocols: ["http", "https"] });` |
| **Event Received** | `console.info("INFO(messaging): receive message from popup", { message, sender });` |
| **Grouping** | `console.group("Migrate v1 to v2 (Legacy Data)"); ... console.groupEnd();` |

### 4. Explicit Location

Example of appending `in Location` format to the end of the message to explicitly indicate the log's origin.

| Situation | Example |
| :--- | :--- |
| **Explicit Location** | `ERROR(init): Failure: failed to update options in ConsoleManager.option in ConsoleManager.option` |

### 5. Throwing Exceptions

The `throw` method does not apply the message normalization format.

| Situation | Example |
| :--- | :--- |
| **Throw Exception** | `throw new Error("Invalid configuration detected.");` |

---

## Notes

- **Display Control**: Due to the default `loglevel: 'warn'` setting, logs at `info` level and below will not be displayed in production environments.
- **Appearance**: `ConsoleManager` automatically applies color coding and timestamps according to the method.