import { cloneObject } from "../../../CloneObject";
import type { SequenceRule } from "../../types";

/**
 * Type definition for verification data object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- VerificationData intentionally allows flexible, arbitrary validation metadata for rule processing
export type VerificationData = Record<string, any>;

/**
 * Rule set for verification composed entirely of synchronous processing.
 */
export const syncRules: SequenceRule<VerificationData>[] = [
	{
		meta: {
			name       : "SyncAddProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Adding a property (Synchronous)",
				target: "data.addedProp",
				action: "Create a new property 'addedProp' and assign the value 'sync_value'"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 10,
		process: {
			condition: ({ data }) => !Object.hasOwn(data, "addedProp"),
			execute  : ({ data }) => {
				const next = cloneObject(data);
				next.addedProp = "sync_value";
				return next;
			}
		}
	},
	{
		meta: {
			name       : "SyncDeleteProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Deleting a property (Synchronous)",
				target: "data.toBeDeleted",
				action: "Delete the property 'toBeDeleted' if it exists"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 20,
		process: {
			condition: ({ data }) => Object.hasOwn(data, "toBeDeleted"),
			execute  : ({ data }) => {
				const next = cloneObject(data);
				delete next.toBeDeleted;
				return next;
			}
		}
	},
	{
		meta: {
			name       : "SyncRewriteProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Modifying a property value (Synchronous)",
				target: "data.status",
				action: "Rewrite the value of the 'status' property to 'updated'"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 30,
		process: {
			condition: ({ data }) => data.status === "initial",
			execute  : ({ data }) => {
				const next = cloneObject(data);
				next.status = "updated";
				return next;
			}
		}
	},
	{
		meta: {
			name       : "SyncMoveProperty",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Moving a property (Synchronous)",
				target: "data.newLocation",
				action: "Move the value of 'oldLocation' to 'newLocation' and delete 'oldLocation'"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		order  : 40,
		process: {
			condition: ({ data }) => Object.hasOwn(data, "oldLocation"),
			execute  : ({ data }) => {
				const next = cloneObject(data);
				next.newLocation = next.oldLocation;
				delete next.oldLocation;
				return next;
			}
		}
	},
	{
		meta: {
			name       : "SyncSkipPropertyAdd",
			author     : "Verification Suite",
			description: {
				reason: "Verification: Skipping rule execution (Synchronous)",
				target: "data.skippedProp",
				action: "Confirm that execution is skipped and the property is not added by setting spec.enabled to false"
			},
			authored: "2026-06-20",
			version : "1.0.0"
		},
		spec: {
			enabled: false
		},
		order  : 50,
		process: {
			condition: () => true,
			execute  : ({ data }) => {
				const next = cloneObject(data);
				next.skippedProp = "should_not_exist";
				return next;
			}
		}
	}
];