# ConfigManager

**Last Updated:** October 3, 2025

A utility class for handling the import and export of application configuration files.

## Overview

`ConfigManager` provides static methods to manage configuration data. It is designed to be independent of any UI framework, focusing solely on file operations. The caller is responsible for processing the data and updating the UI.

- **Import**: Reads a user-selected text file (e.g., JSON) and returns its content as a string.
- **Export**: Takes a string (e.g., a stringified JSON object) and triggers a browser download for the user to save it as a file.

## Methods

### `importFile(mimetype)`

Displays a file open dialog for the user to select a configuration file. It returns a promise that resolves with an `ImportResult` object.

- **`mimetype`**: `MimeType` - The MIME type of the file to import (e.g., `"application/json"`).

**Returns**: `Promise<ImportResult>`

#### `ImportResult` Object

| Property       | Type      | Description                                                                 |
| :------------- | :-------- | :-------------------------------------------------------------------------- |
| `action`       | `"import"`  | Indicates the type of action performed.                                     |
| `success`      | `boolean` | `true` if the file was read successfully, otherwise `false`.                |
| `message`      | `string`  | A message describing the result of the operation.                           |
| `content`      | `string`  | The text content of the file if successful, otherwise `undefined`.          |
| `isUserCancel` | `boolean` | `true` if the user canceled the file dialog, otherwise `false`.             |
| `error`        | `Error`   | The `Error` object if an error occurred (excluding user cancellation). |

### `exportFile(content, filename, mimetype)`

Triggers a browser download for the provided content.

- **`content`**: `string` - The content to be saved to the file.
- **`filename`**: `string` - The default filename for the downloaded file.
- **`mimetype`**: `MimeType` - The MIME type of the file.

**Returns**: `ExportResult`

#### `ExportResult` Object

| Property  | Type       | Description                                                 |
| :-------- | :--------- | :---------------------------------------------------------- |
| `action`  | `"export"` | Indicates the type of action performed.                     |
| `success` | `boolean`  | `true` if the export was initiated successfully, otherwise `false`. |
| `message` | `string`   | A message describing the result of the operation.           |
| `error`   | `Error`    | The `Error` object if an error occurred.                    |

## Custom Error

### `UserCancelError`

This error is thrown when the user closes the file selection dialog without choosing a file. The `importFile` method catches this error and sets the `isUserCancel` flag in the `ImportResult` object to `true`.

## Types

### `MimeType`

The following MIME types are supported:

- `"text/csv"`
- `"application/x-ini"`
- `"application/json"`
- `"text/plain"`
- `"application/toml"`
- `"application/x-yaml"`

## Example

```typescript
import { ConfigManager } from "./ConfigManager";

async function handleImport() {
  const result = await ConfigManager.importFile("application/json");

  if (result.isUserCancel) {
    console.log("User canceled file import.");
    return;
  }

  if (result.success && result.content) {
    console.log("Imported content:", result.content);
    // Process the configuration content...
  } else {
    console.error("Import failed:", result.message, result.error);
  }
}

function handleExport() {
  const myConfig = { theme: "dark", notifications: true };
  const content = JSON.stringify(myConfig, null, 2);
  const result = ConfigManager.exportFile(content, "my-config.json", "application/json");

  if (result.success) {
    console.log("Export initiated successfully.");
  } else {
    console.error("Export failed:", result.message, result.error);
  }
}
```