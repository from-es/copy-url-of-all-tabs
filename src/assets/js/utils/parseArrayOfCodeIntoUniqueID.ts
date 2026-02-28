import { generateID } from "./generateID";

interface CodeObject {
	id           : string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;    // 渡されたオブジェクトの配列のプロパティが "id" 以外だった場合のフォールバック
}

/**
 * オブジェクトの配列内で重複したIDを検出し、重複している場合は新しいユニークIDを生成して置き換える
 *
 * @param   {CodeObject[]} array - IDプロパティを持つオブジェクトの配列
 * @returns {CodeObject[]}       - 重複するIDがユニークなものに置き換えられた新しい配列
 */
export function parseArrayOfCodeIntoUniqueID(array: CodeObject[]): CodeObject[] {
	const codes       = structuredClone(array);
	const flatArray   = codes.map(elm => elm.id);
	const isDuplicate = (flatArray.length !== (new Set(flatArray)).size); // 重複検知

	if (!isDuplicate) {
		return codes;
	}

	(flatArray).forEach(
		(element, index) => {
			const match = flatArray.filter(elm => elm === element);

			if (match.length > 1) {
				const id = generateID(32);

				console.debug("DEBUG(string): duplicate id found, generating new unique id", { index, match });

				flatArray[index]  = id;
				(codes[index]).id = id;
			}
		}
	);

	return codes;
}