# "Copy URL of All Tabs" User Guide

**Last Updated:** January 16, 2026

## Overview

"Copy URL of All Tabs" is a browser extension designed to streamline your tab management. With a single click, you can copy the URLs of all open tabs to your clipboard or open a list of URLs from your clipboard into new tabs.

> [!NOTE]
> This document targets the **latest version** of the extension. Depending on your version, some features or UI elements may differ from what is described here.

## Basic Usage

Click the extension icon in your browser's toolbar to open the popup menu for basic operations.

- **Copy (Copy URLs)**
	Copies the URLs of all tabs in the current window to the clipboard. The format can be changed on the settings page (defaults to URLs only).

- **Paste (Open Tabs)**
	Opens all URLs from the clipboard into new tabs. It can also automatically find and extract URLs from a larger block of text.

- **Options (Go to Settings)**
	Opens the settings page to customize the extension's behavior in detail.

For more detailed customization, you can visit the settings page via the **Options** button.

---

## Settings (Options)

On the options page, you can finely tune the extension's behavior to fit your workflow. Settings are organized by category.

> [!IMPORTANT]
> After changing any settings, be sure to press the **Save** button in the bottom-left corner. Changes will not be applied until you save them.

### Copy

Manage the format and data type for copying.

- **Format**
	- **Format Type**: Choose from three formats.
		- `text`: Copies only the URLs, separated by newlines.
		- `json`: Copies the title and URL of each tab in JSON format.
		- `custom`: Copies using a custom template.
	- **Custom Template**: Used when `Format Type` is set to `custom`. Define your own format using the variables `$title` (tab title) and `$url` (tab URL).
	- **MIME Type**: Select the data format (MIME type) for the `custom` format, either `text/plain` or `text/html`. This allows applications like Word or Gmail to paste the content with its formatting intact.

### Paste

Manage how URLs from the clipboard are opened in new tabs.

- **Search**
	- **Search for URLs in the clipboard text**: When enabled, this option automatically extracts URLs (starting with `http://` or `https://`) from the entire clipboard text using regular expressions. If disabled, each line is treated as a single URL. **Note that if this option is enabled, protocol filtering will only apply to URLs with `http` and `https` schemes.**

- **Tab**
	- **Open tabs in reverse order**: Opens URLs from the clipboard list in reverse order (bottom to top).
	- **Open in active tab**: Makes the newly opened tabs active (brings them to the front).
	- **New tab position**: Specify where to open new tabs.
		- `default`: Follows the browser's default setting.
		- `first` / `last`: Opens at the beginning or end of the tab bar.
		- `left` / `right`: Opens to the left or right of the currently active tab.
	- **Delay**: Sets a wait time in milliseconds before opening the next tab. This helps reduce the load on your browser when opening many tabs at once.
	- **Custom Delay**: Set individual delay times for specific domains or URL patterns.
		- `Enable (Overall Feature)`: Enables the entire custom delay feature.
		- `Enable (Individual Rule)`: Toggles the enable/disable state for each individual custom delay rule.
		- Use the `Add` button to create rules, setting a URL (prefix match) and a delay time. The list can be reordered via drag-and-drop.

> [!NOTE]
> For more advanced control over the execution order when opening many URLs, please see the "[Advanced Settings](#advanced-settings)" chapter.

### Filtering

Exclude URLs based on specific criteria during copy or paste operations.

- **URL Deduplication**
	- `Deduplicate URLs on Copy`: Consolidates duplicate URLs into a single entry when copying.
	- `Deduplicate URLs on Paste`: Consolidates duplicate URLs into a single entry when pasting.

- **Protocol Filtering**
	- `Filter on Copy` / `Filter on Paste`: Excludes URLs with unallowed protocols during copy or paste actions.
	- `Allowed Protocols`: Select the protocol types to allow (e.g., `http`, `https`, `file`).

- **URL Filtering**
	Excludes URLs that match a specified pattern during copy or paste.
	- `Filter on Copy` / `Filter on Paste`: Enables filtering for each action respectively.
	- `Pattern Matching type`: Choose from four matching methods.
		- `Prefix`: Excludes URLs that start with the specified string.
		- `Substring`: Excludes URLs that contain the specified string.
		- `Exact`: Excludes URLs that exactly match the specified string.
		- `Regular expression`: Excludes URLs that match the specified regular expression.
	- `Filtering Pattern`: Enter the URL patterns to exclude (one pattern per line).

### System

Settings related to the extension's UI and general behavior.

- **Options Page**
	- `Font Size`: Adjusts the font size of the options page itself.

