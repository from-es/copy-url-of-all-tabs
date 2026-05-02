/**
 * Utility to add sort functionality to DOM elements using SortableJS.
 *
 * @file
 * @author       From E
 * @lastModified 2026-04-04
 */

// Import NPM Package
import Sortable     from "sortablejs";
import { debounce } from "lodash-es";

// Import Types
import type { Options }    from "sortablejs";
import type { Attachment } from "svelte/attachments";



/**
 * Options for the sortable action.
 */
type SortableOptions = Options & {
	/**
	 * The list of objects to sort.
	 */
	list: object[],
	/**
	 * Callback function called after a sort operation.
	 *
	 * @param {object[]} list - The sorted list.
	 */
	// eslint-disable-next-line no-unused-vars
	onSort: (list: object[]) => void,
	/**
	 * The debounce time (in milliseconds) for the sort operation.
	 */
	debounceTime?: number
};



/**
 * Adds sort functionality to the specified DOM element using the SortableJS library.
 * After a sort operation, it executes the specified callback with a debounce to notify of the list update.
 *
 * @param   {SortableOptions} options - Configuration options for the sort functionality.
 * @returns {Attachment}                Object conforming to the Svelte Action interface. Returns a destroy function to clean up the SortableJS instance when the DOM element is destroyed.
 */
export function sortable(options: SortableOptions): Attachment {
	return (node: Element) => {
		// SortableJS requires an HTMLElement, so verify it using a type guard.
		if (!(node instanceof HTMLElement)) {
			return;
		}

		const reorder = (list: object[], oldIndex: number, newIndex: number) => {
			const [ item ] = list.splice(oldIndex, 1);
			list.splice(newIndex, 0, item);
		};
		const debouncedOnSort = debounce(
			() => {
				// Referencing the latest list at the time of execution avoids "stale data" issues,
				// even if the list changes during the debounce period.
				options.onSort(options.list);
			},
			options.debounceTime ?? 150
		);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
		const { list, onSort, debounceTime, ...restOptions } = options;
		const sortableInstance = new Sortable(node, {
			// Default Sortable options
			animation: 150,
			handle   : ".sortable",

			// Override with external options
			...restOptions,

			onEnd: (event) => {
				if (event.oldIndex !== undefined && event.newIndex !== undefined) {
					reorder(options.list, event.oldIndex, event.newIndex);
					debouncedOnSort();
				}
			},
		});

		return () => {
			sortableInstance.destroy();
		};
	};
}