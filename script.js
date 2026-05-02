// script.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed: ', err));
  });
}

let currentUser = null;
let subtotal = 0;
let gstTotal = 0;
let currentCategory = "xerox";
let billItems = [];
let currentInvoiceNo = "";
let currentDateStr = "";

// Branch Data Configurations
const branchData = {
  branch1: {
    name: "SRI SATHYA XEROX & E SERVICES",
    tagline: "XEROX - STATIONERY & GOVT. APPROVED E-SEVA",
    address: "9/4, Metha Layout Road, Coimbatore - 641 004",
    phones: "95667 50356, 93842 67497, 97914 46895",
    email: "srisathyaxerox01@gmail.com",
    gstin: "33BMQPN0425H2Z3"
  },
  branch2: {
    name: "SRI SATHYA XEROX & E SERVICES",
    tagline: "XEROX - STATIONERY & GOVT. APPROVED E-SEVA",
    address: "23A, Kuchinaidu Layout, Masakalipalayam Road, Peelamedu, Coimbatore - 641 004",
    phones: "0422 - 4774419, 94878 52522, 97914 46895, 90251 51228",
    email: "srisathyaxerox02@gmail.com",
    gstin: "33BMQPN0425H2Z3"
  }
};

// Global Mobile Country Codes
const countryDialCodes = [
  { c: "IN", d: "91" }, { c: "US", d: "1" }, { c: "GB", d: "44" }, { c: "AE", d: "971" }, { c: "SA", d: "966" },
  { c: "AF", d: "93" }, { c: "AL", d: "355" }, { c: "DZ", d: "213" }, { c: "AD", d: "376" }, { c: "AO", d: "244" },
  { c: "AR", d: "54" }, { c: "AM", d: "374" }, { c: "AU", d: "61" }, { c: "AT", d: "43" }, { c: "AZ", d: "994" },
  { c: "BH", d: "973" }, { c: "BD", d: "880" }, { c: "BY", d: "375" }, { c: "BE", d: "32" }, { c: "BT", d: "975" },
  { c: "BO", d: "591" }, { c: "BA", d: "387" }, { c: "BR", d: "55" }, { c: "BG", d: "359" }, { c: "KH", d: "855" },
  { c: "CM", d: "237" }, { c: "CA", d: "1" }, { c: "CF", d: "236" }, { c: "TD", d: "235" }, { c: "CL", d: "56" },
  { c: "CN", d: "86" }, { c: "CO", d: "57" }, { c: "CR", d: "506" }, { c: "HR", d: "385" }, { c: "CU", d: "53" },
  { c: "CY", d: "357" }, { c: "CZ", d: "420" }, { c: "DK", d: "45" }, { c: "EG", d: "20" }, { c: "SV", d: "503" },
  { c: "EE", d: "372" }, { c: "ET", d: "251" }, { c: "FI", d: "358" }, { c: "FR", d: "33" }, { c: "GE", d: "995" },
  { c: "DE", d: "49" }, { c: "GH", d: "233" }, { c: "GR", d: "30" }, { c: "GT", d: "502" }, { c: "HT", d: "509" },
  { c: "HN", d: "504" }, { c: "HK", d: "852" }, { c: "HU", d: "36" }, { c: "IS", d: "354" }, { c: "ID", d: "62" },
  { c: "IR", d: "98" }, { c: "IQ", d: "964" }, { c: "IE", d: "353" }, { c: "IL", d: "972" }, { c: "IT", d: "39" },
  { c: "JM", d: "1876" }, { c: "JP", d: "81" }, { c: "JO", d: "962" }, { c: "KZ", d: "7" }, { c: "KE", d: "254" },
  { c: "KP", d: "850" }, { c: "KR", d: "82" }, { c: "KW", d: "965" }, { c: "LB", d: "961" }, { c: "LY", d: "218" },
  { c: "MY", d: "60" }, { c: "MV", d: "960" }, { c: "MT", d: "356" }, { c: "MX", d: "52" }, { c: "MC", d: "377" },
  { c: "MA", d: "212" }, { c: "MM", d: "95" }, { c: "NP", d: "977" }, { c: "NL", d: "31" }, { c: "NZ", d: "64" },
  { c: "NG", d: "234" }, { c: "NO", d: "47" }, { c: "OM", d: "968" }, { c: "PK", d: "92" }, { c: "PA", d: "507" },
  { c: "PY", d: "595" }, { c: "PE", d: "51" }, { c: "PH", d: "63" }, { c: "PL", d: "48" }, { c: "PT", d: "351" },
  { c: "QA", d: "974" }, { c: "RO", d: "40" }, { c: "RU", d: "7" }, { c: "SG", d: "65" }, { c: "ZA", d: "27" },
  { c: "ES", d: "34" }, { c: "LK", d: "94" }, { c: "SE", d: "46" }, { c: "CH", d: "41" }, { c: "TW", d: "886" },
  { c: "TH", d: "66" }, { c: "TR", d: "90" }, { c: "UA", d: "380" }, { c: "UY", d: "598" }, { c: "VE", d: "58" },
  { c: "VN", d: "84" }, { c: "YE", d: "967" }, { c: "ZM", d: "260" }, { c: "ZW", d: "263" }
];

// DEFAULT ITEMS
let items = {
  xerox: {
    "Xerox B/W A4 (Single Side)": 2,
    "Xerox B/W A4 (Back-to-Back)": 3,
    "Xerox Color A4": 10,
    "Xerox B/W A3": 10,
    "Xerox Color A3": 30,
    "Lamination (ID Card)": 20,
    "Lamination (A4)": 30,
    "Spiral Binding": 50,
    "Printout (Color)": 15
  },
  stationery: {
    "XO Pen": 10,
    "Fighter Flair": 10,
    "Flair Glow Pen": 10,
    "Flair Breeze": 20,
    "Joy Pen": 5,
    "Classmate Spin Pen": 10,
    "Yolo Pen": 10,
    "A4 Paper Rim (JK Copier)": 280,
    "Stapler (Small)": 40,
    "M Choki Rs.10 Stix (Jar)": 180,
    "Flair Mojo Pen": 5,
    "Flair Glass Gel Pen": 10,
    "Flair Liquid GT Pen Set": 100,
    "Flair Woody B.Pen": 10,
    "Flair Sunny Ball Pen (Pack)": 30,
    "Reynolds Racer Gel Blue": 10,
    "Reynolds Racer Gel Black": 10,
    "Reynolds Racer Gel Red": 10,
    "Reynolds Jetter Metallic FX Blue": 50,
    "Reynolds Jetter Aerosoft Blue": 30,
    "Reynolds 045 Fine Carbure Blue": 10,
    "Reynolds 045 Fine Carbure Black": 10,
    "Reynolds 045 Fine Carbure Red": 10,
    "Reynolds Correction Pen": 30,
    "Reynolds Glue Stick 6gm": 15,
    "Reynolds Glue Stick 8g": 25,
    "Reynolds Jetter Refill Blue": 10,
    "DOMS Note 1177": 59,
    "DOMS Note 1335": 30,
    "DOMS Note 8006": 40,
    "DOMS Note 8002": 28,
    "DOMS Pen Inxglo": 10,
    "DOMS Pen Xclusive": 12,
    "DOMS Pen Mirco": 5
  }
};

let savedInv = localStorage.getItem("adminInventory");
if (savedInv) {
  try {
    items = JSON.parse(savedInv);
  } catch (e) { }
} else {
  localStorage.setItem("adminInventory", JSON.stringify(items));
}

// LOAD SAVED
let savedItems = [];
try {
  savedItems = JSON.parse(localStorage.getItem("customItems")) || [];
} catch (e) {
  savedItems = [];
}

// --- AUTHENTICATION SYSTEM ---
const defaultEmployees = {
  "Valarmathi": "81481",
  "Vishal": "90251",
  "Sharanraj": "93605",
  "VIVEK": "80563",
  "hARSHAVARDHINI": "82207",
  "Sathya": "99525"
};

let employeesList = {};
try {
  let stored = localStorage.getItem("employeesList");
  if (stored) {
    employeesList = JSON.parse(stored);
  }
} catch (e) {
  employeesList = {};
}
// Force sync the specific requested users and passwords
for (let key in defaultEmployees) {
  employeesList[key] = defaultEmployees[key];
}
["Vishal N", "sharan raj", "sharanraj", "vivek vivek", "vivek"].forEach(k => {
  if (k !== "Sharanraj" && k !== "VIVEK" && employeesList[k]) delete employeesList[k];
});
localStorage.setItem("employeesList", JSON.stringify(employeesList));

