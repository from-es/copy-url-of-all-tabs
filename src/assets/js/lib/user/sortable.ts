// Import NPM Package
import Sortable from "sortablejs";

// Import Types
import type { Options } from "sortablejs";

type SortableOptions = Options & {
	list  : object[],
	onSort: (list: object[]) => void
};

export function sortable(node: HTMLElement, options: SortableOptions) {
	let sortableInstance: Sortable;

	const reorder = (list: object[], oldIndex: number, newIndex: number) => {
		const item = list.splice(oldIndex, 1)[0];
		list.splice(newIndex, 0, item);
		return list;
	};

	const initialize = () => {
		const { list, onSort, ...restOptions } = options;

		sortableInstance = new Sortable(node, {
			animation: 150,
			handle   : ".sortable",
			onEnd    : (evt) => {
				if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
					const newList = reorder([ ...list ], evt.oldIndex, evt.newIndex);

					// イベントを発行する代わりに、渡された onSort 関数を呼び出す
					onSort(newList);
				}
			},

			// 呼び出し元からのオプションで上書き
			...restOptions
		});
	};

	initialize();

	return {
		// コンポーネントが破棄されるときに SortableJS のインスタンスも破棄
		destroy() {
			if (sortableInstance) {
				sortableInstance.destroy();
			}
		}
	};
}