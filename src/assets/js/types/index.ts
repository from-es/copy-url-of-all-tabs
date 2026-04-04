// Import Object
import type { Config, Define } from "@/assets/js/define";



/**
 * Generic type to hold the return value of setTimeout,
 * absorbing differences in execution environments (Browser/NodeJS).
 */
type SetTimeoutHandle = ReturnType<typeof setTimeout> | number | undefined;

type EmptyObject = Record<string, never>;

type Status = {
	config: Config;
	define: Define;
};

type ExtensionMessage = {
	action : string;
	address: {
		from: string;
		to  : string;
	};
	status: Status;
	argument?: {
		urlList?: string[];
		option ?: Config;

		[key: string]: unknown;
	};
};



export type {
	Status,
	ExtensionMessage,
	EmptyObject,
	SetTimeoutHandle
};
export type {
	Config,
	Define
} from "@/assets/js/define";