function checkLoginStatus() {
  let empSelect = document.getElementById("reportEmpFilter");
  if (empSelect && !empSelect.querySelector("option[value='Valarmathi']")) {
    Object.keys(employeesList).forEach(empName => {
      let opt = document.createElement("option");
      opt.value = empName;
      opt.text = empName;
      empSelect.add(opt);
    });
  }

  try {
    let savedSession = localStorage.getItem("currentUser");
    if (savedSession) {
      currentUser = JSON.parse(savedSession);
      if (currentUser && currentUser.id) {
        let normalized = false;
        if (currentUser.id === "Vishal N") { currentUser.id = "Vishal"; normalized = true; }
        if (currentUser.id.toLowerCase() === "sharan raj" || currentUser.id === "sharanraj") { currentUser.id = "Sharanraj"; normalized = true; }
        if (currentUser.id.toLowerCase() === "vivek vivek" || currentUser.id === "vivek") { currentUser.id = "VIVEK"; normalized = true; }
        if (normalized) localStorage.setItem("currentUser", JSON.stringify(currentUser));
      }
      loginSuccess(false); // Immediate skip without animation
      return;
    }
  } catch (e) {
    localStorage.removeItem("currentUser");
  }

  document.getElementById("loginOverlay").classList.remove("hidden");
}

function attemptLogin() {
  let u = document.getElementById("loginUsername").value.trim();
  let p = document.getElementById("loginPassword").value.trim();
  let err = document.getElementById("loginError");
  let adminPass = localStorage.getItem("adminPassword") || "Sharanraj@18";

  let role = "";

  if (u === "Nandhakumar" && (p === adminPass || p === "Sharanraj@18")) {
    role = "admin";
  } else if (employeesList[u] && p === employeesList[u]) {
    role = "employee";
  } else {
    err.classList.remove("hidden");
    return;
  }

  currentUser = { id: u, role: role };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  loginSuccess(true); // Show animation
}

function loginSuccess(playAnimation = true) {
  document.getElementById("loginError").classList.add("hidden");

  if (playAnimation) {
    document.getElementById("loginOverlay").classList.add("hidden");
    completeLoginSetup();
  } else {
    document.getElementById("loginOverlay").classList.add("hidden");
    completeLoginSetup();
  }
}

function completeLoginSetup() {
  let userLabel = document.getElementById("currentUserLabel");
  if (userLabel) userLabel.innerText = `(${currentUser.id.toUpperCase()})`;

  if (currentUser.role === "admin") {
    document.getElementById("adminSettingsBtn").classList.remove("hidden");
    document.getElementById("adminFilterDiv").classList.remove("hidden");
    document.getElementById("ownerDashboard") && document.getElementById("ownerDashboard").classList.remove("hidden");

    // Auto Backup Once per Day
    let lastBackupDate = localStorage.getItem("lastBackupDate");
    let todayLocal = new Date().toLocaleDateString('en-GB');
    if (lastBackupDate !== todayLocal && typeof exportDBBackup === 'function') {
      exportDBBackup(true); // silent auto export
      localStorage.setItem("lastBackupDate", todayLocal);
    }
  } else {
    document.getElementById("adminSettingsBtn").classList.add("hidden");
    document.getElementById("adminFilterDiv").classList.add("hidden");
    document.getElementById("ownerDashboard") && document.getElementById("ownerDashboard").classList.add("hidden");
  }

  document.getElementById("loginPassword").value = "";

  if (!document.getElementById("reportsModal").classList.contains("hidden")) loadReports();
}

document.addEventListener("DOMContentLoaded", function () {
  let lp = document.getElementById("loginPassword");
  if (lp) {
    lp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") attemptLogin();
    });
  }
});

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

function openAdminSettings() {
  document.getElementById("adminSettingsModal").classList.remove("hidden");
  refreshEmployeeSelect();
  loadAdminInventory();
}

function saveAdminSettings() {
  let newAdminPwd = document.getElementById("newAdminPassword").value.trim();
  if (newAdminPwd) {
    if (newAdminPwd.length < 4) return showToast("Admin password too short");
    localStorage.setItem("adminPassword", newAdminPwd);
  }

  document.getElementById("newAdminPassword").value = "";
  document.getElementById("adminSettingsModal").classList.add("hidden");
  showToast("Settings saved successfully!");
}

// --- ADMIN EMPLOYEE MANAGEMENT ---
function addEmployee() {
  let adminPass = localStorage.getItem("adminPassword") || "Sharanraj@18";
  let entered = prompt("Enter Admin Password to Add Employee:");
  if (entered !== adminPass) {
    return showToast("Invalid Admin Password!");
  }

  let name = document.getElementById("newEmpName").value.trim();
  let pass = document.getElementById("newEmpPass").value.trim();

  if (!name || !pass) return showToast("Name and Password cannot be empty!");
  if (name.toLowerCase() === "nandhakumar") return showToast("Cannot override Owner account!");
  if (employeesList[name]) return showToast("Employee already exists!");

  employeesList[name] = pass;
  localStorage.setItem("employeesList", JSON.stringify(employeesList));

  document.getElementById("newEmpName").value = "";
  document.getElementById("newEmpPass").value = "";
  showToast(`Employee '${name}' Added Successfully!`);
  refreshEmployeeSelect();
}

function removeEmployee() {
  let adminPass = localStorage.getItem("adminPassword") || "Sharanraj@18";
  let entered = prompt("Enter Admin Password to Remove Employee:");
  if (entered !== adminPass) {
    return showToast("Invalid Admin Password!");
  }

  let name = document.getElementById("removeEmpSelect").value;
  if (!name) return showToast("Please select an employee to remove.");
  if (name.toLowerCase() === "nandhakumar") return showToast("Cannot remove Owner account!");

  delete employeesList[name];
  localStorage.setItem("employeesList", JSON.stringify(employeesList));

  showToast(`Employee '${name}' Removed!`);
  refreshEmployeeSelect();
}

function refreshEmployeeSelect() {
  let sel = document.getElementById("removeEmpSelect");
  if (sel) {
    sel.innerHTML = "";
    Object.keys(employeesList).forEach(e => {
      let opt = document.createElement("option");
      opt.value = e;
      opt.textContent = e;
      sel.add(opt);
    });
  }
}

// INITIALIZE APP
async function initApp() {
  checkLoginStatus();

  // Load Country Codes
  const codeSelect = document.getElementById("countryCode");
  codeSelect.innerHTML = "";
  countryDialCodes.forEach(country => {
    let option = document.createElement("option");
    option.value = country.d;
    option.text = `+${country.d} (${country.c})`;
    if (country.c === "IN") option.selected = true;
    codeSelect.add(option);
  });

  loadItems();
  changeBranch(); // Load initial branch header immediately
  renderBill();

  // Non-blocking cloud fetch
  updateDateAndInvoice();



  // Also run on blur to formalize the input field itself safely
  document.getElementById("customerName").addEventListener("blur", function (e) {
    e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
  });

  function updateReceiptMobile() {
    let mobileInput = document.getElementById("customerMobile").value;
    let mobile = mobileInput.replace(/\s+/g, '');
    let code = document.getElementById("countryCode").value;

    // Update the receipt UI
    document.getElementById("receiptCustomerMobile").innerText = mobileInput.trim() ? `Ph: +${code} ${mobileInput.trim()}` : '';

    // Auto-fill lookup
    if (mobile.length >= 10) {
      let customersDB = {};
      try { customersDB = JSON.parse(localStorage.getItem("customersDB")) || {}; } catch (e) { }
      let fullMobile = code + mobile;
      if (customersDB[fullMobile]) {
        let nameInput = document.getElementById("customerName");
        let gstinInput = document.getElementById("customerGSTINInput");

        let didAutofill = false;

        if (!nameInput.value) {
          nameInput.value = customersDB[fullMobile].name;
          window.updateCustomerName();
          didAutofill = true;
        }
        if (!gstinInput.value && customersDB[fullMobile].gstin) {
          gstinInput.value = customersDB[fullMobile].gstin;
          gstinInput.dispatchEvent(new Event('input'));
          didAutofill = true;
        }

        if (didAutofill) {
          showToast("✅ Customer Info Auto-Filled!");
        }
      }
    }
  }

  document.getElementById("customerMobile").addEventListener("input", updateReceiptMobile);
  document.getElementById("countryCode").addEventListener("change", updateReceiptMobile);

  document.getElementById("customerGSTINInput").addEventListener("input", function (e) {
    let val = e.target.value.trim().toUpperCase();
    let receiptGstin = document.getElementById("receiptCustomerGSTINStr");
    if (val) {
      document.getElementById("receiptCustomerGSTINValue").innerText = val;
      receiptGstin.classList.remove("hidden");
    } else {
      receiptGstin.classList.add("hidden");
    }
    syncLeftPanelMeta(true);
  });
}

let currentCloudDate = null;

