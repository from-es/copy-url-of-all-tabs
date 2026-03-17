// Import Object
import type { Config, Define } from "@/assets/js/define";



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
	EmptyObject
};
export type {
	Config,
	Define
} from "@/assets/js/define";