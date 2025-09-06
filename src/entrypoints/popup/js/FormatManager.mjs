class FormatManager {
	static format(tabs, format, template = null, sanitize = false) {
		let result = null;

		switch (format) {
			case "text":
				result = this.#text(tabs);
				break;
			case "json":
				result = this.#json(tabs);
				break;
			case "custom":
				result = this.#custom(tabs, template, sanitize);
				break;
			default: {
				// debug
				const msg = "Error, No match switch case. class FormatManager(tabs, format, template) >> format";
				console.error(msg, { tabs, format, template });

				throw new Error(msg);
			}
		}

		// debug
		console.log(`Debug, ${format} >>`, result);

		return result;
	}

	static #text(tabs) {
		const array  = (tabs).map((tab) => { return tab.url; });
		const result = (array).join("\n");

		return result;
	}

	static #json(tabs) {
		const array  = (tabs).map((tab) => { return { title: tab.title, url: tab.url }; });
		const result = JSON.stringify(array, null, "\t");

		return result;
	}

	static #custom(tabs, template, sanitize) {
		if ( !template ) {
			return "Error, Row template is empty! (see options page)";
		}

		const array = (tabs).map(
			(tab) => {
				const url     = tab.url;
				const title   = sanitize ? this.#escapeHTML(tab.title) : tab.title;
				const current = template
					.replace(/\$url/gi, url)
					.replace(/\$title/gi, title);

				return current;
			}
		);
		const result = (array).join("\n");

		return result;
	}

	/*
		escape と encodeURI と encodeURIComponent を正しく使い分ける(https://aloerina01.github.io/blog/2017-04-28-1)
	*/
	static #escapeHTML(target) {
		if (typeof target !== "string") {
			return target;
		}

		return (target).replace(/[&'`"<>]/g, (match) => {
			return {
				"&" : "&amp;",
				"'" : "&#x27;",
				"`" : "&#x60;",
				'"' : "&quot;",
				"<" : "&lt;",
				">" : "&gt;"
			}[match];
		});
	}
}



export { FormatManager };