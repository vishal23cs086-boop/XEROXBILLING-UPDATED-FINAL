import { checkAuth } from './auth.js';
import { getCustomer, saveBill, getRecentBills } from './db.js';

// App State
let billItems = [];
let currentCustomer = null;
let pointsToRedeem = 0;
let autoDiscountPerc = 0;

// Default Items (Can be moved to Firestore later)
const availableItems = {
  "Xerox B/W A4": 2,
  "Xerox Color A4": 10,
  "Lamination (ID Card)": 20,
  "Lamination (A4)": 30,
  "Spiral Binding": 50,
  "Printout (Color)": 15,
  "A4 Paper Rim": 280,
  "Pen": 10
};

// DOM Elements
const userNameDisplay = document.getElementById('userNameDisplay');
const customerMobile = document.getElementById('customerMobile');
const customerName = document.getElementById('customerName');
const customerStats = document.getElementById('customerStats');
const statTotalSpent = document.getElementById('statTotalSpent');
const statPoints = document.getElementById('statPoints');
const statTier = document.getElementById('statTier');

const itemSearch = document.getElementById('itemSearch');
const itemSelect = document.getElementById('itemSelect');
const itemPrice = document.getElementById('itemPrice');
const itemQty = document.getElementById('itemQty');
const addItemBtn = document.getElementById('addItemBtn');

const redeemPoints = document.getElementById('redeemPoints');
const applyPointsBtn = document.getElementById('applyPointsBtn');
const clearBillBtn = document.getElementById('clearBillBtn');
const generateBillBtn = document.getElementById('generateBillBtn');
const whatsappBtn = document.getElementById('whatsappBtn');
const pdfBtn = document.getElementById('pdfBtn');

// History Elements
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyTableBody = document.getElementById('historyTableBody');

let lastGeneratedBill = null;
let cachedHistory = [];

