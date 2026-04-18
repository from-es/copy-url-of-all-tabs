/**
 * Determines whether the specified HTML element has a parent node and returns information about the parent node.
 *
 * @file
 * @lastModified 2026-04-18
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
 * @throws  {TypeError}            Thrown if the argument is not an HTMLElement
 */
export function hasParentNode(elm: HTMLElement): ParentNodeInfo {
	if (!(elm instanceof HTMLElement)) {
		throw new TypeError("Invalid: argument 'elm' must be an instance of HTMLElement");
	}

	const parent              = elm.parentNode;
	const obj: ParentNodeInfo = {
		elm : parent,
		hasP: !!parent,
		name: parent ? (parent as HTMLElement).nodeName.toLowerCase()         : "",
		isA : parent ? (parent as HTMLElement).nodeName.toLowerCase() === "a" : false,
		href: parent ? (parent as HTMLAnchorElement).href                     : undefined
	};

	console.debug("DEBUG(dom): check parentNode existence", obj);

	return obj;
}