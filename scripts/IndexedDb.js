class IndexedDb {
	constructor(name, version, stores) {
		this.name = name;
		this.version = version;
		this.connection = null;
		this.stores = stores;
	}

	getConnection() {
		if (this.connection) return new Promise(resolve => resolve(this.connection));
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.name, this.version);
			request.onupgradeneeded = e => {
				const db = e.target.result;
				Object.keys(this.stores).forEach(el => db.createObjectStore(el, this.stores[el]));
			};

			request.onsuccess = e => {
				resolve(e.target.result);
			};

			request.onerror = e => {
				reject(e.target.error);
			};
		})
	}

	async query(store, query) {
		const connection = await this.getConnection();
		return await (new Promise((resolve, reject) => {
			const tx = connection.transaction(store, "readonly");
			const table = tx.objectStore(store);
			const request = table.openCursor();
			const documents = [];
			request.onsuccess = e => {
				const cursor = e.target.result;
				if (cursor) {
					if (!query || query(cursor.value)) {
						documents.push(cursor.value);
					}
					cursor.continue();
				} else {
					resolve(documents);
				}
			};
		}))
	}

	async delete(store, key) {
		const connection = await this.getConnection();
		return await (new Promise((resolve, reject) => {
			const tx = connection.transaction(store, "readwrite");
			const table = tx.objectStore(store);
			table.delete(key);
			tx.oncomplete = e => {
				resolve();
			};
			tx.onerror = e => {
				reject();
			};
		}));
	}

	async get(store, key) {
		const connection = await this.getConnection();
		return await (new Promise((resolve, reject) => {
			const tx = connection.transaction(store, "readonly");
			const table = tx.objectStore(store);
			const request = table.get(key);
			request.onsuccess = e => {
				resolve(e.target.result);
			};
			tx.onerror = e => {
				reject(e.target.error);
			};
		}));
	}

	async put(store, data, key = undefined) {
		const connection = await this.getConnection();
		await (new Promise((resolve, reject) => {
			const tx = connection.transaction(store, "readwrite");
			const table = tx.objectStore(store);
			table.put(data, key);
			tx.oncomplete = e => {
				resolve();
			};
			tx.onerror = e => {
				reject(e.target.error);
			};
		}));
	}
}