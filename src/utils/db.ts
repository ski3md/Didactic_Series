
const DB_NAME = 'PathologyModuleDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject(new Error('Error opening database'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains('keyval')) {
                dbInstance.createObjectStore('keyval', { keyPath: 'key' });
            }
        };
    });
    return dbPromise;
};

export const getStoreData = async <T>(key: string): Promise<T | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['keyval'], 'readonly');
        const store = transaction.objectStore('keyval');
        const request = store.get(key);

        request.onerror = () => {
            console.error(`IDB get error for key ${key}:`, request.error);
            reject(new Error(`Failed to retrieve data from local database. Reason: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve(request.result?.value);
        };
    });
};

export const setStoreData = async (key: string, value: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['keyval'], 'readwrite');
        const store = transaction.objectStore('keyval');
        const request = store.put({ key, value });

        request.onerror = () => {
            console.error(`IDB set error for key ${key}:`, request.error);
            if (request.error?.name === 'QuotaExceededError') {
                 reject(new Error('Local database storage quota exceeded. Please clear some storage space in your browser settings.'));
            } else {
                 reject(new Error(`Failed to save data in local database. Reason: ${request.error?.message}`));
            }
        };

        request.onsuccess = () => {
            resolve();
        };
    });
};

export const deleteStoreData = async (key: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['keyval'], 'readwrite');
        const store = transaction.objectStore('keyval');
        const request = store.delete(key);
        
        request.onerror = () => {
            console.error(`IDB delete error for key ${key}:`, request.error);
            reject(new Error(`Failed to delete data in local database. Reason: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve();
        };
    });
};
