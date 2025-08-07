<!-- Dashboard.vue -->
<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center flex-col gap-2">
      <h1
        class="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-600 via-purple-500 to-green-500 inline-block text-transparent bg-clip-text"
      >
        Dashboard
      </h1>
      <div class="flex items-center gap-2 text-sm">
        <Datepicker
          v-model="date"
          month-picker
          auto-apply
          :min-date="new Date(2024, 0, 1)"
          :max-date="new Date()"
        />
      </div>
    </div>

    <!-- Summary cards -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 summary-cards"
    >
      <DashboardCard title="Total Rooms" :value="tenantCount" icon="🏠" />
      <DashboardCard title="Billed Count" :value="billedCount" icon="🧾" />
      <DashboardCard
        title="Income This Month"
        :value="formatCurrency(monthlyIncome)"
        :comparison="incomeComparison"
        icon="💰"
      />
      <DashboardCard
        title="Avg. Income / Room"
        :value="formatCurrency(averageIncome)"
        :comparison="getChangeText(monthlyIncome, lastMonthIncome)"
        icon="📈"
      />
      <DashboardCard
        title="Avg. Electricity Cost/Room"
        :value="formatCurrency(costBreakdown.electricity / billedCount)"
        :comparison="
          getChangeText(costBreakdown.electricity, lastMonthCost.electricity)
        "
        icon="⚡️"
      />
      <DashboardCard
        title="Electricity Usage (kWh)"
        :value="formatNumberWithComma(costBreakdown.electricity / 7)"
        :comparison="
          getChangeText(costBreakdown.electricity, lastMonthCost.electricity)
        "
        icon="💡"
      />
    </div>

    <!-- Chart section -->
    <div class="flex flex-col lg:flex-row gap-6 mt-10">
      <!-- Chart 1 Bar chart -->
      <div class="flex-1 bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-medium text-gray-700 mb-4">
          Income Breakdown for {{ months[selectedMonth] }} {{ selectedYear }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="h-64">
            <IncomeChart :chartData="incomeChartData" :options="chartOptions" />
          </div>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-sm text-gray-500">Electricity Bills</div>
              <div class="text-lg font-semibold">
                {{ formatCurrency(costBreakdown.electricity) }}
              </div>
              <div class="text-xs text-gray-400">
                {{
                  getChangeText(
                    costBreakdown.electricity,
                    lastMonthCost.electricity
                  )
                }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Water Bills</div>
              <div class="text-lg font-semibold">
                {{ formatCurrency(costBreakdown.water) }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Rent</div>
              <div class="text-lg font-semibold">
                {{ formatCurrency(costBreakdown.rent) }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Other</div>
              <div class="text-lg font-semibold">
                {{ formatCurrency(costBreakdown.other) }}
              </div>
            </div>
            <div class="col-span-2 mt-4">
              <div class="text-sm text-green-600">Total Income</div>
              <div class="text-lg font-semibold">
                {{ formatCurrency(monthlyIncome) }}
              </div>
              <div class="text-xs text-gray-400">
                {{ incomeComparison }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart 2 Line chart -->
      <div class="flex-1 bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-medium text-gray-700 mb-4">
          Avg Electricity Cost/Billing Room & Temperature Trend (last 6 months)
        </h2>
        <div class="h-64">
          <!-- #cspell:disable-next-line -->
          <ElecTempTrendChart
            :months="last6MonthsLabels"
            :electricity-costs="last6MonthsCosts.electricity"
            :temperatures="last6MonthsTemps.avg"
          />
        </div>
      </div>
    </div>

    <!-- Room List and Detail View -->
    <div class="mt-10 border-t-2 relative room-list-container">
      <h1
        class="text-2xl font-semibold mb-4 mt-8 bg-gradient-to-r from-purple-600 via-purple-500 to-green-500 inline-block text-transparent bg-clip-text"
      >
        Rooms Overview & Billing History
      </h1>

      <!-- 1️⃣ Always show the list -->
      <div>
        <RoomList :rooms="rooms" @select-room="handleRoomSelect" />
      </div>

      <!-- 2️⃣ Independent overlay for the detail view -->
      <div
        v-if="selectedRoom"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div
          class="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <RoomDetailView :room="selectedRoom" @close="selectedRoom = null" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import DashboardCard from "../components/DashboardCard.vue";
import IncomeChart from "../components/IncomeChart.vue";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import RoomList from "../components/RoomList.vue";
import RoomDetailView from "../components/RoomDetailView.vue";
import ElecTempTrendChart from "../components/ElecTempTrendChart.vue";

const date = ref({
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
});
const selectedMonth = computed(() => date.value.month);
const selectedYear = computed(() => date.value.year);
// cspell:disable
const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const tenantCount = ref(0);
const monthlyIncome = ref(0);
const billedCount = ref(0);
const lastMonthIncome = ref(0);
const costBreakdown = ref({
  electricity: 0,
  water: 0,
  rent: 0,
  other: 0,
});

const lastMonthCost = ref({
  electricity: 0,
  water: 0,
  rent: 0,
  other: 0,
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (value) {
          return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            maximumFractionDigits: 0,
          }).format(value);
        },
      },
    },
  },
}));

