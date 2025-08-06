<template>
  <!-- Modal backdrop -->
  <div
    v-if="room"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
    @click="handleBackdropClick"
  >
    <!-- Modal content -->
    <div
      ref="modalContent"
      class="relative bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- Sticky header -->
      <div
        class="sticky top-0 bg-white border-b border-gray-200 flex justify-between items-center p-4 z-10"
      >
        <h2 class="text-2xl font-bold">Room {{ room.name }}</h2>
        <button
          @click="closeModal"
          class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Scrollable content -->
      <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold mb-2">Details</h3>
            <div
              class="text-sm space-y-1 flex flex-col justify-start text-left ml-20"
            >
              <p class="flex items-center">
                <strong>Type:</strong>
                <span class="ml-2">{{ room.type || "N/A" }}</span>
                <span v-if="room.type" class="ml-2">
                  <!-- AC Icon -->
                  <span
                    v-if="room.type === 'AC'"
                    class="material-symbols-outlined text-sm text-blue-400"
                  >
                    ac_unit
                  </span>
                  <!-- Fan Icon -->
                  <span
                    v-if="room.type === 'Fan'"
                    class="material-symbols-outlined text-sm text-green-400"
                  >
                    mode_fan
                  </span>
                </span>
              </p>
              <p><strong>Capacity:</strong> {{ room.capacity }}</p>
              <p>
                <strong>Monthly Rent:</strong>
                {{ formatCurrency(room.monthlyPrice) }}
              </p>
              <p>
                <strong>Electricity Rate:</strong>
                {{ formatCurrency(room.electricityRate) }} / unit
              </p>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-2">Tenants</h3>
            <ul class="list-disc list-inside text-sm">
              <li
                v-if="!room.tenants || room.tenants.length === 0"
                class="text-gray-500"
              >
                No tenants
              </li>
              <li v-for="tenant in room.tenants" :key="tenant">{{ tenant }}</li>
            </ul>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Billing History</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm bg-white border">
              <thead class="bg-gray-100">
                <tr>
                  <th class="p-2 border">Month</th>
                  <th class="p-2 border">Electricity (kWh)</th>
                  <th class="p-2 border">Water</th>
                  <th class="p-2 border">Rent</th>
                  <th class="p-2 border">Other</th>
                  <th class="p-2 border">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(billing, index) in sortedBillingHistory"
                  :key="billing.month"
                  :class="[
                    'hover:bg-gray-50',
                    index === 0 && sortedBillingHistory.length > 1
                      ? 'bg-amber-50 border-l-4 border-amber-400'
                      : '',
                    index === sortedBillingHistory.length - 1
                      ? 'bg-green-50 border-l-4 border-green-400'
                      : '',
                  ]"
                >
                  <td class="p-2 border">
                    <div class="flex items-center gap-2">
                      {{ billing.month }}
                      <!-- Mark the Initial value -->
                      <span
                        v-if="index === 0 && sortedBillingHistory.length > 1"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                        title="Initial reading - may include setup/initialization costs"
                      >
                        📊 Initial
                      </span>
                      <!-- Mark the latest value -->
                      <span
                        v-if="index === sortedBillingHistory.length - 1"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        title="Latest billing period"
                      >
                        🆕 Latest
                      </span>
                    </div>
                  </td>
                  <td class="p-2 border text-right">{{ billing.usedUnit }}</td>
                  <td class="p-2 border text-right">
                    {{ formatCurrency(billing.waterCost) }}
                  </td>
                  <td class="p-2 border text-right">
                    {{ formatCurrency(billing.rent) }}
                  </td>
                  <td class="p-2 border text-right">
                    {{ formatCurrency(billing.other) }}
                  </td>
                  <td class="p-2 border text-right font-semibold">
                    <div class="flex items-center justify-end gap-1">
                      {{ formatCurrency(billing.total) }}
                      <div
                        v-if="index === 0 && sortedBillingHistory.length > 1"
                        class="text-amber-600 text-xs"
                        title="Excluded from trend analysis"
                      >
                        <div class="flex items-center select-none">
                          <span class="material-symbols-outlined text-sm mr-1">
                            warning
                          </span>
                          <span> Init </span>
                        </div>
                      </div>
                      <!-- Mark Max value But not the Initial value -->
                      <div
                        v-if="
                          index !== 0 &&
                          maxValueToMark !== null &&
                          Number(billing.total).toFixed(2) ===
                            maxValueToMark.toFixed(2)
                        "
                        class="text-red-600 text-xs"
                        title="Highest billing period (excluding initial)"
                      >
                        <div class="flex items-center select-none">
                          <span class="material-symbols-outlined">
                            arrow_drop_up
                          </span>
                          <span> Max </span>
                        </div>
                      </div>

                      <!-- Mark Min value -->
                      <div
                        v-if="
                          billing.total ===
                          Math.min(...sortedBillingHistory.map((b) => b.total))
                        "
                        class="text-green-600 text-xs"
                        title="Lowest billing period"
                      >
                        <div class="flex items-center select-none">
                          <span class="material-symbols-outlined">
                            arrow_drop_down
                          </span>
                          <span> Min </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Cost Trend</h3>
          <div
            v-if="sortedBillingHistory.length > 1"
            class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <span class="text-blue-500 mt-4">💡</span>
              <div class="text-sm text-blue-700">
                <p class="font-medium">Data Visualization Note:</p>
                <p>
                  The first billing period is marked as "Initial" in the table
                  above but
                  <span class="underline"> excluded from the trend chart</span>
                  to provide more accurate analysis, as it may contain
                  initialization or setup costs.
                </p>
              </div>
            </div>
          </div>
          <div class="h-64">
            <LineCostTrendChart
              :chart-data="chartData"
              :options="chartOptions"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import LineCostTrendChart from "./LineCostTrendChart.vue";
