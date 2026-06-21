import { cloneObject } from "../../../CloneObject";
import type { SequenceRule } from "../../types";

/**
 * Type definition for verification data object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- VerificationData intentionally allows flexible, arbitrary validation metadata for rule processing
export type VerificationData = Record<string, any>;

/**
 * Rule set for verification composed of a mixture of synchronous and asynchronous (Promise) processing.
 */
export const mixedRules: SequenceRule<VerificationData>[] = [
	{
		meta: {
			name       : "MixedAddProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Adding a property (Synchronous condition, Asynchronous execute)",
				target: "data.addedPropMixed",
				action: "Following a synchronous condition check, add the 'addedPropMixed' property asynchronously"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 10,
		process: {
			condition: ({ data }) => !Object.hasOwn(data, "addedPropMixed"),
			execute  : async ({ data }) => {
				const next = cloneObject(data);
				next.addedPropMixed = "mixed_value";
				return next;
			}
		}
	},
	{
		meta: {
			name       : "MixedDeleteProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Deleting a property (Fully synchronous rule pattern)",
				target: "data.toBeDeletedMixed",
				action: "Delete the property 'toBeDeletedMixed' synchronously"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 20,
		process: {
			condition: ({ data }) => Object.hasOwn(data, "toBeDeletedMixed"),
			execute  : ({ data }) => {
				const next = cloneObject(data);
				delete next.toBeDeletedMixed;
				return next;
			}
		}
	},
	{
		meta: {
			name       : "MixedRewriteProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Modifying a property value (Asynchronous condition, Synchronous execute)",
				target: "data.statusMixed",
				action: "Following an asynchronous condition check, rewrite the 'statusMixed' property value synchronously"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 30,
		process: {
			condition: async ({ data }) => data.statusMixed === "initial",
			execute  : ({ data }) => {
				const next = cloneObject(data);
				next.statusMixed = "updated_mixed";
				return next;
			}
		}
	},
	{
		meta: {
			name       : "MixedMoveProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Moving a property (Fully asynchronous rule pattern)",
				target: "data.newLocationMixed",
				action: "Move the value of 'oldLocationMixed' to 'newLocationMixed' and delete 'oldLocationMixed' asynchronously"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 40,
		process: {
			condition: async ({ data }) => Object.hasOwn(data, "oldLocationMixed"),
			execute  : async ({ data }) => {
				const next = cloneObject(data);
				next.newLocationMixed = next.oldLocationMixed;
				delete next.oldLocationMixed;
				return next;
			}
		}
	},
	{
		meta: {
			name       : "MixedSkipPropertyAdd",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Skipping rule execution (Skipping via environment version constraint)",
				target: "data.skippedPropMixed",
				action: "Confirm that execution is automatically skipped and the property is not added by specifying spec.lifecycle.obsoleted"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		spec: {
			lifecycle: {
				obsoleted: "1.0.0"
			}
		},
		order  : 50,
		process: {
			condition: () => true,
			execute  : async ({ data }) => {
				const next = cloneObject(data);
				next.skippedPropMixed = "should_not_exist";
				return next;
			}
		}
	}
];