import { define } from "@/assets/js/define";



// UI操作用の関数、行を追加
export function addRowForCustomDelay(list: { id: string; pattern: string; delay: number; }[]): void {
	(list).push({
		id     : crypto.randomUUID(), // 新しい行にも必ずidを付与
		pattern: "",
		delay  : define.TabOpenCustomDelayValue,
	});
}

// UI操作用の関数、IDを元に行を削除
export function deleteRowForCustomDelay(list: { id: string; pattern: string; delay: number; }[], idToDelete: string): void {
	const indexToDelete = list.findIndex(item => item.id === idToDelete);

	if ( indexToDelete > -1 ) {
		list.splice(indexToDelete, 1);
	}
}