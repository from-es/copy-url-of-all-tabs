# BrowserEnvironment Library Technical Specification & Operation Specification

*   Created Date: July 19, 2025
*   Last Updated: July 19, 2025

## Overview

The `BrowserEnvironment` library is a utility for obtaining web browser environment information (browser name, version, OS, device, CPU, language, etc.). It utilizes both [User-Agent Client Hints (UA-CH)](#user-agent-client-hints) and `navigator.userAgent` (User-Agent string) to acquire information, prioritizing the newer API. Its design, which considers integration with external libraries ([bowser](#bowser), etc.), encapsulates dependencies on these libraries, making it easier to adapt to future library changes.

## Technical Specification

### Classes

#### `BrowserEnvironment`

The main class for obtaining browser environment information.

*   **Properties:**
    *   `static readonly #template`: A template object of type `BrowserEnvironmentResult`. Used as a base for initial values and error results.
    *   `static readonly #parser`: An instance of `UserAgentParser`. Used for parsing User-Agent strings.
    *   `static readonly #useLibrary`: The name of the external library used by `UserAgentParser` ([bowser](#bowser), etc.).
    *   `static readonly #highEntropyValueHints`: An array of hints for [High-Entropy Values](#high-entropy-values) obtained from [User-Agent Client Hints](#user-agent-client-hints).
*   **Methods:**
    *   `async get(): Promise<BrowserEnvironmentResult>`:
        *   Asynchronously obtains browser environment information.
        *   If `navigator.userAgentData` is available, it calls `getUserAgentClientHints()`; otherwise, it calls `getUserAgent()`. 
        *   If neither is available, it returns an error result.
        *   If an unexpected error occurs, it logs the error to the console and returns an error result.
    *   `#createErrorResult(message: string): BrowserEnvironmentResult` (private):
        *   Creates a `BrowserEnvironmentResult` object containing an error message.
    *   `static #createChecker(isSuccess: boolean, message: string | undefined, worker: { main: string | undefined; sub: string | undefined }): CheckerInfo` (private, static):
        *   Creates a `CheckerInfo` object indicating the success/failure of the process, a message, and the source of information.
    *   `static #createInformationTemplate(): BrowserEnvironmentResult` (private, static):
        *   Creates an initial template for `BrowserEnvironmentResult`.
    *   `#createBrowserEnvironmentResult(information: BrowserEnvironmentResult, pluginInfo: PluginValue, checker: CheckerInfo): BrowserEnvironmentResult` (private):
        *   Merges the template, plugin information, and checker information to create the final `BrowserEnvironmentResult`.
    *   `async #getUserAgentClientHints(): Promise<BrowserEnvironmentResult>` (private):
        *   Obtains browser environment information using `navigator.userAgentData`.
        *   Calls `getHighEntropyValues` to obtain [High-Entropy Values](#high-entropy-values).
        *   Maps the obtained information to the `BrowserEnvironmentResult` format.
        *   Calls `#patchClientHintsFromUserAgent` to supplement information from the User-Agent string.
    *   `#getUserAgent(): BrowserEnvironmentResult` (private):
        *   Obtains browser environment information using `navigator.userAgent`.
        *   Uses `UserAgentParser` to parse the User-Agent string and obtain information.
    *   `#patchClientHintsFromUserAgent(information: BrowserEnvironmentResult): BrowserEnvironmentResult` (private):
        *   Supplements information obtained from [User-Agent Client Hints](#user-agent-client-hints) with results from User-Agent string parsing.

#### `UserAgentParser`

A wrapper class for parsing User-Agent strings.

*   **Constructor:**
    *   `constructor()`: No specific initialization process.
*   **Methods:**
    *   `parse(): PluginValue | null`:
        *   If `navigator.userAgent` exists, it calls `UserAgentParserPlugin.execute()` to parse the User-Agent string.
        *   Returns the parsed result in `PluginValue` format.
        *   If `navigator.userAgent` does not exist or parsing fails, it returns a default object with undefined properties.

### Plugin (`plugins/bowser.ts`)

#### `UserAgentParserPlugin`

A plugin that uses the [bowser](#bowser) library to parse User-Agent strings.

*   **Properties:**
    *   `information`: Plugin metadata (`name`, `useLibrary`, `version`, `lastupdate`). `useLibrary` is set to `"bowser"`.
*   **Methods:**
    *   `execute(): PluginValue | null`:
        *   Returns `null` if `navigator.userAgent` does not exist.
        *   Uses `bowser.getParser(userAgent)` to parse the User-Agent string and obtains the result with `agent.getResult()`.
        *   Extracts browser, engine, and OS information from the obtained result and returns it in `PluginValue` format.
        *   Returns `null` if the parsing result is invalid.

### Type Definitions (`types.ts`)

*   `CheckerInfo`: An object containing success/failure status, a message, and information sources (`main`, `sub`).
*   `BrowserEnvironmentInfo`: An object containing environment information such as browser, engine, device, CPU, OS, and language.
*   `BrowserEnvironmentResult`: The final result object, combining `CheckerInfo` and `BrowserEnvironmentInfo`.
*   `UserAgentDataBrand`: Brand information for [User-Agent Client Hints](#user-agent-client-hints) (`brand`, `version`).
*   `UserAgentDataValues`: Detailed [User-Agent Client Hints](#user-agent-client-hints) values returned by `navigator.userAgentData.getHighEntropyValues()`.
*   `NavigatorUserAgentData`: Extends the `Navigator` interface to define the `userAgentData` property and `getHighEntropyValues` method.
*   `PluginInformation`: Plugin metadata (`name`, `useLibrary`, `version`, `lastupdate`).
*   `PluginValue`: Browser, engine, and OS information returned by the plugin.
*   `UserAgentParserInformation`: An object containing plugin information and an execution function.

### Dependencies

*   **Internal Dependencies:**
    *   `./UserAgentParser`: Responsible for User-Agent string parsing.
    *   `./types`: Type definitions.
    *   `./plugins/bowser`: A wrapper for the external library ([bowser](#bowser)) used by `UserAgentParser` for User-Agent string parsing.
*   **External Dependencies:**
    *   `bowser`: Used for User-Agent string parsing.

### Browser API Usage

*   `navigator.userAgentData`: [User-Agent Client Hints](#user-agent-client-hints) API.
*   `navigator.userAgent`: User-Agent string.

## Operation Specification

### 1. Priority of Environment Information Acquisition

The `get()` method of the `BrowserEnvironment` class obtains browser environment information in the following priority:

1.  **[User-Agent Client Hints (UA-CH)](#user-agent-client-hints):**
    *   If this API is available, it first uses `getHighEntropyValues()` to obtain detailed information.
    *   The obtained information (`brands`, `platform`, `mobile`, `architecture`, `bitness`, `model`, `fullVersionList`, etc.) is mapped to the `BrowserEnvironmentResult` format.
    *   Subsequently, `UserAgentParser` is used to supplement information from `navigator.userAgent`. This is to compensate for some information (e.g., OS version name) that [User-Agent Client Hints](#user-agent-client-hints) does not provide.
2.  **`navigator.userAgent` (User-Agent string):**
    *   If `navigator.userAgentData` is not available, `navigator.userAgent` is used.
    *   The `UserAgentParser` class, via `UserAgentParserPlugin`, parses this User-Agent string and extracts information such as browser, engine, and OS.
3.  **Information Not Obtainable:**
    *   If neither `navigator.userAgentData` nor `navigator.userAgent` is available, an error result is returned.

### 2. Structure of the Result Object

The `BrowserEnvironmentResult` object returned by the `get()` method has the following main properties:

*   `checker`:
    *   `isSuccess`: A boolean value indicating whether information acquisition was successful.
    *   `message`: A message regarding information acquisition (success/failure, API used, etc.).
    *   `worker`: The primary API used for information acquisition (`main`) and auxiliary information sources (`sub`).
*   `ua`: The value of `navigator.userAgent` (if present).
*   `browser`: Browser name and version.
*   `engine`: Rendering engine name and version.
*   `device`: Whether it's a mobile device, and the model name.
*   `cpu`: CPU architecture and bitness.
*   `os`: OS name, version, and version name.
*   `language`: Browser language setting.

### 3. Error Handling

*   If `navigator.userAgentData` or `navigator.userAgent` is not supported, a `BrowserEnvironmentResult` containing an appropriate error message is returned.
*   If an unexpected error occurs within the `get()` method, the error is logged to the console, and a generic error message is returned in the `BrowserEnvironmentResult`.

### 4. Plugin System

*   The `UserAgentParser` class functions as a wrapper for using external libraries ([bowser](#bowser), etc.) for User-Agent string parsing.
*   `UserAgentParserPlugin`, defined in `plugins/bowser.ts`, uses the specific parsing library [bowser](#bowser) to parse User-Agent strings.
*   This separates the User-Agent parsing logic from the core logic of `BrowserEnvironment`, making it easier to switch to different parsing libraries in the future.

### 5. Information Supplementation

*   Even when [User-Agent Client Hints](#user-agent-client-hints) are available, the results of User-Agent string parsing by `UserAgentParser` are applied via the `#patchClientHintsFromUserAgent` method. This is to compensate for some information (e.g., OS version name) that [User-Agent Client Hints](#user-agent-client-hints) does not provide or is complex to obtain.

---

## File Roles and Placement

```
.
└── BrowserEnvironment/
     ├── types.ts            <-- Type definition file: Defines types for all data structures used in the library
     ├── index.ts            <-- Main entry point: Integrates the logic for obtaining browser environment information
     ├── UserAgentParser.ts  <-- User-Agent parsing wrapper: Encapsulates external libraries (bowser) and parses User-Agent strings
     ├── plugins/            <-- Plugin directory: Integration of actual User-Agent parsing libraries (bowser) 
     │    └── bowser.ts      <-- Bowser plugin: Parses User-Agent strings via the bowser library and formats the results
     │
     └─ doc/                 <-- Documentation directory: Explanations and supplementary information about the library
         ├── navigator.userAgentData.md
         ├── README.en.md
         └── README.ja.md

```

### Library Usage Example

This library asynchronously obtains browser environment information.

```typescript
import { BrowserEnvironment } from './BrowserEnvironment/index';

async function getBrowserInfo() {
  const browserEnv = new BrowserEnvironment();

  try {
    const info = await browserEnv.get();
    console.log('Browser Environment Information:', info);
  } catch (error) {
    console.error('Failed to get browser environment information:', error);
  }
}

getBrowserInfo();
```

### Example of Output Data

An example of the `BrowserEnvironmentResult` object returned by the `browserEnv.get()` method.
This is based on the `BrowserEnvironmentResult` type defined in `types.ts`.

```json
{
  "checker": {
    "isSuccess": true,
    "message": "This Browser can get User-Agent Client Hints. 'navigator.userAgentData' is supported. Obtain information from navigator.userAgentData and supplement it with bowser.",
    "worker": {
      "main": "navigator.userAgentData",
      "sub": "bowser"
    }
  },
  "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "browser": {
    "name": "Chrome",
    "version": "126.0.0.0"
  },
  "engine": {
    "name": "Blink",
    "version": "126.0.0.0"
  },
  "device": {
    "mobile": false,
    "model": ""
  },
  "cpu": {
    "architecture": "x86",
    "bitness": "64"
  },
  "os": {
    "name": "Windows",
    "version": "10",
    "versionName": "" // If not obtainable by the library or Client Hints
  },
  "language": "ja"
}
```

---

## Glossary

<a id="user-agent-client-hints"></a>
#### User-Agent Client Hints (UA-CH)

A new mechanism that replaces the traditional User-Agent string, allowing websites to obtain more granular and privacy-preserving browser environment information (browser name, version, OS, etc.). Browsers do not send detailed information unless explicitly requested by the website.

*   MDN Web Docs: [User-Agent Client Hints API](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API)

<a id="high-entropy-values"></a>
#### High-Entropy Values

In User-Agent Client Hints, these refer to more detailed browser environment information (e.g., exact OS version, CPU architecture, device model) that has a higher potential for identifying users. For privacy protection, this information is only provided when explicitly requested by the website as a "hint."

<a id="bowser"></a>
#### bowser

A JavaScript library for parsing User-Agent strings and extracting information such as browser, OS, and device. In the `BrowserEnvironment` library, it is used to supplement information that cannot be obtained via User-Agent Client Hints or in environments where Client Hints are not available.

*   Official Website: [https://bowser-js.github.io/bowser/](https://bowser-js.github.io/bowser/)
*   GitHub: [https://github.com/bowser-js/bowser](https://github.com/bowser-js/bowser)

## License

This project is licensed under the [MIT License](../../../../../../../LICENSE.md).