// Initialize
async function init() {
  const user = await checkAuth();
  if (user) {
    userNameDisplay.textContent = localStorage.getItem('userName') || user.email;
    if (localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'super_admin') {
      document.getElementById('dashboardBtn').classList.remove('hidden');
    }
  }

  // Populate items
  for (const [name, price] of Object.entries(availableItems)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} - ₹${price}`;
    itemSelect.appendChild(opt);
  }
  updatePriceInput();

  // Clock
  setInterval(updateClock, 1000);
  updateClock();
}

function updateClock() {
  const now = new Date();
  document.getElementById('receiptDate').textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('receiptTime').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Event Listeners
itemSelect.addEventListener('change', updatePriceInput);

function updatePriceInput() {
  const selected = itemSelect.value;
  if (availableItems[selected]) {
    itemPrice.value = availableItems[selected];
  }
}

customerMobile.addEventListener('input', async (e) => {
  const mobile = e.target.value.replace(/\D/g, '');
  document.getElementById('receiptCustomerMobile').textContent = mobile ? `Ph: +91 ${mobile}` : '';
  
  if (mobile.length === 10) {
    const cust = await getCustomer(mobile);
    if (cust) {
      currentCustomer = cust;
      customerName.value = cust.name;
      document.getElementById('receiptCustomerName').textContent = cust.name;
      
      statTotalSpent.textContent = `₹${cust.totalSpent || 0}`;
      statPoints.textContent = `${cust.points || 0} Pts`;
      
      // Auto Discount Tier Logic
      const spent = cust.totalSpent || 0;
      if (spent >= 5000) autoDiscountPerc = 20;
      else if (spent >= 3000) autoDiscountPerc = 15;
      else if (spent >= 1500) autoDiscountPerc = 10;
      else autoDiscountPerc = 0;

      statTier.textContent = `${autoDiscountPerc}%`;
      customerStats.classList.remove('hidden');
      customerStats.classList.add('grid');
    } else {
      currentCustomer = null;
      autoDiscountPerc = 0;
      customerStats.classList.add('hidden');
      customerStats.classList.remove('grid');
    }
    renderReceipt();
  } else {
    currentCustomer = null;
    autoDiscountPerc = 0;
    customerStats.classList.add('hidden');
    customerStats.classList.remove('grid');
    renderReceipt();
  }
});

customerName.addEventListener('input', (e) => {
  document.getElementById('receiptCustomerName').textContent = e.target.value || 'Cash Customer';
});

addItemBtn.addEventListener('click', () => {
  const name = itemSelect.value;
  const price = parseFloat(itemPrice.value);
  const qty = parseInt(itemQty.value);

  if (!name || isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
    alert('Please enter valid item details.');
    return;
  }

  billItems.push({ name, price, qty, total: price * qty });
  itemQty.value = '';
  renderReceipt();
});

applyPointsBtn.addEventListener('click', () => {
  const p = parseInt(redeemPoints.value);
  if (isNaN(p) || p <= 0) return;
  if (!currentCustomer) return alert('No customer loaded.');
  if (p > (currentCustomer.points || 0)) return alert('Not enough points.');
  
  pointsToRedeem = p;
  renderReceipt();
});

clearBillBtn.addEventListener('click', () => {
  billItems = [];
  pointsToRedeem = 0;
  customerMobile.value = '';
  customerName.value = '';
  currentCustomer = null;
  autoDiscountPerc = 0;
  customerStats.classList.add('hidden');
  customerStats.classList.remove('grid');
  document.getElementById('receiptCustomerName').textContent = 'Cash Customer';
  document.getElementById('receiptCustomerMobile').textContent = '';
  document.getElementById('receiptInvoiceNo').textContent = 'Pending Generation';
  
  generateBillBtn.classList.remove('hidden');
  whatsappBtn.classList.add('hidden');
  pdfBtn.classList.add('hidden');
  generateBillBtn.disabled = false;
  generateBillBtn.innerHTML = '✅ Generate Bill';
  lastGeneratedBill = null;
  
  renderReceipt();
});

window.removeItem = function(index) {
  billItems.splice(index, 1);
  renderReceipt();
};

function renderReceipt() {
  const list = document.getElementById('receiptItems');
  const emptyMsg = document.getElementById('emptyCartMsg');
  
  list.innerHTML = '';
  let subtotal = 0;

  if (billItems.length === 0) {
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
    billItems.forEach((item, i) => {
      subtotal += item.total;
      list.innerHTML += `
        <tr class="text-slate-300">
          <td class="py-2">${i+1}</td>
          <td class="py-2 font-medium text-white">${item.name}</td>
          <td class="py-2 text-center">${item.qty}</td>
          <td class="py-2 text-right">₹${item.price.toFixed(2)}</td>
          <td class="py-2 text-right font-bold text-white">₹${item.total.toFixed(2)}</td>
          <td class="py-2 text-center no-print">
            <button onclick="removeItem(${i})" class="text-red-500 hover:text-red-400 text-lg">&times;</button>
          </td>
        </tr>
      `;
    });
  }

  const discountAmt = subtotal * (autoDiscountPerc / 100);
  const totalBeforePoints = subtotal - discountAmt;
  
  // Ensure points don't exceed the bill amount
  if (pointsToRedeem > totalBeforePoints) {
    pointsToRedeem = Math.floor(totalBeforePoints);
    redeemPoints.value = pointsToRedeem;
  }
  
  const finalAmount = totalBeforePoints - pointsToRedeem;
  
  // Earn 1 point per 100 Rs spent on the final amount
  const pointsEarned = Math.floor(finalAmount / 100);

  document.getElementById('receiptSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('receiptDiscountPerc').textContent = autoDiscountPerc;
  document.getElementById('receiptDiscountAmt').textContent = `-₹${discountAmt.toFixed(2)}`;
  document.getElementById('receiptPointsRedeemed').textContent = `-₹${pointsToRedeem.toFixed(2)}`;
  document.getElementById('receiptFinalAmount').textContent = `₹${finalAmount.toFixed(2)}`;
  document.getElementById('receiptPointsEarned').textContent = `Earns ${pointsEarned} Loyalty Points`;
}

generateBillBtn.addEventListener('click', async () => {
  if (billItems.length === 0) return alert('Bill is empty!');
  
  // Disable button to prevent double submit
  generateBillBtn.disabled = true;
  generateBillBtn.innerHTML = 'Generating...';

  try {
    let subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    let discountAmt = subtotal * (autoDiscountPerc / 100);
    let finalAmount = subtotal - discountAmt - pointsToRedeem;
    let pointsEarned = Math.floor(finalAmount / 100);
    
    // Generate Invoice Number
    let now = new Date();
    let dd = String(now.getDate()).padStart(2, '0');
    let mm = String(now.getMonth() + 1).padStart(2, '0');
    let rand = Math.floor(1000 + Math.random() * 9000); // Temporary sequence until robust counter is implemented
    let invoiceNo = `SSX-${dd}${mm}-${rand}`;

    const billData = {
      invoiceNo: invoiceNo,
      customerMobile: customerMobile.value.trim(),
      customerName: customerName.value.trim() || 'Cash Customer',
      items: billItems,
      subtotal: subtotal,
      discount: discountAmt,
      pointsRedeemed: pointsToRedeem,
      finalAmount: finalAmount,
      pointsEarned: pointsEarned
    };

    const docId = await saveBill(billData);
    
    lastGeneratedBill = billData;
    
    document.getElementById('receiptInvoiceNo').textContent = invoiceNo;
    document.getElementById('receiptInvoiceNo').classList.replace('text-indigo-400', 'text-emerald-400');
    
    alert(`Bill Generated Successfully!\nInvoice: ${invoiceNo}\nAmount: ₹${finalAmount}`);
    
    // Toggle Buttons
    generateBillBtn.classList.add('hidden');
    whatsappBtn.classList.remove('hidden');
    pdfBtn.classList.remove('hidden');
    
  } catch (error) {
    alert('Failed to generate bill. Check console.');
    generateBillBtn.disabled = false;
    generateBillBtn.innerHTML = '✅ Generate Bill';
  }
});

// WhatsApp Integration
whatsappBtn.addEventListener('click', () => {
  if (!lastGeneratedBill) return;
  const mobile = lastGeneratedBill.customerMobile;
  if (!mobile || mobile.length !== 10) {
    alert("Please enter a valid 10-digit mobile number to send WhatsApp message.");
    return;
  }
  
  let msg = `*SRI SATHYA XEROX & E-SERVICES*\n`;
  msg += `Invoice: ${lastGeneratedBill.invoiceNo}\n`;
  msg += `Date: ${new Date().toLocaleDateString('en-GB')}\n\n`;
  msg += `*Items:*\n`;
  lastGeneratedBill.items.forEach(item => {
    msg += `- ${item.name} x${item.qty} = ₹${item.total}\n`;
  });
  msg += `\nSubtotal: ₹${lastGeneratedBill.subtotal}`;
  if (lastGeneratedBill.discount > 0) msg += `\nDiscount: -₹${lastGeneratedBill.discount}`;
  if (lastGeneratedBill.pointsRedeemed > 0) msg += `\nPoints Redeemed: -₹${lastGeneratedBill.pointsRedeemed}`;
  msg += `\n*Final Amount: ₹${lastGeneratedBill.finalAmount}*\n\n`;
  msg += `Thank you for your visit!`;

  const url = `https://api.whatsapp.com/send?phone=91${mobile}&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
});

