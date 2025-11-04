import { type Config, type Define } from "@/assets/js/define";

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



export { type Status, type ExtensionMessage, type EmptyObject };
export { type Config, type Define } from "@/assets/js/define";