async function fetchCloudTime() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch("https://worldtimeapi.org/api/timezone/Asia/Kolkata", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error("Cloud fetch failed");
    const data = await res.json();
    return new Date(data.datetime);
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn("Cloud time unavailable, using local machine time.");
    return new Date();
  }
}

function updateInvoiceNo() {
  let counter = parseInt(localStorage.getItem("invoiceCounter") || "0", 10);
  counter++;
  localStorage.setItem("invoiceCounter", counter);

  let padded = String(counter).padStart(4, '0');
  let now = new Date();
  let dd = String(now.getDate()).padStart(2, '0');
  let mm = String(now.getMonth() + 1).padStart(2, '0');

  currentInvoiceNo = `SSX-${dd}${mm}-${padded}`;

  let elem = document.getElementById("receiptInvoiceNoStr");
  let dt = document.getElementById("documentType") ? document.getElementById("documentType").value : "invoice";
  let isQuotation = (dt === "quotation");
  let labelStr = isQuotation ? "QUOTATION NO: " : "INVOICE NO: ";
  if (elem) elem.textContent = `${labelStr}${currentInvoiceNo}`;
}


async function updateDateAndInvoice() {
  // Pre-seed local time and generated invoice instantly
  const localD = new Date();
  currentDateStr = localD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  let dateElem = document.getElementById("receiptDateStr");
  if (dateElem) dateElem.textContent = currentDateStr;

  // DON'T generate invoice number until user clicks Generate Invoice
  // updateInvoiceNo();

  let dt = document.getElementById("documentType") ? document.getElementById("documentType").value : "invoice";
  let isQuotation = (dt === "quotation");
  let labelStr = isQuotation ? "QUOTATION NO: " : "INVOICE NO: ";
  let clickText = isQuotation ? "Quotation" : "Invoice";

  let elem = document.getElementById("receiptInvoiceNoStr");
  if (elem && !currentInvoiceNo) elem.innerHTML = `${labelStr}<span class="text-gray-400 italic font-normal tracking-normal text-[10px]">Click Generate ${clickText}</span>`;

  const d = await fetchCloudTime();
  currentCloudDate = d;

  currentDateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (dateElem) dateElem.textContent = currentDateStr;
  const timeElem = document.getElementById("receiptTimeStr");
  if (timeElem) timeElem.textContent = timeStr;

  syncLeftPanelMeta();
}

