
function overrideConsoleMethod () {
	const trapFunc = function (target, thisArg, args) {
		// Send a message to Parent Window
		const origin = new URL(document.URL).origin;
		const regex  = /^https?:\/\//i;
		const message = {
			type      : target.name,
			arguments : args
		};
		const targetOrigin = origin.match(regex) ? origin : "*";
		window.parent.postMessage(message, targetOrigin);

		// Return to Original Method
		return target(...args);
	};
	const handler = {
		apply : trapFunc
	};
	const methodOfConsole = [
		"debug",
		"info",
		"log",
		"warn",
		"error"
	];

	methodOfConsole.forEach(
		(method) => {
			console[method] = new Proxy(console[method], handler);
		}
	);
}