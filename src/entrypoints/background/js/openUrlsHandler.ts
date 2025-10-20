// WXT provided cross-browser compatible API and Types
import { browser, type Browser } from "wxt/browser";

// Import Types
import { type Define, type ExtensionMessage }                from "@/assets/js/types/";
import { type UrlDelayRule, type UrlDelayCalculationResult } from "@/assets/js/lib/user/UrlDelayCalculator";

// Import Module
import { define }             from "@/assets/js/define";
import { UrlDelayCalculator } from "@/assets/js/lib/user/UrlDelayCalculator";
import { sleep }              from "@/assets/js/utils/sleep";
import { QueueManager }       from "@/assets/js/lib/user/QueueManager";

// Types
export type TabPosition = "default" | "first" | "left" | "right" | "last";
export type TaskMode    = "unitary" | "batch" | "monolithic";
export type OpenMode    = "parallel" | "append" | "prepend" | "insertNext";

type TabOption       = Define["Config"]["Tab"];
type CreateTabOption = TabOption & { windowId: number | undefined };



/**
 * メッセージを受け取り、URLを開くプロセスを開始するハンドラー
 * @param   {ExtensionMessage} message - 拡張機能メッセージ
 * @returns {Promise<void>}
 */
export async function handleOpenURLs(message: ExtensionMessage): Promise<void> {
	const { argument } = message;
	const urlList      = argument?.urlList;
	const option       = argument?.option;

	if ( urlList && option ) {
		openURLs(urlList, option);
	} else {
		console.error("Error, Cannot open URL List! urlList or option are missing in the message argument.", { argument });
	}
}

/**
 * URLリストと指定されたオプションに基づき、タブを開くプロセスを調整
 * @param   {string[]}      urlList   - 開く対象のURLリスト
 * @param   {TabOptions}    tabOption - タブの開き方に関する設定
 * @returns {Promise<void>}
 */