// PDF Generation
pdfBtn.addEventListener('click', () => {
  const element = document.getElementById('receiptContainer');
  const opt = {
    margin:       10,
    filename:     `${lastGeneratedBill ? lastGeneratedBill.invoiceNo : 'Invoice'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Ensure backgrounds render in PDF
  element.classList.add('bg-slate-900');
  html2pdf().set(opt).from(element).save().then(() => {
    element.classList.remove('bg-slate-900');
  });
});

// History Modal Integration
historyBtn.addEventListener('click', async () => {
  historyModal.classList.remove('hidden');
  historyTableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-500 italic">Loading records...</td></tr>';
  
  const bills = await getRecentBills(50);
  cachedHistory = bills;
  historyTableBody.innerHTML = '';
  
  if (bills.length === 0) {
    historyTableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-500 italic">No previous bills found.</td></tr>';
    return;
  }
  
  bills.forEach((bill, index) => {
    const timeStr = bill.timestamp ? bill.timestamp.toDate().toLocaleString('en-GB') : 'Unknown';
    historyTableBody.innerHTML += `
      <tr class="text-slate-300 hover:bg-slate-800/50 transition-colors">
        <td class="py-3 px-2">${timeStr}</td>
        <td class="py-3 px-2 font-medium text-white">${bill.invoiceNo}</td>
        <td class="py-3 px-2">${bill.customerName} ${bill.customerMobile ? '(' + bill.customerMobile + ')' : ''}</td>
        <td class="py-3 px-2 text-right font-bold text-emerald-400">₹${(bill.finalAmount || 0).toFixed(2)}</td>
        <td class="py-3 px-2 text-center">
          <button onclick="viewHistoricalBill(${index})" class="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded text-xs font-bold border border-indigo-500/20">
            View
          </button>
        </td>
      </tr>
    `;
  });
});

closeHistoryBtn.addEventListener('click', () => {
  historyModal.classList.add('hidden');
});

window.viewHistoricalBill = function(index) {
  const bill = cachedHistory[index];
  if (!bill) return;
  
  // Close modal
  historyModal.classList.add('hidden');
  
  // Populate UI with historical bill
  lastGeneratedBill = bill;
  billItems = bill.items || [];
  pointsToRedeem = bill.pointsRedeemed || 0;
  autoDiscountPerc = bill.discount ? Math.round((bill.discount / bill.subtotal) * 100) : 0;
  
  document.getElementById('receiptCustomerName').textContent = bill.customerName;
  document.getElementById('receiptCustomerMobile').textContent = bill.customerMobile ? `Ph: +91 ${bill.customerMobile}` : '';
  
  document.getElementById('receiptInvoiceNo').textContent = bill.invoiceNo;
  document.getElementById('receiptInvoiceNo').classList.replace('text-indigo-400', 'text-emerald-400');
  
  if (bill.timestamp) {
     const d = bill.timestamp.toDate();
     document.getElementById('receiptDate').textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
     document.getElementById('receiptTime').textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  renderReceipt(); // This will recalculate UI based on the billItems and discounts
  
  // Update final amount UI just in case renderReceipt has precision differences
  document.getElementById('receiptFinalAmount').textContent = `₹${(bill.finalAmount || 0).toFixed(2)}`;
  
  generateBillBtn.classList.add('hidden');
  whatsappBtn.classList.remove('hidden');
  pdfBtn.classList.remove('hidden');
};

// Run Init
init();
