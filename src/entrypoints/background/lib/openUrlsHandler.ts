/**
 * Handler for opening multiple URLs in new tabs.
 *
 * @file
 * @lastModified 2026-06-01
 */

// WXT provided cross-browser compatible API and Types.
import { browser, type Browser } from "wxt/browser";

// Import Module
import { define }             from "@/assets/js/define";
import { QueueManager }       from "@/assets/js/lib/QueueManager";
import { UrlDelayCalculator } from "@/assets/js/lib/UrlDelayCalculator";
import { sleep }              from "@/assets/js/utils/sleep";
import { countManager }       from "../lib/CountManager";

// Import Types
import type { Config, ExtensionMessage }                from "@/assets/js/types";
import type { UrlDelayRule, UrlDelayCalculationResult } from "@/assets/js/lib/UrlDelayCalculator";



type TabPosition = "default" | "first" | "left" | "right" | "last";
type TaskMode    = "unitary" | "batch" | "monolithic";
type OpenMode    = "parallel" | "append" | "prepend" | "insertNext";

/**
 * Unified window ID type compatible with window retrieval, tab creation, and tab searching APIs.
 * This intersection type ensures that the ID is compatible across all relevant browser API properties.
 */
type TabOperationWindowId =
	Browser.windows.Window["id"] &
	Browser.tabs.CreateProperties["windowId"] &
	Browser.tabs.QueryInfo["windowId"];

/**
 * Index type expected by the tab creation (create) API.
 */
type TabOperationIndex = Browser.tabs.CreateProperties["index"];

type TabOption       = Config["Tab"];
type CreateTabOption = TabOption & { windowId: TabOperationWindowId };



/**
 * Handler that receives a message and starts the process of opening URLs.
 *
 * Assumes the URL list in the message has been pre-processed (e.g., filtered) by the popup.
 *
 * @param   {ExtensionMessage} message - Extension message containing the pre-processed URL list and settings.
 * @returns {Promise<void>}              Promise that resolves when the process has been initiated.
 */
async function handleOpenURLs(message: ExtensionMessage): Promise<void> {
	const { argument } = message;
	const urlList      = argument?.urlList;
	const config       = argument?.option;

	if (urlList && config) {
		openURLs(urlList, config);
	} else {
		console.error("ERROR(tab): Invalid: cannot open url list, urlList or option are missing", argument);
	}
}

/**
 * Coordinate the process of opening tabs based on the provided URL list and tab settings.
 *
 * This function does not filter URLs; instead it handles tab reordering, delay calculation, and task dispatching.
 *
 * @param   {string[]}      urlList - List of URLs to open (pre-filtered by the popup).
 * @param   {Config}        config  - Configuration object.
 * @returns {Promise<void>}           Promise that resolves when tasks have been dispatched.
 */
async function openURLs(urlList: string[], config: Config): Promise<void> {
	if (!urlList || !Array.isArray(urlList) || urlList.length === 0) {
		console.warn("WARN(tab): Invalid: url list is missing or empty, no tabs will be opened", { received: urlList });
		return;
	}

	// Tab: is reverse ?
	if (config.Tab.reverse) {
		urlList = urlList.toReversed();
	}

	const tabOption       = config.Tab;
	const filteringOption = config.Filtering;
	const windowId        = await getCurrentWindowId();
	const delayResults    = buildUrlListWithDelay(urlList, tabOption);

	console.debug(
		"DEBUG(tab): open urls: tab option and url list",
		{
			option: {
				Filtering: {
					...filteringOption
				},
				Tab: {
					...tabOption
				}
			},
			"URL List": {
				source : urlList,
				rebuild: delayResults
			}
		}
	);
	taskController(delayResults, windowId, tabOption);
}

/**
 * Build a list of URL processing tasks with appropriate order and delay times based on the URL list and tab settings.
 *
 * @param   {string[]}                    urlList   - List of URLs to be processed.
 * @param   {TabOption}                   tabOption - Configuration for how to open tabs.
 * @returns {UrlDelayCalculationResult[]}             Array of URL information after delay calculation.
 */
function buildUrlListWithDelay(urlList: string[], tabOption: TabOption): UrlDelayCalculationResult[] {
	const { delay, customDelay }            = tabOption;
	const { enable, list: customDelayList } = customDelay;
	const applyFrom                         = define.TabOpenCustomDelayApplyFrom;  // Delay application starts from the second rule match (default: 2).
	let   rules: UrlDelayRule[]             = [];

	if (enable && customDelayList) {
		rules = customDelayList
			.filter(item => item.enable)
			.map(item => ({
				pattern  : item.pattern,
				count    : item.count,
				delay    : item.delay,
				matchType: define.TabOpenCustomDelayMatchType  // Match type used for regex evaluation in UrlDelayCalculator (default: "prefix").
			}));
	}

	return UrlDelayCalculator.calculate(urlList, delay, rules, applyFrom);
}