async function openURLs(urlList: string[], tabOption: TabOption): Promise<void> {
	if ( !urlList || !Array.isArray(urlList) || urlList.length === 0 ) {
		console.warn("Warning, URL list is missing or empty. No tabs will be opened.", { received: urlList });
		return;
	}

	const windowId     = await getCurrentWindowID();
	const delayResults = buildUrlListWithDelay(urlList, tabOption);

	// debug
	console.log(
		"Debug, Open URLs >> Tab Option & URL List >>",
		{
			option: {
				...tabOption
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
 * URLリストとタブ設定に基づき、適切な順序と遅延時間を持つURL処理リストを構築
 * @param   {string[]}                    urlList   - 元のURLリスト
 * @param   {TabOption}                   tabOption - タブの開き方に関する設定
 * @returns {UrlDelayCalculationResult[]}           - 遅延計算後のURL情報配列
 */
function buildUrlListWithDelay(urlList: string[], tabOption: TabOption): UrlDelayCalculationResult[] {
	const { reverse, delay, customDelay } = tabOption;

	// 逆順に開くかどうか
	const orderedUrlList = reverse ? urlList.toReversed() : urlList;

	const { enable, list: customDelayList } = customDelay;
	const applyFrom                         = define.TabOpenCustomDelayApplyFrom;  // 遅延適応はルールマッチ二回目(デフォルト値: 2)から
	let   rules: UrlDelayRule[]             = [];

	if ( enable && customDelayList ) {
		rules = customDelayList.map(
			(rule) => ({
				pattern  : rule.pattern,
				delay    : rule.delay,
				matchType: define.TabOpenCustomDelayMatchType // `UrlDelayCalculator` に渡す正規表現判定時用の値(デフォルト値: "prefix")
			})
		);
	}

	return UrlDelayCalculator.calculate(orderedUrlList, delay, rules, applyFrom);
}

/**
 * タスクの生成とキューへのディスパッチを統括
 * @param {UrlDelayCalculationResult[]} delayResults - 遅延時間を含むURL情報
 * @param {number | undefined}          windowId     - タブを開くウィンドウのID
 * @param {TabOption}                   tabOption    - タブの開き方に関する設定
 */
function taskController(delayResults: UrlDelayCalculationResult[], windowId: number | undefined, tabOption: TabOption): void {
	// タスクオブジェクト（関数）の配列を生成
	const tasks = createTasks(delayResults, windowId, tabOption);

	// 生成されたタスク配列を、指定されたモードで実行
	dispatchTasks(tasks, tabOption.TaskControl.openMode);
}

/**
 * 遅延結果の配列から、実行可能なタスク（関数）の配列を生成
 * @param   {UrlDelayCalculationResult[]} delayResults - 遅延時間を含むURL情報
 * @param   {number | undefined}          windowId     - タブを開くウィンドウのID
 * @param   {TabOption}                   tabOption    - タブの開き方に関する設定
 * @returns {(() => Promise<void>)[]}                  - 生成されたタスク関数の配列
 */
function createTasks(delayResults: UrlDelayCalculationResult[], windowId: number | undefined, tabOption: TabOption): (() => Promise<void>)[] {
	const openTabWithDelay = async (result: UrlDelayCalculationResult): Promise<void> => {
		const individual = result.delay.individual;

		if ( typeof individual === "number" && individual > 0 ) {
			await sleep(individual);
		}

		createTab(result.url, { ...tabOption, windowId }); // tabOption と windowId はクロージャでキャプチャ
	};

	const taskMode: TaskMode = tabOption?.TaskControl?.taskMode ?? "unitary";

	switch (taskMode) {
		// URLリスト全体を1つの大きなタスクとして扱う
		case "monolithic": {
			const task = async () => { for (const result of delayResults) { await openTabWithDelay(result); } };
			return [ task ];
		}

		// URLリストを指定されたサイズで分割し、それぞれをタスクとして扱う
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

		// URL一つひとつを個別のタスクとして扱う
		case "unitary": {
			return delayResults.map(result => {
				return async () => {
					await openTabWithDelay(result);
				};
			});
		}

		// 未知のモードが渡された場合はエラーをスローし、開発者に問題を通知
		default: {
			const exhaustiveCheck: never = taskMode;
			throw new Error(`Unknown TaskMode: ${exhaustiveCheck}. This indicates a programming error.`);
		}
	}
}

/**
 * タスクの配列を、指定されたモードに応じてキューに追加、または直接実行
 * @param {(() => Promise<void>)[]} tasks - 実行するタスクの配列
 * @param {OpenMode}                mode  - 実行モード
 */
function dispatchTasks(tasks: (() => Promise<void>)[], mode: OpenMode): void {
	switch (mode) {
		case "parallel":
			for (const task of tasks) {
				task();
			}
			break;

		case "prepend":
			for (const task of tasks) {
				QueueManager.addPriorityTask(task);
			}
			break;

		case "insertNext":
			// v1.8.0 の実装では prepend と同じ挙動（優先キューへの追加）。将来的には、実行中のタスクの直後に挿入する機能の実装を検討。
			for (const task of tasks) {
				QueueManager.addPriorityTask(task);
			}
			break;

		case "append":
			for (const task of tasks) {
				QueueManager.addTask(task);
			}
			break;

		default: {
			// 未知のモードが渡された場合はエラーをスローし、開発者に問題を通知
			const exhaustiveCheck: never = mode;
			throw new Error(`Unknown OpenMode: ${exhaustiveCheck}. This indicates a programming error.`);
		}
	}
}

/**
 * 現在アクティブなウィンドウのIDを取得
 * @returns {Promise<number | undefined>} ウィンドウID、または取得失敗時に undefined
 */
async function getCurrentWindowID(): Promise<number | undefined> {
	try {
		const window = await browser.windows.getCurrent({ windowTypes: [ "normal" ] });
		return window?.id;
	} catch (error) {
		console.error("Failed to get current window:", { error });
		return undefined;
	}
}

/**
 * 指定されたURLとオプションで新しいタブを作成
 * @param   {string}          url    - 開くURL
 * @param   {CreateTabOption} option - タブ作成に関するオプション
 * @returns {Promise<void>}
 */
async function createTab(url: string, option: CreateTabOption): Promise<void> {
	const { active, position, windowId } = option;

	try {
		const tabs       = await browser.tabs.query({ currentWindow : true });
		const currentTab = (tabs).find((tab) => tab.active === true);
		const tabIndex   = createTabPosition(position, tabs, currentTab);

		const property         = { url, active, windowId };
		const createProperties = (typeof tabIndex === "number") ? Object.assign(property, { index : tabIndex }) : property;

		// debug
		console.log("Debug, Open URLs >> createTab() >>", { position : position, ...createProperties });

		browser.tabs.create(createProperties);
	} catch (error) {
		console.error("Error, Can not Open URL >> createTab() >>", { error });
	}
}

/**
 * 指定された位置設定に基づき、新しいタブを挿入すべきインデックスを計算
 * @param   {TabPosition}                  position   - タブの挿入位置を示す識別子
 * @param   {Browser.tabs.Tab[]}           tabs       - 現在のウィンドウにあるタブの配列
 * @param   {Browser.tabs.Tab | undefined} currentTab - 現在アクティブなタブ
 * @returns {number | null}                           - 計算されたタブのインデックス、またはデフォルトの挙動に任せる場合は null
 */
function createTabPosition(position: TabPosition, tabs: Browser.tabs.Tab[], currentTab: Browser.tabs.Tab | undefined): number | null {
	let number: number | null = null;

	switch (position) {
		case "default":
			number = null;
			break;
		case "first":
			number = 0;
			break;
		case "left":
			number = currentTab ? currentTab.index : null;
			break;
		case "right":
			number = currentTab ? currentTab.index + 1 : null;
			break;
		case "last":
			number = tabs.length + 1;
			break;
		default:
			/*
			  position が "未指定 or undefined or null" の場合のタブの位置は、browser.tabs.create(options) における index のデフォルトの挙動に準ずる
			  index のデフォルトの挙動: 新規タブは、指定されたウィンドウの一番右端（末尾）に作成される
			*/

			// debug
			console.error("Error, Invalid argument passed to createTabPosition() >> position >>", position);
			break;
	}

	if ( (typeof number === "number") && number < 0 ) {
		number = 0;
	}

	return number;
}