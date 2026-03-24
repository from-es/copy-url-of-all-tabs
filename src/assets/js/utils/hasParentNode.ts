/**
 * Determines whether the specified HTML element has a parent node and returns information about the parent node.
 *
 * @file
 * @lastModified 2026-03-24
 */

interface ParentNodeInfo {
  elm : ParentNode | null;
  hasP: boolean;
  name: string;
  isA : boolean;
  href: string | undefined;
}



/**
 * Determines whether the specified HTML element has a parent node and returns information about the parent node.
 *
 * @param   {HTMLElement}    elm - The HTML element whose parent node is to be investigated
 * @returns {ParentNodeInfo}       An object containing the parent node element, existence flag, node name, boolean whether it's an A tag, and its href attribute
 */
export function hasParentNode(elm: HTMLElement): ParentNodeInfo {
	const parent              = elm.parentNode;
	const obj: ParentNodeInfo = {
		elm : parent,
		hasP: parent ? Object.hasOwn(parent, "nodeName")                      : false,
		name: parent ? (parent as HTMLElement).nodeName.toLowerCase()         : "",
		isA : parent ? (parent as HTMLElement).nodeName.toLowerCase() === "a" : false,
		href: parent ? (parent as HTMLAnchorElement).href                     : undefined
	};

	console.debug("DEBUG(dom): check parentNode existence", obj);

	return obj;
}