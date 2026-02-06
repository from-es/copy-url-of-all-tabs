# "Copy URL of All Tabs" User Guide

**Last Updated:** February 6, 2026

## Overview

"Copy URL of All Tabs" is an extension designed to streamline browser tab management. With a single click, you can copy the URLs of all currently open tabs to your clipboard, or open a group of URLs from your clipboard as new tabs.

> [!NOTE]
> This document targets the **latest version** of the extension. Depending on your extension's version, some features or screen displays may differ from what is described here.

## Basic Usage

Clicking the extension icon in the toolbar will display a popup menu. From here, you can perform basic operations.

- **Copy (Copy URLs)**
	Copies the URLs of all currently open tabs to the clipboard. The copy format can be changed in the settings screen. (Default is URL only)

- **Paste (Open Tabs)**
	Opens all URLs copied to the clipboard as new tabs. It can also automatically find URLs within text.

- **Options (Go to Settings Screen)**
	Opens the settings page to customize the extension's behavior in detail.

More detailed customization of behavior can be done on the **Options** settings page.

---

## Settings (Options)

The options screen allows you to fine-tune the extension's behavior to suit your usage. Settings are categorized.

> [!IMPORTANT]
> After making changes to the settings, be sure to click the **Save** button in the bottom left corner to save them. Changes will not be applied until saved.

### Copy (Copy Settings)

Manages the format and data type when copying.

- **Format**
	- **Format Type**: Select from 3 types of formats.
		- `text`: Copies only URLs, separated by newlines.
		- `json`: Copies tab titles and URLs in JSON format.
		- `custom`: Copies in a custom template.
	- **Custom Template**: Used when `custom` is selected for `Format Type`. You can define a custom format using `$title` (tab title) and `$url` (tab URL) as variables.
	- **MIME Type**: When copying in `custom` format, select the data type (MIME type) from `text/plain` (plain text) or `text/html` (HTML format). Applications where you paste (e.g., Word or Gmail) can interpret this format to maintain formatting.

### Paste (Paste & Tab Expansion Settings)

Manages the behavior when opening URLs from the clipboard in new tabs.

- **Search (Search for URLs)**
	- **Search for URLs in the clipboard text**: If this option is enabled, URLs (starting with `http://` or `https://`) will be automatically extracted from the entire clipboard text using regular expressions. If disabled, each line of text will be treated as a single URL. **Note that if this option is enabled, protocol filtering will only apply to URLs with `http` and `https` protocols.**

- **Tab (Tab Behavior)**
	- **Open tabs in reverse order**: Opens the list of URLs from the clipboard in reverse order (bottom to top).
	- **Open in active tab**: Makes newly opened tabs active (displayed in the foreground).
	- **New tab position**: Specifies where new tabs are opened.
		- `default`: Follows the browser's default settings.
		- `first` / `last`: Opens at the beginning or end of the tab bar.
		- `left` / `right`: Opens to the left or right of the currently active tab.
	- **Delay**: Sets the waiting time in milliseconds before opening the next tab. Reduces browser load when opening many tabs at once.
	- **Custom Delay**: Allows you to set individual delay times for specific domains or URL patterns.
		- `Enable (Overall Feature)`: Enables this entire custom delay feature.
		- `Enable (Individual Rule)`: Individually enables/disables each custom delay rule.
		- Add rules with the `Add` button, setting the URL (forward match) and delay time. The list can be reordered by drag and drop.
- **Task Control**: Provides fine-grained control over how multiple URLs are processed and executed when opening many URLs.

> [!NOTE]
> For more information on Task Control, please refer to the "[Advanced Settings](#advanced-settings)" section.

### Filtering (Filtering Settings)

Excludes URLs based on specific conditions during copy or paste operations.

- **URL Deduplication**
	- `Deduplicate URLs on Copy`: Consolidates duplicate URLs into one during copy.
	- `Deduplicate URLs on Paste`: Consolidates duplicate URLs into one during paste.

- **Protocol Filtering**
	- `Filter on Copy` / `Filter on Paste`: Excludes URLs with protocols other than the allowed ones during copy or paste.
	- `Allowed Protocols`: Select the types of protocols allowed for processing (e.g., `http`, `https`, `file`).

- **URL Filtering**
	Excludes URLs that match specified patterns during copy or paste operations.
	- `Filter on Copy` / `Filter on Paste`: Enables filtering for each action.
	- `Pattern Matching type`: Select from 4 matching methods.
		- `Prefix`: Forward match. Excludes URLs starting with the specified string.
		- `Substring`: Partial match. Excludes URLs containing the specified string.
		- `Exact`: Exact match. Excludes URLs that exactly match the specified string.
		- `Regular expression`: Regular expression. Excludes URLs that match the specified regular expression.
	- `Filtering Pattern`: Enter the URL patterns to be excluded (one pattern per line).

### System (System Settings)

Settings related to the extension's UI and behavior.

- **Options Page**
	- `Font Size`: Adjusts the font size of this options page itself.

- **Popup Menu**
	- `Font Size`: Adjusts the font size of the popup menu displayed when clicking the extension icon.
	- `Clear Message`: Automatically clears completion messages displayed in the popup after a specified number of seconds.
	- `OnClick Close`: Automatically closes the popup menu after a specified number of seconds after clicking a button (Copy/Paste) in the popup menu.

