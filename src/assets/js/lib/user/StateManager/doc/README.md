# State Manager

**Last updated:** December 31, 2025

A reactive state management module that utilizes Svelte 5 runes to manage shared state within a Svelte project. It features dynamic property generation and per-property write protection (freezing).

## Overview

This `State Manager` provides a centralized store to share a consistent state across different parts of the extension (e.g., background, options, popup). It is built on Svelte 5's `$state` rune, enabling intuitive and efficient state management.

The core of the module is the `createStore` factory in `store.svelte.ts`. This factory is called by `state.ts` to generate a single store instance (singleton) that is used throughout the Svelte project. Each component and module in the application can access this shared state by simply importing `shareStatus` and `updateState` from `state.ts`.

### Applying Type Definitions

`store.svelte.ts` is designed as a generic store factory and does not depend on the specific data structures of any project. Project-specific type definitions (e.g., the properties of `config` or `define` objects) are applied in `state.ts`, where the instance is created.

This approach allows for the reuse of the core store logic while ensuring type safety for the state in each application.

Below is a code example of how types are applied in `state.ts`.

```typescript
// src/assets/js/lib/user/StateManager/state.ts

// Import Module & Types
import { createStore, type UpdateState } from "./store.svelte";
// Import project-specific type definitions
import type { Status } from "@/assets/js/types";

// Specify the type with generics like `createStore<Status>()` 
// to generate an application-specific store instance.
const { shareStatus, updateState }: {
    shareStatus: Status;
    updateState: UpdateState;
} = createStore<Status>();

// Export the instance for other modules
export { shareStatus, updateState };
```

## Motivation

Traditionally, sharing state between components required passing props down through multiple layers, from parent to child to grandchild. This method, known as "**Props Drilling**," causes several issues as the component hierarchy deepens:

-   **Reduced Maintainability:** Intermediate components must hold and pass down props they don't use, making the code verbose. Tracking the origin and usage of state becomes difficult.
-   **Hindered Reusability:** Components become tightly coupled to specific parent components, making them difficult to reuse elsewhere.

`State Manager` was introduced to solve these problems. It applies the Svelte store pattern to provide a centralized state store accessible from anywhere in the application. This allows components to get the state they need directly from the store, completely eliminating Props Drilling.

## Advantages and Caveats of Using State Manager

This library offers many advantages, but it also comes with some caveats.

### Merits

1.  **Elimination of Props Drilling:**
    Components can directly reference the state they need from the store, eliminating the need for redundant data relaying via props. This makes components loosely coupled and significantly improves code readability.

2.  **Centralized State Management:**
    The application's state is consolidated into a single store, making it easier to grasp the overall state picture. The data flow approaches a unidirectional model (Store → Component), which simplifies debugging and feature additions.

3.  **Powerful Reactivity:**
    Built on Svelte 5's runes (`$state`), it achieves efficient reactivity with minimal code. When the state is updated, only the UI elements that depend on that state are automatically re-rendered.

