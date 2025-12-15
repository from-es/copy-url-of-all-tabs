// Import NPM Package
import Sortable     from "sortablejs";
import { debounce } from "lodash-es";

// Import Types
import type { Options }    from "sortablejs";
import type { Attachment } from "svelte/attachments";

type SortableOptions = Options & {
	list         : object[],
	onSort       : (list: object[]) => void,
	debounceTime?: number
};

/**
 * SortableJS ライブラリを使用して、指定されたDOM要素にソート機能を追加
 * ソート操作後、指定されたコールバックをデバウンスして実行し、リストの更新を通知する。
 *
 * @param   {SortableOptions} options - ソート機能の設定オプション
 * @returns {Attachment}              - Svelte の Action インターフェースに準拠オブジェクト。DOM要素が破棄される際に SortableJS インスタンスをクリーンアップする destroy 関数を返す
 */
export function sortable(options: SortableOptions): Attachment {
	return (node: Element) => {
		// SortableJS は HTMLElement を要求するため、型ガードで検証
		if (!(node instanceof HTMLElement)) {
			return;
		}

		const reorder = (list: object[], oldIndex: number, newIndex: number) => {
			const [ item ] = list.splice(oldIndex, 1);
			list.splice(newIndex, 0, item);
		};
		const debouncedOnSort = debounce(
			() => {
				// デバウンス中にリストが変更されても、実行時の最新リストを参照することで「データ先祖返り」の問題を回避
				options.onSort(options.list);
			},
			options.debounceTime ?? 150
		);

		        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
		        const { list, onSort, debounceTime, ...restOptions } = options;
		        const sortableInstance = new Sortable(node, {
		            // Sortable オプションデフォルト値
		            animation: 150,
		            handle   : ".sortable",
			 // 外部からのオプションで上書き
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