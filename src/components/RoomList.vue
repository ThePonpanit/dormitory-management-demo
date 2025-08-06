<template>
  <div>
    <!-- Loop per building -->
    <div v-for="group in groupedRooms" :key="group.building" class="mb-6">
      <!-- Building Header -->
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
        Building {{ group.building }}
      </h2>

      <!-- Rooms Grid for this building -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 select-none"
      >
        <div
          v-for="room in group.rooms"
          :key="room.id"
          class="room-info-card w-full border rounded-lg p-4 space-y-2 cursor-pointer"
          :class="[getBorderClass(room), getShadowClass(room)]"
          @click="$emit('select-room', room)"
        >
          <!-- Room Header -->
          <div class="flex justify-between items-center">
            <h3
              class="font-semibold text-lg text-gray-800 bg-gray-200 px-2 py-1 rounded"
            >
              Room {{ room.name }}
            </h3>
          </div>

          <!-- Room Info -->
          <div class="text-sm text-gray-700 space-y-1 text-left">
            <p class="flex items-center">
              <span>Type:</span>
              <span class="ml-2 font-semibold">{{ room.type || "N/A" }}</span>
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
            <p>
              Rent:
              <span class="font-medium">{{
                formatCurrency(room.monthlyPrice)
              }}</span>
            </p>
            <p>
              Power Rate:
              <span class="font-medium">
                {{ formatCurrency(room.electricityRate) }} / Unit
              </span>
            </p>
          </div>

          <!-- Tenants List -->
          <div>
            <p class="font-medium text-sm mt-2 underline">Tenants</p>
            <ul class="text-sm list-disc list-inside text-gray-800 mt-1">
              <li v-if="room.tenants.length === 0" class="italic text-gray-400">
                No tenants yet
              </li>
              <li
                v-for="tenant in room.tenants"
                :key="tenant"
                class="text-left"
              >
                {{ tenant }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  rooms: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select-room", "edit-room", "add-tenant"]);

// 1️⃣ Group and sort the rooms by building/room numbers
const groupedRooms = computed(() => {
  const map = {};

  props.rooms.forEach((room) => {
    // split "1/10" → ["1","10"]
    const [bldgStr, roomStr] = (room.name || "").split("/");
    const bldg = parseInt(bldgStr, 10) || 0;

    if (!map[bldg]) map[bldg] = [];
    map[bldg].push(room);
  });

  // convert to sorted array
  return Object.entries(map)
    .map(([bldg, rooms]) => {
      // sort rooms numerically by the part after "/"
      rooms.sort((a, b) => {
        const aNum = parseInt(a.name.split("/")[1], 10) || 0;
        const bNum = parseInt(b.name.split("/")[1], 10) || 0;
        return aNum - bNum;
      });
      return { building: Number(bldg), rooms };
    })
    .sort((a, b) => a.building - b.building);
});

function formatCurrency(amount) {
  if (typeof amount !== "number") return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}

const getBorderClass = (room) => {
  if (!room.tenants || room.tenants.length === 0)
    return "border-green-600 border-2";
  if (room.tenants.length !== room.capacity)
    return "border-red-300 border-2 no-shadow-card";
  return "";
};

const getShadowClass = (room) => {
  if (!room.tenants || room.tenants.length === 0) {
    return "shadow-card";
  }
  return "";
};
</script>

<style scoped>
.room-info-card {
  background-color: #efeeea;
  aspect-ratio: 4 / 3;
  transition: transform 0.2s;
}
.room-info-card:hover {
  transform: translateY(-4px);
}

/* Only apply shadow when class is added dynamically */
.shadow-card {
  box-shadow: 3px 3px 10px 3px #dddddd;
  background-color: rgba(108, 201, 108, 0.13);
}

/* Optional: drop fixed aspect ratio on very small screens */
@media (max-width: 640px) {
  .room-info-card {
    aspect-ratio: auto;
  }
}
</style>
