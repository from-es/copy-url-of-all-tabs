// Import Types
import type { Action, EventOnClickActionResult } from "./types";

// Import Svelte
import { writable, derived } from "svelte/store";

// AppStateの型定義
type AppState = {
	isLoading    : boolean;
	currentAction: Action | null;
	result       : EventOnClickActionResult | null;
	message      : string | null;
};

// PopupMenu の状態管理用変数の初期化
const appState = writable<AppState>(getDefaultValueOfAppState());

/**
 * appState オブジェクトのテンプレート
 * @returns {AppState}
 */
function getDefaultValueOfAppState(): AppState {
	return {
		isLoading    : false,
		currentAction: null,
		result       : null,
		message      : null
	};
};

/**
 * result オブジェクトのテンプレート
 * @returns {ActionResult}
 */
function createResultTemplate(): EventOnClickActionResult {
	return {
		action   : null,
		status   : false,
		message  : "",
		judgment : false,
		urlList  : [],
		clipboard: {
			direction: null,
			text     : null
		}
	};
};

// PopupMenu の状態管理用メソッド
const actionStore = {
	// アクション開始
	startAction: (action: Action | null) => {
		appState.update(
			(state) => {
				return {
					// 現在の appState の値、スプレッド構文で展開
					...state,

					// 上書き
					isLoading    : true,
					currentAction: action,
					result       : createResultTemplate(),
					message      : null
				};
			}
		);
	},

	// アクション完了
	completeAction: (result: EventOnClickActionResult | null) => {
		appState.update((state) => {
			return {
				// 現在の appState の値、スプレッド構文で展開
				...state,

				// 上書き
				isLoading    : false,
				currentAction: null,
				result       : result
			};
		});
	},

	// メッセージを設定
	setMessage: (message: string | null) => {
		appState.update((state) => {
			return {
				// 現在の appState の値、スプレッド構文で展開
				...state,

				// 上書き
				message: message
			};
		});
	},

	// 状態のリセット
	reset: () => {
		appState.set(getDefaultValueOfAppState());
	}
};

// 派生ストア
const isActionInProgress = derived(
	appState,
	($appState) => {
		return $appState.isLoading;
	}
);

// 派生ストア
const shouldShowMessage = derived(
	appState,
	($appState) => {
		return ($appState.message !== null);
	}
);



export { appState, actionStore, isActionInProgress, shouldShowMessage };