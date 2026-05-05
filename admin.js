import { checkAuth } from './auth.js';
import { db } from './firebase-config.js';
import { collection, query, orderBy, limit, getDocs, where, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const shopId = localStorage.getItem("shopId") || 'shop1';

async function init() {
  const user = await checkAuth('admin'); // requires admin
  if (user) {
    document.getElementById('userNameDisplay').textContent = localStorage.getItem('userName') || user.email;
  }

  loadTopCustomers();
  loadActivityFeed();
  loadRevenueAndStaffMetrics();
}

function getStartOfDay() {
  const now = new Date();
  now.setHours(0,0,0,0);
  return now;
}

function getStartOfMonth() {
  const now = new Date();
  now.setDate(1);
  now.setHours(0,0,0,0);
  return now;
}

async function loadRevenueAndStaffMetrics() {
  try {
    const todayStart = getStartOfDay();
    const monthStart = getStartOfMonth();

    // In a real production app with massive scale, use Firebase Cloud Functions for aggregations.
    // For this startup scale, fetching month data is acceptable.
    const billsRef = collection(db, "bills");
    const q = query(billsRef, where("shopId", "==", shopId), where("timestamp", ">=", Timestamp.fromDate(monthStart)));
    
    // Using onSnapshot for real-time dashboard updates
    onSnapshot(q, (snapshot) => {
      let todayRev = 0;
      let monthRev = 0;
      let staffSalesToday = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const amt = data.finalAmount || 0;
        const staff = data.staffId || 'Unknown';
        const docDate = data.timestamp.toDate();

        monthRev += amt;
        
        if (docDate >= todayStart) {
          todayRev += amt;
          staffSalesToday[staff] = (staffSalesToday[staff] || 0) + amt;
        }
      });

      document.getElementById('todayRevenue').textContent = `₹${todayRev.toFixed(2)}`;
      document.getElementById('monthlyRevenue').textContent = `₹${monthRev.toFixed(2)}`;

      // Render Top Staff
      const staffList = document.getElementById('topStaffList');
      staffList.innerHTML = '';
      
      const sortedStaff = Object.entries(staffSalesToday).sort((a,b) => b[1] - a[1]);
      if (sortedStaff.length === 0) {
        staffList.innerHTML = '<li class="text-sm text-slate-500 italic">No sales today.</li>';
      } else {
        sortedStaff.forEach(([staffId, sales], index) => {
          // Ideally fetch staff name from users collection, using ID for now
          staffList.innerHTML += `
            <li class="flex justify-between items-center text-sm">
              <span class="text-slate-300"><span class="text-slate-500 font-bold mr-2">#${index+1}</span> ${staffId.substring(0,6)}...</span>
              <span class="font-bold text-emerald-400">₹${sales.toFixed(2)}</span>
            </li>
          `;
        });
      }

      // Update Chart (Dummy logic for last 7 days since we only fetched month)
      // A proper implementation would group the 'month' snapshot by day
      renderChart(snapshot.docs);
    });

  } catch (error) {
    console.error("Error loading metrics:", error);
  }
}

let chartInstance = null;
function renderChart(docs) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  
  // Group by last 7 days
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }).reverse();

  const dataMap = {};
  last7Days.forEach(d => dataMap[d] = 0);

  docs.forEach(doc => {
    const data = doc.data();
    const dateStr = data.timestamp.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (dataMap[dateStr] !== undefined) {
      dataMap[dateStr] += (data.finalAmount || 0);
    }
  });

  const chartData = last7Days.map(d => dataMap[d]);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Revenue (₹)',
        data: chartData,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function loadTopCustomers() {
  const custRef = collection(db, "customers");
  const q = query(custRef, where("shopId", "==", shopId), orderBy("totalSpent", "desc"), limit(5));
  
  onSnapshot(q, (snapshot) => {
    const table = document.getElementById('topCustomersTable');
    table.innerHTML = '';
    
    if (snapshot.empty) {
      table.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500 italic">No customers yet.</td></tr>';
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      table.innerHTML += `
        <tr class="text-slate-300">
          <td class="py-2 font-medium text-white">${data.name}</td>
          <td class="py-2">${data.mobile}</td>
          <td class="py-2 text-right font-bold text-emerald-400">₹${(data.totalSpent || 0).toFixed(2)}</td>
          <td class="py-2 text-right text-amber-400">${data.points || 0}</td>
        </tr>
      `;
    });
  });
}

function loadActivityFeed() {
  const actRef = collection(db, "activity_logs");
  const q = query(actRef, where("shopId", "==", shopId), orderBy("timestamp", "desc"), limit(20));
  
  onSnapshot(q, (snapshot) => {
    const feed = document.getElementById('activityFeed');
    feed.innerHTML = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
      
      let icon = '📝';
      let color = 'text-blue-400';
      if (data.action === 'CREATE_BILL') { icon = '✅'; color = 'text-emerald-400'; }
      
      feed.innerHTML += `
        <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex gap-3 items-start">
          <div class="text-xl">${icon}</div>
          <div class="flex-1">
            <p class="text-sm text-white font-medium">${data.action.replace('_', ' ')} <span class="text-slate-400 text-xs ml-1 font-normal">by ${data.staffId.substring(0,5)}</span></p>
            <p class="text-xs text-slate-400 mt-0.5">${data.meta?.invoiceNo || ''} <span class="${color} font-bold ml-2">₹${data.amount}</span></p>
          </div>
          <div class="text-[10px] text-slate-500 font-medium">${time}</div>
        </div>
      `;
    });
  });
}

init();