4.  **Immutable State Management:**
    The `freeze: true` option allows you to protect specific states (e.g., the application's fixed settings `define`) from unintentional changes, enhancing the application's stability.

### Caveats (Demerits)

1.  **Overhead in Small-Scale Use:**
    For very simple applications that only share state between a few components, introducing a store might overcomplicate the design. In such cases, Svelte's Context API or simple prop passing may be more appropriate.

2.  **Tracking State Changes:**
    Since state can be updated from anywhere (via `updateState` or direct assignment), it can become difficult to track *what*, *when*, and *where* state changes occurred in large applications. Establishing strict update rules or enhancing debug logging can be effective countermeasures.

3.  **Learning Curve:**
    In addition to the concepts of Svelte stores and runes, developers need to understand the library's unique API (`updateState`, `StateOption`, etc.). This introduces a learning curve for new project members.

4.  **Strong Dependency on the Svelte Environment:**
    The core functionality of this `State Manager` is built using `$state`, a reactivity primitive (rune) from Svelte 5. Therefore, this library only works correctly within a Svelte project where the code is processed by the Svelte compiler. It cannot be used in other frameworks like React or Vue.js, nor in a plain JavaScript/TypeScript environment without a build process.

## Main Features

- **Svelte 5 Reactivity:** Based on Svelte 5's runes (`$state`), changes to the state are automatically reflected in the UI.
- **Dynamic Properties:** You can dynamically add and manage states with any name, not just fixed properties like `config` or `define`.
- **Write Protection:** By setting `freeze: true` for each property, you can easily create immutable states to prevent unintentional changes.
- **Intuitive Updates:** Properties that are writable can be updated simply by direct assignment, like `shareStatus.prop.value = ...`.
- **Safe Bulk Updates:** The `updateState` function allows for atomic merging and updating of the store's **initialization** or existing state. Updates to frozen properties are safely blocked.
- **Type Safety:** Designed with TypeScript and generics to leverage the benefits of typing during development.

## Basic Usage

To use the `State Manager`, import `shareStatus` and `updateState` from `state.ts`.

### Initializing and Updating State

Typically, state initialization is performed at the application's entry points (e.g., `popup/main.ts` or `options/main.ts`).

```typescript
// src/entrypoints/popup/js/main.ts

import { updateState } from "@/assets/js/lib/user/StateManager/state";
import { initializeConfig } from "@/assets/js/initializeConfig";

// Load settings and update the shared state on application startup
async function boot() {
  const { config, define } = await initializeConfig(null);

  updateState([
    // Initialize the store or update the existing state
    { name: "config", value: config, freeze: false }, // config is mutable
    { name: "define", value: define, freeze: true }  // define is immutable
  ]);

  // ... application mounting process
}
```

### Usage in Svelte Components

Inside Svelte components, you can access the reactive state using `shareStatus`.

```svelte
<!-- src/entrypoints/popup/svelte/App.svelte -->

<script lang="ts">
  import { shareStatus } from "@/assets/js/lib/user/StateManager/state";

  // Changes to shareStatus.config are automatically reflected in the UI
  $: theme = $shareStatus.config?.theme || 'light';
</script>

<main class={theme}>
  <h1>Current Theme: {theme}</h1>
  <p>Version: {$shareStatus.define?.version}</p>
</main>
```

## API Reference

### `shareStatus`

A Proxy object that holds the reactive state. Inside Svelte components, subscribe to it with a `$` prefix, or access it directly like `shareStatus.propName` outside of components.

- **Type:** `Proxy<Status>` (the type specified with generics)

### `updateState(newStates)`

Updates (merges) the store's state in bulk.

- **`newStates: StateOption[]`**: An array of `StateOption` objects containing the information of the state to be updated or added.

### The `StateOption` Interface

An interface for defining a state property.

```typescript
interface StateOption {
  /**
   * The name of the state property.
   */
  name: string;

  /**
   * Whether to make this property immutable.
   * If set to `true`, subsequent merges by `updateState` or changes by direct assignment are blocked.
   */
  freeze: boolean;

  /**
   * The value to be stored in the property (an object).
   */
  value: Record<string, any>;
}
```

## Advanced Usage

### Write Protection (Freeze)

When you call `updateState` with `freeze: true`, the property becomes immutable. Thereafter, all attempts to change that property will be denied, and a warning will be logged to the console.

```typescript
// Assuming 'define' was initialized with freeze: true
shareStatus.define.version = '2.0.0'; // The change is denied
// Console output: [StateManager] Attempted to write to a frozen property "define". Operation denied.

// Updates via updateState are also denied
updateState([
  { name: "define", value: { version: '3.0.0' }, freeze: true }
]);
// Console output: [StateManager] Attempted to update a frozen property "define". Operation denied.
```

### Direct Assignment Updates

Properties with `freeze: false` can be reactively updated by direct assignment, even for nested values.

```typescript
// Assuming 'config' is freeze: false
console.log(shareStatus.config.theme); // "light"

// Update the value by direct assignment
shareStatus.config.theme = "dark";

console.log(shareStatus.config.theme); // "dark" (The UI is also updated automatically)
```

## License

This project is licensed under the [MIT License](../../../../../../../LICENSE.md).