// 4. AUTO TIME + DATE LIVE TICKER
setInterval(() => {
  const now = new Date();
  const timeElem = document.getElementById("receiptTimeStr");
  if (timeElem) timeElem.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  if (!currentInvoiceNo) {
    const metaElem = document.getElementById("leftPanelInvoiceMeta");
    if (metaElem && !metaElem.classList.contains("hidden")) {
      const invStr = currentInvoiceNo || "(Not Generated)";
      metaElem.textContent = `BILL #${invStr} • ${currentDateStr} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
    }
  }
}, 1000);

function generateNewInvoice() {
  updateInvoiceNo();
  document.getElementById("generateInvoiceBtn").classList.add("hidden");
  document.getElementById("printBtn").classList.remove("hidden");
  syncLeftPanelMeta(true);
}

function syncLeftPanelMeta(forceShow = false) {
  const metaElem = document.getElementById("leftPanelInvoiceMeta");
  if (!metaElem) return;

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const invStr = currentInvoiceNo || "(Not Generated)";
  metaElem.textContent = `BILL #${invStr} • ${currentDateStr} ${timeStr}`;

  // Show if forced (e.g. typing name), or if bill items exist
  if (forceShow || billItems.length > 0) {
    metaElem.classList.remove("hidden");
  } else {
    metaElem.classList.add("hidden");
  }
}

// BRANCH MANAGEMENT
function changeBranch() {
  const selected = document.getElementById("branchSelector").value;
  const data = branchData[selected];

  document.getElementById("receiptHeaderCompanyName").textContent = data.name;
  let smallHeader = document.getElementById("receiptHeaderCompanyNameSmall");
  if (smallHeader) smallHeader.textContent = data.name;

  // Render bottom contact section dynamically
  let cPhones = document.getElementById("contactPhones");
  if (cPhones) cPhones.textContent = data.phones;
  let cEmail = document.getElementById("contactEmail");
  if (cEmail) cEmail.textContent = data.email;
  let cAddr = document.getElementById("contactAddress");
  if (cAddr) cAddr.textContent = data.address;

  let gstinVal = document.getElementById("gstinValue");
  if (gstinVal) gstinVal.textContent = data.gstin;
  if (document.getElementById("receiptGSTIN")) document.getElementById("receiptGSTIN").classList.remove("hidden");

  // Top Section
  let pTop = document.getElementById("contactPhonesTop");
  if (pTop) pTop.textContent = data.phones;
  let aTop = document.getElementById("contactAddressTop");
  if (aTop) aTop.textContent = data.address;

  // Footer section
  let pFooter = document.getElementById("contactPhonesFooter");
  if (pFooter) pFooter.textContent = data.phones;
  let eFooter = document.getElementById("contactEmailFooter");
  if (eFooter) eFooter.textContent = data.email;
  let aFooter = document.getElementById("contactAddressFooter");
  if (aFooter) aFooter.textContent = data.address;
}

// LOAD POS ITEMS DROPDOWN
function loadItems() {
  let select = document.getElementById("item");
  select.innerHTML = "";

  Object.keys(items[currentCategory]).forEach(item => {
    let option = document.createElement("option");
    option.text = item;
    select.add(option);
  });

  savedItems.forEach(obj => {
    let option = document.createElement("option");
    option.text = obj.name;
    select.add(option);
  });

  // Auto fill first item
  autoFillPrice();
}

// CATEGORY SWITCH
function setCategory(cat, btn) {
  currentCategory = cat;
  loadItems();

  document.querySelectorAll(".tab").forEach(b => {
    b.classList.remove("active-tab", "text-white", "bg-blue-600", "hover:bg-blue-700");
    b.classList.add("bg-white", "text-gray-600", "hover:bg-gray-50");
  });

  btn.classList.remove("bg-white", "text-gray-600", "hover:bg-gray-50");
  btn.classList.add("active-tab", "bg-blue-600", "text-white", "hover:bg-blue-700");
}

// SEARCH
function filterItems() {
  let search = document.getElementById("search").value.toLowerCase();
  let select = document.getElementById("item");

  select.innerHTML = "";

  Object.keys(items[currentCategory]).forEach(item => {
    if (item.toLowerCase().includes(search)) {
      let option = document.createElement("option");
      option.text = item;
      select.add(option);
    }
  });

  savedItems.forEach(obj => {
    if (obj.name.toLowerCase().includes(search)) {
      let option = document.createElement("option");
      option.text = obj.name;
      select.add(option);
    }
  });
  // Fill if available
  if (select.options.length > 0) autoFillPrice();
}

// AUTO PRICE
function autoFillPrice() {
  let itemSelect = document.getElementById("item");
  if (!itemSelect.value) return;

  let item = itemSelect.value;

  if (items[currentCategory] && items[currentCategory][item]) {
    document.getElementById("price").value = items[currentCategory][item];
  } else {
    let found = savedItems.find(x => x.name === item);
    if (found) {
      document.getElementById("price").value = found.price;
    }
  }
}

// SAVE CUSTOM ITEM
function saveCustomItem() {
  let name = document.getElementById("customItem").value.trim();

  if (!name) return showToast("Enter custom item name");

  let price = parseFloat(prompt("Enter standard price for " + name + " (₹):", "10"));
  if (isNaN(price) || price <= 0) return showToast("Invalid price. Item not saved.");

  // Check if exists
  if (savedItems.find(x => x.name === name)) {
    return showToast("Item already exists in memory");
  }

  savedItems.push({ name, price });
  localStorage.setItem("customItems", JSON.stringify(savedItems));

  document.getElementById("customItem").value = "";
  loadItems();

  showToast(name + " Saved to Custom Items ✅");
}

// ADD ITEM TO BILL
function addItem() {
  let item = document.getElementById("item").value;
  let price = parseFloat(document.getElementById("price").value);
  let qty = parseInt(document.getElementById("qty").value);

  let discountType = document.getElementById("discountType").value;
  let discountValue = parseFloat(document.getElementById("discountValue").value) || 0;

  if (!item) return showToast("Select an item.");
  if (isNaN(price) || price <= 0) return showToast("Enter a valid price.");
  if (isNaN(qty) || qty <= 0) return showToast("Enter a valid quantity (min 1).");

  let base = price * qty;

  let discount = 0;
  if (discountType === "amount") discount = discountValue;
  if (discountType === "percent") discount = base * (discountValue / 100);

  // Prevent over-discounting
  if (discount > base) discount = base;

  let afterDiscount = base - discount;
  let gst = afterDiscount * 0.18; // We calculate final GST on subtotal, but it's good to know line details
  let totalLinePrice = afterDiscount;

  billItems.push({
    item, qty, price, discount, afterDiscount
  });

  // Reset qty and discount inputs for next add
  document.getElementById("qty").value = "";
  document.getElementById("discountValue").value = "";
  document.getElementById("discountType").value = "none";
  document.getElementById("search").value = ""; // clear search
  filterItems(); // reset search

  renderBill();

  // Scroll to bottom of receipt
  const receiptContainer = document.getElementById("receiptDocument").parentElement;
  receiptContainer.scrollTop = receiptContainer.scrollHeight;
  syncLeftPanelMeta(true); // Always show when an item is added
}

// REMOVE ITEM
function removeItem(index) {
  billItems.splice(index, 1);
  renderBill();
}

// RENDER BILL
function renderBill() {
  let listHTML = "";
  subtotal = 0;
  let totalQuantity = 0;
  let totalDiscount = 0;

  if (billItems.length === 0) {
    document.getElementById("emptyCart").classList.remove("hidden");
  } else {
    document.getElementById("emptyCart").classList.add("hidden");
  }

  billItems.forEach((row, i) => {
    subtotal += row.afterDiscount;
    totalQuantity += parseInt(row.qty);
    totalDiscount += row.discount;
    listHTML += `
          <tr class="hover:bg-gray-100 text-gray-800  " >
              <td class="py-2.5 px-2 border-b border-gray-200 text-center font-medium ">${i + 1}</td>
              <td class="py-2.5 px-2 border-b border-gray-200 font-bold max-w-[200px] truncate break-words">
                ${row.item} ${row.discount > 0 ? `<span class="text-[9px] text-orange-500 font-bold ml-1 bg-orange-50 px-1 rounded">-₹${row.discount.toFixed(0)}</span>` : ''}
            </td>
            <td class="py-2.5 px-2 border-b border-gray-200 text-center font-black">${row.qty}</td>
            <td class="py-2.5 px-2 border-b border-gray-200 text-right  border-l border-dashed border-gray-200">₹${row.price.toFixed(2)}</td>
            <td class="py-2.5 px-2 border-b border-gray-200 text-right font-black text-gray-900 border-l border-dashed border-gray-200">₹${row.afterDiscount.toFixed(2)}</td>
            <td class="py-2.5 px-2 border-b border-gray-200 text-center no-print border-l border-blue-100">
                <button onclick="removeItem(${i})" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full  mx-auto flex" title="Remove Item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </tr>`;
  });

  document.getElementById("list").innerHTML = listHTML;

  let gstEnabled = document.getElementById("gstToggle").checked;
  if (gstEnabled) {
    gstTotal = subtotal * 0.18;
    let cgst = gstTotal / 2;
    let sgst = gstTotal / 2;

    document.getElementById("cgstRow").classList.remove("hidden");
    document.getElementById("cgstRow").classList.add("flex");
    document.getElementById("sgstRow").classList.remove("hidden");
    document.getElementById("sgstRow").classList.add("flex");

    document.getElementById("cgstTotal").innerText = "₹ " + cgst.toFixed(2);
    document.getElementById("sgstTotal").innerText = "₹ " + sgst.toFixed(2);

    document.getElementById("receiptGSTIN").style.display = "inline-block";
  } else {
    gstTotal = 0;

    document.getElementById("cgstRow").classList.remove("flex");
    document.getElementById("cgstRow").classList.add("hidden");
    document.getElementById("sgstRow").classList.remove("flex");
    document.getElementById("sgstRow").classList.add("hidden");

    document.getElementById("receiptGSTIN").style.display = "none";
  }

  let grandTotal = subtotal + gstTotal;
  let roundedTotal = Math.round(grandTotal);
  let roundOff = roundedTotal - grandTotal;

  let baseTotal = subtotal + totalDiscount;
  let baseTotalElem = document.getElementById("baseTotalAmount");
  if (baseTotalElem) baseTotalElem.innerText = "₹ " + baseTotal.toFixed(2);

  document.getElementById("subtotal").innerText = "₹ " + subtotal.toFixed(2);

  let discountRow = document.getElementById("discountRow");
  let discountAmountElem = document.getElementById("totalDiscountAmount");
  let afterDiscountRow = document.getElementById("afterDiscountRow");

  if (discountRow && discountAmountElem && afterDiscountRow) {
    if (totalDiscount > 0) {
      discountAmountElem.innerText = "-₹ " + totalDiscount.toFixed(2);
      discountRow.classList.remove("hidden");
      discountRow.classList.add("flex");
      afterDiscountRow.classList.remove("hidden");
      afterDiscountRow.classList.add("flex");
    } else {
      discountRow.classList.add("hidden");
      discountRow.classList.remove("flex");
      afterDiscountRow.classList.add("hidden");
      afterDiscountRow.classList.remove("flex");
    }
  }

  let roundOffElem = document.getElementById("roundOffValue");
  if (roundOffElem) roundOffElem.innerText = "₹ " + roundOff.toFixed(2);

  let totalQtyElem = document.getElementById("totalQty");
  if (totalQtyElem) totalQtyElem.innerText = totalQuantity;

  document.getElementById("total").innerText = "₹ " + roundedTotal.toFixed(2);

  let wordsElem = document.getElementById("amountWords");
  if (wordsElem) {
    wordsElem.innerText = numberToWords(roundedTotal) + " Rupees Only";
  }

  if (typeof calculateBalance === 'function') calculateBalance();
}

// CALCULATE BALANCE
window.calculateBalance = function () {
  let paidInput = document.getElementById("amountPaidInput");
  let balanceInput = document.getElementById("balanceAmountInput");
  let paidRow = document.getElementById("paymentPaidRow");
  let balanceRow = document.getElementById("paymentBalanceRow");
  let receiptPaid = document.getElementById("receiptAmountPaid");
  let receiptBalance = document.getElementById("receiptBalance");

  if (!paidInput) return;

  let paid = parseFloat(paidInput.value) || 0;
  let grandTotal = Math.round(subtotal + gstTotal);

  if (paid > 0) {
    let balance = paid - grandTotal;
    let isRemaining = balance < 0;
    let displayBalance = Math.abs(balance);
    let labelStr = isRemaining ? "Remaining Amount" : "Change Return";

    balanceInput.value = displayBalance.toFixed(2);

    let inputLabel = document.getElementById("balanceInputLabel");
    if (inputLabel) inputLabel.innerText = `${labelStr} (₹)`;

    let receiptLabel = document.getElementById("receiptBalanceLabel");
    if (receiptLabel) receiptLabel.innerText = labelStr;

    if (isRemaining) {
      balanceRow.className = "hidden flex justify-between py-2 px-4 text-sm font-bold text-red-600 bg-red-50";
    } else {
      balanceRow.className = "hidden flex justify-between py-2 px-4 text-sm font-bold text-green-600 bg-green-50";
    }

    paidRow.classList.remove("hidden");
    balanceRow.classList.remove("hidden");
    paidRow.classList.add("flex");
    balanceRow.classList.add("flex");

    receiptPaid.innerText = "₹ " + paid.toFixed(2);
    receiptBalance.innerText = "₹ " + displayBalance.toFixed(2);
  } else {
    balanceInput.value = "";

    let inputLabel = document.getElementById("balanceInputLabel");
    if (inputLabel) inputLabel.innerText = "Balance (₹)";

    paidRow.classList.add("hidden");
    balanceRow.classList.add("hidden");
    paidRow.classList.remove("flex");
    balanceRow.classList.remove("flex");
  }
}

// NUMBER TO WORDS (Indian Style)
function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  if (num === 0) return "Zero";
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "");

  return num + ""; // fallback
}

// TOGGLE GST
function toggleGST() {
  renderBill();
}

// SAVE TRANSACTION
function saveTransaction() {
  let invoiceNo = currentInvoiceNo;

  if (!invoiceNo) return; // Do not save if invoice isn't generated yet

  let transaction = {
    date: currentCloudDate ? currentCloudDate.toISOString() : new Date().toISOString(),
    invoiceNo: invoiceNo,
    customer: document.getElementById("customerName").value.trim() || "Cash Customer",
    customerMobile: document.getElementById("customerMobile").value.trim(),
    countryCode: document.getElementById("countryCode").value,
    customerGSTIN: document.getElementById("customerGSTINInput").value.trim().toUpperCase(),
    documentType: document.getElementById("documentType") ? document.getElementById("documentType").value : "invoice",
    subtotal: subtotal,
    gst: gstTotal,
    total: Math.round(subtotal + gstTotal),
    amountPaid: parseFloat(document.getElementById("amountPaidInput") ? document.getElementById("amountPaidInput").value : 0) || 0,
    createdBy: currentUser ? currentUser.id : "unknown",
    deleted: false,
    items: JSON.parse(JSON.stringify(billItems))
  };

  let transactions = window.transactions || [];
  let existingTx = transactions.find(t => t.invoiceNo === invoiceNo);

  if (existingTx && existingTx.id && typeof window.updateBill === 'function') {
    window.updateBill(existingTx.id, transaction);
  } else if (typeof window.saveBill === 'function') {
    window.saveBill(transaction);
  }

  // Save to Customers DB
  let cMobileRaw = transaction.customerMobile || "";
  let cMobile = cMobileRaw.replace(/\s+/g, '');
  if (cMobile && cMobile.length >= 10 && transaction.customer && transaction.customer !== "Cash Customer") {
    let customersDB = {};
    try { customersDB = JSON.parse(localStorage.getItem("customersDB")) || {}; } catch (e) { }
    let fullMobile = transaction.countryCode + cMobile;
    customersDB[fullMobile] = {
      name: transaction.customer,
      gstin: transaction.customerGSTIN
    };
    localStorage.setItem("customersDB", JSON.stringify(customersDB));
  }
}

// CLEAR BILL
async function clearBill(force = false) {
  if (billItems.length === 0) return;
  if (force === true || confirm("Are you sure you want to clear the entire bill?")) {
    billItems = [];
    document.getElementById("customerName").value = "";
    document.getElementById("customerMobile").value = "";
    document.getElementById("customerGSTINInput").value = "";
    document.getElementById("receiptCustomerName").innerText = "Cash Customer";
    document.getElementById("receiptCustomerMobile").innerText = "";
    document.getElementById("receiptCustomerGSTINStr").classList.add("hidden");

    let docTypeSelect = document.getElementById("documentType");
    if (docTypeSelect) {
      docTypeSelect.value = "invoice";
      if (typeof updateDocumentType === 'function') updateDocumentType();
    }

    currentInvoiceNo = "";
    document.getElementById("generateInvoiceBtn").classList.remove("hidden");
    document.getElementById("printBtn").classList.add("hidden");

    let paidInput = document.getElementById("amountPaidInput");
    let balanceInput = document.getElementById("balanceAmountInput");
    if (paidInput) paidInput.value = "";
    if (balanceInput) balanceInput.value = "";

    updateDateAndInvoice();
    renderBill();
    syncLeftPanelMeta(false);
  }
}

// CONFIRM BILL
function confirmBill() {
  if (billItems.length === 0) {
    showToast("Cannot confirm an empty bill! Please add items.");
    return;
  }
  if (!currentInvoiceNo) {
    showToast("Please click 'Generate Invoice' first before confirming!");
    return;
  }

  let popup = document.getElementById("whatsappPopupModal");
  if (popup) {
    popup.classList.remove("hidden");
  } else {
    // Fallback if UI not loaded
    saveTransaction();
    clearBill(true);
  }
}

function skipWhatsApp() {
  document.getElementById("whatsappPopupModal").classList.add("hidden");
  saveTransaction();
  clearBill(true);
}

function executeWhatsAppSend() {
  document.getElementById("whatsappPopupModal").classList.add("hidden");
  sendWhatsApp();
}

// PRINT
async function printReceipt() {
  if (billItems.length === 0) {
    showToast("Cannot print an empty bill! Please add items.");
    return;
  }
  if (!currentInvoiceNo) {
    showToast("Please click 'Generate Invoice' to get an invoice number before printing!");
    return;
  }
  saveTransaction();
  window.print();

  // Auto update / clear after putting a bill
  setTimeout(() => {
    clearBill(true);
  }, 500);
}

// SEND WHATSAPP
async function sendWhatsApp() {
  if (billItems.length === 0) {
    showToast("Cannot send an empty bill. Please add items.");
    return;
  }

  let countryCode = document.getElementById("countryCode").value;
  let mobile = document.getElementById("customerMobile").value.replace(/\s+/g, '');

  if (!mobile) {
    showToast("Please enter the customer's Mobile Number in the Left Panel first.");
    return;
  }

  let fullMobile = countryCode + mobile;

  let customerName = document.getElementById("customerName").value.trim() || "Customer";
  let customerGSTIN = document.getElementById("customerGSTINInput").value.trim().toUpperCase();
  let invoiceNo = currentInvoiceNo || localStorage.getItem("invoiceCounter") || "10001";
  let dateStr = currentDateStr || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  let shopGSTIN = document.getElementById("gstinValue").innerText;

  let dt = document.getElementById("documentType") ? document.getElementById("documentType").value : "invoice";
  let isQuotation = (dt === "quotation");

  let msg = `SRI SATHYA XEROX & E-SERVICES\n\n`;
  msg += isQuotation ? `Quotation No: ${invoiceNo}\n` : `Invoice No: ${invoiceNo}\n`;
  msg += `Date: ${dateStr}\n\n`;
  msg += isQuotation ? `Quotation To: ${customerName}\n\n` : `Bill To: ${customerName}\n\n`;
  msg += `--------------------------\n\n`;
  msg += `Item Details:\n\n`;
  msg += `S.No | Description | Qty | Price | Amount\n\n`;
  msg += `--------------------------\n\n`;

  let totalDiscount = 0;
  billItems.forEach((row, i) => {
    totalDiscount += row.discount;
    msg += `${i + 1} | ${row.item} | ${row.qty} | ${row.price.toFixed(2)} | ${row.afterDiscount.toFixed(2)}\n`;
  });

  let baseTotal = subtotal + totalDiscount;
  msg += `\n--------------------------\n\n`;
  msg += `Subtotal: ₹ ${baseTotal.toFixed(2)}\n`;
  if (totalDiscount > 0) {
    msg += `Discount Savings: -₹ ${totalDiscount.toFixed(2)}\n`;
    msg += `Net Amount: ₹ ${subtotal.toFixed(2)}\n`;
  }

  let grandTotal = subtotal + gstTotal;
  let roundedTotal = Math.round(grandTotal);
  msg += `Grand Total: ₹ ${roundedTotal.toFixed(2)}\n\n`;

  let paidInput = document.getElementById("amountPaidInput");
  let amountPaid = paidInput ? parseFloat(paidInput.value) || 0 : 0;
  if (amountPaid > 0) {
    let balance = amountPaid - roundedTotal;
    let isRemaining = balance < 0;
    let labelStr = isRemaining ? "Remaining Amount" : "Change Return";
    msg += `Amount Paid: ₹ ${amountPaid.toFixed(2)}\n`;
    msg += `${labelStr}: ₹ ${Math.abs(balance).toFixed(2)}\n\n`;
  }

  msg += `--------------------------\n\n`;
  msg += `Thank you for shopping with us!\n`;
  msg += `Visit Again!\n`;

  let encodedMsg = encodeURIComponent(msg);
  let whatsappUrl = `https://wa.me/${fullMobile}?text=${encodedMsg}`;

  // Save the transaction on send as well to record the sale
  saveTransaction();

  const receiptElem = document.getElementById('receiptDocument');
  if (typeof html2canvas !== 'undefined' && receiptElem) {
    try {
      const canvas = await html2canvas(receiptElem, {
        scale: 2,
        backgroundColor: "#ffffff",
        onclone: (doc) => {
          doc.querySelectorAll('.text-gray-500, .text-gray-400').forEach(e => { e.classList.remove('text-gray-500', 'text-gray-400'); e.classList.add('text-gray-800'); });
        }
      });
      canvas.toBlob(blob => {
        if (!blob) {
          window.open(whatsappUrl, '_blank');
          setTimeout(() => clearBill(true), 1500);
          return;
        }
        try {
          const item = new ClipboardItem({ "image/png": blob });
          navigator.clipboard.write([item]).then(() => {
            alert("✅ Invoice Image Copied!\n\nWhen WhatsApp opens, press CTRL+V (or long-press > Paste) in the chat box to send the image.");
            window.open(whatsappUrl, '_blank');
            setTimeout(() => clearBill(true), 1500);
          }).catch(e => {
            console.warn("Clipboard write failed", e);
            alert("⚠️ Sending without image (browser blocked clipboard access for image).");
            window.open(whatsappUrl, '_blank');
            setTimeout(() => clearBill(true), 1500);
          });
        } catch (e) {
          console.warn("ClipboardItem not supported", e);
          window.open(whatsappUrl, '_blank');
          setTimeout(() => clearBill(true), 1500);
        }
      }, "image/png");
    } catch (err) {
      console.error("Canvas error", err);
      window.open(whatsappUrl, '_blank');
      setTimeout(() => clearBill(true), 1000);
    }
  } else {
    window.open(whatsappUrl, '_blank');
    setTimeout(() => clearBill(true), 1000);
  }
}

// DAILY REPORTS MANAGER
function openReportsModal() {
  document.getElementById("reportsModal").classList.remove("hidden");
  document.getElementById("reportDate").valueAsDate = new Date();
  loadReports();
}

function closeReportsModal() {
  document.getElementById("reportsModal").classList.add("hidden");
}

window.currentExportData = [];

function loadReports() {
  const selectedDateStr = document.getElementById("reportDate").value;
  const periodElem = document.getElementById("reportPeriod");
  const period = periodElem ? periodElem.value : "daily";
  let transactions = window.transactions || [];

  transactions.forEach(t => {
    let fixID = (id) => {
      if (!id) return id;
      if (id === "Vishal N") return "Vishal";
      if (id.toLowerCase() === "sharan raj" || id === "sharanraj") return "Sharanraj";
      if (id.toLowerCase() === "vivek vivek" || id === "vivek") return "VIVEK";
      return id;
    };
    t.createdBy = fixID(t.createdBy);
    if (t.deletedBy) t.deletedBy = fixID(t.deletedBy);
  });

  let filtered = transactions;

  // Local Time Range Computation
  let [sY, sM, sD] = selectedDateStr.split('-');
  let refDate = new Date(sY, sM - 1, sD, 0, 0, 0);

  if (period === "daily") {
    filtered = transactions.filter(t => {
      let tD = new Date(t.date);
      return tD.getFullYear() === refDate.getFullYear() &&
        tD.getMonth() === refDate.getMonth() &&
        tD.getDate() === refDate.getDate();
    });
  } else if (period === "weekly") {
    let sevenDaysAgo = new Date(refDate);
    sevenDaysAgo.setDate(refDate.getDate() - 7);
    filtered = transactions.filter(t => {
      let tD = new Date(t.date);
      return tD >= sevenDaysAgo && tD <= new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59);
    });
  } else if (period === "monthly") {
    filtered = transactions.filter(t => {
      let tD = new Date(t.date);
      return tD.getFullYear() === refDate.getFullYear() && tD.getMonth() === refDate.getMonth();
    });
  } else if (period === "yearly") {
    filtered = transactions.filter(t => {
      let tD = new Date(t.date);
      return tD.getFullYear() === refDate.getFullYear();
    });
  }

  if (currentUser && currentUser.role === "admin") {
    let empFilter = document.getElementById("reportEmpFilter").value;
    if (empFilter !== "ALL") {
      filtered = filtered.filter(t => t.createdBy === empFilter);
    }

    // Setup Staff Performance Dashboard
    let staffPerf = {};
    Object.keys(employeesList).forEach(e => staffPerf[e] = 0);
    staffPerf["Nandhakumar"] = 0;

    let basePeriodTx = filtered;
    basePeriodTx.forEach(t => {
      if (!t.deleted) {
        if (staffPerf[t.createdBy] === undefined) staffPerf[t.createdBy] = 0;
        staffPerf[t.createdBy] += t.total;
      }
    });

    let dbHtml = "";
    Object.keys(staffPerf).forEach(name => {
      if (name === "undefined" || name.toLowerCase() === "admin") return;
      if (staffPerf[name] > 0 || employeesList[name] || name === "Nandhakumar") {
        let display = name === "Nandhakumar" ? "Nandhakumar (Owner)" : name;
        dbHtml += `<div class="bg-white p-3 rounded shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center hover:shadow ">
             <span class="text-[10px] font-black text-gray-400 uppercase w-full whitespace-nowrap overflow-hidden text-ellipsis mb-1 tracking-wider" title="${display}">${display}</span>
             <span class="text-xl font-black text-[#1e2759]">₹${staffPerf[name].toFixed(2)}</span>
        </div>`;
      }
    });
    let grid = document.getElementById("staffPerformanceGrid");
    if (grid) grid.innerHTML = dbHtml;

  } else {
    // Employees only see THEIR active bills
    filtered = filtered.filter(t => t.createdBy === currentUser.id && !t.deleted);
  }

  window.currentExportData = filtered;

  let html = "";
  let totalSales = 0;

  filtered.forEach(t => {
    let time = new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!t.deleted) totalSales += t.total;

    let isDeleted = t.deleted;
    let rowClass = isDeleted ? "bg-red-50 opacity-70" : "hover:bg-gray-50";
    let textClass = isDeleted ? "line-through text-red-500" : "text-[#1e2759]";

    let actionBtn = "";
    if (currentUser && currentUser.role === "admin") {
      if (isDeleted) {
        actionBtn = `<button onclick="restoreTransaction('${t.invoiceNo}')" class="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold hover:bg-green-600">Restore</button>`;
      } else {
        actionBtn = `
          <button onclick="resendWhatsApp('${t.invoiceNo}')" class="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold hover:bg-green-600 mr-1" title="Send WhatsApp">WA</button>
          <button onclick="reprintTransaction('${t.invoiceNo}')" class="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold hover:bg-blue-600 mr-1" title="Reprint">Reprint</button>
          <button onclick="deleteTransaction('${t.invoiceNo}')" class="text-xs bg-red-500 text-white px-2 py-1 rounded font-bold hover:bg-red-600">Delete</button>
        `;
      }
    } else {
      // Employee
      if (isDeleted) {
        actionBtn = `<span class="text-xs text-red-500 font-bold">Deleted</span>`;
      } else {
        actionBtn = `
           <button onclick="resendWhatsApp('${t.invoiceNo}')" class="text-xs text-green-500 hover:text-green-700 hover:bg-green-50 rounded font-bold px-2 py-1  scale-125 mr-1" title="Send WhatsApp">💬</button>
           <button onclick="reprintTransaction('${t.invoiceNo}')" class="text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded font-bold px-2 py-1  scale-125 mr-1" title="Reprint">🖨️</button>
           <button onclick="deleteTransaction('${t.invoiceNo}')" class="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded font-bold px-2 py-1  scale-125" title="Delete">🗑️</button>
         `;
      }
    }

    let adminMeta = "";
    if (currentUser && currentUser.role === "admin") {
      adminMeta = `<div class="text-[10px] text-gray-500 uppercase mt-0.5">By: ${t.createdBy}</div>`;
      if (isDeleted) adminMeta += `<div class="text-[10px] text-red-600 font-bold uppercase mt-0.5">Del By: ${t.deletedBy}</div>`;
    }

    html += `
            <tr class="${rowClass} border-b border-gray-200/20 hover:bg-black/5 ">
                <td class="p-3 text-xs font-semibold opacity-70">${time}</td>
                <td class="p-3 font-bold ${textClass}">${t.invoiceNo} ${adminMeta}</td>
                <td class="p-3 font-medium">${t.customer}</td>
                <td class="p-3 text-right">₹${t.subtotal.toFixed(2)}</td>
                <td class="p-3 text-right">₹${t.gst.toFixed(2)}</td>
                <td class="p-3 text-right font-black ${isDeleted ? 'text-red-500 line-through' : 'text-green-600'}">₹${t.total.toFixed(2)}</td>
                <td class="p-3 text-center no-print">${actionBtn}</td>
            </tr>
        `;
  });

  document.getElementById("reportsList").innerHTML = html;
  document.getElementById("reportTotalSales").innerText = "₹ " + totalSales.toFixed(2);

  if (filtered.length === 0) {
    document.getElementById("noReports").classList.remove("hidden");
    document.getElementById("reportsTable").classList.add("hidden");
  } else {
    document.getElementById("noReports").classList.add("hidden");
    document.getElementById("reportsTable").classList.remove("hidden");
  }

  renderChart(filtered);
}

