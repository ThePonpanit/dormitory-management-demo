<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: "Monthly Income Breakdown",
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.dataset.label || "";
          const value = context.raw;
          const total = context.chart.data.datasets[0].data.reduce(
            (acc, cur) => acc + cur,
            0
          );
          const percentage = ((value / total) * 100).toFixed(2) + "%";
          return `${label}: ${new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(value)} (${percentage})`;
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        callback: function (value) {
          return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            maximumFractionDigits: 0,
          }).format(value);
        },
      },
    },
  },
  ...props.options,
}));
</script>