- **Badge (Icon Badge)**
	- `Enable`: Displays the number of URLs waiting to be opened as tabs by the "Paste" function on the extension icon as a badge.
	- `Theme`: Selects the color scheme theme for the badge.
		- `Light` / `Dark`: Uses predefined light or dark themes.
		- `Custom`: Freely set `Text` (text color) and `Background` (background color).

### Debug (Debug Settings)

Settings for developers.

- **Enable Log Output**
	- If `true`, the extension's operation logs are output to the browser's developer console. If `false`, all log output is suppressed regardless of the log level setting.
- **Log Level**
	- Specifies the minimum level of logs to output. Only logs with importance equal to or greater than the selected level will be displayed.
		- `all`: Outputs all logs (most detailed)
		- `trace`: Outputs logs of `trace` level or higher
		- `debug`: Outputs logs of `debug` level or higher
		- `info`: Outputs logs of `info` level or higher (`console.log` is treated as `info` level)
		- `warn`: Outputs logs of `warn` level or higher
		- `error`: Outputs logs of `error` level or higher
		- `silent`: Suppresses all logs
- **Add Method Label**
	- If `true`, a label indicating the method type (e.g., `[INFO]`) is added to each log.
- **Add Timestamp**
	- If `true`, a timestamp is added to each log.
- **Select Timestamp Type (Timestamp Timezone)**
	- Select the timezone for the timestamp from `UTC` or `GMT`.

---

## Advanced Settings

### Task Control

Provides fine-grained control over how multiple URLs are processed and executed when opening many URLs. This **significantly impacts browser performance**, so please understand the settings thoroughly before use.

Here, a "task" refers to the series of processes of "opening a group of URLs read from the clipboard as new tabs."

#### Setting Items

- **Processing Unit**: Determines how URLs are grouped and processed.
	- `Unitary`: Treats each URL as an individual task. If `Append` or `Prepend` is selected for `Execution Order` below, the load on the browser can be distributed.
	- `Batch`: Groups URLs into a specified number (`Number of URLs per Batch`) of chunks and processes them in groups.
	- `Monolithic`: Processes all URLs as one large task at once.

- **Execution Order**: Determines how generated tasks are added to the execution waiting queue.
	- `Parallel`: Does not use a queue, and **attempts to open all URLs simultaneously**.
	- `Append`: Adds new tasks to the **end of the queue**. If there are currently running tasks, they will be processed after those are finished.
	- `Prepend`: Adds new tasks to the **beginning of the queue**. If there are currently running tasks, the new tasks will be processed preferentially immediately after those are finished.

#### Examples of Combined Behavior

- **For `Unitary` or `Batch`**:
	- If `Execution Order: Append` is selected, new tasks will be processed in order after currently running tasks are completed.
	- If `Execution Order: Prepend` is selected, new tasks will interrupt to the front of the queue and be processed preferentially immediately after currently running tasks are completed.

- **For `Monolithic`**:
	- In this mode, all URLs are treated as a single large task, so the effect of `Execution Order` is limited. Once processing begins, no other tasks can interrupt until all URLs are opened.

#### Caution: Maximum Load Combination

**`Processing Unit: Unitary` + `Execution Order: Parallel`**

This combination theoretically results in the highest load when opening tabs.

A large number of URLs broken down into individual tasks by `Unitary` are sent to the browser simultaneously without any waiting time by `Parallel`. In this case, **all delays specified in the `Paste` settings are ignored**.
As a result, CPU and memory resources may be rapidly consumed, and the browser may become significantly slow or unresponsive.

> [!IMPORTANT]
> Avoid using this combination unless you need to open a small number of URLs (up to about 5) as quickly as possible.

---

## Managing Settings

Settings can be saved and transferred to other environments as files.

### Import / Export

You can save (export) your created settings as a file, or load and restore them from a file (import). This allows you to easily synchronize settings across different PCs or browser profiles.

- **Import**: Select and load a settings file (JSON format).
- **Export**: Downloads all current settings as a JSON file.

### Save / Reset

- **Save**: Saves all changes made on the options page.
- **Reset**: Resets all settings to their initial state (default values). This operation is not saved until you click the `Save` button.

#### **Important Notes**

When you click the `Save` button, the settings values are first validated. If invalid values are detected, you will be notified which items have issues, and the saving of settings will be canceled. **Values in the UI are not automatically corrected**, so please check the notification, manually correct the values, and click the `Save` button again.

---

## Required Permissions

This extension requires the following permissions to operate. Your privacy is respected, and all data is processed on your local device.

| Permission         | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `tabs`             | Required to access the URLs and titles of open tabs.         |
| `storage`          | Required to save extension settings in the browser.          |
| `clipboardRead`    | Required to read URLs from the clipboard for the "Paste" function. |
| `clipboardWrite`   | Required to write URLs to the clipboard for the "Copy" function. |

---

## Support

This extension is provided free of charge, so individual support is not offered.

For bug reports or feature requests, please use the GitHub Issues page.
- [GitHub Issues](https://github.com/from-es/copy-url-of-all-tabs/issues)

## Related Links

- **Source Code:**
	- [from-es/copy-url-of-all-tabs (GitHub)](https://github.com/from-es/copy-url-of-all-tabs)
- **Store Pages:**
	- [Chrome Web Store](https://chromewebstore.google.com/detail/copy-url-of-all-tabs/glhbfaabeopieaeoojdlaboihfbdjhbm)
	- [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/copy-url-of-all-tabs/)