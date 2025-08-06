// src/stores/auth.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth } from "../firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const accessToken = ref(null);
  const initialized = ref(false);

  // populate user + accessToken + role
  const setUser = async (firebaseUser) => {
    user.value = firebaseUser;

    if (firebaseUser) {
      // force-refresh token
      accessToken.value = await firebaseUser.getIdToken(true);

      // pull custom claims
      const tokenResult = await getIdTokenResult(firebaseUser);
      user.value.role = tokenResult.claims.role || null;
    } else {
      accessToken.value = null;
    }
  };

  // returns a promise that resolves once we've done the very first onAuthStateChanged
  const initAuthListener = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        await setUser(firebaseUser);
        initialized.value = true;
        resolve(firebaseUser);
      });
    });
  };

  const logout = async () => {
    // Check if it's a guest user - don't try to sign out from Firebase
    if (user.value?.isGuest) {
      user.value = null;
      accessToken.value = null;
    } else {
      await auth.signOut(); // actually sign out
      user.value = null;
      accessToken.value = null;
    }
  };

  // Guest login function for testing
  const loginAsGuest = () => {
    const guestUser = {
      uid: "guest-user-123",
      email: "guest@dormapp.test",
      displayName: "Guest User",
      role: "admin", // Give guest admin access for testing
      photoURL: null,
      emailVerified: false,
      isGuest: true, // Flag to identify guest users
    };

    user.value = guestUser;
    accessToken.value = "guest-token-123"; // Mock token for guest
    initialized.value = true;
  };

  return {
    user,
    accessToken,
    initialized,
    setUser,
    initAuthListener,
    logout,
    loginAsGuest,
  };
});
