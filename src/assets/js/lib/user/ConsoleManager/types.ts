/**
 * Type definitions and constants used in ConsoleManager.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

const LOG_LEVELS = {
	all   : 0,  // Most detailed level; outputs all logs.
	trace : 100,
	debug : 200,
	info  : 300,
	warn  : 400,
	error : 500,
	silent: Number.MAX_VALUE  // Disables all logging.
} as const;



type LogLevel = keyof typeof LOG_LEVELS;

type ConsoleMethod      = "trace" | "debug" | "info" | "log" | "warn" | "error";
type GroupConsoleMethod = "group" | "groupCollapsed" | "groupEnd";

const METHOD_TO_LEVEL: Record<ConsoleMethod, LogLevel> = {
	trace: "trace",
	debug: "debug",
	info : "info",
	log  : "info",  // Treat console.log as "info" level.
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