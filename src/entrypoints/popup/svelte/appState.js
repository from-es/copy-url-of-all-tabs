// Import Svelte
import { writable, derived } from "svelte/store";



// PopupMenu の状態管理用変数の初期化
const appState = writable(getDefaultValueOfAppState());

/**
 * appState オブジェクトのテンプレート
 * @returns {object}
 */
function getDefaultValueOfAppState() {
	return {
		isLoading    : false,
		currentAction: null,
		result       : null,
		message      : null
	};
};

/**
 * result オブジェクトのテンプレート
 * @returns {object}
 */
function createResultTemplate() {
	return {
		action   : null,
		status   : null,    // クリップボードへのアクセス成否
		message  : null,
		judgment : false,   // 結果の総合判断 >> メッセージ表示用
		urlList  : [],
		clipboard: {
			direction: null, // "From Tabs to Clipboard" or "From Clipboard to Tabs"
			text     : null  // クリップボードの中身
		}
	};
};

// PopupMenu の状態管理用メソッド
const actionStore = {
	// アクション開始
	startAction: (action) => {
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
	completeAction: (result) => {
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
	setMessage: (message) => {
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