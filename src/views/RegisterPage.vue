<template>
  <div class="login-wrapper">
    <div class="login-container">
      <h2 class="text-2xl font-bold mb-4">Register</h2>

      <form @submit.prevent="registerWithEmail" class="space-y-4 text-gray-100">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          autocomplete="email"
          aria-label="Email"
          class="input"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
          minlength="6"
          autocomplete="new-password"
          aria-label="Password"
          class="input"
        />
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          required
          autocomplete="new-password"
          aria-label="Confirm Password"
          class="input"
        />

        <p
          v-if="password && confirmPassword && password !== confirmPassword"
          class="error"
        >
          Passwords do not match.
        </p>
        <div>
          <button type="submit" class="btn-primary" :disabled="!canSubmit">
            <span class="material-symbols-outlined mr-2">person_add</span>
            Register with Email
          </button>
        </div>
      </form>
      <div>
        <p class="text-sm text-gray-500 mt-4">
          Already have an account?
          <router-link to="/login" class="text-blue-600">Login</router-link>
        </p>
      </div>

      <p v-if="errorMessage">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const errorMessage = ref("");
const router = useRouter();
const authStore = useAuthStore();

const canSubmit = computed(
  () =>
    email.value &&
    password.value &&
    confirmPassword.value &&
    password.value === confirmPassword.value
);

const registerWithEmail = async () => {
  errorMessage.value = "";
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    authStore.setUser(userCredential.user);

    router.push("/dashboard");
  } catch (error) {
    errorMessage.value = error.message;
  }
};
</script>

<style scoped>
.login-wrapper {
  @apply flex items-center justify-center min-h-screen;
  margin-top: -5%;
}

.login-container {
  @apply bg-white p-8 rounded shadow-md w-full max-w-sm text-center;
}

input {
  @apply w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400;
}

button {
  @apply py-2 px-4 rounded font-semibold;
}

.btn-primary {
  @apply inline-flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed;
}

.error {
  @apply text-red-500 mt-4 text-sm;
}

.input {
  @apply w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900;
}
</style>
