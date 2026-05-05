import { db } from './firebase-config.js';
import { getCurrentStaffId, getShopId } from './db.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function logActivity(action, amount, meta = {}) {
  try {
    const activityData = {
      action: action,
      amount: amount || 0,
      staffId: getCurrentStaffId(),
      shopId: getShopId(),
      timestamp: serverTimestamp(),
      meta: meta
    };
    await addDoc(collection(db, "activity_logs"), activityData);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
