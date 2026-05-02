/**
 * Tests for sortable
 *
 * Verifies whether the Svelte action calling SortableJS correctly performs initialization and destruction.
 *
 * Since the focus is mainly on side effects to elements, this test uses individual 'it' blocks
 * instead of TestRunner.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { sortable } from "@/assets/js/lib/sortable.svelte";
import Sortable from "sortablejs";

// Mock SortableJS
vi.mock("sortablejs", () => {
	return {
		default: vi.fn().mockImplementation(function(node, options) {
			return {
				destroy: vi.fn(),
				options: options // Retain so options can be verified in tests
			};
		})
	};
});

describe("sortable (Svelte Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should return early without doing anything if a node other than HTMLElement is passed", () => {
		// Node is an Element but not an HTMLElement (e.g., SVGElement, Comment, etc.)
		const invalidNode = document.createComment("text") as unknown as Element;
		const options = {
			list: [],
			onSort: vi.fn()
		};

		const action = sortable(options);
		const destroy = action(invalidNode);

		expect(destroy).toBeUndefined();
		expect(Sortable).not.toHaveBeenCalled();
	});

	it("should create a Sortable instance and return a destroy method if an HTMLElement is passed", () => {
		const div = document.createElement("div");
		const options = {
			list: [ { id: 1 }, { id: 2 } ],
			onSort: vi.fn()
		};

		const action = sortable(options);
		const destroy = action(div);

		expect(Sortable).toHaveBeenCalledTimes(1);
		expect(Sortable).toHaveBeenCalledWith(div, expect.objectContaining({
			animation: 150,
			handle: ".sortable"
		}));

		// Verify that destroy() is returned
		expect(typeof destroy).toBe("function");

		// Verify that executing destroy calls destroy on the internal Sortable instance
		const mockSortableInstance = (Sortable as any).mock.results[0].value;
		destroy!();
		expect(mockSortableInstance.destroy).toHaveBeenCalledTimes(1);
	});

	it("should update the list and call the callback when sorting (onEnd event) occurs", async () => {
		// Arrange
		const div = document.createElement("div");
		const list = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const onSort = vi.fn();
		const options = { list, onSort, debounceTime: 100 };

		const action = sortable(options);
		action(div);

		// Retrieve options passed to the SortableJS constructor
		const sortableOptions = (Sortable as any).mock.calls[0][1];

		// Act: Simulate onEnd event (moving index 0 to index 2)
		sortableOptions.onEnd({
			oldIndex: 0,
			newIndex: 2
		});

		// Assert: List is updated [1, 2, 3] -> [2, 3, 1]
		expect(list).toEqual([ { id: 2 }, { id: 3 }, { id: 1 } ]);

		// Not called before debounce time elapses
		vi.advanceTimersByTime(50);
		expect(onSort).not.toHaveBeenCalled();

		// Called after debounce time elapses
		vi.advanceTimersByTime(51);
		expect(onSort).toHaveBeenCalledWith(list);
	});

	it("should skip sorting if oldIndex or newIndex is undefined", () => {
		// Arrange
		const div = document.createElement("div");
		const list = [ { id: 1 } ];
		const onSort = vi.fn();
		const options = { list, onSort };

		const action = sortable(options);
		action(div);
		const sortableOptions = (Sortable as any).mock.calls[0][1];

		// Act
		sortableOptions.onEnd({ oldIndex: undefined, newIndex: 0 });
		sortableOptions.onEnd({ oldIndex: 0, newIndex: undefined });

		// Assert
		expect(list).toEqual([ { id: 1 } ]);
		vi.runAllTimers();
		expect(onSort).not.toHaveBeenCalled();
	});
});