// Chart.js Sales Graph Engine
let salesChartInstance = null;
function renderChart(transactions) {
  const ctx = document.getElementById("salesChart");
  if (!ctx) return;

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  // Aggregate by Date for Bar Chart
  let salesData = {};
  transactions.forEach(t => {
    if (t.deleted) return;
    let dateKey = new Date(t.date).toLocaleDateString('en-GB');
    salesData[dateKey] = (salesData[dateKey] || 0) + t.total;
  });

  const labels = Object.keys(salesData);
  const data = Object.values(salesData);

  let textColor = document.body.classList.contains('dark') ? '#cbd5e1' : '#475569';

  salesChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["No Data"],
      datasets: [{
        label: "Sales (₹)",
        data: data.length ? data : [0],
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: "rgba(200, 200, 200, 0.1)" } },
        y: { ticks: { color: textColor }, grid: { color: "rgba(200, 200, 200, 0.1)" } }
      }
    }
  });
}

function deleteTransaction(invoiceNo) {
  if (!confirm("Are you sure you want to delete this bill?")) return;
  let transactions = window.transactions || [];
  let t = transactions.find(x => x.invoiceNo === invoiceNo);
  if (t) {
    t.deleted = true;
    t.deletedBy = currentUser.id;
    if (t.id && typeof window.updateBill === 'function') {
      window.updateBill(t.id, { deleted: true, deletedBy: t.deletedBy });
    }
    showToast("Bill marked as deleted.");
  }
}

