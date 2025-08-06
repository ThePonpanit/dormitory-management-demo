<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">🧩User Management</h2>

    <!-- Loading indicator -->
    <div
      v-if="loading"
      class="text-gray-500 flex items-center justify-center flex-col mt-10"
    >
      <Spinner class="mb-2" />
      Loading users…
    </div>

    <!-- Authentication / permission errors -->
    <div v-else-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>

    <!-- User table -->
    <table
      v-else
      class="mx-auto table-auto border border-gray-300 rounded overflow-hidden bg-white shadow-md"
    >
      <thead class="bg-gray-100 text-left text-sm text-gray-700">
        <tr>
          <th class="p-3 border-b">UID</th>
          <th class="p-3 border-b">Email</th>
          <th class="p-3 border-b">Display Name</th>
          <th class="p-3 border-b">Login Provider</th>
          <th class="p-3 border-b">Current Role</th>
          <th class="p-3 border-b">Set New Role</th>
          <th class="p-3 border-b">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="u in users"
          :key="u.uid"
          class="border-t hover:bg-gray-50 transition"
        >
          <td class="p-3 text-xs break-all text-gray-700">{{ u.uid }}</td>
          <td class="p-3 text-sm text-gray-800">{{ u.email }}</td>
          <td class="p-3 text-sm text-gray-800">{{ u.displayName || "–" }}</td>
          <td class="p-3 text-sm text-gray-800">
            {{ u.providerData.join(", ") }}
          </td>
          <td class="p-3 font-semibold text-sm text-indigo-600">
            {{ u.role.charAt(0).toUpperCase() + u.role.slice(1) }}
          </td>
          <td class="p-3">
            <div class="flex items-center space-x-2">
              <select
                v-model="u.newRole"
                class="border border-gray-300 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring focus:border-blue-300"
              >
                <option disabled value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="tenant">Tenant</option>
                <option value="guest">Guest</option>
              </select>

              <button
                class="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50 transition w-24"
                @click="assignRole(u, u.newRole)"
                :disabled="!u.newRole || u.newRole === u.role || !setButton"
              >
                {{ !setButton ? "Setting" : "Set" }}
              </button>
            </div>
          </td>
          <td class="p-3">
            <button
              class="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50 transition"
              @click="removeUser(u)"
            >
              Remove
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";
import { useAuthStore } from "../stores/auth";
import { getAuth } from "firebase/auth";
import Spinner from "../components/animation/Spinner.vue";

const functions = getFunctions(app);
const users = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const setButton = ref(true);

const authStore = useAuthStore();

const refreshToken = async () => {
  const user = getAuth().currentUser;
  if (user) {
    await user.getIdToken(true); // 🔁 force refresh
    await new Promise((r) => setTimeout(r, 1000)); // ⏱ 1s delay to sync
  }
};

async function fetchUsers() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await refreshToken(); // 🔁 Force refresh token before action
    const getAll = httpsCallable(functions, "listUsers");
    const { data } = await getAll();

    users.value = data.users.map((u) => ({
      ...u,
      newRole: u.role,
    }));
    // console.log("Fetched users:", users.value);
  } catch (err) {
    console.error("getAllUsers error", err);
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Ensure auth is initialized before fetching users
onMounted(() => {
  // Watch for auth to finish initializing
  watch(
    () => authStore.initialized,
    (isReady) => {
      if (isReady && authStore.user?.role === "admin") {
        fetchUsers(); // 🚀 Now it's safe to call
      }
    },
    { immediate: true }
  );
});

const assignRole = async (user, role) => {
  setButton.value = false;
  // console.log("CALLING setRole WITH:", { uid: user.uid, role });

  try {
    const fn = httpsCallable(functions, "setRole");
    await refreshToken();

    if (authStore.user?.role !== "admin") {
      throw new Error("You do not have permission to assign roles.");
    }

    const result = await fn({ uid: user.uid, role });
    // console.log(result.data.message);
  } catch (err) {
    console.error("Error assigning role:", err.message);
    alert(`Error assigning role: ${err.message}`);
  } finally {
    setButton.value = true;
    await fetchUsers(); // 🔄 Refresh user list after role change
  }
};

const removeUser = async (user) => {
  if (!confirm(`Are you sure you want to remove user ${user.email}?`)) {
    return;
  }

  try {
    const fn = httpsCallable(functions, "removeUser");
    await refreshToken(); // 🔁 Force refresh token before action
    await fn({ uid: user.uid });
    await fetchUsers(); // Refresh user list
  } catch (err) {
    console.error("Error removing user:", err.message);
    alert(`Error removing user: ${err.message}`);
  } finally {
    alert(`User ${user.email} removed successfully.`);
  }
};
</script>

<style scoped>
table {
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #e5e7eb;
}
.disabled\:opacity-50:disabled {
  opacity: 0.5;
}
</style>
