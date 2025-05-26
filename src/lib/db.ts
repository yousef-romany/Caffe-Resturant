/* eslint-disable @typescript-eslint/no-explicit-any */
import Database from "@tauri-apps/plugin-sql"; // Corrected import

let db: Database | null = null; // Initialize db to null and type it
let dbInitializationPromise: Promise<Database | null> | null = null;

async function initializeDb(): Promise<Database | null> {
  if (typeof window !== "undefined") {
    try {
      console.log("Attempting to load database...");
      const loadedDb = await Database.load("mysql://root:root@localhost:3306/cafferesturant");
      console.log("Database loaded successfully.");
      return loadedDb;
    } catch (error) {
      console.error("Error loading database via Tauri plugin:", error);
      // Fallback or further error handling can be done here.
      // For now, it will return null if loading fails.
      return null;
    }
  }
  console.log("Not in a windowed environment, skipping DB load.");
  return null;
}

export async function getDb(): Promise<Database | null> {
  if (db) {
    return db;
  }
  if (!dbInitializationPromise) {
    dbInitializationPromise = initializeDb();
  }
  db = await dbInitializationPromise;
  return db;
}
