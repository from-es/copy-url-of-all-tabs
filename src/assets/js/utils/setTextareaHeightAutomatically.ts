
/**
 * `textarea`要素の高さを、その内容に合わせて自動的に調整
 * `input`または`change`イベントのイベントリスナーとして使用することを想定
 *
 * @param   {Event} event - `textarea`要素から発火したイベントオブジェクト
 * @returns {void}
 * @see https://web-dev.tech/front-end/javascript/textarea-auto-height/
 */
export function setTextareaHeightAutomatically(event: Event): void {
	const self = event.currentTarget as HTMLTextAreaElement;

	self.style.height = "auto";
	self.style.height = `${self.scrollHeight}px`;
}