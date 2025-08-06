<template>
  <Line :data="processedChartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
);

const props = defineProps({
  months: {
    type: Array,
    required: true, // e.g. ['2024-01', '2024-02', ...]
  },
  electricityCosts: {
    type: Array,
    required: true, // e.g. [1400, 1200, 1320, ...]
  },
  temperatures: {
    type: Array,
    required: true, // e.g. [28.3, 29.1, 30.2, ...]
  },
});

const processedChartData = computed(() => ({
  labels: props.months,
  datasets: [
    {
      label: "Electricity Cost / Billing Room (฿)",
      data: props.electricityCosts,
      yAxisID: "y",
      borderColor: "#42A5F5",
      backgroundColor: "#42A5F5",
      fill: false,
      tension: 0.4,
    },
    {
      label: "Avg Temperature (°C)",
      data: props.temperatures,
      yAxisID: "y1",
      borderColor: "#FF7043",
      backgroundColor: "#FF7043",
      fill: false,
      tension: 0.4,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
    tooltip: {
      mode: "index", // 👈 ensures all datasets for the index are shown
      intersect: false,
      callbacks: {
        label: function (context) {
          const label = context.dataset.label || "";
          const value = context.raw;

          if (context.datasetIndex === 0) {
            return `${label}: ฿${parseInt(value).toLocaleString()}`;
          } else if (context.datasetIndex === 1) {
            return `${label}: ${value} °C`;
          }
          return `${label}: ${value}`;
        },
      },
    },
  },
  scales: {
    y: {
      type: "linear",
      position: "left",
      beginAtZero: true,
      ticks: {
        callback: (val) =>
          new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            maximumFractionDigits: 0,
          }).format(val),
      },
    },
    y1: {
      type: "linear",
      position: "right",
      ticks: {
        stepSize: 1,
        callback: (val) => `${val}°`,
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
};
</script>
