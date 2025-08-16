// Import Types
import { type Config, type Define } from "@/assets/js/types/";



type MigrationRuleMeta = {
	reason : string;
	target : string;
	action : string;
	created: string;
	expires: string;
}

type MigrationArgument = {
	config: Config;
	define: Define;
}

type MigrationRule = {
	rules    : MigrationRuleMeta;
	condition: (argument: MigrationArgument) => boolean;
	execute  : (argument: MigrationArgument) => Config;
}

type MigrationResult = {
	isMigrated: boolean;
	config: Config;
};



export { MigrationRuleMeta, MigrationArgument, MigrationRule, MigrationResult };