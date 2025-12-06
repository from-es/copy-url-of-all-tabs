# User Guide for "Copy URL of All Tabs"

**Last Updated:** November 10, 2025

## Overview

"Copy URL of All Tabs" is a browser extension designed to streamline your tab management. With a single click, you can copy the URLs of all open tabs to the clipboard or open a list of URLs from your clipboard into new tabs.

## Core Features

Click the extension icon in your browser's toolbar to open the popup menu.

- **Copy**: Copies the URLs of all tabs in the current window to the clipboard.
- **Paste**: Opens all URLs listed in the clipboard, each in a new tab.
- **Options**: Opens the detailed settings page for the extension.

---

## Settings

On the options page, you can customize the extension's behavior in detail. Settings are organized by category.

**Important:** After changing any settings, you must click the **Save** button at the bottom left of the screen. Changes will not be applied until they are saved.

### Copy Settings

Manage the format and data type of the content you copy.

- **Format**
  - **Format Type**: Choose from three formats.
	 - `text`: Copies only the URLs, separated by newlines.
	 - `json`: Copies the tab titles and URLs in JSON format.
	 - `custom`: Copies using your own defined template.
  - **Custom Template**: When `custom` is selected, you can define your own format using the variables `$title` (tab title) and `$url` (tab URL).
  - **MIME Type**: For the `custom` format, you can select the data's MIME type, such as `text/plain` (plain text) or `text/html` (HTML format). This allows applications like Word or Gmail to interpret the format, enabling you to paste content while preserving its structure.

### Paste Settings

Manage how URLs from the clipboard are opened in new tabs.

- **Search for URLs**
  - **Search for URLs in the clipboard text**: When enabled, this option uses a regular expression to automatically extract URLs (starting with `http://` or `https://`) from the entire text in the clipboard. If disabled, each line of text is treated as a single URL. **Note: When this option is enabled, protocol filtering will only apply to URLs with `http` and `https`.**

- **Tab Behavior**
  - **Open tabs in reverse order**: Opens URLs from the clipboard list in reverse order (from bottom to top).
  - **Open in active tab**: Opens new tabs in an active (front-facing) state.
  - **New tab position**: Specifies where new tabs are opened.
	 - `default`: Follows your browser's default setting.
	 - `first` / `last`: Opens at the beginning or end of the tab bar.
	 - `left` / `right`: Opens to the left or right of the currently active tab.
  - **Delay**: Sets the waiting time in milliseconds before opening the next tab. This helps reduce the load on your browser when opening many tabs at once.
  - **Custom Delay**: Allows you to set specific delay times for particular domains or URL patterns.
	 - `Enable`: Activates this feature.
	 - Use the `Add` button to create rules, specifying a URL (exact match) and a delay time. The list can be reordered via drag-and-drop.

- **Task Control**
  Provides fine-grained control over how multiple URLs are processed and executed. For details, see the "[Advanced Settings](#advanced-settings)" section.

### Filtering Settings

Exclude URLs based on specific criteria during copy or paste actions.

- **URL Deduplication**
  - `Deduplicate URLs on Copy`: Consolidates duplicate URLs into a single entry when copying.
  - `Deduplicate URLs on Paste`: Consolidates duplicate URLs into a single entry when pasting.

- **Protocol Filtering**
  - `Filter on Copy` / `Filter on Paste`: Excludes URLs with non-permitted protocols when copying or pasting.
  - `Allowed Protocols`: Select the protocol types to be processed (e.g., `http`, `https`, `file`).

### System Settings

Configure the extension's own UI and behavior.

- **Options Page**
  - `Font Size`: Adjusts the font size of the options page itself.

- **Popup Menu**
  - `Font Size`: Adjusts the font size of the popup menu that appears when you click the extension icon.
  - `Clear Message`: Automatically clears completion messages in the popup after a specified number of seconds.
  - `OnClick Close`: Automatically closes the popup menu after a specified number of seconds following an action (Copy/Paste).

- **Badge**
  - `Enable`: Displays the number of URLs waiting to be opened as tabs by the "Paste" feature on the extension icon.
  - `Theme`: Selects the color theme for the badge.
    - `Light` / `Dark`: Uses predefined light or dark themes.
    - `Custom`: Sets `Text` (text color) and `Background` (background color) freely.

