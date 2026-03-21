import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "../../../data/bridgeStore.json");

function loadStats() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return { totalBridges: 0, totalVolume: 0n };
    }
    const data = fs.readFileSync(STORE_PATH, "utf8");
    const json = JSON.parse(data);
    return {
      totalBridges: json.totalBridges || 0,
      totalVolume: BigInt(json.totalVolume || "0"),
    };
  } catch (e) {
    console.error("[BridgeStore] Error loading store:", e.message);
    return { totalBridges: 0, totalVolume: 0n };
  }
}

function syncToDisk() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify({
      totalBridges: bridgeStats.totalBridges,
      totalVolume: bridgeStats.totalVolume.toString(),
    }, null, 2));
  } catch (e) {
    console.error("[BridgeStore] Error syncing to disk:", e.message);
  }
}

let bridgeStats = loadStats();

export const BridgeManager = {
  recordBridge(amountUsdt) {
    bridgeStats.totalBridges += 1;
    bridgeStats.totalVolume += BigInt(amountUsdt);
    syncToDisk();
  },
  getStats() {
    return {
      count: bridgeStats.totalBridges,
      volume: bridgeStats.totalVolume.toString(),
    };
  }
};