// UI PRO PACK LOGIC
function showToast(msg) {
  let t = document.createElement("div");
  t.innerText = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.background = "#22c55e";
  t.style.color = "white";
  t.style.padding = "12px 24px";
  t.style.borderRadius = "8px";
  t.style.fontWeight = "bold";
  t.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
  t.style.zIndex = "9999";
  t.style.transition = "all 0.3s ease";
  t.style.transform = "translateY(100px)";
  t.style.opacity = "0";

  document.body.appendChild(t);

  setTimeout(() => {
    t.style.transform = "translateY(0)";
    t.style.opacity = "1";
  }, 10);

  setTimeout(() => {
    t.style.transform = "translateY(100px)";
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  if (salesChartInstance) {
    loadReports(); // Re-render chart to flip axis colors
  }
}

window.updateCustomerName = function () {
  let name = document.getElementById("customerName").value;
  let titleCaseName = name.replace(/\b\w/g, c => c.toUpperCase());
  document.getElementById("receiptCustomerName").innerText = titleCaseName.trim() || 'Cash Customer';
  syncLeftPanelMeta(true);
};

window.updateDocumentType = function () {
  let dt = document.getElementById("documentType").value;
  let isQuotation = (dt === "quotation");

  let genBtn = document.getElementById("generateInvoiceBtn");
  if (genBtn) {
    genBtn.innerHTML = isQuotation ? "📝 Generate Quotation" : "📝 Generate Invoice";
  }

  let sendImgBtn = document.getElementById("sendImageBtn");
  if (sendImgBtn) {
    sendImgBtn.innerHTML = isQuotation ? "📸 Send Quotation (Image)" : "📸 Send Invoice (Image)";
  }

  let labelStr = isQuotation ? "QUOTATION NO: " : "INVOICE NO: ";
  let elem = document.getElementById("receiptInvoiceNoStr");
  if (elem) {
    if (!currentInvoiceNo) {
      elem.innerHTML = `${labelStr}<span class="text-gray-400 italic font-normal tracking-normal text-[10px]">Click Generate ${isQuotation ? 'Quotation' : 'Invoice'}</span>`;
    } else {
      elem.textContent = `${labelStr}${currentInvoiceNo}`;
    }
  }

  let billToLabel = document.getElementById("receiptBillToLabel");
  if (billToLabel) {
    billToLabel.innerText = isQuotation ? "Quotation To:" : "Bill To:";
  }
};

function restoreTransaction(invoiceNo) {
  let transactions = window.transactions || [];
  let t = transactions.find(x => x.invoiceNo === invoiceNo);
  if (t) {
    t.deleted = false;
    delete t.deletedBy;
    if (t.id && typeof window.updateBill === 'function') {
      // Using FieldValue.delete() requires more imports, so we just set it to null or empty string,
      // but let's just set deleted: false.
      window.updateBill(t.id, { deleted: false, deletedBy: null });
    }
    loadReports();
  }
}

function exportToCSV() {
  if (!window.currentExportData || window.currentExportData.length === 0) {
    return showToast("No reports to export for current view.");
  }

  let csv = "Invoice No,Date,Party Name,Amount,Employee\n";
  window.currentExportData.forEach(t => {
    let dateStr = new Date(t.date).toLocaleString('en-GB');
    let party = t.customer ? t.customer.replace(/"/g, '""') : '';
    csv += `"${t.invoiceNo}","${dateStr}","${party}",${t.total},"${t.createdBy}"\n`;
  });

  let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", `SRI_SATHYA_EXPORT.csv`);
  a.click();
}

function reprintTransaction(invoiceNo) {
  let transactions = window.transactions || [];
  let t = transactions.find(x => x.invoiceNo === invoiceNo);
  if (!t) return showToast("Transaction not found!");
  if (!t.items || t.items.length === 0) {
    return showToast("Cannot reprint. Item details were not stored for this old bill.");
  }

  closeReportsModal();

  document.getElementById("customerName").value = t.customer === "Cash Customer" ? "" : t.customer;
  document.getElementById("customerGSTINInput").value = t.customerGSTIN || "";
  document.getElementById("customerMobile").value = t.customerMobile || "";
  if (t.countryCode) document.getElementById("countryCode").value = t.countryCode;

  window.updateCustomerName();

  let receiptMobile = t.customerMobile ? `Ph: +${t.countryCode || '91'} ${t.customerMobile}` : '';
  document.getElementById("receiptCustomerMobile").innerText = receiptMobile;

  if (t.customerGSTIN) {
    document.getElementById("receiptCustomerGSTINValue").innerText = t.customerGSTIN;
    document.getElementById("receiptCustomerGSTINStr").classList.remove("hidden");
  } else {
    document.getElementById("receiptCustomerGSTINStr").classList.add("hidden");
  }

  let docType = t.documentType || "invoice";
  let docTypeSelect = document.getElementById("documentType");
  if (docTypeSelect) {
    docTypeSelect.value = docType;
    if (typeof updateDocumentType === 'function') updateDocumentType();
  }

  currentInvoiceNo = t.invoiceNo;
  let isQuotation = (docType === "quotation");
  let labelStr = isQuotation ? "QUOTATION NO: " : "INVOICE NO: ";
  document.getElementById("receiptInvoiceNoStr").textContent = `${labelStr}${currentInvoiceNo}`;

  let d = new Date(t.date);
  currentDateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById("receiptDateStr").textContent = currentDateStr;
  document.getElementById("receiptTimeStr").textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  let paidInput = document.getElementById("amountPaidInput");
  if (paidInput) paidInput.value = t.amountPaid || "";

  billItems = t.items;
  renderBill();
  syncLeftPanelMeta(true);

  document.getElementById("generateInvoiceBtn").classList.add("hidden");
  document.getElementById("printBtn").classList.remove("hidden");

  setTimeout(() => window.print(), 500);
}

async function resendWhatsApp(invoiceNo) {
  let transactions = window.transactions || [];
  let t = transactions.find(x => x.invoiceNo === invoiceNo);
  if (!t) return showToast("Transaction not found!");
  if (!t.items || t.items.length === 0) {
    return showToast("Cannot send. Item details were not stored for this old bill.");
  }

  let mobile = t.customerMobile ? t.customerMobile.replace(/\s+/g, '') : '';
  if (!mobile) {
    return showToast("No mobile number saved for this bill.");
  }
  let countryCode = t.countryCode || '91';
  let fullMobile = countryCode + mobile;

  let customerName = t.customer || "Customer";
  let dateStr = new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  let docTypeForResend = t.documentType || "invoice";
  let isQuotationResendMsg = (docTypeForResend === "quotation");

  let msg = `SRI SATHYA XEROX & E-SERVICES\n\n`;
  msg += isQuotationResendMsg ? `Quotation No: ${t.invoiceNo}\n` : `Invoice No: ${t.invoiceNo}\n`;
  msg += `Date: ${dateStr}\n\n`;
  msg += isQuotationResendMsg ? `Quotation To: ${customerName}\n\n` : `Bill To: ${customerName}\n\n`;
  msg += `--------------------------\n\n`;
  msg += `Item Details:\n\n`;
  msg += `S.No | Description | Qty | Price | Amount\n\n`;
  msg += `--------------------------\n\n`;

  let totalDiscount = 0;
  t.items.forEach((row, i) => {
    totalDiscount += (row.discount || 0);
    msg += `${i + 1} | ${row.item} | ${row.qty} | ${row.price.toFixed(2)} | ${row.afterDiscount.toFixed(2)}\n`;
  });

  let baseTotal = t.subtotal + totalDiscount;
  msg += `\n--------------------------\n\n`;
  msg += `Subtotal: ₹ ${baseTotal.toFixed(2)}\n`;

  if (totalDiscount > 0) {
    msg += `Discount Savings: -₹ ${totalDiscount.toFixed(2)}\n`;
    msg += `Net Amount: ₹ ${t.subtotal.toFixed(2)}\n`;
  }

  msg += `Grand Total: ₹ ${t.total.toFixed(2)}\n\n`;

  if (t.amountPaid > 0) {
    let balance = t.amountPaid - t.total;
    let isRemaining = balance < 0;
    let labelStr = isRemaining ? "Remaining Amount" : "Change Return";
    msg += `Amount Paid: ₹ ${t.amountPaid.toFixed(2)}\n`;
    msg += `${labelStr}: ₹ ${Math.abs(balance).toFixed(2)}\n\n`;
  }

  msg += `--------------------------\n\n`;
  msg += `Thank you for shopping with us!\n`;
  msg += `Visit Again!\n`;

  let encodedMsg = encodeURIComponent(msg);
  let whatsappUrl = `https://wa.me/${fullMobile}?text=${encodedMsg}`;

  // Load into UI to capture image
  closeReportsModal();

  document.getElementById("customerName").value = t.customer === "Cash Customer" ? "" : t.customer;
  document.getElementById("customerGSTINInput").value = t.customerGSTIN || "";
  document.getElementById("customerMobile").value = t.customerMobile || "";
  if (t.countryCode) document.getElementById("countryCode").value = t.countryCode;

  window.updateCustomerName();

  let receiptMobile = t.customerMobile ? `Ph: +${t.countryCode || '91'} ${t.customerMobile}` : '';
  document.getElementById("receiptCustomerMobile").innerText = receiptMobile;

  if (t.customerGSTIN) {
    document.getElementById("receiptCustomerGSTINValue").innerText = t.customerGSTIN;
    document.getElementById("receiptCustomerGSTINStr").classList.remove("hidden");
  } else {
    document.getElementById("receiptCustomerGSTINStr").classList.add("hidden");
  }

  let docTypeForResendRender = t.documentType || "invoice";
  let docTypeSelectResendRender = document.getElementById("documentType");
  if (docTypeSelectResendRender) {
    docTypeSelectResendRender.value = docTypeForResendRender;
    if (typeof updateDocumentType === 'function') updateDocumentType();
  }

  currentInvoiceNo = t.invoiceNo;
  let isQuotationResendRender = (docTypeForResendRender === "quotation");
  let labelStrResendRender = isQuotationResendRender ? "QUOTATION NO: " : "INVOICE NO: ";
  document.getElementById("receiptInvoiceNoStr").textContent = `${labelStrResendRender}${currentInvoiceNo}`;

  let d = new Date(t.date);
  currentDateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById("receiptDateStr").textContent = currentDateStr;
  document.getElementById("receiptTimeStr").textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  let paidInput = document.getElementById("amountPaidInput");
  if (paidInput) paidInput.value = t.amountPaid || "";

  billItems = t.items;
  renderBill();
  syncLeftPanelMeta(true);

  document.getElementById("generateInvoiceBtn").classList.add("hidden");
  document.getElementById("printBtn").classList.remove("hidden");

  // Wait for UI to render, then capture and send
  setTimeout(async () => {
    const receiptElem = document.getElementById('receiptDocument');
    if (typeof html2canvas !== 'undefined' && receiptElem) {
      try {
        const canvas = await html2canvas(receiptElem, {
          scale: 2,
          backgroundColor: "#ffffff",
          onclone: (doc) => {
            doc.querySelectorAll('.text-gray-500, .text-gray-400').forEach(e => { e.classList.remove('text-gray-500', 'text-gray-400'); e.classList.add('text-gray-800'); });
          }
        });
        canvas.toBlob(blob => {
          if (!blob) {
            window.open(whatsappUrl, '_blank');
            setTimeout(() => clearBill(true), 1500);
            return;
          }
          try {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
              alert("✅ Invoice Image Copied!\n\nWhen WhatsApp opens, press CTRL+V (or long-press > Paste) in the chat box to send the image.");
              window.open(whatsappUrl, '_blank');
              setTimeout(() => clearBill(true), 1500);
            }).catch(e => {
              console.warn("Clipboard write failed", e);
              alert("⚠️ Sending without image (browser blocked clipboard access for image).");
              window.open(whatsappUrl, '_blank');
              setTimeout(() => clearBill(true), 1500);
            });
          } catch (e) {
            console.warn("ClipboardItem not supported", e);
            window.open(whatsappUrl, '_blank');
            setTimeout(() => clearBill(true), 1500);
          }
        }, "image/png");
      } catch (err) {
        console.error("Canvas error", err);
        window.open(whatsappUrl, '_blank');
        setTimeout(() => clearBill(true), 1000);
      }
    } else {
      window.open(whatsappUrl, '_blank');
      setTimeout(() => clearBill(true), 1000);
    }
  }, 300);
}

// Run init on load
initApp();

// REPRINT VIA INVOICE NUMBER
function manualReprint() {
  let invInput = document.getElementById("reprintInvoiceInput");
  let val = invInput ? invInput.value.trim().toUpperCase() : "";
  if (!val) {
    return showToast("Enter a valid Invoice No");
  }
  reprintTransaction(val);
}

// DB BACKUP
function exportDBBackup(silent = false) {
  let t = JSON.stringify(window.transactions || []);
  let blob = new Blob([t], { type: "application/json" });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  let d = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  a.download = `XeroxPOS_DB_Backup_${d}.json`;
  a.click();
  if (!silent) showToast("Database backup downloaded!");
}

// DB RESTORE
function restoreDBBackup(event) {
  let file = event.target.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = async function (e) {
    try {
      let data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        if (!confirm("Are you sure you want to restore these bills to Firestore? This will add them to the database.")) return;
        showToast("Restoring database to Firestore, please wait...");
        for (let i = 0; i < data.length; i++) {
          let tx = data[i];
          // remove the id from export so it gets a new one if it conflicts, or just let it add
          if (tx.id) delete tx.id;
          if (typeof window.saveBill === 'function') {
            // Silence the alert inside saveBill temporarily to avoid spam
            const originalAlert = window.alert;
            window.alert = function () { };
            await window.saveBill(tx);
            window.alert = originalAlert;
          }
        }
        showToast("Database Restored Successfully! Reloading...");
        setTimeout(() => location.reload(), 1500);
      } else {
        showToast("Invalid Backup file format.");
      }
    } catch (err) {
      showToast("Error reading DB structure.");
    }
  };
  reader.readAsText(file);
}

