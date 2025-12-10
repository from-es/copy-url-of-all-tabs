# "Copy URL of All Tabs" User Guide

**Last Updated:** December 10, 2025

## Overview

"Copy URL of All Tabs" is a browser extension designed to streamline tab management. With a single click, you can copy the URLs of all currently open tabs to the clipboard or open a list of URLs from the clipboard into new tabs.

## Main Features

Clicking the extension icon in the toolbar will display a popup menu.

- **Copy**: Copies the URLs of all tabs open in the current window to the clipboard.
- **Paste**: Opens all URLs from the clipboard into new tabs.
- **Options**: Opens the detailed settings page for the extension.

---

## Settings

On the options page, you can customize the extension's behavior to fit your workflow. Settings are divided into categories.

**Important:** After changing any settings, be sure to press the **Save** button in the bottom-left corner to apply them. Changes will not take effect until they are saved.

### Copy Settings

Manage the format and data type for copied URLs.

- **Format**
	- **Format Type**: Choose from three formats.
		- `text`: Copies only the URLs, separated by newlines.
		- `json`: Copies the title and URL of each tab in JSON format.
		- `custom`: Copies using a custom template.
	- **Custom Template**: Used when `custom` is selected for `Format Type`. Define your own format using the variables `$title` (tab title) and `$url` (tab URL).
	- **MIME Type**: Select the data format (MIME type) for `custom` format copying, either `text/plain` (plain text) or `text/html` (HTML format). This allows applications like Word or Gmail to interpret the format, enabling you to paste with formatting preserved.

### Paste Settings

Manage the behavior when opening URLs from the clipboard into new tabs.

- **Search**
	- **Search for URLs in the clipboard text**: When enabled, this option automatically extracts URLs (starting with `http://` or `https://`) from the entire clipboard text using regular expressions. If disabled, each line of text is treated as a single URL. **Note: When this option is enabled, protocol filtering will only apply to URLs with `http` and `https`.**

- **Tab**
	- **Open tabs in reverse order**: Opens URLs from the clipboard in reverse order (from bottom to top).
	- **Open in active tab**: Makes the newly opened tabs active (displayed in the foreground).
	- **New tab position**: Specifies the position where new tabs are opened.
		- `default`: Follows the browser's default setting.
		- `first` / `last`: Opens at the beginning or end of the tab bar.
		- `left` / `right`: Opens to the left or right of the currently active tab.
	- **Delay**: Sets the waiting time in milliseconds before opening the next tab. This helps reduce the load on the browser when opening many tabs at once.
	- **Custom Delay**: Allows you to set individual delay times for specific domains or URL patterns.
		- `Enable`: Enables this feature.
		- Add rules using the `Add` button, specifying a URL (exact match) and a delay time. The list can be reordered via drag-and-drop.

- **Task Control**
	Provides fine-grained control over how numerous URLs are processed and executed. For details, see the "[Advanced Settings](#advanced-settings)" section.

### Filtering Settings

Exclude URLs based on specific criteria during copy or paste operations.

- **URL Deduplication**
	- `Deduplicate URLs on Copy`: Consolidates duplicate URLs into a single entry upon copying.
	- `Deduplicate URLs on Paste`: Consolidates duplicate URLs into a single entry upon pasting.

- **Protocol Filtering**
	- `Filter on Copy` / `Filter on Paste`: Excludes URLs with unallowed protocols during copy or paste actions.
	- `Allowed Protocols`: Select the types of protocols to allow (e.g., `http`, `https`, `file`).

- **URL Filtering**
	Excludes URLs that match a specified pattern during copy or paste actions.
	- `Filter on Copy` / `Filter on Paste`: Enables filtering for each respective action.
	- `Pattern Matching type`: Choose from four matching methods.
		- `Prefix`: Excludes URLs that start with the specified string.
		- `Substring`: Excludes URLs that contain the specified string.
		- `Exact`: Excludes URLs that exactly match the specified string.
		- `Regular expression`: Excludes URLs that match the specified regular expression.
	- `Filtering Pattern`: Enter the URL patterns to be excluded (one pattern per line).

### System Settings

Configure the extension's UI and general behavior.

- **Options Page**
	- `Font Size`: Adjusts the font size of the options page itself.

- **Popup Menu**
	- `Font Size`: Adjusts the font size of the popup menu that appears when you click the extension icon.
	- `Clear Message`: Automatically clears completion messages from the popup after a specified number of seconds.
	- `OnClick Close`: Automatically closes the popup menu a specified number of seconds after a button (Copy/Paste) is clicked.

