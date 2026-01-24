<script lang="ts">
	// Import NPM Package
	import { debounce } from "lodash-es";

	// Import Module & Types
	import { PopoverMessage, type MessageType } from "@/assets/js/lib/user/MessageManager/PopoverMessage";

	type Props = {
		id          ?: string;
		value        : number;
		min         ?: number;
		max         ?: number;
		step        ?: number;
		debounceTime?: number;
		[key: string]: any;
	};

	let {
		id,
		value        = $bindable(),
		min          = 0,
		max          = 100,
		step         = 1,
		debounceTime = 500, // milliseconds
		...rest             // Collects all other props into the 'rest' object.
	}: Props = $props();

	let handleInput = $state<ReturnType<typeof debounce> | null>(null);

	// `debounceTime` プロパティが変更されるたびに、effect が再実行される
	$effect(() => {
		// 新しい debounce 関数を生成
		const newHandleInput = debounce(processInput, debounceTime);

		// この関数は、
		//   - effect が再実行される（`debounceTime`が変更される）
		//   - コンポーネントが破棄される
		// のタイミングに呼び出される、クリーンアップ用関数である。
		//
		// このスコープの `newHandleInput` をキャプチャしてキャンセルする。
		const cleanup = () => { newHandleInput.cancel(); };

		handleInput = newHandleInput;

		return cleanup;
	});

	/**
	 * Processes the input event, validates the numeric value,
	 * and updates the parent component's state or shows a warning.
	 *
	 * @param {Event} event - The input event from the HTMLInputElement.
	 */
	function processInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const num    = Number(target.value);

		if (isNaN(num) || num < min || num > max) {
			// If an invalid value is entered, display a warning message.
			const message = {
				message    : [	`The entered value "${target.value}" is invalid.`, `Please set a value in the range ${min} ~ ${max}.` ],
				timeout    : 5000,
				fontsize   : "1rem",
				messagetype: "warning" as MessageType
			};
			PopoverMessage.create(message);

			// If an invalid value is entered, revert the input's value to the last valid value.
			target.value = String(value);
		} else {
			// Notify the parent component of the validated value.
			value = num;
		}
	}
</script>



<input
	{id}
	type="number"
	value={value}
	{min}
	{max}
	{step}
	oninput={handleInput}
	{...rest}
/>