### Debug Settings

Settings for developers.

- **Output debug log**: Prints the extension's operational logs to the browser's developer console.
- **Add Timestamp**: Adds a timestamp to the debug logs.
- **Select Timestamp Type**: Choose the timezone for the timestamp (`UTC` or `GMT`).

## Advanced Settings

### Task Control Details

This section provides fine-grained control over how multiple URLs are processed and executed. As these settings significantly impact browser performance, please ensure you understand them before making changes.

Here, "task" refers to a series of operations that open a group of URLs read from the clipboard as new tabs.

#### Configuration Items

- **Processing Unit**: Determines how URLs are grouped for processing.
  - `Unitary`: Treats each URL as a single, individual task. If you choose `Append` or `Prepend` in the `Execution Order` below, this can help distribute the load on your browser.
  - `Batch`: Processes URLs in groups (chunks) of a specified size (`Number of URLs per Batch`).
  - `Monolithic`: Processes all URLs as a single, large task.

- **Execution Order**: Determines how generated tasks are added to the execution queue (a waiting line for tasks).
  - `Parallel`: Bypasses the queue and attempts to open all URLs simultaneously.
  - `Append`: Adds the new task to the end of the queue. It will be processed after any currently running tasks are complete.
  - `Prepend`: Adds the new task to the front of the queue. It will be processed immediately after the currently running task is complete.

#### Behavior Examples

- **For `Unitary` or `Batch` mode:**
	- `Execution Order: Append`: The new task is processed sequentially after the current tasks are finished.
	- `Execution Order: Prepend`: The new task is prioritized and jumps to the front of the line to be processed next.

- **For `Monolithic` mode:**
	- In this mode, the effect of the `Execution Order` is limited because all URLs are treated as a single, uninterruptible task.

#### Warning: Maximum Load Combination

**`Processing Unit: Unitary` + `Execution Order: Parallel`**

This combination theoretically results in the highest possible load when opening tabs.

A large number of URLs, broken into individual tasks by `Unitary`, are sent to the browser simultaneously by `Parallel`. When this happens, any **delay settings you have configured are completely ignored**.
This can cause a sharp spike in CPU and memory usage, potentially leading to significant browser slowdowns or unresponsiveness.

**It is strongly recommended to avoid this combination, except when you need to open a very small number of URLs (e.g., up to 5) as quickly as possible.**

---

## Settings Management

### Import / Export

You can save your settings to a file (export) or load them from a file (import). This is useful for syncing your configuration across different computers or browser profiles.

- **Import**: Select a settings file (in JSON format) to load.
- **Export**: Downloads all your current settings as a JSON file.

### Save / Reset

- **Save**: Saves all changes made on the options page.
- **Reset**: Resets all settings to their original default values. This action will not be saved until you click the `Save` button.

#### **Important Notice**

When you click the `Save` button, the settings values are first validated. If any invalid values are detected, you will be notified which items have issues, and the save process will be canceled. **The values in the UI will not be automatically corrected**, so please review the notification, correct the values manually, and then click the `Save` button again.

---

## Permissions Required

This extension requires the following permissions to function. Your privacy is respected, and all data is processed locally on your device.

| Permission       | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `tabs`           | Required to access the URLs and titles of your open tabs.            |
| `storage`        | Required to save the extension's settings in your browser.           |
| `clipboardRead`  | Required to read the list of URLs from the clipboard for the "Paste" feature. |
| `clipboardWrite` | Required to write the list of URLs to the clipboard for the "Copy" feature.   |

---

## Support

As this is a free extension, we are unable to provide personalized support.

For bug reports or feature requests, please submit them on our GitHub Issues page.
- [GitHub Issues](https://github.com/from-es/copy-url-of-all-tabs/issues)

## Related Links

- **Source Code:**
  - [from-es/copy-url-of-all-tabs (GitHub)](https://github.com/from-es/copy-url-of-all-tabs)
- **Store Pages:**
  - [Chrome Web Store](https://chromewebstore.google.com/detail/copy-url-of-all-tabs/glhbfaabeopieaeoojdlaboihfbdjhbm)
  - [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/copy-url-of-all-tabs/)