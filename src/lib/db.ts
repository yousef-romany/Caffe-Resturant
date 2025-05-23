
import Database from "@tauri-apps/plugin-sql"; // Corrected import

let db: Database | null = null; // Initialize db to null and type it

async function initializeDb() {
  try {
    if (typeof window !== "undefined" && !db) {
      console.log("Attempting to load database with @tauri-apps/plugin-sql...");
      // Check if Database.load is available (it might not be in a pure Next.js SSR context without Tauri)
      if (Database && typeof Database.load === 'function') {
        // For MySQL, connection string format is: mysql://user:pass@host:port/database
        db = await Database.load("mysql://root:root@localhost:3306/cafferesturant");
        console.log("Database loaded successfully via @tauri-apps/plugin-sql.");
      } else {
        console.warn("@tauri-apps/plugin-sql Database.load is not available. DB operations will fail unless in a Tauri context.");
        db = null;
      }
    }
  } catch (error) {
    console.error("Error loading database with @tauri-apps/plugin-sql:", error);
    db = null; 
  }
  return db;
}

export const getDb = async (): Promise<Database | null> => {
  if (!db) { 
    await initializeDb();
  }
  if (!db) {
    console.error("Database connection is not available. Operations will likely fail.");
    // Optionally throw an error here if db connection is critical for all operations
    // throw new Error("Database connection failed or not available.");
  }
  return db;
};
