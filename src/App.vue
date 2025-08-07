<template>
  <div class="min-h-screen bg-gray-100 font-sans">
    <!-- Auth Page -->
    <template v-if="!isAuthPage">
      <!-- Navigation Header -->
      <nav class="bg-white shadow px-6 py-3 flex justify-between items-center">
        <h1
          class="text-xl font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition select-none"
          @click="routeToHome"
        >
          <!-- #cspell:disable-next-line -->
          🏠 Khampor-Piemsuk- <span class="text-green-500">DEMO</span>
        </h1>
        <div class="flex items-center space-x-6">
          <div
            v-if="auth.user?.role === 'admin' || auth.user?.isGuest"
            class="space-x-4 select-none"
          >
            <RouterLink to="/dashboard" :class="navClass('/dashboard')"
              >Dashboard</RouterLink
            >
            <RouterLink to="/billing" :class="navClass('/billing')"
              >Billing</RouterLink
            >
            <RouterLink to="/rooms" :class="navClass('/rooms')"
              >Rooms</RouterLink
            >
          </div>

          <!-- Vertical Line -->
          <div
            v-if="auth.user?.role === 'admin' || auth.user?.isGuest"
            class="border-l border-gray-400 h-6 mx-4 select-none"
          ></div>
          <!-- User Menu -->
          <div class="relative ml-6 select-none" ref="menuRef">
            <div class="border cursor-pointer rounded-full" @click="toggleMenu">
              <!-- Avatar: Image or fallback "User" text -->
              <div
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white text-xs text-gray-700 font-semibold"
              >
                <img
                  v-if="auth.user?.photoURL"
                  :src="auth.user.photoURL"
                  alt="Avatar"
                  class="w-9 h-9 rounded-full border object-cover"
                />
                <span v-else>User</span>
              </div>
            </div>

            <!-- Dropdown Menu -->
            <transition name="fade">
              <div
                v-if="isMenuOpen"
                class="absolute right-0 mt-3 w-48 bg-white rounded shadow-md z-10 transition-opacity duration-300 add-shadow"
              >
                <div class="p-4 border-b cursor-default">
                  <p class="font-semibold text-gray-800">
                    {{ auth.user?.displayName }}
                    <span
                      v-if="auth.user?.isGuest"
                      class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2"
                      >GUEST</span
                    >
                  </p>
                  <p class="text-sm text-gray-400 truncate">
                    {{ auth.user?.email }}
                  </p>
                </div>

                <!-- Admin Links -->
                <template
                  v-if="auth.user?.role === 'admin' || auth.user?.isGuest"
                >
                  <div class="border-b">
                    <RouterLink
                      to="/qr"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline"
                    >
                      <li>QR Generator</li>
                    </RouterLink>
                    <RouterLink
                      to="/admin"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline"
                    >
                      <li>Admin's Panel</li>
                    </RouterLink>
                  </div>
                </template>

                <!-- Logout -->
                <button
                  class="block w-full text-center px-4 py-2 text-red-500 hover:bg-gray-200"
                  @click="handleLogout"
                >
                  Logout
                </button>
              </div>
            </transition>
          </div>
        </div>
      </nav>
    </template>

    <!-- Routed Views -->
    <main class="p-6">
      <template
        v-if="
          auth.user?.role ||
          route.path === '/login' ||
          route.path === '/register'
        "
      >
        <RouterView />
      </template>
      <template v-else>
        <div
          class="max-w-2xl mx-auto bg-white p-6 rounded shadow-md text-center text-yellow-500 font-semibold"
        >
          ⚠️ You have no access to this page. Please contact the admin for more
          information.
        </div>
      </template>
    </main>

    <!-- Back to Top Button -->
    <BackToTopButton />
  </div>
</template>

<script setup>
import { useRoute, RouterLink, RouterView, useRouter } from "vue-router";
import { computed, watch } from "vue";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAuthStore } from "../src/stores/auth";
import { signOut } from "firebase/auth";
import { auth as firebaseAuth } from "../src/firebase";
import BackToTopButton from "./components/BackToTopButton.vue";

const route = useRoute();
const router = useRouter();

const auth = useAuthStore();

// Menu toggle state
const isMenuOpen = ref(false);
const menuRef = ref(null); // 👈 bind this to the wrapper

// Toggle visibility
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Route to home
const routeToHome = () => {
  router.push("/");
};

// Dynamically detect if we're on the auth page
const isAuthPage = computed(
  () =>
    route.path === "/" || route.path === "/login" || route.path === "/register"
);
watch(
  () => route.path,
  (newPath) => {
    console.log("Route changed to:", newPath);
  },
  { immediate: true }
);

// Page title
watch(
  () => route.path,
  (newPath) => {
    // #cspell:disable-next-line
    document.title = `Khampor-Piemsuk - ${
      newPath === "/"
        ? "Home"
        : newPath.slice(1).charAt(0).toUpperCase() + newPath.slice(2)
    }`;
  },
  { immediate: true }
);

// Class for nav link
const navClass = (path) =>
  [
    "nav-btn",
    route.path === path ? "border-b-4 border-red-400 font-bold" : "",
  ].join(" ");

// Logout logic
const handleLogout = async () => {
  // Only call Firebase signOut for real authenticated users, not guests
  if (!auth.user?.isGuest) {
    await signOut(firebaseAuth);
  }

  auth.logout();
  console.log("User logged out");

  // Redirect to login page
  router.push("/login");
};
</script>

<style scoped>
.nav-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition;
}

.add-shadow {
  -webkit-box-shadow: 3px 3px 10px 3px #dddddd;
  -moz-box-shadow: 3px 3px 10px 3px #dddddd;
  box-shadow: 3px 3px 10px 3px #dddddd;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
button {
  @apply select-none;
}
</style>
