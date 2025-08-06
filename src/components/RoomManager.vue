<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
    >
      <div class="text-left bg-gray-200 p-4 rounded-lg">
        <h2 class="text-xl font-semibold text-gray-800 underline">
          Rooms Status
        </h2>
        <div>
          <p class="text-sm">
            🏠 {{ roomStats.occupied }} / {{ roomStats.total }} rooms occupied
            ({{ roomStats.free }}
            free)
          </p>
          <p class="text-sm">
            🌀 Fan rooms free: {{ roomStats.fanFree }} /
            {{ roomStats.fanTotal }} | ❄️ AC rooms free:
            {{ roomStats.acFree }} / {{ roomStats.acTotal }}
          </p>
        </div>
      </div>
      <button class="btn self-start md:self-auto" @click="openRoomForm()">
        ➕ Add Room
      </button>
    </div>

    <div
      v-for="(buildingRooms, buildingNumber) in groupedRooms"
      :key="buildingNumber"
      class="space-y-4 border-b-4 pb-4 last:border-b-0"
    >
      <h3 class="text-xl font-bold text-gray-700 pb-2">
        🏢 Building {{ buildingNumber }}
      </h3>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <RoomCard
          v-for="room in buildingRooms"
          :key="room.id"
          :room="room"
          @edit="openRoomForm"
          @add-tenant="openTenantForm"
        />
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">
          {{ editMode ? "Edit" : "Add" }} Room
        </h3>

        <!-- FORM FIELDS -->
        <div class="space-y-4 text-gray-800">
          <!-- Room Number -->
          <div>
            <label class="block text-sm font-medium mb-1"
              >Room Number (e.g. 1/12) *</label
            >
            <input v-model="form.name" class="input" />
          </div>

          <!-- Capacity -->
          <div>
            <label class="block text-sm font-medium mb-1">Capacity</label>
            <input
              v-model.number="form.capacity"
              type="number"
              class="input"
              placeholder="Default: 2"
            />
          </div>

          <!-- Room Type -->
          <div>
            <label class="block text-sm font-medium mb-1">Room Type *</label>
            <select v-model="form.type" class="input">
              <option value="" disabled>Select Room Type</option>
              <option value="Fan">Fan</option>
              <option value="AC">AC</option>
            </select>
          </div>

          <!-- Monthly Rent -->
          <div>
            <label class="block text-sm font-medium mb-1"
              >Monthly Rent (THB) *</label
            >
            <input
              v-model.number="form.monthlyPrice"
              type="number"
              class="input select-all"
              placeholder="e.g. 2500"
            />
          </div>

          <!-- Electricity Rate -->
          <div>
            <label class="block text-sm font-medium mb-1"
              >Electricity Rate (THB/unit)</label
            >
            <input
              v-model.number="form.electricityRate"
              type="number"
              class="input"
              placeholder="Default: 7"
            />
          </div>

          <!-- Water Billing -->
          <div>
            <label class="block text-sm font-medium mb-1"
              >Water Billing Method *</label
            >
            <select v-model="form.waterBilling" class="input">
              <option value="" disabled>Select Billing Option</option>
              <option value="lump">Lump Sum (100฿/Month)</option>
              <option value="lump-2">Lump Sum (50฿/Month)</option>
              <option value="metered">Pay as you use</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap justify-between items-center gap-2 pt-4">
          <!-- Delete button (only when Editing) -->
          <button
            v-if="editMode"
            @click="confirmDelete"
            class="text-red-600 hover:underline text-sm"
          >
            🗑️ Delete
          </button>

          <!-- Save / Cancel -->
          <div class="flex gap-2 ml-auto">
            <button @click="showForm = false" class="btn-secondary">
              Cancel
            </button>
            <button @click="saveRoom" class="btn">
              💾 {{ editMode ? "Update" : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tenant Modal -->
    <div
      v-if="tenantModalVisible"
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
    >
      <div class="bg-white w-full max-w-md p-6 rounded-lg space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">
          Manage Tenants - Room {{ selectedRoom.name }}
        </h2>

        <!-- Tenant List -->
        <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li
            v-for="tenant in editedTenants"
            :key="tenant"
            class="flex justify-between items-center"
          >
            {{ tenant }}
            <button
              @click="removeTenant(tenant)"
              class="text-red-500 text-xs hover:underline"
            >
              Remove
            </button>
          </li>
          <li v-if="editedTenants.length === 0" class="italic text-gray-400">
            No tenants
          </li>
        </ul>

        <!-- Add Tenant Input -->
        <div class="flex gap-2">
          <input
            v-model="tenantNameInput"
            class="input"
            placeholder="Enter tenant name"
          />
          <button @click="addTenant" class="btn">Add</button>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-2 pt-4">
          <button @click="tenantModalVisible = false" class="btn-secondary">
            Cancel
          </button>
          <button @click="saveTenants" class="btn">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import RoomCard from "./RoomCard.vue";
import { watch } from "vue";
import { computed } from "vue";

const rooms = ref([]);
const showForm = ref(false);
const tenantModalVisible = ref(false);
const selectedRoom = ref(null);

const editMode = ref(false);
const currentId = ref(null);

const defaultForm = {
  name: "",
  capacity: 2,
  monthlyPrice: null,
  electricityRate: 7,
  tenants: [],
  type: "",
  waterBilling: "lump",
};

const form = ref({ ...defaultForm });
const roomsCollection = collection(db, "rooms");

async function loadRooms() {
  const snapshot = await getDocs(roomsCollection);
  const fetchedRooms = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by building/room number as integers
  rooms.value = fetchedRooms.sort((a, b) => {
    const [aBuilding, aRoom] = a.name.split("/").map(Number);
    const [bBuilding, bRoom] = b.name.split("/").map(Number);

    if (aBuilding === bBuilding) {
      return aRoom - bRoom;
    } else {
      return aBuilding - bBuilding;
    }
  });
}

const groupedRooms = computed(() => {
  // Step 1: Sort all rooms by building/room number
  const sorted = [...rooms.value].sort((a, b) => {
    const [ab, ar] = a.name.split("/").map(Number);
    const [bb, br] = b.name.split("/").map(Number);
    return ab === bb ? ar - br : ab - bb;
  });

  // Step 2: Group by building number
  const groups = {};
  for (const room of sorted) {
    const [building] = room.name.split("/");
    if (!groups[building]) groups[building] = [];
    groups[building].push(room);
  }

  return groups;
});

const roomStats = computed(() => {
  const total = rooms.value.length;
  const occupied = rooms.value.filter((room) => room.tenants.length > 0).length;
  const free = total - occupied;

  const fanRooms = rooms.value.filter((room) => room.type === "Fan");
  const acRooms = rooms.value.filter((room) => room.type === "AC");

  const fanTotal = fanRooms.length;
  const acTotal = acRooms.length;

  const fanFree = fanRooms.filter((room) => room.tenants.length === 0).length;
  const acFree = acRooms.filter((room) => room.tenants.length === 0).length;

  return {
    total,
    occupied,
    free,
    fanTotal,
    acTotal,
    fanFree,
    acFree,
  };
});

watch(
  () => form.value.type,
  (newType) => {
    // Only set default price when creating new room
    if (!editMode.value && !form.value.monthlyPrice) {
      if (newType === "Fan") {
        form.value.monthlyPrice = 2500;
      } else if (newType === "AC") {
        form.value.monthlyPrice = 3000;
      }
    }
    if (!editMode.value) {
      form.value.monthlyPrice = newType === "Fan" ? 2500 : 3000;
    }
  }
);

async function saveRoom() {
  if (
    !form.value.name ||
    !form.value.monthlyPrice ||
    !form.value.type ||
    !form.value.waterBilling
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  const payload = {
    ...form.value,
    capacity: form.value.capacity || 2,
    electricityRate: form.value.electricityRate || 7,
    tenants: form.value.tenants || [],
  };

  if (editMode.value) {
    const docRef = doc(db, "rooms", currentId.value);
    await updateDoc(docRef, payload);
  } else {
    await addDoc(roomsCollection, payload);
  }

  showForm.value = false;
  await loadRooms();
}

async function confirmDelete() {
  const room = rooms.value.find((r) => r.id === currentId.value);
  const confirmed = window.confirm(
    `Are you sure you want to delete Room ${room?.name || ""}?`
  );
  if (!confirmed) return;

  await deleteDoc(doc(db, "rooms", currentId.value));
  showForm.value = false;
  await loadRooms();
}

function openRoomForm(room = null) {
  if (room) {
    editMode.value = true;
    currentId.value = room.id;
    form.value = { ...room };
  } else {
    editMode.value = false;
    form.value = { ...defaultForm };
  }
  showForm.value = true;
}

// Open modal to manage tenants
function openTenantForm(room) {
  selectedRoom.value = { ...room };
  editedTenants.value = [...room.tenants]; // ⬅️ safe copy
  tenantNameInput.value = "";
  tenantModalVisible.value = true;
}

// Add a tenant
function addTenant() {
  const name = tenantNameInput.value.trim();
  if (name && !editedTenants.value.includes(name)) {
    editedTenants.value.push(name);
    tenantNameInput.value = "";
  }
}

// Remove a tenant
function removeTenant(name) {
  editedTenants.value = editedTenants.value.filter((t) => t !== name);
}

// Save tenant list to Firestore
async function saveTenants() {
  const docRef = doc(db, "rooms", selectedRoom.value.id);
  await updateDoc(docRef, {
    tenants: editedTenants.value,
  });
  tenantModalVisible.value = false;
  await loadRooms();
}

const tenantNameInput = ref("");
const editedTenants = ref([]); // ⬅️ local working copy

onMounted(loadRooms);
</script>

<style scoped>
.btn {
  @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition;
}
.btn-secondary {
  @apply bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition;
}

.input {
  @apply w-full border border-gray-300 px-3 py-2 rounded text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400;
}
</style>