/**
 * Oversee the generation and dispatching of tasks to the queue.
 *
 * @param {UrlDelayCalculationResult[]} delayResults - URL information including delay times.
 * @param {TabOperationWindowId}        windowId     - ID of the window in which to open the tabs.
 * @param {TabOption}                   tabOption    - Configuration for how to open tabs.
 */
function taskController(delayResults: UrlDelayCalculationResult[], windowId: TabOperationWindowId, tabOption: TabOption): void {
	// Generate an array of task objects (functions).
	const tasks = createTasks(delayResults, windowId, tabOption);

	// Execute the generated task array in the specified mode.
	dispatchTasks(tasks, tabOption.TaskControl.openMode);
}

/**
 * Generate an array of executable tasks (functions) from an array of delay results.
 *
 * @param   {UrlDelayCalculationResult[]} delayResults - URL information including delay times.
 * @param   {TabOperationWindowId}        windowId     - ID of the window in which to open the tabs.
 * @param   {TabOption}                   tabOption    - Configuration for how to open tabs.
 * @returns {(() => Promise<void>)[]}                    Array of generated task functions.
 */
function createTasks(delayResults: UrlDelayCalculationResult[], windowId: TabOperationWindowId, tabOption: TabOption): (() => Promise<void>)[] {
	// Add the total number of URLs to be processed to the counter at once.
	countManager.increment(delayResults.length);

	const openTabWithDelay = async (result: UrlDelayCalculationResult): Promise<void> => {
		try {
			const individual = result.delay.individual;

			try {
				// sleep itself performs validation and throws an exception if the value is invalid.
				await sleep(individual);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (sleepError) {
				// Skip waiting and proceed to create tab if sleep fails.
			}

			await createTab(result.url, { ...tabOption, windowId }); // tabOption and windowId are captured via closure.
		} finally {
			// Decrement the counter after processing each URL, regardless of success or failure.
			countManager.decrement();
		}
	};

	const taskMode: TaskMode = tabOption?.TaskControl?.taskMode ?? "unitary";

	switch (taskMode) {
		// Treat the entire URL list as a single monolithic task.
		case "monolithic": {
			const task = async () => { for (const result of delayResults) { await openTabWithDelay(result); } };
			return [ task ];
		}

		// Split the URL list into chunks of a specified size and treat each as a task.
		case "batch": {
			const chunkSize                             = tabOption?.TaskControl?.chunkSize ?? define.TaskControlChunkSizeValue;
			const loop                                  = delayResults.length;
			const chunks: UrlDelayCalculationResult[][] = [];

			for (let i = 0; i < loop; i += chunkSize) {
				const piece = delayResults.slice(i, i + chunkSize);
				chunks.push(piece);
			}

			return chunks.map(chunk => {
				return async () => {
					for (const result of chunk) {
						await openTabWithDelay(result);
					}
				};
			});
		}

		// Treat each URL as an individual task.
		case "unitary": {
			return delayResults.map(result => {
				return async () => {
					await openTabWithDelay(result);
				};
			});
		}

		// Throw an error if an unknown mode is provided, notifying the developer.
		default: {
			const exhaustiveCheck: never = taskMode;
			throw new Error(`Error: unknown TaskMode "${exhaustiveCheck}" in createTasks`);
		}
	}
}

/**
 * Add an array of tasks to the queue or execute them directly according to the specified mode.
 *
 * @param {(() => Promise<void>)[]} tasks - Array of tasks to execute.
 * @param {OpenMode}                mode  - Execution mode.
 */
function dispatchTasks(tasks: (() => Promise<void>)[], mode: OpenMode): void {
	switch (mode) {
		case "parallel":
			for (const task of tasks) {
				task();
			}
			break;

		case "prepend":
			// If queue processing begins while tasks are still being added in the loop, the task execution order may become corrupted.
			// To prevent this, we pause the queue until all tasks have been successfully added.
			QueueManager.pause();

			// QueueManager.addPriorityTask increases priority as it adds tasks to the queue, resulting in tasks being executed
			// in the reverse order of addition. To maintain the intended FIFO order, we reverse the task array before adding.
			for (const task of tasks.toReversed()) {
				QueueManager.addPriorityTask(task);
			}

			// Resume queue processing now that all tasks have been added.
			QueueManager.resume();
			break;

		case "insertNext":
			// In v1.8.0, this behaves the same as prepend (adding to the priority queue).
			// We may consider a future implementation that inserts immediately after the currently running task.
			//
			// If queue processing begins while tasks are still being added in the loop, the task execution order may become corrupted.
			// To prevent this, we pause the queue until all tasks have been successfully added.
			QueueManager.pause();

			// QueueManager.addPriorityTask increases priority as it adds tasks to the queue, resulting in tasks being executed
			// in the reverse order of addition. To maintain the intended FIFO order, we reverse the task array before adding.
			for (const task of tasks.toReversed()) {
				QueueManager.addPriorityTask(task);
			}

			// Resume queue processing now that all tasks have been added.
			QueueManager.resume();
			break;

		case "append":
			for (const task of tasks) {
				QueueManager.addTask(task);
			}
			break;

		default: {
			// Throw an error if an unknown mode is provided, notifying the developer.
			const exhaustiveCheck: never = mode;
			throw new Error(`Error: unknown OpenMode "${exhaustiveCheck}" in dispatchTasks`);
		}
	}
}

/**
 * Get the ID of the currently active window.
 *
 * @returns {Promise<TabOperationWindowId>} Window ID, or undefined on failure.
 */
async function getCurrentWindowId(): Promise<TabOperationWindowId> {
	try {
		const window = await browser.windows.getCurrent({ windowTypes: [ "normal" ] });
		return window?.id;
	} catch (error) {
		console.error("ERROR(tab): Exception: failed to get current window", { error });
		return undefined;
	}
}

/**
 * Create a new tab with the specified URL and options.
 *
 * @param   {string}          url       - URL to open.
 * @param   {CreateTabOption} tabOption - Options for tab creation.
 * @returns {Promise<void>}               Promise that resolves when the tab creation has been requested.
 */
async function createTab(url: string, tabOption: CreateTabOption): Promise<void> {
	const { active, position, windowId } = tabOption;

	try {
		const tabIndex                                        = await getActiveTabIndex(position, windowId);
		const createProperties: Browser.tabs.CreateProperties = { url, active, windowId, index: tabIndex };

		console.debug("DEBUG(tab): open urls: create tab", { position, ...createProperties });

		// Await to ensure stable execution order across multiple tab creations.
		await browser.tabs.create(createProperties);
	} catch (error) {
		console.error("ERROR(tab): Exception: cannot open url, create tab failed", { error });
	}
}

/**
 * Calculates the target index for tab insertion based on the specified position setting.
 *
 * If the position is "default", it returns undefined immediately to bypass the `browser.tabs.query`
 * API call and allow the browser to handle the placement according to its default behavior.
 *
 * @param   {TabPosition}                position - Identifier for the tab insertion position ("default", "first", "left", "right", "last").
 * @param   {TabOperationWindowId}       windowId - The ID of the window where the tabs are being opened.
 * @returns {Promise<TabOperationIndex>}            The calculated index number for tab insertion, or undefined for default placement.
 */
async function getActiveTabIndex(position: TabPosition, windowId: TabOperationWindowId): Promise<TabOperationIndex> {
	if (position === "default") {
		return undefined;
	}

	// If windowId is undefined, limit the query to the current window.
	const queryInfo: Browser.tabs.QueryInfo = {
		windowId: windowId ?? browser.windows.WINDOW_ID_CURRENT
	};

	const tabs       = await browser.tabs.query(queryInfo);
	const currentTab = (tabs).find((tab) => tab.active === true);
	const tabIndex   = createTabPosition(position, tabs, currentTab);

	return tabIndex;
};

/**
 * Calculate the index at which a new tab should be inserted based on the position setting.
 *
 * @param   {TabPosition}                  position   - Identifier for the tab insertion position ("default", "first", "left", "right", "last").
 * @param   {Browser.tabs.Tab[]}           tabs       - Array of tabs in the current window.
 * @param   {Browser.tabs.Tab | undefined} currentTab - Currently active tab.
 * @returns {TabOperationIndex}                         Calculated tab index, or undefined to allow default behavior.
 */
function createTabPosition(position: TabPosition, tabs: Browser.tabs.Tab[], currentTab: Browser.tabs.Tab | undefined): TabOperationIndex {
	let index: TabOperationIndex = undefined;

	switch (position) {
		case "default":
			index = undefined;
			break;
		case "first":
			index = 0;
			break;
		case "left":
			index = currentTab?.index;
			break;
		case "right":
			index = (currentTab !== undefined) ? currentTab.index + 1 : undefined;
			break;
		case "last":
			index = tabs.length;
			break;
		default:
			// If position is "unspecified, undefined, or null", the tab's position follows the default behavior of browser.tabs.create(options) for index.
			// Default index behavior: The new tab is created at the far right (end) of the specified window.

			console.error("ERROR(tab): Invalid: invalid argument passed to createTabPosition", { position });
			break;
	}

	if ((typeof index === "number") && index < 0) {
		index = 0;
	}

	return index;
}



export {
	handleOpenURLs
};
export type {
	TabPosition,
	TaskMode,
	OpenMode
};