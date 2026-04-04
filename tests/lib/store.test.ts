/**
 * This file verifies the functionality of the `createStore` function and its state management capabilities,
 * specifically focusing on how it handles array updates and deep merging.
 *
 * Purpose of Inspection:
 * - To ensure that arrays within the state are replaced entirely rather than being merged by index.
 * - To verify that deep merging works correctly for non-array objects.
 * - To confirm that top-level arrays are handled as expected when they are part of the state object.
 *
 * Inspection Method:
 * - The `createStore` function is initialized with various `StateOption` configurations.
 * - The `updateState` function is called with new values.
 * - The resulting `shareStatus` is compared against expected values using `expect(...).toEqual(...)`.
 * - Multiple test cases are executed in a data-driven manner to ensure comprehensive coverage of state update behaviors.
 *
 * @file
 * @lastModified 2026-04-04
 */

import { createStore, type StateOption } from "@/assets/js/lib/user/StateManager/store.svelte.ts";
import { describe, it, expect } from "vitest";

interface TestCase {
	name           : string;
	initialStates  : StateOption[];
	expectedInitial: Record<string, unknown>;
	updates        : StateOption[];
	expectedFinal  : Record<string, unknown>;
}

describe("createStore", () => {
	const testCases: TestCase[] = [
		{
			name         : "should replace arrays instead of merging them by index",
			initialStates: [
				{
					name  : "list",
					freeze: false,
					value : { items: [ 1, 2, 3 ] }
				}
			],
			expectedInitial: { list: { items: [ 1, 2, 3 ] } },
			updates        : [
				{
					name  : "list",
					freeze: false,
					value : { items: [ 4, 5 ] }
				}
			],
			expectedFinal: { list: { items: [ 4, 5 ] } }
		},
		{
			name         : "should replace top-level arrays if they are part of the state object",
			initialStates: [
				{
					name  : "topLevelArray",
					freeze: false,
					value : [ "a", "b", "c" ] as unknown as StateOption["value"]
				}
			],
			expectedInitial: { topLevelArray: [ "a", "b", "c" ] },
			updates        : [
				{
					name  : "topLevelArray",
					freeze: false,
					value : [ "d" ] as unknown as StateOption["value"]
				}
			],
			expectedFinal: { topLevelArray: [ "d" ] }
		},
		{
			name         : "should still perform deep merge for non-array objects",
			initialStates: [
				{
					name  : "config",
					freeze: false,
					value : {
						nested: {
							keep: "me",
							change: "old"
						}
					}
				}
			],
			expectedInitial: {
				config: {
					nested: {
						keep: "me",
						change: "old"
					}
				}
			},
			updates: [
				{
					name  : "config",
					freeze: false,
					value : {
						nested: {
							change: "new",
							add: "more"
						}
					}
				}
			],
			expectedFinal: {
				config: {
					nested: {
						keep: "me",
						change: "new",
						add: "more"
					}
				}
			}
		}
	];

	testCases.forEach(({ name, initialStates, expectedInitial, updates, expectedFinal }) => {
		it(name, () => {
			const { shareStatus, updateState } = createStore(initialStates);

			// Initial check
			Object.entries(expectedInitial).forEach(([ key, expectedValue ]) => {
				expect(shareStatus[key]).toEqual(expectedValue);
			});

			// Update
			updateState(updates);

			// Final check
			Object.entries(expectedFinal).forEach(([ key, expectedValue ]) => {
				expect(shareStatus[key]).toEqual(expectedValue);
			});
		});
	});
});