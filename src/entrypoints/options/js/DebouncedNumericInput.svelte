<script lang="ts">
	/**
	 * A numeric input component with debounced updates.
	 *
	 * @file
	 * @lastModified 2026-03-24
	 */

	// Import NPM Package
	import { debounce } from "lodash-es";

	// Import Module & Types
	import { PopoverMessage, type MessageType } from "@/assets/js/lib/user/MessageManager/PopoverMessage";



	/**
	 * Properties for the DebouncedNumericInput component.
	 */
	type Props = {
		/** Optional ID for the input element. */
		id          ?: string;
		/** The numeric value to be debounced and synchronized. */
		value        : number;
		/** Minimum allowed value. */
		min         ?: number;
		/** Maximum allowed value. */
		max         ?: number;
		/** Step increment for the numeric input. */
		step        ?: number;
		/** Debounce time in milliseconds. */
		debounceTime?: number;
		/** Additional attributes to be passed to the input element. */
		[key: string]: unknown;
	};



	/* eslint-disable prefer-const */
	let {
		id,
		value        = $bindable(),
		min          = 0,
		max          = 100,
		step         = 1,
		debounceTime = 500,  // milliseconds
		...rest              // Collects all other props into the 'rest' object.
	}: Props = $props();
	/* eslint-enable prefer-const */

	let handleInput = $state<ReturnType<typeof debounce> | null>(null);

	// The effect is re-executed whenever the debounceTime property changes.
	$effect(() => {
		// Generate a new debounce function.
		const newHandleInput = debounce(processInput, debounceTime);

		/**
		 * Cleanup function called when:
		 *   - The effect is re-executed (debounceTime changes)
		 *   - The component is destroyed
		 */
		const cleanup = () => {
			// Capture and cancel newHandleInput within this scope.
			newHandleInput.cancel();
		};

		handleInput = newHandleInput;

		return cleanup;
	});

	/**
	 * Processes the input event, validates the numeric value,
	 * and updates the parent component's state or shows a warning.
	 *
	 * @param   {Event} event - The input event from the HTMLInputElement.
	 * @returns {void}
	 */
	function processInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		const num    = Number(target.value);

		if (isNaN(num) || num < min || num > max) {
			// If an invalid value is entered, display a warning message.
			const message = {
				message: [
					`The entered value "${target.value}" is invalid.`,
					`Please set a value in the range ${min} ~ ${max}.`,
				],
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
	{value}
	{min}
	{max}
	{step}
	oninput={handleInput}
	{...rest}
/>