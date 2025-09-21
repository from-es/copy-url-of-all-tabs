# PopoverMessage.ts

**Last Updated:** September 21, 2025

A utility class for easily displaying stackable messages on the screen using the Popover API.

---

## Overview

You can easily display a message on the screen just by calling the `PopoverMessage.create()` method. This class manages multiple messages simultaneously and provides a stackable UI where new messages pile on top. Displayed messages disappear automatically after a set time and can also be actively closed by the user with a double-click.

This utility is designed as a stateless, static class, requiring no instantiation, making it easy to call from any component.

## Features

- **Stateless Design:** No instance required. All functionality is provided through static methods.
- **Simple API:** Display messages without complex configuration with a single method call.
- **Stackable UI:** Displays multiple messages aligned vertically.
- **Auto-hide and Manual Close:** Messages disappear automatically after a specified time and can be closed immediately with a double-click.
- **Flexible Customization:** Individually set the display time, font size, and colors (text and background) for messages.
- **Predefined Styles:** Comes with five standard message types for common use cases: `success`, `debug`, `notice`, `warning`, and `error`.

## Basic Usage

Here is a basic example of how to use it.

```typescript
import { PopoverMessage } from './PopoverMessage';

// Simplest usage
PopoverMessage.create({
  message: "Processing completed successfully."
});

// Example with multiple messages and options
PopoverMessage.create({
  message: [
    "Warning: Required fields are not filled in.",
    "Please check the form again."
  ],
  messagetype: "warning",
  timeout: 10000 // Set to disappear in 10 seconds
});

// Advanced usage with all options specified
PopoverMessage.create({
  message: "This is a custom message with all options specified.",
  timeout: 15000, // 15 seconds
  fontsize: "14px",
  messagetype: "debug", // This will be overridden by the 'color' option
  color: {
    font: "white",
    background: "linear-gradient(45deg, #3a7bd5, #3a6073)"
  }
});
```

## API Reference

### `PopoverMessage.create(options)`

Displays a new popover message on the screen.

- **`options: PopoverMessageOptions`**: An object containing the display settings for the message.

### `PopoverMessageOptions` Interface

The interface for the settings object passed to the `create` method.

```typescript
interface PopoverMessageOptions {
  /**
   * **Required**. The message string or array of strings to display.
   * HTML is not interpreted and is treated as plain text.
   */
  message: string | string[];

  /**
   * (Optional) The time in milliseconds until the message automatically disappears.
   * Default: 5000
   */
  timeout?: number;

  /**
   * (Optional) The font size of the message.
   * Default: "16px"
   */
  fontsize?: string;

  /**
   * (Optional) Directly specifies the text and background colors of the message.
   * This setting takes precedence over `messagetype`.
   */
  color?: {
    font?: string;
    background?: string;
  };

  /**
   * (Optional) Applies a predefined style.
   * 'success' | 'debug' | 'notice' | 'warning' | 'error'
   */
  messagetype?: "success" | "debug" | "notice" | "warning" | "error";
}
```

## Behavioral Specifications & Notes

### Message Text Format

**HTML cannot be used in the `message` property.**
This class safely treats all passed strings as plain text by internally setting the value to the `textContent` property. If a string containing HTML tags is passed, the tags will not be interpreted as HTML elements but will be displayed as a literal string on the screen (e.g., `<b>` will be displayed as `<b>`). This is an intentional design to prevent Cross-Site Scripting (XSS).

### Dependencies

This class depends on the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). Therefore, it must be run in a browser environment that supports this API. Compatibility for major browsers is as follows (for full details, please refer to the [MDN Browser compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API#browser_compatibility)):

- **Google Chrome**: `114`+
- **Firefox**: `125`+

### Execution Context

This class performs DOM manipulation internally. Therefore, it is intended for use in a client-side context (such as a Content Script, or an extension's Popup or Options page). It will not work in environments without a DOM, such as a Background Script.
