# Copy URL of All Tabs

**Last Updated:** August 11, 2025

## Overview

"Copy URL of All Tabs" is a Chrome extension that allows you to easily manage tab URLs. With a single click, you can copy the URLs of all open tabs in the current window to your clipboard. You can also paste a list of URLs from your clipboard to open them all in new tabs.

## Features

This extension provides the following features:

1.  **Click the extension icon** in the Chrome toolbar to open the popup menu.
2.  From the popup menu, click the action you want to perform (Copy, Paste, Options).
    *   **Copy:** Copies the URLs of all tabs in the active window to the clipboard. The format of the copied text can be customized in the options.
    *   **Paste:** Reads a list of URLs from the clipboard and opens each one in a new tab. The behavior of how tabs are opened is configurable.
    *   **Options:** Opens the extension's settings page.

### Options Page

You can customize the extension's behavior to fit your workflow. The settings are organized into the following categories:

#### Copy

*   **Format:** Controls the format of the text copied to the clipboard.
    *   **Format Type:** Choose between `text` (list of URLs), `json` (structured with titles and URLs), or `custom`.
    *   **Custom Template:** If `custom` is selected, you can define your own format using `$title` and `$url` as placeholders.
    *   **MIME Type:** For the `custom` format, you can set the MIME type of the copied data (e.g., `text/plain` or `text/html`).

#### Paste

*   **Search:**
    *   **Search for URLs:** When enabled, the extension uses a regular expression to find URLs within the entire clipboard text. If disabled, it treats each line of the text as a potential URL.
*   **Tab:** Controls how new tabs are opened.
    *   **Reverse Order:** Open tabs in the reverse order of how they appear in your clipboard.
    *   **Active Tab:** Open new tabs as active (focused) tabs.
    *   **Position:** Choose where new tabs are opened (e.g., next to the current tab, at the beginning/end of the tab list).
    *   **Delay (Common):** Set a general delay (in milliseconds) to wait before opening the next tab.
    *   **Custom Delay:** Define rules to set specific delay times for URLs that match certain patterns.

#### Filtering

*   **Enable Filtering:** You can enable or disable URL filtering independently for the **Copy** and **Paste** actions.
*   **Allowed Protocols:** When filtering is enabled, only URLs with the selected protocols will be processed (e.g., `http`, `https`, `file`, etc.).

#### System

*   **Options Page:**
    *   **Font Size:** Adjust the font size for the options page itself.
*   **Popup Menu:**
    *   **Font Size:** Adjust the font size for the popup menu.
    *   **Clear Message:** Automatically clear success or error messages in the popup after a set number of seconds.
    *   **OnClick Close:** Automatically close the popup menu after an action (like Copy or Paste) is performed.

#### Debug

*   **Enable Logging:** Output debug information to the browser's developer console.
*   **Add Timestamp:** Add a timestamp to the debug logs.
*   **Time Coordinate:** Choose the time coordinate for the timestamp (UTC or GMT).

#### Import / Export

Allows you to export your current settings to a file or import settings from a file. Click the 'Export' button to save your settings to a JSON file, or click 'Import' and select a JSON file to load previously saved settings. This is useful for backing up your configuration or sharing it across different browsers or profiles.

#### Save / Reset

*   **Save:** Saves all changes made on the settings page. Changes will not take effect until this button is clicked.
*   **Reset:** Resets all settings to their original defaults. This action cannot be undone.

## Permissions Required

This extension requires the following permissions to function correctly:

| Permission       | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `tabs`           | To access the URLs and titles of your open tabs.                     |
| `storage`        | To save your custom settings.                                        |
| `clipboardRead`  | To read the list of URLs from the clipboard when using the "Paste" feature. |
| `clipboardWrite` | To save the list of URLs to the clipboard when using the "Copy" feature.   |

Your privacy is respected. This extension processes all data locally on your device.

## Related Links

- [Copy URL of All Tabs - Chrome Web Store](https://chromewebstore.google.com/detail/copy-url-of-all-tabs/glhbfaabeopieaeoojdlaboihfbdjhbm "Copy URL of All Tabs - Chrome Web Store")
- [from-es/copy-url-of-all-tabs - Github](https://github.com/from-es/copy-url-of-all-tabs "https://github.com/from-es/copy-url-of-all-tabs")