- **Badge**
	- `Enable`: Displays the number of URLs waiting to be opened via the "Paste" function as a badge on the extension icon.
	- `Theme`: Selects the color scheme for the badge.
		- `Light` / `Dark`: Uses a predefined light or dark theme.
		- `Custom`: Allows you to freely set the `Text` (text color) and `Background` (background color).

### Debug Settings

Settings for developers.

- **Output debug log**: Outputs the extension's operational logs to the browser's developer console.
- **Add Timestamp**: Adds a timestamp to the logs.
- **Select Timestamp Type**: Select the timestamp's time zone from `UTC` or `GMT`.

## Advanced Settings

### Task Control

Provides fine-grained control over how numerous URLs are processed and executed. **This can significantly impact browser performance**, so please use it with a clear understanding of the settings.

A "task" here refers to the entire process of "reading a group of URLs from the clipboard and opening them as new tabs."

#### Configuration Items

- **Processing Unit**: Determines how URLs are grouped for processing.
	- `Unitary`: Treats each URL as an individual task. When combined with `Append` or `Prepend` in `Execution Order`, this can help distribute the load on the browser.
	- `Batch`: Groups URLs into chunks of a specified size (`Number of URLs per Batch`) and processes them as groups.
	- `Monolithic`: Processes all URLs as a single, large task.

- **Execution Order**: Determines how generated tasks are added to the execution queue.
	- `Parallel`: Bypasses the queue and attempts to **open all URLs simultaneously**.
	- `Append`: Adds new tasks to the **end of the queue**. They will be processed after any currently running tasks are finished.
	- `Prepend`: Adds new tasks to the **front of the queue**. They will be prioritized for processing immediately after the current task finishes.

#### Behavior Examples for Combinations

- **For `Unitary` or `Batch`:**
	- `Execution Order: Append`: New tasks are processed sequentially after the current task completes.
	- `Execution Order: Prepend`: New tasks interrupt the queue and are processed with priority as soon as the current task finishes.

- **For `Monolithic`:**
	- In this mode, `Execution Order` has a limited effect because all URLs are treated as a single large task. Once processing begins, no other tasks can interrupt until all URLs are opened.

#### Warning: Highest Load Combination

**`Processing Unit: Unitary` + `Execution Order: Parallel`**

This combination theoretically results in the highest load when opening tabs.

A large number of URLs, decomposed into individual tasks by `Unitary`, are sent to the browser simultaneously without any waiting time by `Parallel`. In this case, **any delay specified in the `Paste` settings is ignored**.
This can cause a sudden spike in CPU and memory usage, potentially leading to significant browser slowdowns or unresponsiveness.

**It is strongly recommended to avoid this combination unless you need to open a small number of URLs (up to about 5) as quickly as possible.**

---

## Configuration Management

### Import / Export

You can save your settings as a file (export) or load them from a file to restore them (import). This allows for easy synchronization of settings between different computers or browser profiles.

- **Import**: Select a settings file (in JSON format) to load.
- **Export**: Downloads all current settings as a JSON file.

### Save / Reset

- **Save**: Saves all changes made on the options page.
- **Reset**: Resets all settings to their initial default values. This action is not saved until you press the `Save` button.

#### **Note**

When you press the `Save` button, your settings are first validated. If any invalid values are detected, you will be notified which items have issues, and the save will be canceled. **The values in the UI will not be automatically corrected**, so please review the notification, manually correct the values, and press `Save` again.

---

## Required Permissions

This extension requires the following permissions to function. Your privacy is respected, and all data is processed locally on your device.

| Permission       | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `tabs`           | Needed to access the URLs and titles of open tabs.         |
| `storage`        | Needed to save the extension's settings in the browser.    |
| `clipboardRead`  | Needed to read URLs from the clipboard for the "Paste" function. |
| `clipboardWrite` | Needed to write URLs to the clipboard for the "Copy" function.     |

---

## Support

As this is a free extension, personalized support is not provided.

Please report any issues or feature requests on the GitHub Issues page.
- [GitHub Issues](https://github.com/from-es/copy-url-of-all-tabs/issues)

## Related Links

- **Source Code:**
	- [from-es/copy-url-of-all-tabs (GitHub)](https://github.com/from-es/copy-url-of-all-tabs)
- **Store Pages:**
	- [Chrome Web Store](https://chromewebstore.google.com/detail/copy-url-of-all-tabs/glhbfaabeopieaeoojdlaboihfbdjhbm)
	- [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/copy-url-of-all-tabs/)