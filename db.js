import { db, auth } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { logActivity } from './activity.js';

export function getCurrentStaffId() {
  return auth.currentUser ? auth.currentUser.uid : 'unknown';
}

export function getShopId() {
  return localStorage.getItem("shopId") || 'shop1';
}

export async function getCustomer(mobile) {
  if (!mobile) return null;
  try {
    const docRef = doc(db, "customers", mobile);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

export async function saveOrUpdateCustomer(mobile, name, spentAmount, pointsEarned) {
  if (!mobile) return;
  try {
    const docRef = doc(db, "customers", mobile);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      await updateDoc(docRef, {
        name: name || data.name,
        totalSpent: (data.totalSpent || 0) + spentAmount,
        points: (data.points || 0) + pointsEarned,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        mobile: mobile,
        name: name || 'Cash Customer',
        totalSpent: spentAmount,
        points: pointsEarned,
        shopId: getShopId(),
        createdBy: getCurrentStaffId(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating customer:", error);
  }
}

export async function saveBill(billData) {
  try {
    billData.staffId = getCurrentStaffId();
    billData.shopId = getShopId();
    billData.status = "completed";
    billData.createdBy = getCurrentStaffId();
    billData.updatedAt = serverTimestamp();
    billData.timestamp = serverTimestamp();

    const docRef = await addDoc(collection(db, "bills"), billData);
    
    // Log Activity
    await logActivity("CREATE_BILL", billData.finalAmount, { invoiceNo: billData.invoiceNo });

    // Update customer stats
    if (billData.customerMobile) {
      await saveOrUpdateCustomer(
        billData.customerMobile, 
        billData.customerName,
        billData.finalAmount, 
        billData.pointsEarned
      );
      
      // Deduct redeemed points
      if (billData.pointsRedeemed > 0) {
         const custRef = doc(db, "customers", billData.customerMobile);
         const custSnap = await getDoc(custRef);
         if(custSnap.exists()) {
            await updateDoc(custRef, {
              points: custSnap.data().points - billData.pointsRedeemed
            });
         }
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error saving bill:", error);
    throw error;
  }
}

export async function getRecentBills(limitCount = 50) {
  try {
    const q = query(
      collection(db, "bills"), 
      where("shopId", "==", getShopId()), 
      orderBy("timestamp", "desc"), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const bills = [];
    snapshot.forEach(doc => {
      bills.push({ id: doc.id, ...doc.data() });
    });
    return bills;
  } catch (error) {
    console.error("Error fetching recent bills:", error);
    return [];
  }
}
