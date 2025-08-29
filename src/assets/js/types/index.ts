import { type Config, type Define } from "@/assets/js/define";



type ExtensionMessage = {
	action : string;
	address: {
		from: string;
		to  : string;
	};
	status: {
		config: Config;
		define: Define;
	};
	argument?: {
		urlList?: string[];
		option ?: Config["Tab"];

		[key: string]: unknown;
	};
};



export { ExtensionMessage };
export { type Config, type Define } from "@/assets/js/define";