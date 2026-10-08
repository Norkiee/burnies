// Keep the original database name so the Burnies rename does not erase existing history.
const DB_NAME = "work-check-in";
const DB_VERSION = 1;
let dbPromise;

function openDatabase() {
  if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB unavailable"));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error || new Error("Could not open history"));
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("checkins")) db.createObjectStore("checkins", { keyPath: "id" });
        if (!db.objectStoreNames.contains("plans")) db.createObjectStore("plans", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
    });
  }
  return dbPromise;
}

async function run(storeName, mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let request;
    try { request = action(store); } catch (error) { reject(error); return; }
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error || new Error("History operation failed"));
    tx.onabort = () => reject(tx.error || new Error("History operation stopped"));
  });
}

export async function historyAvailable() { try { await openDatabase(); return true; } catch { return false; } }
export async function saveCheckIn(record) { return run("checkins", "readwrite", store => store.put(record)); }
export async function savePlan(record) { return run("plans", "readwrite", store => store.put(record)); }
export async function updatePlan(record) { return savePlan(record); }

export async function getAll(storeName) {
  try {
    const records = await run(storeName, "readonly", store => store.getAll());
    return (records || []).sort((a, b) => new Date(a.takenAt || a.createdAt) - new Date(b.takenAt || b.createdAt));
  } catch { return []; }
}

export const getCheckIns = () => getAll("checkins");
export const getPlans = () => getAll("plans");
export async function clearHistory() { await Promise.all([run("checkins", "readwrite", store => store.clear()), run("plans", "readwrite", store => store.clear())]); }