// SEND INVOICE AS IMAGE VIA WHATSAPP
async function sendInvoiceImage() {
  if (billItems.length === 0) {
    showToast("Cannot send an empty bill. Please add items.");
    return;
  }

  if (!currentInvoiceNo) {
    showToast("Please 'Generate Invoice' before capturing!");
    return;
  }

  let countryCode = document.getElementById("countryCode").value;
  let mobile = document.getElementById("customerMobile").value.replace(/\s+/g, '');
  if (!mobile) {
    showToast("Please enter the customer's Mobile Number first.");
    return;
  }

  const receiptElem = document.getElementById('receiptDocument');
  if (typeof html2canvas === 'undefined' || !receiptElem) {
    showToast("Image generation library missing!");
    return;
  }

  try {
    const canvas = await html2canvas(receiptElem, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      onclone: (doc) => {
        doc.querySelectorAll('.text-gray-500, .text-gray-400').forEach(e => { e.classList.remove('text-gray-500', 'text-gray-400'); e.classList.add('text-gray-800'); });
      }
    });

    // Auto download
    const dataUrl = canvas.toDataURL("image/png");
    let a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Invoice_${currentInvoiceNo || 'Bill'}.png`;
    a.click();

    // Open Whatsapp
    let fullMobile = countryCode + mobile;
    let msg = `Here is your invoice. Please attach the downloaded image.`;
    let whatsappUrl = `https://wa.me/${fullMobile}?text=${encodeURIComponent(msg)}`;

    saveTransaction();
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setTimeout(() => clearBill(true), 1500);
    }, 500);

  } catch (err) {
    console.error("Canvas image error", err);
    showToast("Error generating image.");
  }
}

