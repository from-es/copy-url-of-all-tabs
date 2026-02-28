// Import Svelte
import { SvelteMap } from "svelte/reactivity";

// Import NPM Package
import merge from "lodash-es/merge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateObject = Record<string, any>;


/**
 * Defines the structure for initializing or updating a state property within the store.
 */
export type StateOption = {
	/**
	 * The name of the state property.
	 */
	name: string;
	/**
	 * Determines the mutability and reactivity of the state property.
	 * - `true` : The property is frozen and immutable after initialization; its initial value is retained.
	 * - `false`: The property is mutable and reactive, allowing subsequent changes to trigger updates.
	 */
	freeze: boolean;
	/**
	 * The value of the state property. This can be any object.
	 */
	value: StateObject;
};

/**
 * Defines the type for the function that updates the store's state.
 * @param newStates - An array of {@link StateOption} objects used to update the store.
 */
// eslint-disable-next-line no-unused-vars
export type UpdateState = (newStates: StateOption[]) => void;

/**
 * A factory function to create a type-safe, reactive store using Svelte 5 runes.
 * The store supports dynamic properties and property-level write protection.
 *
 * @param initialStates - An optional array of state options to initialize the store.
 * @returns A reactive `shareStatus` proxy object and an `updateState` function.
 */
export function createStore<T extends StateObject>(initialStates: StateOption[] = []) {
	// Internal reactive state managed by a single $state object.
	const internalState = $state<StateObject>({});
	const freezeMap     = new SvelteMap<string, boolean>();

	/**
	 * An internal function to initialize or merge new state options into the store.
	 * @param states - An array of state options.
	 */
	function upsertStates(states: StateOption[]): void {
		for (const option of states) {
			const { name, freeze, value } = option;

			// Deny updates to properties that are already frozen.
			if (freezeMap.get(name)) {
				console.warn("WARN(state): Invalid: attempted to update frozen property, operation denied", { name });
				continue;
			}

			// Set the freeze status for new properties.
			if (freeze && !freezeMap.has(name)) {
				freezeMap.set(name, true);
			}

			// Merge the new value with the existing state or set it if new.
			if (Object.prototype.hasOwnProperty.call(internalState, name)) {
				merge(internalState[name], value);
			} else {
				internalState[name] = value;
				// If freeze status is not set, default to the provided value (or false).
				if (freezeMap.get(name) === undefined) {
					freezeMap.set(name, freeze);
				}
			}
		}
	}

	// Initialize the store with the provided initial states.
	upsertStates(initialStates);

	/**
	 * A proxy to expose the state and control access.
	 * This is the `shareStatus` object.
	 */
	const shareStatusProxy = new Proxy<T>(internalState as T, {
		get(target, property, receiver) {
			return Reflect.get(target, property, receiver);
		},
		set(target, property, value) {
			const propName = String(property);

			// Deny assignments to properties marked as frozen.
			if (freezeMap.get(propName)) {
				console.warn("WARN(state): Invalid: attempted to write to frozen property, operation denied", { propName });
				return false;
			}

			// Allow assignment and trigger reactivity via the $state object.
			return Reflect.set(target, property, value);
		}
	});

	/**
	 * Updates the reactive store by merging the new state.
	 * @param newStates - An array of state options to update.
	 */
	function updateState(newStates: StateOption[]): void {
		upsertStates(newStates);
	}

	return {
		shareStatus: shareStatusProxy,
		updateState,
	};
}