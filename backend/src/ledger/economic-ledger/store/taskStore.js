import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "../../../../data/taskStore.json");

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      if (!fs.existsSync(path.dirname(STORE_PATH))) {
        fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(data);
  } catch (e) {
    console.error("[TaskStore] Error loading store:", e.message);
    return [];
  }
}

function syncToDisk() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(taskStore, null, 2));
  } catch (e) {
    console.error("[TaskStore] Error syncing to disk:", e.message);
  }
}

const taskStore = loadStore();

export function saveTask(task) {
  taskStore.push(task);
  syncToDisk();
  console.log("[TaskStore] Task saved and persisted:", task.taskId);
}

export function getAllTasks() {
  return taskStore;
}

export function getTaskById(taskId) {
  return taskStore.find((t) => t.taskId === taskId);
}