const incomeChartData = computed(() => ({
  labels: ["Electricity", "Water", "Rent", "Other"],
  datasets: [
    {
      label: "Income",
      backgroundColor: ["#42A5F5", "#66BB6A", "#FFA726", "#FF7043"],
      data: [
        costBreakdown.value.electricity,
        costBreakdown.value.water,
        costBreakdown.value.rent,
        costBreakdown.value.other,
      ],
    },
  ],
}));

// Last 6 months data for trend chart
const last6MonthsLabels = ref([]);
const last6MonthsCosts = ref({
  electricity: [],
  water: [],
  rent: [],
});

const last6MonthsTemps = ref({
  avg: [],
});

const incomeComparison = computed(() => {
  if (lastMonthIncome.value === 0) return "No data for last month";
  if (monthlyIncome.value === 0) return "No income this month";
  const percentageChange =
    ((monthlyIncome.value - lastMonthIncome.value) / lastMonthIncome.value) *
    100;
  const sign = percentageChange >= 0 ? "+" : "";
  return `${sign}${percentageChange.toFixed(1)}% from last month`;
});

const averageIncome = computed(() =>
  billedCount.value > 0
    ? (monthlyIncome.value / billedCount.value).toFixed(0)
    : 0
);

// Fetch billing data and calculate monthly income, costs, and billed count
// ✅ Returns time axis labels for chart alignment
async function fetchBillingData() {
  const billingSnapshot = await getDocs(collection(db, "billing"));
  const billingData = billingSnapshot.docs.map((doc) => doc.data());

  const selectedDate = new Date(selectedYear.value, selectedMonth.value);
  const currentMonthKey = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const lastMonthDate = new Date(selectedDate);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(
    lastMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;

  // Calculate current month data
  const currentMonthBilling = billingData.filter(
    (b) => b.month === currentMonthKey && b.status !== "closed"
  );

  const lastMonthBilling = billingData.filter(
    (b) => b.month === lastMonthKey && b.status !== "closed"
  );

  // Update current month metrics
  billedCount.value = currentMonthBilling.length;
  monthlyIncome.value = currentMonthBilling.reduce(
    (sum, b) => sum + b.total,
    0
  );
  lastMonthIncome.value = lastMonthBilling.reduce((sum, b) => sum + b.total, 0);

  // Calculate cost breakdowns
  costBreakdown.value = {
    electricity: currentMonthBilling.reduce(
      (sum, b) => sum + (b.electricityCost || 0),
      0
    ),
    water: currentMonthBilling.reduce((sum, b) => sum + (b.waterCost || 0), 0),
    rent: currentMonthBilling.reduce((sum, b) => sum + (b.rent || 0), 0),
    other: currentMonthBilling.reduce(
      (sum, b) => sum + (b.otherCosts?.reduce((s, i) => s + i.amount, 0) || 0),
      0
    ),
  };

  lastMonthCost.value = {
    electricity: lastMonthBilling.reduce(
      (sum, b) => sum + (b.electricityCost || 0),
      0
    ),
    water: lastMonthBilling.reduce((sum, b) => sum + (b.waterCost || 0), 0),
    rent: lastMonthBilling.reduce((sum, b) => sum + (b.rent || 0), 0),
    other: lastMonthBilling.reduce(
      (sum, b) => sum + (b.otherCosts?.reduce((s, i) => s + i.amount, 0) || 0),
      0
    ),
  };

  // Generate 6-month trend data and time axis
  const monthsBack = 6;
  const now = new Date(selectedYear.value, selectedMonth.value);
  const timeAxisLabels = [];
  const timeAxisKeys = [];
  const electricityCosts = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthLabel = `${months[date.getMonth()]} ${date.getFullYear()}`;

    timeAxisLabels.push(monthLabel);
    timeAxisKeys.push(monthKey);

    const monthBilling = billingData.filter(
      (b) => b.month === monthKey && b.status !== "closed"
    );

    const totalElectricity = monthBilling.reduce(
      (sum, b) => sum + (b.electricityCost || 0),
      0
    );
    const billedRoomCount = monthBilling.length;
    electricityCosts.push(
      billedRoomCount > 0 ? Math.round(totalElectricity / billedRoomCount) : 0
    );
  }

  // Update chart data
  last6MonthsLabels.value = timeAxisLabels;

  // ⚡ Normalize first electricity cost to match avg of next 1–2 months if it's unrealistically high
  if (
    electricityCosts.length >= 3 &&
    electricityCosts[0] > electricityCosts[1] * 5
  ) {
    const nextAvg =
      (electricityCosts[1] + electricityCosts[2]) / 2 || electricityCosts[1];
    electricityCosts[0] = Math.round(nextAvg);
  }
  last6MonthsCosts.value = { electricity: electricityCosts };

  // Return time axis for parallel weather data fetching
  return { labels: timeAxisLabels, keys: timeAxisKeys };
}

