
import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
let dbInitializationPromise: Promise<Database | null> | null = null;

async function initializeDb(): Promise<Database | null> {
  if (db) {
    return db;
  }

  // If initialization is already in progress, wait for it
  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }

  // Start initialization
  dbInitializationPromise = (async () => {
    try {
      if (typeof window !== "undefined") {
        console.log("Attempting to load database with @tauri-apps/plugin-sql...");
        // Check if Database.load is available
        if (Database && typeof Database.load === 'function') {
          // For MySQL, connection string format is: mysql://user:pass@host:port/database
          // Ensure your database server is running and accessible.
          const loadedDb = await Database.load("mysql://root:root@localhost:3306/cafferesturant");
          console.log("Database loaded successfully via @tauri-apps/plugin-sql.");
          db = loadedDb; // Assign to the outer db variable
          return db;
        } else {
          console.warn("@tauri-apps/plugin-sql Database.load is not available. DB operations will fail unless in a Tauri context or if the plugin isn't correctly initialized.");
          db = null;
          return null;
        }
      } else {
        console.log("Database initialization skipped (not in browser environment).");
        db = null;
        return null;
      }
    } catch (error) {
      console.error("Error loading database with @tauri-apps/plugin-sql:", error);
      db = null;
      return null;
    } finally {
      dbInitializationPromise = null; // Reset promise once done
    }
  })();
  return dbInitializationPromise;
}

export const getDb = async (): Promise<Database | null> => {
  if (!db) {
    await initializeDb();
  }
  if (!db) {
    // This console.error might be redundant if initializeDb already logged an error,
    // but it's a safeguard to indicate connection issues.
    console.error("Database connection is not available after initialization attempt. Operations will likely fail.");
  }
  return db;
};
