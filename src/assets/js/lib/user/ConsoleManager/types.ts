export const LOG_LEVELS = {
	all   : 0,  // 最も詳細なレベル、全てのログを出力する
	trace : 100,
	debug : 200,
	info  : 300,
	warn  : 400,
	error : 500,
	silent: Number.MAX_VALUE  // ログを一切出力しない
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export type ConsoleMethod      = "trace" | "debug" | "info" | "log" | "warn" | "error";
export type GroupConsoleMethod = "group" | "groupCollapsed" | "groupEnd";

export const METHOD_TO_LEVEL: Record<ConsoleMethod, LogLevel> = {
	trace: "trace",
	debug: "debug",
	info : "info",
	log  : "info",  // console.log は "info" レベルとして扱う
	warn : "warn",
	error: "error"
};

export type TimeCoordinate = "UTC" | "GMT";

export interface ConsoleManagerOptions {
  logging       : boolean;
  loglevel      : LogLevel;
  methodLabel   : boolean;
  timestamp     : boolean;
  timecoordinate: TimeCoordinate;
}