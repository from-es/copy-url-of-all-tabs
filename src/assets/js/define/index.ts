// Import Module
import { defaultConfig }     from "./config";
import { VerificationRules } from "./validation";
import * as App              from "./app";
import * as Constants        from "./constants";

// Import Types
import type { Define, Config } from "./types";

const {
	Environment,
	Information,
	Storage
} = App;

const {
	Regex,
	Message,
	Messaging,
	...restConstants
} = Constants;

export const define: Define = {
	Environment,
	Information,
	Storage,

	Config      : defaultConfig,
	Verification: VerificationRules,

	Regex,
	Message,
	Messaging,
	...restConstants,
};

export { Define, Config };