<template>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <p class="text-gray-700 font-medium ml-5">
      📋 Preview of the billing table for
      <span class="font-bold underline text-xl">
        {{ formattedMonthYear }}
        ({{ selectedMonth + 1 }} / {{ selectedYear }})
      </span>
    </p>
  </div>

  <!-- Billing Table Per Building -->
  <div v-for="(rooms, building) in grouped" :key="building" class="mb-8">
    <h3 class="text-2xl font-bold text-gray-700 my-4 border-t-4 rounded pt-4">
      🏢 Building {{ building }}
    </h3>
    <div class="overflow-x-auto rounded-lg mt-4">
      <table
        class="table-auto w-full md:table-fixed md:min-w-[800px] md:max-w-[1000px] mx-auto bg-white shadow-md rounded-lg"
      >
        <thead class="bg-gray-300 text-gray-700 text-center">
          <tr>
            <th class="p-2 border w-20">Status</th>
            <th class="p-2 border w-20">Room</th>
            <th class="p-2 border w-16">Type</th>
            <th class="p-2 border w-16">Last</th>
            <th class="p-2 border w-16">Now</th>
            <th class="p-2 border w-16">Used</th>
            <th class="p-2 border w-16">Rate</th>
            <th class="p-2 border w-24">Electricity</th>
            <th class="p-2 border w-24">Water</th>
            <th class="p-2 border w-16">Days</th>
            <th class="p-2 border w-24">Rent</th>
            <th class="p-2 border w-24">Other</th>
            <th class="p-2 border w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="room in rooms"
            :key="room.id"
            class="text-center hover:bg-gray-100"
            :class="{
              'bg-red-200 hover:bg-red-200': room.status === 'closed',
            }"
          >
            <td class="p-2 border text-center font-medium select-none">
              {{ room.status === "open" ? "🟢" : "🔒" }}
            </td>
            <td class="p-2 border text-left font-medium">{{ room.name }}</td>
            <td class="p-2 border">{{ room.type }}</td>
            <td class="p-2 border">{{ room.lastMeter }}</td>
            <td class="p-2 border">{{ room.currentMeter }}</td>
            <td class="p-2 border">{{ room.usedUnit }}</td>
            <td class="p-2 border">{{ getRate(room) }}</td>
            <td class="p-2 border text-right">
              ฿{{ fmt(room.electricityCost) }}
            </td>
            <td class="p-2 border text-right">฿{{ fmt(room.waterCost) }}</td>
            <td class="p-2 border">{{ room.stayedDays }}</td>
            <td class="p-2 border text-right">฿{{ fmt(room.rent) }}</td>
            <td class="p-2 border text-right">฿{{ fmt(getOther(room)) }}</td>
            <td class="p-2 border text-right font-bold text-blue-600">
              ฿{{ fmt(room.total) }}
            </td>
          </tr>

          <!-- Summary -->
          <tr class="bg-gray-300 text-right text-green-900 font-bold">
            <td colspan="5" class="p-2 border text-center">📊 Summary</td>
            <td class="p-2 border text-center">{{ sum(rooms, "usedUnit") }}</td>
            <td class="p-2 border text-center">—</td>
            <td class="p-2 border">
              ฿{{ fmt(sum(rooms, "electricityCost")) }}
            </td>
            <td class="p-2 border">฿{{ fmt(sum(rooms, "waterCost")) }}</td>
            <td class="p-2 border text-center">—</td>
            <td class="p-2 border">฿{{ fmt(sum(rooms, "rent")) }}</td>
            <td class="p-2 border">฿{{ fmt(sum(rooms, getOther)) }}</td>
            <td class="p-2 border underline">
              ฿{{ fmt(sum(rooms, "total")) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Grand Summary -->
  <div v-if="Object.keys(grouped).length" class="mt-8">
    <h3 class="text-2xl font-bold text-gray-700 my-4 border-t-4 rounded pt-4">
      📊 Grand Summary
    </h3>
    <div class="overflow-x-auto rounded-lg mt-4">
      <table
        class="table-auto w-full md:table-fixed md:min-w-[800px] md:max-w-[1000px] mx-auto bg-white shadow-md rounded-lg"
      >
        <thead class="bg-gray-300 text-gray-700 text-center">
          <tr>
            <th class="p-2 border w-1/6">Power Used (Units)</th>
            <th class="p-2 border w-1/6">Electricity</th>
            <th class="p-2 border w-1/6">Water</th>
            <th class="p-2 border w-1/6">Rent</th>
            <th class="p-2 border w-1/6">Other</th>
            <th class="p-2 border w-1/6">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr class="bg-green-200 text-right text-green-900 font-bold">
            <td class="p-2 border text-center">
              {{ grandSummary.totalUsedUnit }}
            </td>
            <td class="p-2 border">
              ฿{{ fmt(grandSummary.totalElectricityCost) }}
            </td>
            <td class="p-2 border">฿{{ fmt(grandSummary.totalWaterCost) }}</td>
            <td class="p-2 border">฿{{ fmt(grandSummary.totalRent) }}</td>
            <td class="p-2 border">฿{{ fmt(grandSummary.totalOtherCost) }}</td>
            <td class="p-2 border underline">
              ฿{{ fmt(grandSummary.grandTotal) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Empty State -->
  <div
    v-if="!Object.keys(grouped).length"
    class="text-center text-red-600 text-xl mt-10"
  >
    <p>📄 No billing data available for this month.</p>
  </div>
</template>

// #cspell:disable
<script setup>
import { computed } from "vue";

const props = defineProps({
  billingRooms: Array,
  selectedMonth: Number,
  selectedYear: Number,
});

const monthNames = [
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

const formattedMonthYear = computed(() => {
  return `${monthNames[props.selectedMonth]} ${props.selectedYear}`;
});

// ─── Utilities ───
const fmt = (v) =>
  (v || 0).toLocaleString("en-US", { minimumFractionDigits: 0 });

const getRate = (r) =>
  r.usedUnit > 0 ? Math.round(r.electricityCost / r.usedUnit) : "—";

const getOther = (r) =>
  (r.otherCosts || []).reduce((s, item) => s + (item.amount || 0), 0);

const sum = (arr, fieldOrFn) =>
  typeof fieldOrFn === "function"
    ? arr.reduce((s, r) => s + fieldOrFn(r), 0)
    : arr.reduce((s, r) => s + (r[fieldOrFn] || 0), 0);

const grouped = computed(() => {
  const map = {};
  for (const room of props.billingRooms) {
    const building = room.name.split("/")[0];
    if (!map[building]) map[building] = [];
    map[building].push(room);
  }
  return map;
});

const grandSummary = computed(() => {
  const allRooms = props.billingRooms;
  return {
    totalUsedUnit: sum(allRooms, "usedUnit"),
    totalElectricityCost: sum(allRooms, "electricityCost"),
    totalWaterCost: sum(allRooms, "waterCost"),
    totalRent: sum(allRooms, "rent"),
    totalOtherCost: sum(allRooms, getOther),
    grandTotal: sum(allRooms, "total"),
  };
});
</script>
