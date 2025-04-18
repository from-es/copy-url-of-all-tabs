export class StorageManager {
	static test() {
		console.log("Call, class StorageManager() >> test()");
	}

	static view(key) {
		const keyname = (key === undefined ||  key === null || typeof key !== "string" || key === "") ? {} : key;
		
		chrome.storage.local.get(keyname, (items) => {
			// console.log(`View Local Storage, keyname is "${keyname}".`, items);
			
			return { key: key, items: items };
		});
	}

	static save(key, data) {
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

	static load(key) {
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

	static remove(key) {
		chrome.storage.local.remove(key, () => {
			console.log(`Removed Data from Local Storage. keyname is "${key}".`, key);
		});
	}

	static removeAll() {
		chrome.storage.local.clear(() => {
			console.log(`Removed All Data from Local Storage.`);
		});
	}
}