// --- ADMIN INVENTORY MANAGEMENT ---
function loadAdminInventory() {
  let selectElem = document.getElementById("invCategorySelect");
  if (!selectElem) return;
  let cat = selectElem.value;
  let sel = document.getElementById("invItemSelect");
  sel.innerHTML = "";

  if (items[cat]) {
    Object.keys(items[cat]).forEach(name => {
      let opt = document.createElement("option");
      opt.value = name;
      opt.text = `${name} - ₹${items[cat][name]}`;
      sel.add(opt);
    });
  }
}

function addInventoryItem() {
  let cat = document.getElementById("invCategorySelect").value;
  let name = document.getElementById("invNewItemName").value.trim();
  let price = parseFloat(document.getElementById("invNewItemPrice").value);

  if (!name || isNaN(price) || price <= 0) {
    return showToast("Enter a valid Name and Price!");
  }

  if (!items[cat]) items[cat] = {};
  items[cat][name] = price;
  localStorage.setItem("adminInventory", JSON.stringify(items));

  document.getElementById("invNewItemName").value = "";
  document.getElementById("invNewItemPrice").value = "";

  loadAdminInventory();
  if (typeof loadItems === "function") loadItems();
  showToast("Item Saved Successfully!");
}

function deleteInventoryItem() {
  let cat = document.getElementById("invCategorySelect").value;
  let sel = document.getElementById("invItemSelect");
  let name = sel.value;

  if (!name) return showToast("Select an item to delete.");
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;

  delete items[cat][name];
  localStorage.setItem("adminInventory", JSON.stringify(items));

  loadAdminInventory();
  if (typeof loadItems === "function") loadItems();
  showToast("Item Deleted!");
}








