<template>
  <div
    class="bg-white rounded-lg shadow p-4 flex items-center space-x-4 min-w-fit"
  >
    <div class="text-3xl select-none">{{ icon }}</div>
    <div>
      <div class="text-sm text-gray-500 no-warp">{{ title }}</div>
      <div class="text-xl font-semibold text-gray-800">{{ value }}</div>
      <div v-if="comparison" class="text-xs text-gray-500 no-warp">
        {{ comparison }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: String,
  comparison: String,
});
</script>

<style scoped>
.no-warp {
  white-space: nowrap;
}
</style>
