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
    await auth.signOut(); // actually sign out
    user.value = null;
    accessToken.value = null;
  };

  return {
    user,
    accessToken,
    initialized,
    setUser,
    initAuthListener,
    logout,
  };
});
