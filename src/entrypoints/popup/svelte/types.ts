type Action = "copy" | "paste" | "options";

// 結果のコア部分
type ResultCore = {
  message: string;
  judgment: boolean;
  urlList: string[];
};

// 汎用的な結果型 (App.svelte, appState.ts などで利用)
type EventOnClickActionResult = ResultCore & {
  action: Action | null;
  status: string | boolean;
  clipboard: {
    direction: string | null;
    text: string | null;
  };
};

// イベントハンドラが返す、プロパティが確定した結果の型
type ConcreteResult = ResultCore & {
  action: Action;
  clipboard: {
    direction: string;
    text: string;
  };
};

// コピーアクションの結果
type EventActionCopyResult = ConcreteResult & {
  status: boolean;
};

// ペーストアクションの結果
type EventActionPasteResult = ConcreteResult & {
  status: string | boolean;
};



export { Action, EventOnClickActionResult, EventActionCopyResult, EventActionPasteResult };