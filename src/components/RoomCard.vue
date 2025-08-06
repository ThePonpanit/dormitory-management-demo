<template>
  <div
    class="border rounded-lg p-4 space-y-2 room-info-card cursor-pointer"
    :class="[borderClass, shadowClass]"
    @click="$emit('select-room', room)"
  >
    <!-- Room Header -->
    <div class="flex justify-between items-center">
      <h3
        class="font-semibold text-lg text-gray-800 bg-gray-200 px-2 py-1 rounded"
      >
        Room {{ room.name }}
      </h3>
      <div class="space-x-2 ml-2">
        <button
          @click="$emit('edit', room)"
          class="text-blue-600 hover:underline"
        >
          Edit
        </button>
      </div>
    </div>

    <!-- Room Info -->
    <div class="text-sm text-gray-700 space-y-1 text-left">
      <p>
        Occupied:
        <span class="font-medium"
          >{{ room.tenants.length }} / {{ room.capacity }}</span
        >
      </p>
      <p>
        Type: <span class="font-medium">{{ room.type || "N/A" }}</span>
      </p>
      <p>
        💵 Rent:
        <span class="font-medium">{{ formatCurrency(room.monthlyPrice) }}</span>
      </p>
      <p>
        ⚡️ Power Rate:
        <span class="font-medium"
          >{{ formatCurrency(room.electricityRate) }} / Unit</span
        >
      </p>
    </div>

    <!-- Tenants List -->
    <div>
      <p class="font-medium text-sm mt-2 underline">Tenants</p>
      <ul class="text-sm list-disc list-inside text-gray-800 mt-1">
        <li v-if="room.tenants.length === 0" class="italic text-gray-400">
          No tenants yet
        </li>
        <li v-for="tenant in room.tenants" :key="tenant" class="text-left">
          {{ tenant }}
        </li>
      </ul>
    </div>

    <!-- Add/Remove Tenant -->
    <div class="pt-2">
      <button
        class="text-green-600 hover:underline text-sm"
        @click="$emit('add-tenant', room)"
      >
        ✏️ Add/Remove Tenant
      </button>
    </div>
  </div>
</template>

<script setup>
const { room } = defineProps({ room: Object });
import { computed } from "vue";

function formatCurrency(amount) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}

const borderClass = computed(() => {
  if (!room.tenants || room.tenants.length === 0)
    return "border-green-600 border-2";
  if (room.tenants.length != room.capacity)
    return "border-red-300 border-2 no-shadow-card";
  return "";
});

const shadowClass = computed(() => {
  if (!room.tenants || room.tenants.length === 0) {
    return "shadow-card";
  }
  return "";
});
</script>

<style scoped>
.room-info-card {
  background-color: #efeeea;
  aspect-ratio: 4 / 3;
}

/* Only apply shadow when class is added dynamically */
.shadow-card {
  -webkit-box-shadow: 3px 3px 10px 3px #dddddd;
  -moz-box-shadow: 3px 3px 10px 3px #dddddd;
  box-shadow: 3px 3px 10px 3px #dddddd;
  background-color: rgba(108, 201, 108, 0.13);
}

/* .no-shadow-card {
} */
</style>
