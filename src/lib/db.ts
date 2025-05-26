/* eslint-disable @typescript-eslint/no-explicit-any */
import Database from "tauri-plugin-sql-api";
let getDb: any;
try {
  if (typeof window !== "undefined") {
    getDb = Database?.load("mysql://root:root@localhost:3306/cafferesturant");
  }
} catch (error) {
  console.log("error in load dataBase");
  throw error;
}
export { getDb };