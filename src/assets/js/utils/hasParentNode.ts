interface ParentNodeInfo {
  elm : ParentNode | null;
  hasP: boolean;
  name: string;
  isA : boolean;
  href: string | undefined;
}

/**
 * 指定されたHTML要素の親ノードが存在するかどうかを判定し、親ノードに関する情報を返します。
 *
 * @param   {HTMLElement}    elm - 親ノードを調査する対象のHTML要素。
 * @returns {ParentNodeInfo}     - 親ノードの要素、存在有無、ノード名、Aタグかどうかの真偽値、およびhref属性を含むオブジェクト。
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