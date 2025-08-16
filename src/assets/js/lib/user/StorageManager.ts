export class StorageManager {
	static test(): void {
		console.log("Call, class StorageManager() >> test()");
	}

	static view(key: string): void {
		const keyname = (key === undefined ||  key === null || typeof key !== "string" || key === "") ? {} : key;

		chrome.storage.local.get(keyname, (items) => {
			console.log(`View Local Storage, keyname is "${keyname}". item >>`, items);
		});
	}

	/**
	 * @param   {string}           key
	 * @param   {object}           data
	 * @returns {Promise<boolean>}
	 */
	static save(key: string, data: object): Promise<boolean> {
		return new Promise(
			(resolve, reject) => {
				let config = null;

				if ((typeof key === "string" && key !== "") && (typeof data === "object" && data !== null)) {
					config = { [key] : data };
				} else {
					console.error("Failed, Could not Save to Local Storage. Invalid argument, class StorageManager() >> save()", key, data);

					return reject(false);
				}

				chrome.storage.local.set(config, () => {
					// console.log(`Save to Local Storage. keyname is "${key}".`, config);

					return resolve(true);
				});
			}
		);
	}

	static load(key: string): Promise<object> {
		return new Promise(
			(resolve) => {
				chrome.storage.local.get(key, (item) => {
					const result = key ? item[key] : item;

					// console.log(`Load from Local Storage. keyname is "${key}".`, item)

					return resolve(result);
				});
			}
		);
	}

	static remove(key: string): void {
		chrome.storage.local.remove(key, () => {
			console.log(`Removed Data from Local Storage. keyname is "${key}".`, key);
		});
	}

	static removeAll(): void {
		chrome.storage.local.clear(() => {
			console.log("Removed All Data from Local Storage.");
		});
	}
}