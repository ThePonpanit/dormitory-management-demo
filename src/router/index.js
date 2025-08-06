// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth"; // 💡 Pinia store for auth
import { watch } from "vue";

// 🛣️ Import views
import Dashboard from "../views/Dashboard.vue";
import Rooms from "../views/Rooms.vue";
import Billing from "../views/Billing.vue";
import QRcode from "../views/PromptPayQR.vue";
import Login from "../views/LoginPage.vue";
import AdminView from "../views/AdminView.vue";
import Register from "../views/RegisterPage.vue"; // If you have a registration view

// Define route meta for protection
const routes = [
  { path: "/", redirect: "/dashboard" },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/rooms",
    component: Rooms,
    meta: { requiresAuth: true, requiresRole: "admin" },
  },
  {
    path: "/billing",
    component: Billing,
    meta: { requiresAuth: true, requiresRole: "admin" },
  },
  {
    path: "/qr",
    component: QRcode,
    meta: { requiresAuth: true, requiresRole: "admin" },
  },
  {
    path: "/login",
    component: Login,
    meta: { requiresAuth: false }, // No auth required for login
  },
  {
    path: "/register",
    component: Register, // Registration view
    meta: { requiresAuth: false }, // No auth required for registration
  },
  {
    path: "/admin",
    component: AdminView,
    meta: {
      requiresAuth: true,
      requiresRole: "admin",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ✅ Reactive Global Auth Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Wait until auth is initialized
  if (!authStore.initialized) {
    await new Promise((resolve) => {
      const stopWatch = watch(
        () => authStore.initialized,
        (val) => {
          if (val) {
            stopWatch();
            resolve();
          }
        }
      );
    });
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiredRole = to.meta.requiresRole;

  const isAuthenticated = !!authStore.user;
  const userRole = authStore.user?.role;
  const isGuest = authStore.user?.isGuest || false;

  if (requiresAuth && !isAuthenticated) {
    next("/login");
  } else if (requiredRole && userRole !== requiredRole && !isGuest) {
    // 🚫 User lacks required role (but allow guests full access)
    alert("You do not have permission to access this page.");
    next("/dashboard"); // Or redirect anywhere else
  } else if (to.path === "/login" && isAuthenticated) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
