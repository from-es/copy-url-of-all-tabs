import { type Config, type Define } from "@/assets/js/define";

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
		option ?: Config["Tab"];

		[key: string]: unknown;
	};
};



export { type ExtensionMessage, type Status };
export { type Config, type Define } from "@/assets/js/define";