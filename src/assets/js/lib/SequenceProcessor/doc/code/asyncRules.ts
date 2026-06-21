import { cloneObject } from "../../../CloneObject";
import type { SequenceRule } from "../../types";

/**
 * Type definition for verification data object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- VerificationData intentionally allows flexible, arbitrary validation metadata for rule processing
export type VerificationData = Record<string, any>;

/**
 * Rule set for verification composed entirely of asynchronous processing (Promise).
 */
export const asyncRules: SequenceRule<VerificationData>[] = [
	{
		meta: {
			name       : "AsyncAddProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Adding a property (Asynchronous)",
				target: "data.addedPropAsync",
				action: "Create a new property 'addedPropAsync' and assign the value 'async_value' after async resolution"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 10,
		process: {
			condition: async ({ data }) => {
				return !Object.hasOwn(data, "addedPropAsync");
			},
			execute: async ({ data }) => {
				const next = cloneObject(data);
				next.addedPropAsync = "async_value";
				return next;
			}
		}
	},
	{
		meta: {
			name       : "AsyncDeleteProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Deleting a property (Asynchronous)",
				target: "data.toBeDeletedAsync",
				action: "Delete the property 'toBeDeletedAsync' after async resolution"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 20,
		process: {
			condition: async ({ data }) => {
				return Object.hasOwn(data, "toBeDeletedAsync");
			},
			execute: async ({ data }) => {
				const next = cloneObject(data);
				delete next.toBeDeletedAsync;
				return next;
			}
		}
	},
	{
		meta: {
			name       : "AsyncRewriteProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Modifying a property value (Asynchronous)",
				target: "data.statusAsync",
				action: "Rewrite the value of the 'statusAsync' property to 'updated_async' after async resolution"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 30,
		process: {
			condition: async ({ data }) => {
				return data.statusAsync === "initial";
			},
			execute: async ({ data }) => {
				const next = cloneObject(data);
				next.statusAsync = "updated_async";
				return next;
			}
		}
	},
	{
		meta: {
			name       : "AsyncMoveProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Moving a property (Asynchronous)",
				target: "data.newLocationAsync",
				action: "Move the value of 'oldLocationAsync' to 'newLocationAsync' and delete 'oldLocationAsync' after async resolution"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 40,
		process: {
			condition: async ({ data }) => {
				return Object.hasOwn(data, "oldLocationAsync");
			},
			execute: async ({ data }) => {
				const next = cloneObject(data);
				next.newLocationAsync = next.oldLocationAsync;
				delete next.oldLocationAsync;
				return next;
			}
		}
	},
	{
		meta: {
			name       : "AsyncSkipPropertyAdd",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Skipping rule execution (Asynchronous)",
				target: "data.skippedPropAsync",
				action: "Confirm that execution is skipped and the property is not added by returning false asynchronously from the condition function"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 50,
		process: {
			condition: async () => {
				return false;
			},
			execute: async ({ data }) => {
				const next = cloneObject(data);
				next.skippedPropAsync = "should_not_exist";
				return next;
			}
		}
	}
];