# KeyboardStateManager.ts

A generic abstraction layer for keyboard input management. It wraps `hotkeys-js` to isolate dependencies and provide a clean, state-based interface for tracking key presses.

## Overview

Managing keyboard shortcuts and modifier key states (like Alt, Shift, or Ctrl) can become complex, especially when trying to maintain a reactive UI. `KeyboardStateManager.ts` simplifies this by maintaining a `Set` object of currently pressed keys that are being "tracked".

This class is framework-agnostic but designed to be easily integrated into reactivity systems (such as Svelte runes or Vue refs) by providing explicit synchronization points.

## Features

- **Dependency Isolation:** Wraps `hotkeys-js` so the rest of your application doesn't need to depend on it directly.
- **Explicit Scope:** Only tracks the keys you **explicitly** tell it to track via `setup()`.
- **Manual Synchronization:** The `sync()` method allows you to control exactly when the state is updated, which is effective for avoiding unnecessary reactivity overhead or race conditions during event bubbling.
- **Safe Cleanup:** Provides `teardown()` to unbind all global event listeners, preventing memory leaks and conflicting handlers in multi-page or component-based environments.
- **Framework-Agnostic:** Pure TypeScript class with no external dependencies other than `hotkeys-js`.
- **Limited Responsibility:** This library's role is specialized for "managing keyboard input states (which keys are pressed)". It does not provide features to perform actions (such as executing callbacks) in response to specific key inputs. Action execution should be implemented on the user side by monitoring changes in the `status`.

## Basic Usage

Here is a basic example of how to use the manager.

```typescript
import { KeyboardStateManager } from './KeyboardStateManager';

const kbd = new KeyboardStateManager();

// 1. Define the keys you want to track
kbd.setup(['alt', 'shift', 's']);

// 2. Synchronize state in response to events (e.g., in a global window listener)
window.addEventListener('keydown', () => kbd.sync());
window.addEventListener('keyup', () => kbd.sync());

// 3. Check the status
if (kbd.status.has('alt')) {
    console.log('Alt key is currently pressed');
}

// 4. Cleanup when done
kbd.teardown();
```

## API Reference

### `status: Set<string>`

A `Set` object containing the identifiers of tracked keys that are currently pressed.
Note: This set is modified in place. If using a reactivity system, you should wrap this property or trigger an update after calling `sync()`.

### `setup(keys: string[])`

Sets the scope of keys to be tracked.

- **`keys: string[]`**: An array of key identifiers (e.g., `"alt"`, `"shift"`, `"a"`, `"control"`).
- **Behavior**: 
    - Unbinds any previously registered handlers.
    - Normalizes keys to lowercase and removes duplicates.
    - Registers internal handlers with `hotkeys-js` for the specified keys.

### `sync()`

Synchronizes the current physical key states into the `status` set.

- **Behavior**: 
    - Iterates through all tracked keys and checks their current state via `hotkeys-js`.
    - Adds pressed keys to the `status` set and removes released keys.
    - Logs debug information to the console when keys are pressed or released.

### `reset()`

Forces the `status` set to be cleared.

- **Use Case**: Useful for clearing states when the window loses focus or an unexpected state change occurs.

### `teardown()`

Completely stops tracking and cleans up resources.

- **Behavior**:
    - Unbinds all handlers from `hotkeys-js`.
    - Clears the `status` set.
    - Resets the internal list of tracked keys.

## Implementation Details

### Reactivity Integration

Because `status` is a standard `Set` object, it is not reactive by default. In a framework like Svelte 5, you might wrap it like this:

```typescript
const kbd = new KeyboardStateManager();
let keyStatus = $state(kbd.status);

function handleKey() {
    kbd.sync();
    keyStatus = new Set(kbd.status); // Trigger reactivity
}
```

## References

- [hotkeys.js](https://wangchujiang.com/hotkeys-js/)
- [hotkeys-js (npm)](https://www.npmjs.com/package/hotkeys-js)
- [hotkeys-js (GitHub)](https://github.com/jaywcjlove/hotkeys-js)

## License

This project is licensed under the [MIT License](../../../../../../LICENSE.md).