- **Popup Menu**
	- `Font Size`: Adjusts the font size of the popup menu that appears when you click the extension icon.
	- `Clear Message`: Automatically clears completion messages from the popup after a specified number of seconds.
	- `OnClick Close`: Automatically closes the popup menu after a specified number of seconds when a button (Copy/Paste) is clicked.

- **Badge**
	- `Enable`: Displays a badge on the extension icon showing the number of URLs pending to be opened as tabs by the "Paste" feature.
	- `Theme`: Choose a color theme for the badge.
		- `Light` / `Dark`: Use a predefined light or dark theme.
		- `Custom`: Freely set the `Text` (text color) and `Background` (background color).

### Debug

Settings for developers.

- **Output debug log**: Outputs the extension's operational logs to the browser's developer console.
- **Add Timestamp**: Adds a timestamp to the logs.
- **Select Timestamp Type**: Choose the timezone for the timestamp, either `UTC` or `GMT`.

---

## Advanced Settings

### Task Control

Finely control the processing method and execution order when opening a large number of URLs. **This can significantly impact browser performance**, so please use it with a good understanding of what each setting does.

Here, a "task" refers to the entire process of "opening a set of URLs from the clipboard into new tabs."

#### Setting Items

- **Processing Unit**: Determines how URLs are grouped for processing.
	- `Unitary`: Treats each URL as an individual task. This can help distribute the load on the browser when `Append` or `Prepend` is selected for `Execution Order`.
	- `Batch`: Processes URLs in chunks of a specified size (`Number of URLs per Batch`).
	- `Monolithic`: Processes all URLs as a single, large task.

- **Execution Order**: Determines how newly generated tasks are added to the execution queue.
	- `Parallel`: Bypasses the queue and attempts to **open all URLs simultaneously**.
	- `Append`: Adds a new task to the **end of the queue**. It will be processed after any currently running tasks are complete.
	- `Prepend`: Adds a new task to the **front of the queue**. It will be prioritized for processing immediately after the current task finishes.

#### Behavior Examples

- **For `Unitary` or `Batch`:**
	- `Execution Order: Append`: New tasks are processed sequentially after the current ones are finished.
	- `Execution Order: Prepend`: New tasks interrupt the queue and are processed with priority as soon as the current task is done.

- **For `Monolithic`:**
	- The effect of `Execution Order` is limited in this mode, as all URLs are treated as a single task. Once processing begins, no other tasks can interrupt until all URLs have been opened.

#### Caution: Highest Load Combination

**`Processing Unit: Unitary` + `Execution Order: Parallel`**

This combination theoretically results in the highest load when opening tabs.

A large number of URLs, broken into individual tasks by `Unitary`, are sent to the browser simultaneously without any waiting time due to `Parallel`. In this case, the **delay specified in the Paste settings is ignored**.
This can cause a sudden spike in CPU and memory usage, potentially making the browser slow or unresponsive.

> [!IMPORTANT]
> Avoid this combination unless you need to open a small number of URLs (around 5 or fewer) as quickly as possible.

---

## Settings Management

You can save your settings, or export them to a file to use in other environments.

### Import / Export

Save your settings to a file (export) or load them from a file (import). This allows you to easily sync your settings across different computers or browser profiles.

- **Import**: Select a settings file (in JSON format) to load.
- **Export**: Download all current settings as a JSON file.

### Save / Reset

- **Save**: Saves all changes made on the options page.
- **Reset**: Resets all settings to their initial (default) values. This action is not saved until you press the `Save` button.

#### **Note**

When you press the `Save` button, your settings are first validated. If any invalid values are detected, you will be notified about which item has an issue, and the save will be canceled. **The values in the UI will not be automatically corrected**, so please check the notification, fix the values manually, and press `Save` again.

---

## Required Permissions

This extension requires the following permissions to function. Your privacy is respected, and all data is processed locally on your device.

| Permission       | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `tabs`           | Required to access the URL and title of open tabs.         |
| `storage`        | Required to save the extension's settings in the browser. |
| `clipboardRead`  | Required to read URLs from the clipboard for the "Paste" feature. |
| `clipboardWrite` | Required to write URLs to the clipboard for the "Copy" feature.  |

---

## Support

As this extension is provided for free, individual support is not available.

For bug reports or feature requests, please visit the GitHub Issues page.
- [GitHub Issues](https://github.com/from-es/copy-url-of-all-tabs/issues)

## Related Links

- **Source Code:**
	- [from-es/copy-url-of-all-tabs (GitHub)](https://github.com/from-es/copy-url-of-all-tabs)
- **Store Pages:**
	- [Chrome Web Store](https://chromewebstore.google.com/detail/copy-url-of-all-tabs/glhbfaabeopieaeoojdlaboihfbdjhbm)
	- [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/copy-url-of-all-tabs/)