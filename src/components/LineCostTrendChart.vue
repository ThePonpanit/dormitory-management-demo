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
  chartData: {
    type: Object,
    required: true,
  },
  options: Object,
});

const processedChartData = computed(() => {
  if (!props.chartData || !props.chartData.datasets) {
    return { labels: [], datasets: [] };
  }

  const newDatasets = props.chartData.datasets.map((dataset) => ({
    ...dataset,
    fill: true,
    backgroundColor: (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) {
        return null;
      }
      const gradient = ctx.createLinearGradient(
        0,
        chartArea.bottom,
        0,
        chartArea.top
      );
      gradient.addColorStop(0, "rgba(75, 192, 192, 0)");
      gradient.addColorStop(1, "rgba(75, 192, 192, 0.5)");
      return gradient;
    },
    borderColor: "rgba(75, 192, 192, 1)",
    tension: 0.4,
    borderWidth: 2,
  }));

  return {
    ...props.chartData,
    datasets: newDatasets,
  };
});

const chartOptions = computed(() => ({
  ...props.options,
  plugins: {
    ...props.options?.plugins,
    legend: {
      display: false,
    },
  },
  scales: {
    ...(props.options?.scales || {}),
    y: {
      ...(props.options?.scales?.y || {}),
      min: 2500, // 👈 Start value
      ticks: {
        ...(props.options?.scales?.y?.ticks || {}),
        precision: 0,
        stepSize: 100, // 👈 Step between ticks
        callback: (value) => {
          return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            maximumFractionDigits: 0,
          }).format(value);
        },
      },
    },
  },
}));
</script>
