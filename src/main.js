// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import "./registerSW.js"; // for VitePWA

import "./assets/main.css";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// grab the store instance (pass pinia if needed)
const authStore = useAuthStore(pinia);

// **DELAY** mounting until our auth listener has fired once**
authStore.initAuthListener().then(() => {
  app.mount("#app");
});