// Fetch temperature data for specific time axis keys
async function fetchTemperatureData(timeAxisKeys) {
  const temperaturePromises = timeAxisKeys.map(async (monthKey) => {
    try {
      const weatherDoc = await getDoc(doc(db, "weather", monthKey));
      return weatherDoc.exists() ? weatherDoc.data().avgTemp || 0 : null;
    } catch (error) {
      console.warn(`Failed to fetch weather data for ${monthKey}:`, error);
      return null;
    }
  });

  // Wait for all temperature data to resolve in parallel
  const temperatures = await Promise.all(temperaturePromises);

  // Update temperature data - perfectly aligned with billing data
  last6MonthsTemps.value.avg = temperatures;
}

const rooms = ref([]);
const selectedRoom = ref(null);

async function fetchRooms() {
  const roomsSnapshot = await getDocs(collection(db, "rooms"));
  rooms.value = roomsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  tenantCount.value = rooms.value.length;
}

function handleRoomSelect(room) {
  selectedRoom.value = room;
}

// Coordinated data fetching - ensures perfect alignment
async function fetchDashboardData() {
  try {
    // 1. Fetch rooms data (independent)
    await fetchRooms();

    // 2. Fetch billing data and get time axis
    const { keys: timeAxisKeys } = await fetchBillingData();

    // 3. Fetch temperature data using the same time axis
    await fetchTemperatureData(timeAxisKeys);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }
}

onMounted(async () => {
  await fetchDashboardData();

  const today = new Date();
  const isCurrentMonthSelected =
    selectedMonth.value === today.getMonth() &&
    selectedYear.value === today.getFullYear();

  if (monthlyIncome.value === 0 && isCurrentMonthSelected) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    date.value = {
      month: lastMonth.getMonth(),
      year: lastMonth.getFullYear(),
    };
  }
});

// Utils
function formatCurrency(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function formatNumberWithComma(value) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 0,
  }).format(value);
}

const getChangeText = (current, previous) => {
  if (!previous) return "No data";
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% from last month`;
};

// Watchers
watch(date, async () => {
  // Re-fetch both billing and temperature data when date changes
  try {
    const { keys: timeAxisKeys } = await fetchBillingData();
    await fetchTemperatureData(timeAxisKeys);
  } catch (error) {
    console.error("Error updating dashboard data:", error);
  }
});
</script>

<style scoped>
.input-style {
  @apply appearance-none;
}

.room-list-container {
  width: 85%;
  @apply mx-auto;
}

.summary-cards {
  width: fit-content;
  @apply mx-auto;
}

h2 {
  @apply text-base font-semibold mb-4 mt-1;
}
</style>
