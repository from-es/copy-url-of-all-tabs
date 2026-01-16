// Import Module
import { define } from "@/assets/js/define";

// Import Types
import type { CustomDelayInfo } from "@/assets/js/define/types";

// UI操作用の関数、行を追加
export function addRowForCustomDelay(list: CustomDelayInfo[]): void {
	(list).push({
		id     : crypto.randomUUID(), // 新しい行にも必ずidを付与
		enable : true,                // 新規作成時はデフォルトで有効
		pattern: "",
		delay  : define.TabOpenCustomDelayValue,
	});
}

// UI操作用の関数、IDを元に行を削除
export function deleteRowForCustomDelay(list: CustomDelayInfo[], idToDelete: string): void {
	const indexToDelete = list.findIndex(item => item.id === idToDelete);

	if ( indexToDelete > -1 ) {
		list.splice(indexToDelete, 1);
	}
}