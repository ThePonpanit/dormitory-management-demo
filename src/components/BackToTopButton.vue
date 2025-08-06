<template>
  <button
    v-if="isVisible"
    @click="scrollToTop"
    class="fixed bottom-10 right-10 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-opacity duration-300 flex items-center justify-center w-12 h-12"
    :class="{ 'opacity-100': isVisible, 'opacity-0': !isVisible }"
  >
    <span class="material-symbols-outlined text-4xl"> arrow_circle_up </span>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const isVisible = ref(false);

const handleScroll = () => {
  if (window.scrollY > 200) {
    isVisible.value = true;
  } else {
    isVisible.value = false;
  }
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
button {
  z-index: 1000;
}
</style>
