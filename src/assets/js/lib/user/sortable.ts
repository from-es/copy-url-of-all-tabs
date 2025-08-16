// Import NPM Package
import Sortable from "sortablejs";



export function sortable(node: HTMLElement, options: { list: object[], onSort: (list: object[]) => void }) {
	let sortableInstance: Sortable;

	const reorder = (list: object[], oldIndex: number, newIndex: number) => {
		const item = list.splice(oldIndex, 1)[0];
		list.splice(newIndex, 0, item);
		return list;
	};

	const initialize = () => {
		sortableInstance = new Sortable(node, {
			animation: 150,
			handle   : ".sortable",
			onEnd    : (evt) => {
				if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
					const newList = reorder([ ...options.list ], evt.oldIndex, evt.newIndex);

					// イベントを発行する代わりに、渡された onSort 関数を呼び出す
					options.onSort(newList);
				}
			}
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