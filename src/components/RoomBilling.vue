<template>
  <div class="space-y-6">
    <!-- Toggle Buttons -->
    <div class="flex gap-3 justify-between items-center">
      <div class="flex gap-2">
        <button
          class="btn transition-all duration-500"
          :class="[
            !showPrint
              ? 'bg-blue-600 text-white border-b-4 border-red-400 font-semibold'
              : 'bg-gray-200 text-gray-700 border-b-4 border-transparent',
          ]"
          @click="showPrint = false"
        >
          🧾 Current Billing
        </button>
        <button
          class="btn transition-all duration-500"
          :class="[
            showPrint
              ? 'bg-blue-600 text-white border-b-4 border-red-400 font-semibold'
              : 'bg-gray-200 text-gray-700 border-b-4 border-transparent',
          ]"
          @click="showPrint = true"
        >
          🖨️ Print Billing
        </button>
      </div>
    </div>

    <!-- Print View -->
    <MonthlyBillingPrinter v-if="showPrint" />

    <!-- Main Billing UI -->
    <div v-else>
      <!-- Header with Month/Year Picker -->
      <div class="flex justify-between items-center">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-xl font-semibold text-gray-800">Monthly Billing</h2>
          <div class="flex gap-2 items-center text-sm">
            <Datepicker
              v-model="selectedDate"
              month-picker
              format="MMMM/yyyy"
              class="input"
              :clearable="false"
              auto-apply
              :max-date="new Date()"
            />
          </div>
        </div>
        <span class="text-gray-500 text-sm">
          ({{ billingRooms.length }} rooms)
        </span>
      </div>

      <!-- Loading Indicator -->
      <div v-if="loading" class="flex justify-center py-8">
        <div
          class="flex flex-col items-center gap-2 text-gray-500 italic text-m"
        >
          <LoadingSpinner />
          <p>Loading billing data...</p>
        </div>
      </div>

      <!-- Tables Grouped by Building -->
      <div v-else>
        <hr class="solid mt-5" />
        <div class="mb-5">
          <p class="text-gray-700 font-medium text-xl">
            Showing billing data for
            <span class="font-bold underline">
              {{ months[selectedMonth] }} {{ selectedYear }}
            </span>
            ({{ monthKey }})
          </p>
          <p class="text-gray-500 text-sm italic">
            Note: Please ensure all rooms have valid data before saving.
          </p>
        </div>
        <div
          v-for="(rooms, building) in groupedBilling"
          :key="building"
          class="mb-1"
        >
          <h3 class="text-2xl font-bold text-gray-700 my-4">
            🏢 Building {{ building }}
          </h3>
          <div class="overflow-x-auto">
            <table
              class="text-sm bg-white md:table-fixed md:min-w-[800px] md:max-w-[1100px] mx-auto"
            >
              <thead class="bg-gray-300 text-gray-700">
                <tr>
                  <th class="p-2 border">Status</th>
                  <th class="p-2 border">Room</th>
                  <th class="p-2 border">Type</th>
                  <th class="p-2 border text-center">Last Meter</th>
                  <th class="p-2 border text-center">Current Meter</th>
                  <th class="p-2 border text-center">Used (kWh)</th>
                  <th class="p-2 border text-center">Rate (฿/unit)</th>
                  <th class="p-2 border text-center">Electricity</th>
                  <th class="p-2 border text-center">Water</th>
                  <th class="p-2 border text-center">Stayed Days</th>
                  <th class="p-2 border text-center">Rent</th>
                  <th class="p-2 border text-center">Other</th>
                  <th class="p-2 border text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="room in rooms"
                  :key="room.id"
                  :class="[
                    'hover:bg-gray-100',
                    room.status === 'closed'
                      ? 'bg-red-200 hover:bg-red-200'
                      : '',
                  ]"
                  class="align-top"
                >
                  <!-- Status Toggle -->
                  <td
                    class="pt-3 border text-center cursor-pointer"
                    @click="() => !billingSaved && toggleRoomStatus(room)"
                    :title="
                      room.status === 'closed'
                        ? 'Click to reopen'
                        : 'Click to close'
                    "
                  >
                    <button
                      class="status-toggle font-semibold select-none"
                      :class="[
                        room.status === 'closed'
                          ? 'border-red-500 text-red-600'
                          : room.currentMeter >= room.lastMeter
                          ? 'border-green-500 text-green-600'
                          : 'border-gray-400 text-red-600',
                      ]"
                      :title="
                        room.status === 'closed'
                          ? 'Room is closed'
                          : room.currentMeter >= room.lastMeter
                          ? 'Room is OK'
                          : 'Current meter is invalid'
                      "
                    >
                      {{
                        room.status === "closed"
                          ? "🔒"
                          : room.currentMeter >= room.lastMeter
                          ? "✅"
                          : "❌"
                      }}
                    </button>
                  </td>

                  <!-- Room Data -->
                  <td class="border font-semibold w-12 pt-4">
                    {{ room.name }}
                  </td>
                  <td class="border pt-4">{{ room.type }}</td>
                  <td class="border text-center w-48 pt-2">
                    <input
                      type="text"
                      :value="formatNumberWithComma(room.lastMeter)"
                      @input="updateLastMeter(room, $event)"
                      :disabled="billingSaved"
                      class="w-24 px-2 py-1 border-2 rounded text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="0"
                      title="Last month's final meter reading - editable"
                    />
                    <div class="min-h-[1rem]">
                      <p
                        class="text-blue-500 text-xs italic"
                        :class="{
                          invisible:
                            room.originalLastMeter === undefined ||
                            room.lastMeter === room.originalLastMeter,
                        }"
                      >
                        Original:
                        {{ formatNumberWithComma(room.originalLastMeter) }}
                      </p>
                    </div>
                  </td>

                  <td class="border text-center w-48 pt-2">
                    <input
                      type="text"
                      :value="formatNumberWithComma(room.currentMeter)"
                      @input="updateCurrentMeter(room, $event)"
                      :min="room.lastMeter"
                      :disabled="billingSaved"
                      class="w-38 px-2 py-1 border-2 rounded text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="0"
                    />
                    <div class="min-h-[1rem]">
                      <p
                        class="text-red-500 text-xs"
                        :class="{
                          invisible: room.currentMeter >= room.lastMeter,
                        }"
                      >
                        Can't be less than
                        <span class="font-bold font-mono">
                          {{ formatNumberWithComma(room.lastMeter) }}
                        </span>
                      </p>
                    </div>
                  </td>

                  <td class="border text-right w-24 pt-4">
                    {{ formatNumberWithComma(getUsedUnits(room)) }}
                  </td>
                  <td class="border text-right w-12 pt-4">
                    {{ room.electricityRate }}
                  </td>
                  <td class="border text-right w-24 pt-4">
                    ฿{{ formatPrice(getElectricityCost(room)) }}
                  </td>
                  <td class="border text-right w-24 pt-4">
                    ฿{{ formatPrice(getWaterCost(room)) }}
                  </td>
                  <td class="border text-center w-48 pt-2">
                    <input
                      type="number"
                      v-model.number="room.stayedDays"
                      :min="1"
                      :max="daysInMonth"
                      :disabled="billingSaved"
                      class="w-20 px-2 py-1 border-2 rounded text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <p
                      v-if="room.stayedDays > daysInMonth"
                      class="text-red-500 text-xs"
                    >
                      Max: {{ daysInMonth }}
                    </p>
                  </td>
                  <td class="border text-right w-48 pt-4">
                    <p>฿{{ formatPrice(getRentCost(room)) }}</p>
                    <p
                      v-if="
                        room.status !== 'closed' &&
                        room.stayedDays < daysInMonth
                      "
                      class="text-gray-500 text-xs italic ml-1"
                    >
                      (of ฿{{ formatPrice(room.monthlyPrice) }})
                    </p>
                  </td>
                  <td class="border text-right w-48 pt-4">
                    <span v-if="room.otherCosts?.length">
                      ฿{{ formatPrice(getOtherCostTotal(room)) }}
                    </span>
                    <button
                      class="text-blue-500 hover:underline text-sm ml-1"
                      @click="openOtherCostModal(room)"
                      :disabled="billingSaved"
                    >
                      ➕
                    </button>
                  </td>
                  <td
                    class="border text-right font-bold text-blue-600 w-48 pt-4 pr-2"
                  >
                    ฿{{ formatPrice(getTotalCost(room)) }}
                    <span v-if="room.otherCosts?.length">*</span>
                  </td>
                </tr>

                <!-- Building Summary Row -->
                <tr class="font-bold text-right text-green-800 bg-gray-300">
                  <td colspan="5" class="border text-center py-2">
                    📊 Summary
                  </td>
                  <td class="border text-right">
                    {{ rooms.reduce((s, r) => s + getUsedUnits(r), 0) }}
                  </td>
                  <td class="border text-center">—</td>
                  <td class="border text-right">
                    ฿{{
                      formatPrice(
                        rooms.reduce((s, r) => s + getElectricityCost(r), 0)
                      )
                    }}
                  </td>
                  <td class="border text-right">
                    ฿{{
                      formatPrice(
                        rooms.reduce((s, r) => s + getWaterCost(r), 0)
                      )
                    }}
                  </td>
                  <td class="border">—</td>
                  <td class="border text-right">
                    ฿{{
                      formatPrice(rooms.reduce((s, r) => s + getRentCost(r), 0))
                    }}
                  </td>
                  <td class="border text-right">
                    ฿{{
                      formatPrice(
                        rooms.reduce((s, r) => s + getOtherCostTotal(r), 0)
                      )
                    }}
                  </td>
                  <td class="border text-right underline">
                    ฿{{
                      formatPrice(
                        rooms.reduce((s, r) => s + getTotalCost(r), 0)
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
            <hr class="solid mt-5" />
          </div>
        </div>

        <!-- All-books Summary -->
        <div class="mt-8 text-right text-sm text-gray-800">
          <div
            class="border-b pb-2 mt-6 border-gray-300 max-w-[1000px] mx-auto"
          >
            <h3 class="text-lg font-bold mb-2 text-gray-700 text-left">
              📊 Summary of All Buildings
            </h3>
            <table class="table-auto w-full text-right text-sm">
              <thead class="text-gray-600 border-b">
                <tr>
                  <th class="p-2">Total Power Usage (kWh)</th>
                  <th class="p-2">Electricity Income</th>
                  <th class="p-2">Water Income</th>
                  <th class="p-2">Rent Income</th>
                  <th class="p-2">Other Income</th>
                  <th class="p-2 text-green-700">Total Income</th>
                </tr>
              </thead>
              <tbody>
                <tr class="font-semibold">
                  <td class="p-2">
                    {{ billingRooms.reduce((s, r) => s + getUsedUnits(r), 0) }}
                  </td>
                  <td class="p-2">
                    ฿{{
                      formatPrice(
                        billingRooms.reduce(
                          (s, r) => s + getElectricityCost(r),
                          0
                        )
                      )
                    }}
                  </td>
                  <td class="p-2">
                    ฿{{
                      formatPrice(
                        billingRooms.reduce((s, r) => s + getWaterCost(r), 0)
                      )
                    }}
                  </td>
                  <td class="p-2">
                    ฿{{
                      formatPrice(
                        billingRooms.reduce((s, r) => s + getRentCost(r), 0)
                      )
                    }}
                  </td>
                  <td class="p-2">
                    ฿{{
                      formatPrice(
                        billingRooms.reduce(
                          (s, r) => s + getOtherCostTotal(r),
                          0
                        )
                      )
                    }}
                  </td>
                  <td class="p-2 text-green-700 underline">
                    ฿{{
                      formatPrice(
                        billingRooms.reduce((s, r) => s + getTotalCost(r), 0)
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-center mt-4">
          <button
            @click="saveBillingData"
            class="save-btn px-10 py-3 rounded-3xl"
            :disabled="billingSaved || loading"
          >
            💾 Save Billing Data
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Other Costs Modal -->
  <div
    v-if="showOtherCostModal"
    class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
  >
    <div class="bg-white rounded-lg p-6 w-[360px] space-y-4 shadow-xl">
      <h3 class="text-lg font-semibold">Add/Remove Other Costs</h3>
      <p class="text-sm text-gray-700">For Room: {{ selectedRoom?.name }}</p>

      <div class="flex gap-2">
        <input
          v-model="newOtherItem.name"
          class="input w-full"
          placeholder="Cost Name"
        />
        <input
          v-model.number="newOtherItem.amount"
          type="number"
          min="0"
          class="input w-24"
          placeholder="฿"
        />
        <button
          @click="addOtherItem"
          class="btn bg-green-600 text-white px-2 py-1"
        >
          Add
        </button>
      </div>

      <ul class="text-sm text-gray-800 space-y-1 max-h-32 overflow-y-auto">
        <li
          v-for="(item, i) in tempOtherCosts"
          :key="i"
          class="flex justify-between items-center border-b pb-1 gap-2"
        >
          <div class="flex-1">
            <p class="font-medium">{{ item.name }}</p>
            <p class="text-gray-500 text-xs">฿{{ formatPrice(item.amount) }}</p>
          </div>
          <button
            @click="removeOtherItem(i)"
            class="text-red-500 hover:text-red-700 text-xs"
            title="Remove"
          >
            ✖
          </button>
        </li>
      </ul>

      <div class="flex justify-between items-center text-sm font-semibold">
        <span>Total</span>
        <span
          >฿{{
            formatPrice(tempOtherCosts.reduce((s, i) => s + i.amount, 0))
          }}</span
        >
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button @click="closeModal" class="btn bg-gray-300 text-gray-700">
          Cancel
        </button>
        <button @click="saveOtherCost" class="btn bg-blue-600 text-white">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 🔌 Imports
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

import MonthlyBillingPrinter from "../components/MonthlyBillingPrinter.vue";
import LoadingSpinner from "../components/animation/Spinner.vue";

// 🌱 State Variables
const showPrint = ref(false);
const loading = ref(true);
const billingSaved = ref(false);
const billingRooms = ref([]);

// Modal state
const showOtherCostModal = ref(false);
const selectedRoom = ref(null);
const tempOtherCosts = ref([]);
const newOtherItem = ref({ name: "", amount: 0 });

// Month/Year picker state
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

const selectedDate = ref({
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
});

const monthKey = computed(() => {
  const mm = String(selectedDate.value.month + 1).padStart(2, "0");
  return `${selectedDate.value.year}-${mm}`;
});

// ⚙️ Computed Properties
const selectedMonth = computed({
  get: () => selectedDate.value.month,
  set: (m) => {
    selectedDate.value.month = m;
  },
});
const selectedYear = computed({
  get: () => selectedDate.value.year,
  set: (y) => {
    selectedDate.value.year = y;
  },
});
const daysInMonth = computed(() =>
  new Date(selectedYear.value, selectedMonth.value + 1, 0).getDate()
);
const currentMonthKey = computed(() => {
  const mm = String(selectedMonth.value + 1).padStart(2, "0");
  return `${selectedYear.value}-${mm}`;
});
const groupedBilling = computed(() => {
  const map = {};
  for (const room of billingRooms.value) {
    const [building] = room.name.split("/");
    if (!map[building]) map[building] = [];
    map[building].push(room);
  }
  return map;
});

// 💎 Format Helpers
const formatPrice = (v) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v || 0);

function formatNumberWithComma(value) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 0,
  }).format(value);
}

// Handle real-time comma formatting while typing
function updateCurrentMeter(room, event) {
  let value = event.target.value;
  // Remove all non-digit characters except for potential decimal point
  value = value.replace(/[^\d]/g, "");

  // Convert to number and update the room's currentMeter
  const numericValue = parseInt(value) || 0;
  room.currentMeter = numericValue;

  // Update the input display with comma formatting
  event.target.value = formatNumberWithComma(numericValue);
}

// Validate on blur to ensure minimum value

// Handle Last Meter input with comma formatting
function updateLastMeter(room, event) {
  let value = event.target.value;
  // Remove all non-digit characters
  value = value.replace(/[^\d]/g, "");

  // Convert to number and update the room's lastMeter
  const numericValue = parseInt(value) || 0;
  room.lastMeter = numericValue;

  // Update the input display with comma formatting
  event.target.value = formatNumberWithComma(numericValue);

  // Mark as having unsaved changes
  hasUnsavedChanges.value = true;
}

// 🧮 Billing Cost Calculations
const getUsedUnits = (r) => Math.max(r.currentMeter - r.lastMeter, 0);
const getElectricityCost = (r) => getUsedUnits(r) * (r.electricityRate || 7);
const getWaterCost = (r) => {
  // if room is closed, no water charges
  if (r.status === "closed") return 0;
  switch (r.waterBilling) {
    case "lump":
      return 100;
    case "lump-2":
      return 50;
    default:
      return 0;
  }
};
const getRentCost = (r) => {
  // if room is closed, no rent
  if (r.status === "closed") return 0;
  return (r.monthlyPrice / daysInMonth.value) * r.stayedDays;
};
const getOtherCostTotal = (r) =>
  (r.otherCosts || []).reduce((s, i) => s + i.amount, 0);
const getTotalCost = (r) =>
  getElectricityCost(r) +
  getWaterCost(r) +
  getRentCost(r) +
  getOtherCostTotal(r);

// 📥 Data Loading
const getPreviousMonthKey = (y, m) => {
  const d = new Date(y, m, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

async function loadBillingRooms() {
  loading.value = true;
  billingRooms.value = [];

  const snapshot = await getDocs(collection(db, "rooms"));
  const days = daysInMonth.value;

  const roomPromises = snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const prevKey = getPreviousMonthKey(
      selectedYear.value,
      selectedMonth.value
    );
    const prevRef = doc(db, "billing", `${id}_${prevKey}`);
    const currRef = doc(db, "billing", `${id}_${currentMonthKey.value}`);

    const [prevSnap, currSnap] = await Promise.all([
      getDoc(prevRef),
      getDoc(currRef),
    ]);

    const lastMeter = prevSnap.exists() ? prevSnap.data().currentMeter : 0;
    const currentMeter = currSnap.exists() ? currSnap.data().currentMeter : 0;
    const otherCosts = currSnap.exists()
      ? currSnap.data().otherCosts || []
      : [];
    const stayedDays =
      currSnap.exists() && currSnap.data().stayedDays
        ? currSnap.data().stayedDays
        : days;
    const status = currSnap.exists()
      ? currSnap.data().status || "open"
      : prevSnap.exists()
      ? prevSnap.data().status || "open"
      : "open";

    return {
      id,
      name: data.name,
      type: data.type || "Null",
      electricityRate: data.electricityRate || 7,
      monthlyPrice: data.monthlyPrice || 0,
      waterBilling: data.waterBilling || "lump",
      lastMeter,
      originalLastMeter: lastMeter, // Store original value for comparison
      currentMeter,
      stayedDays,
      otherCosts,
      status,
    };
  });

  const rooms = await Promise.all(roomPromises);
  billingRooms.value = rooms.sort((a, b) => {
    const [ab, ar] = a.name.split("/").map(Number);
    const [bb, br] = b.name.split("/").map(Number);
    return ab === bb ? ar - br : ab - bb;
  });

  loading.value = false;
}

// 📤 Save Billing Data
const hasUnsavedChanges = ref(false);
watch(
  billingRooms,
  () => {
    if (!billingSaved.value) hasUnsavedChanges.value = true;
  },
  { deep: true }
);

async function saveBillingData() {
  const invalid = billingRooms.value.some(
    (r) => r.currentMeter < r.lastMeter || r.stayedDays > daysInMonth.value
  );
  if (invalid) {
    return alert("❗ Please fix invalid values first.");
  }

  loading.value = true;
  billingSaved.value = false;

  const ops = billingRooms.value.map(async (r) => {
    const billRef = doc(db, "billing", `${r.id}_${currentMonthKey.value}`);
    await setDoc(billRef, {
      roomId: r.id,
      roomName: r.name,
      month: currentMonthKey.value,
      electricityCost: getElectricityCost(r),
      waterCost: getWaterCost(r),
      stayedDays: r.stayedDays,
      rent: getRentCost(r),
      total: getTotalCost(r),
      usedUnit: getUsedUnits(r),
      lastMeter: r.lastMeter,
      currentMeter: r.currentMeter,
      createdAt: serverTimestamp(),
      otherCosts: r.otherCosts || [],
      status: r.status || "open",
    });

    // update room status
    const roomRef = doc(db, "rooms", r.id);
    await setDoc(roomRef, { status: r.status || "open" }, { merge: true });
  });

  await Promise.all(ops);
  alert("✅ Billing saved successfully!");
  hasUnsavedChanges.value = false;
  loading.value = false;
}

// 🗂 Modal / Other-Cost Handlers
function openOtherCostModal(room) {
  selectedRoom.value = room;
  tempOtherCosts.value = [...(room.otherCosts || [])];
  newOtherItem.value = { name: "", amount: 0 };
  showOtherCostModal.value = true;
}
function addOtherItem() {
  const { name, amount } = newOtherItem.value;
  if (!name || amount <= 0) return;
  tempOtherCosts.value.push({ name, amount });
  newOtherItem.value = { name: "", amount: 0 };
}
function removeOtherItem(i) {
  tempOtherCosts.value.splice(i, 1);
}
function saveOtherCost() {
  if (!selectedRoom.value) return;
  selectedRoom.value.otherCosts = [...tempOtherCosts.value];
  closeModal();
}
function closeModal() {
  showOtherCostModal.value = false;
  selectedRoom.value = null;
  tempOtherCosts.value = [];
}

// 🔄 Toggle Room Status
function toggleRoomStatus(room) {
  room.status = room.status === "closed" ? "open" : "closed";
  hasUnsavedChanges.value = true;
}

// 🔧 Watchers & Lifecycle
watch(selectedDate, loadBillingRooms, { deep: true });

onMounted(() => {
  loadBillingRooms();
  window.addEventListener("beforeunload", warnBeforeUnload);
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", warnBeforeUnload);
});

function warnBeforeUnload(e) {
  if (hasUnsavedChanges.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded transition font-medium;
}
.input {
  @apply border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400;
}
.save-btn {
  @apply bg-green-600 text-white hover:bg-green-700 transition;
  font-weight: bold;
}
/* Solid border */
hr.solid {
  border-top: 3px solid #bbbbbb9a;
}
.status-toggle {
  @apply border-2 rounded-full p-1 transition-colors bg-gray-200 shadow-sm;
}
</style>
