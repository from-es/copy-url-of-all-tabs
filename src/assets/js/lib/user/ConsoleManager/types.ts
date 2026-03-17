const LOG_LEVELS = {
	all   : 0,  // 最も詳細なレベル、全てのログを出力する
	trace : 100,
	debug : 200,
	info  : 300,
	warn  : 400,
	error : 500,
	silent: Number.MAX_VALUE  // ログを一切出力しない
} as const;



type LogLevel = keyof typeof LOG_LEVELS;

type ConsoleMethod      = "trace" | "debug" | "info" | "log" | "warn" | "error";
type GroupConsoleMethod = "group" | "groupCollapsed" | "groupEnd";

const METHOD_TO_LEVEL: Record<ConsoleMethod, LogLevel> = {
	trace: "trace",
	debug: "debug",
	info : "info",
	log  : "info",  // console.log は "info" レベルとして扱う
	warn : "warn",
	error: "error"
};

type TimeCoordinate = "UTC" | "GMT";

interface ConsoleManagerOptions {
  logging       : boolean;
  loglevel      : LogLevel;
  methodLabel   : boolean;
  timestamp     : boolean;
  timecoordinate: TimeCoordinate;
}



export {
	LOG_LEVELS,
	METHOD_TO_LEVEL
};
export type {
	LogLevel,
	ConsoleMethod,
	GroupConsoleMethod,
	TimeCoordinate,
	ConsoleManagerOptions,
};