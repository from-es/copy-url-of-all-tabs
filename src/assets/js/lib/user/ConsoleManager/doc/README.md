# ConsoleManager

**Last Updated:** February 5, 2026

## Overview

`ConsoleManager` is a static utility class designed to manage the behavior of an application's console output. It provides features for filtering output based on log levels, adding timestamps, and globally enabling/disabling console output.

## Key Features

- **Log Level Management**: Filters console logs to be displayed based on the configured log level.
- **Prefixes and Styling**: When `methodLabel` or `timestamp` options are `true`, a prefix (method label or timestamp) is added to the beginning of the log. This prefix is color-coded according to the log level.
- **Flexible Prefixes**: Individually set `methodLabel` and `timestamp` options to flexibly control the displayed prefix content.
- **Global Control**: All console output can be suppressed at once by setting `logging: false` or `loglevel: 'silent'`.

## Log Levels

Log levels are hierarchical based on importance. Only logs with a level of importance equal to or higher than the level specified in the `loglevel` option will be output.

| Level Name | Level Value | Description                                  |
| :--------- | :---------- | :------------------------------------------- |
| `all`      | `0`         | Outputs all logs (most detailed level)       |
| `trace`    | `100`       | Outputs logs at `trace` level and above      |
| `debug`    | `200`       | Outputs logs at `debug` level and above      |
| `info`     | `300`       | Outputs logs at `info` level and above       |
| `warn`     | `400`       | Outputs logs at `warn` level and above       |
| `error`    | `500`       | Outputs logs at `error` level and above      |
| `silent`   | `1000`      | Suppresses all logs                          |

`console.log` is treated as an `info` level log.

## ConsoleManagerOptions

Options that can be set with the `ConsoleManager.option()` method.

| Property Name    | Type                              | Description                                                                                             | Default Value |
| :--------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------ |
| `logging`        | `boolean`                         | If `true`, enables console output. If `false`, suppresses all output.                                   | `true`        |
| `loglevel`       | `LogLevel`                        | Specifies the minimum log level to output.                                                              | `'warn'`      |
| `methodLabel`    | `boolean`                         | If `true`, a method label (e.g., `[INFO]`) is added to each log.                                        | `true`        |
| `timestamp`      | `boolean`                         | If `true`, a timestamp is added to each log.                                                            | `true`        |
| `timecoordinate` | `'UTC' \| 'GMT'`                  | Specifies the timezone for timestamps.                                                                  | `'UTC'`       |

`LogLevel` Type: `'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'`

## Static Methods

### `option(newOptions: Partial<ConsoleManagerOptions>): void`

Updates `ConsoleManager` settings. The object passed as an argument will be merged with the current settings.
If `newOptions` is not a valid object or contains invalid properties, a `TypeError` will be thrown.

```typescript
ConsoleManager.option({ loglevel: 'debug', timestamp: false });
```

### `apply(): void`

Overrides the behavior of the global `console` object based on the configured options. This method should be called once during application initialization.

```typescript
ConsoleManager.apply();
```

### `restore(): void`

Restores the `console` object to its original state.

```typescript
ConsoleManager.restore();
```

### `state(): { option: ConsoleManagerOptions; method: Record<string, string> }`

Returns a deep copy of the current configuration options and a reference to the color definition object.

```typescript
const currentState = ConsoleManager.state();
console.log(currentState.option.loglevel); // 'warn'
console.log(currentState.method.error);    // 'red'
```

## Usage Examples

```typescript
// Application initialization
function initializeApp() {
	// Overwrites the console with default settings (loglevel: 'warn', timestamp: true, methodLabel: true)
	ConsoleManager.apply();

	console.log("This will not be displayed.");    // level: 'info'
	console.info("This will not be displayed.");   // level: 'info'
	console.debug("This will not be displayed.");  // level: 'debug'
	console.warn("This is a warning.");            // level: 'warn' - Displayed with prefix and color
	console.error("This is an error.");            // level: 'error' - Displayed with prefix and color
}

// When you want to display detailed logs during development
function setupForDevelopment() {
	ConsoleManager.option({ loglevel: 'all' });
	ConsoleManager.apply();

	console.log("Now, this will be displayed."); // level: 'info' - Displayed with prefix and color
}

// Disable only timestamp
function disableTimestamp() {
	ConsoleManager.option({ timestamp: false });
	ConsoleManager.apply();

	console.warn("This warning has a method label, but no timestamp."); // Displays a color-coded method label [WARN]
}

// Disable only method label
function disableMethodLabel() {
	ConsoleManager.option({ methodLabel: false });
	ConsoleManager.apply();

	console.warn("This warning has a timestamp, but no method label."); // Displays a color-coded timestamp
}

// Disable all prefixes
function disableAllPrefixes() {
	ConsoleManager.option({ timestamp: false, methodLabel: false });
	ConsoleManager.apply();

	console.warn("This is a warning without any prefix or color."); // Displays without any prefix or color
}

initializeApp();
setupForDevelopment();
disableTimestamp();
disableMethodLabel();
disableAllPrefixes();