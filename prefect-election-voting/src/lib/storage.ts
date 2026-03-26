import { Candidate, Teacher } from "./mockData";

interface StoredVote {
  teacherEmail: string;
  selections: { prefects: string[] };
}

const DB_NAME = "electionDB";
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      if (!database.objectStoreNames.contains("candidates")) {
        database.createObjectStore("candidates", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("votes")) {
        database.createObjectStore("votes", { keyPath: "teacherEmail" });
      }
      if (!database.objectStoreNames.contains("teachers")) {
        database.createObjectStore("teachers", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings", { keyPath: "key" });
      }
    };
  });
};

// Candidates
export const saveCandidates = async (candidates: Candidate[]): Promise<void> => {
  const database = await openDB();
  const transaction = database.transaction("candidates", "readwrite");
  const store = transaction.objectStore("candidates");
  
  // Clear existing and add new
  store.clear();
  candidates.forEach((candidate) => {
    store.put(candidate);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadCandidates = async (): Promise<Candidate[]> => {
  const database = await openDB();
  const transaction = database.transaction("candidates", "readonly");
  const store = transaction.objectStore("candidates");
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Votes
export const saveVotes = async (votes: StoredVote[]): Promise<void> => {
  const database = await openDB();
  const transaction = database.transaction("votes", "readwrite");
  const store = transaction.objectStore("votes");
  
  store.clear();
  votes.forEach((vote) => {
    store.put(vote);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadVotes = async (): Promise<StoredVote[]> => {
  const database = await openDB();
  const transaction = database.transaction("votes", "readonly");
  const store = transaction.objectStore("votes");
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Teachers
export const saveTeachers = async (teachers: Teacher[]): Promise<void> => {
  const database = await openDB();
  const transaction = database.transaction("teachers", "readwrite");
  const store = transaction.objectStore("teachers");
  
  store.clear();
  teachers.forEach((teacher) => {
    store.put(teacher);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadTeachers = async (): Promise<Teacher[]> => {
  const database = await openDB();
  const transaction = database.transaction("teachers", "readonly");
  const store = transaction.objectStore("teachers");
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Settings (votingOpen)
export const saveSetting = async (key: string, value: any): Promise<void> => {
  const database = await openDB();
  const transaction = database.transaction("settings", "readwrite");
  const store = transaction.objectStore("settings");
  store.put({ key, value });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadSetting = async (key: string, defaultValue: any): Promise<any> => {
  const database = await openDB();
  const transaction = database.transaction("settings", "readonly");
  const store = transaction.objectStore("settings");
  const request = store.get(key);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result?.value ?? defaultValue);
    };
    request.onerror = () => reject(request.error);
  });
};