import { Chart } from "chart.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "opened", "closed"]);

const billingHistory = ref([]);
const modalContent = ref(null);

// Computed property for sorted billing history (chronological order)
const sortedBillingHistory = computed(() => {
  return [...billingHistory.value].sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );
});

// Computed property to find the max value that's not the initial value
const maxValueToMark = computed(() => {
  if (sortedBillingHistory.value.length <= 1) return null;

  // Get all values except the first one (initial value)
  const nonInitialValues = sortedBillingHistory.value
    .slice(1)
    .map((b) => Number(b.total));

  if (nonInitialValues.length === 0) return null;

  // Find the maximum among non-initial values
  return Math.max(...nonInitialValues);
});

// Disable body scroll when modal is open
onMounted(() => {
  if (props.room) {
    document.body.style.overflow = "hidden";
    emit("opened");
  }
});

// Re-enable body scroll when component unmounts
watch(
  () => props.room,
  (newRoom, oldRoom) => {
    if (newRoom && !oldRoom) {
      document.body.style.overflow = "hidden";
      emit("opened");
    } else if (!newRoom && oldRoom) {
      document.body.style.overflow = "";
      emit("closed");
    }
  }
);

const chartData = computed(() => {
  if (billingHistory.value.length === 0) return { labels: [], datasets: [] };

  // Sort by month to ensure proper order
  const sortedHistory = [...billingHistory.value].sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  // Exclude first data point from trend analysis if it's abnormally high
  // (typically due to prevMeter = 0 initialization)
  const trendData =
    sortedHistory.length > 1 ? sortedHistory.slice(1) : sortedHistory;

  const labels = trendData.map((b) => b.month);
  const totalCosts = trendData.map((b) => b.total);

  return {
    labels,
    datasets: [
      {
        label: "Total Cost",
        data: totalCosts,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.1,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text:
        billingHistory.value.length > 1
          ? "Cost Trend Analysis (Excluding Initial Reading)"
          : "Cost Trend Analysis",
      font: {
        size: 14,
        weight: "bold",
      },
    },
    legend: {
      display: true,
      labels: {
        generateLabels: function (chart) {
          const original = Chart.defaults.plugins.legend.labels.generateLabels;
          const labels = original.call(this, chart);

          if (billingHistory.value.length > 1) {
            labels.push({
              text: "⚠️ First reading excluded from trend",
              fillStyle: "rgba(156, 163, 175, 0.5)",
              strokeStyle: "rgba(156, 163, 175, 1)",
              fontColor: "rgba(107, 114, 128, 1)",
              fontStyle: "italic",
              fontSize: 11,
            });
          }

          return labels;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => formatCurrency(value),
      },
    },
  },
};

function formatCurrency(amount) {
  if (typeof amount !== "number") return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
}

function handleBackdropClick(event) {
  // Only close if the click was on the backdrop, not on the modal content
  if (event.target === event.currentTarget) {
    closeModal();
  }
}

function closeModal() {
  document.body.style.overflow = "";
  emit("close");
  emit("closed");
}

async function fetchBillingHistory() {
  if (!props.room) return;

  billingHistory.value = [];
  const q = query(
    collection(db, "billing"),
    where("roomId", "==", props.room.id),
    orderBy("month", "desc")
  );

  const querySnapshot = await getDocs(q);
  const history = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    history.push({
      month: data.month,
      usedUnit: data.usedUnit || 0,
      waterCost: data.waterCost || 0,
      rent: data.rent || 0,
      other: (data.otherCosts || []).reduce(
        (sum, item) => sum + item.amount,
        0
      ),
      total: data.total || 0,
    });
  });
  billingHistory.value = history;
}

watch(() => props.room, fetchBillingHistory, { immediate: true });

onMounted(fetchBillingHistory);

onUnmounted(() => {
  // Ensure body scroll is restored when component is destroyed
  document.body.style.overflow = "";
});
</script>

<style scoped>
/* Add any additional styling here */
</style>
