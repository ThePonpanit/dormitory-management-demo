<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <h2 class="text-xl font-semibold">Print Billing</h2>
      <Datepicker
        v-model="selectedDate"
        month-picker
        format="MMMM/yyyy"
        :max-date="new Date()"
        :clearable="false"
        auto-apply
        class="input w-auto text-gray-100"
      />

      <!-- add vertical border -->
      <div class="border-l border-gray-400 h-12 rounded"></div>

      <button
        @click="generatePDF"
        class="btn bg-green-600 text-white hover:bg-green-700"
        :disabled="isLoading"
      >
        🖨️ Export PDF
      </button>

      <ExportBillingImages
        :billingRooms="billingRooms"
        :selectedMonth="selectedMonth"
        :selectedYear="selectedYear"
        :months="months"
      />
    </div>
    <div
      v-if="isPageLoading"
      class="flex flex-col justify-center items-center min-h-[200px] text-gray-500 text-center"
    >
      <Spinner class="mb-2" />
      <span>Loading billing data...</span>
    </div>

    <div v-else>
      <BillingTablePreview
        :billingRooms="billingRooms"
        :selectedMonth="selectedMonth"
        :selectedYear="selectedYear"
      />
    </div>
  </div>
</template>

<!-- #cspell:disable -->
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  collection,
  getDocs,
  doc as firestoreDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

import pdfMake from "../utils/pdfFonts"; // ← pdfmake instance (with vfs)
import BillingTablePreview from "./BillingTablePreview.vue";
import Spinner from "./animation/Spinner.vue";
import getPromptPayQRDataURL from "../utils/promptpay";
import { thaiQrHeaderBase64 } from "../assets/thaiQrHeaderBase64.js";
import ExportBillingImages from "./ExportBillingImages.vue";

import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

// ──────────────────────────────
// 🧠 State
// ──────────────────────────────
const selectedMonth = ref(new Date().getMonth());
const selectedYear = ref(new Date().getFullYear());
const isLoading = ref(false);
const isPageLoading = ref(false);
const billingRooms = ref([]);

// COMPUTED TWO-WAY BINDING FOR DATEPICKER
const selectedDate = computed({
  get() {
    return { month: selectedMonth.value, year: selectedYear.value };
  },
  set({ month, year }) {
    selectedMonth.value = month;
    selectedYear.value = year;
  },
});

// ──────────────────────────────
// 🗓️ Calendar Logic
// ──────────────────────────────
const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const monthKey = computed(() => {
  const m = String(selectedMonth.value + 1).padStart(2, "0");
  return `${selectedYear.value}-${m}`;
});

// watch for changes in the picker
watch([selectedMonth, selectedYear], loadBillingRooms);

// ──────────────────────────────
// 📦 Parallel Data Loading
// ──────────────────────────────
async function loadBillingRooms() {
  isPageLoading.value = true;

  const roomsSnapshot = await getDocs(collection(db, "rooms"));

  const fetchPromises = roomsSnapshot.docs.map(async (docSnap) => {
    const room = docSnap.data();
    const roomId = docSnap.id;
    const type = room.type || "Null";

    const billingRef = firestoreDoc(
      db,
      "billing",
      `${roomId}_${monthKey.value}`
    );
    const billingSnap = await getDoc(billingRef);

    if (!billingSnap.exists()) return null;

    return {
      id: roomId,
      name: room.name,
      ...billingSnap.data(),
      type,
    };
  });

  const resultsWithNulls = await Promise.all(fetchPromises);
  const results = resultsWithNulls.filter((room) => room !== null);

  billingRooms.value = results.sort((a, b) => {
    const [ab, ar] = a.name.split("/").map(Number);
    const [bb, br] = b.name.split("/").map(Number);
    return ab === bb ? ar - br : ab - bb;
  });

  isPageLoading.value = false;
}

onMounted(loadBillingRooms);

// ──────────────────────────────
// 📄 PDF Export via pdfMake
// ──────────────────────────────
async function generatePDF() {
  isLoading.value = true;

  const roomsSnapshot = await getDocs(collection(db, "rooms"));
  const sortedRooms = roomsSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((room) => room.status !== "closed") // ✅ Only include non-closed rooms
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

  if (sortedRooms.length === 0) return; // ✅ Check against filtered list

  const content = [];
  const buildingTotals = {};
  let grandTotal = 0;

  // Two rooms per page
  for (let i = 0; i < sortedRooms.length; i += 2) {
    const roomPair = [sortedRooms[i], sortedRooms[i + 1]].filter(Boolean);

    const columns = await Promise.all(
      roomPair.map(async (room) => {
        const billingRef = firestoreDoc(
          db,
          "billing",
          `${room.id}_${monthKey.value}`
        );
        const billingSnap = await getDoc(billingRef);
        if (!billingSnap.exists()) return { text: "" };

        const b = billingSnap.data();
        const buildingNum = Number(room.name.split("/")[0]) || 0;

        // 🔢 Accumulate summary data
        buildingTotals[buildingNum] =
          (buildingTotals[buildingNum] || 0) + (b.total || 0);
        grandTotal += b.total || 0;

        const stayedDays = b.stayedDays || 0;
        const daysInMonth = getDaysInSelectedMonth();
        const fullMonthRent =
          stayedDays > 0 ? (b.rent * daysInMonth) / stayedDays : 0;
        const showProrated = stayedDays > 0 && stayedDays < daysInMonth;

        const otherTotal = (b.otherCosts || []).reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        );

        const getRate = () =>
          b.usedUnit > 0 ? (b.electricityCost / b.usedUnit).toFixed(1) : "0";

        const qrImageUrl = await getPromptPayQRDataURL(b.total, buildingNum);

        return {
          width: "50%",
          stack: [
            {
              text: "หอพักคำป้อเปี่ยมสุข",
              style: "header",
              alignment: "center",
              margin: [0, 10, 0, 6],
              decoration: "underline",
            },
            {
              text: [
                "147 หมู่ 11 บ้านหนองท่า ตำบลป่าสัก อำเภอเมือง จังหวัดลำพูน รหัสไปรษณีย์ 51000\n",
                "081-9526545(แม่แดง) , 081-0331677(พี่ต๋อม)",
              ],
              style: "subheader",
              margin: [0, 0, 0, 3],
            },
            {
              text: [
                `ค่าเช่าประจำเดือน: ${months[selectedMonth.value]} ${
                  selectedYear.value
                }\n`,
                `หมายเลขห้อง: ${room.name} (${room.type})\n`,
                `ยอดทั้งหมด: ${formatPrice(b.total)} บาท\n`,
              ],
              style: "roomInfo",
              margin: [0, 0, 0, 3],
            },
            {
              text: [
                showProrated
                  ? `เดือนนี้เข้าพัก: ${stayedDays} วัน จาก ${daysInMonth} วัน\n` +
                    `คิดเป็นค่าเช่า: ${formatPrice(b.rent)} บาท` +
                    ` (คิดจาก: [${formatPrice(
                      fullMonthRent
                    )} บาท / ${daysInMonth} วัน] × ${stayedDays} วัน = ${formatPrice(
                      b.rent
                    )} บาท)`
                  : `อยู่ครบทั้งเดือน: ${daysInMonth} วัน (ค่าเช่าเต็มเดือน ${formatPrice(
                      b.rent
                    )} บาท )`,
              ],
              style: "roomDayInfo",
            },
            // ✅ Center table using fixed widths + margin instead of column hack
            {
              style: "tableExample",
              table: {
                widths: [160, 100],
                body: [
                  [
                    {
                      text: "รายการ",
                      fillColor: "#e0e0e0",
                      bold: true,
                      alignment: "left",
                    },
                    {
                      text: "จำนวน",
                      fillColor: "#e0e0e0",
                      bold: true,
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "ค่าเช่า", alignment: "left" },
                    { text: `${formatPrice(b.rent)} บาท`, alignment: "right" },
                  ],
                  [
                    { text: "ค่าน้ำ", alignment: "left" },
                    {
                      text: `${formatPrice(b.waterCost)} บาท`,
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "มิเตอร์ไฟฟ้าครั้งก่อน", alignment: "left" },
                    { text: `${b.lastMeter} หน่วย`, alignment: "right" },
                  ],
                  [
                    { text: "มิเตอร์ไฟฟ้าครั้งนี้", alignment: "left" },
                    { text: `${b.currentMeter} หน่วย`, alignment: "right" },
                  ],
                  [
                    {
                      text: "หน่วยไฟฟ้าที่ใช้ (kWh)",
                      alignment: "left",
                    },
                    { text: `${b.usedUnit} หน่วย`, alignment: "right" },
                  ],
                  [
                    {
                      text: `ค่าไฟฟ้า = ${
                        b.usedUnit
                      } หน่วย x ${getRate()} บาท/หน่วย`,
                      alignment: "left",
                    },
                    {
                      text: `${formatPrice(b.electricityCost)} บาท`,
                      alignment: "right",
                    },
                  ],

                  [
                    { text: "ค่าใช้จ่ายอื่น ๆ*", alignment: "left" },
                    {
                      text: `${formatPrice(otherTotal)} บาท`,
                      alignment: "right",
                    },
                  ],
                  [
                    {
                      text: "รวมทั้งหมด",
                      bold: true,
                      fillColor: "#f0f0f0",
                      alignment: "left",
                    },
                    {
                      text: `${formatPrice(b.total)} บาท`,
                      bold: true,
                      fillColor: "#f0f0f0",
                      alignment: "right",
                    },
                  ],
                ],
              },
              layout: {
                hLineColor: () => "#ccc",
                vLineColor: () => "#ccc",
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                paddingLeft: () => 8,
                paddingRight: () => 8,
              },
              margin: [30, 0, 0, 8],
            },
            {
              text: "*หมายเหตุ: ค่าใช้จ่ายอื่น ๆ อาจรวมค่าบริการต่าง ๆ เช่น ค่าซ่อมบำรุง, ค่าทำความสะอาด ฯลฯ โปรดติดต่อหอพักหากมีข้อสงสัย",
              style: "note",
            },
            {
              text: "กรุณาโอนเงินโดยใช้ QR code ด้านล่าง หรือเลขที่บัญชี *โดยไม่ปัดเศษ(หากมี)*",
              style: "note",
              decoration: "underline",
              margin: [0, 0, 0, 5],
            },
            {
              columns: [
                {
                  width: "*",
                  alignment: "center",
                  stack: [
                    {
                      table: {
                        widths: [150],
                        body: [
                          [
                            {
                              stack: [
                                {
                                  image: thaiQrHeaderBase64,
                                  width: 95,
                                  alignment: "center",
                                },
                                {
                                  image: qrImageUrl,
                                  width: 95,
                                  alignment: "center",
                                  margin: [0, -5, 0, 0],
                                },
                                {
                                  text: getAccountDisplayText(buildingNum),
                                  style: "note",
                                  alignment: "center",
                                },
                                {
                                  text:
                                    "ยอดโอน: " + formatPrice(b.total) + " บาท",
                                  style: "priceNote",
                                  alignment: "center",
                                },
                              ],
                            },
                          ],
                        ],
                      },
                      layout: {
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                        hLineColor: () => "#000000",
                        vLineColor: () => "#000000",
                      },
                    },
                  ],
                },
              ],
              margin: [110, 0, 0, 0],
            },
            {
              text: "ขอบคุณที่ใช้บริการหอพักคำป้อเปี่ยมสุข",
              style: "footer",
              alignment: "center",
              margin: [-5, 15, 0, 0],
            },
          ],
        };
      })
    );

    content.push({
      columns,
      columnGap: 10,
      margin: [0, 0, 0, 20],
    });

    const isLastPair = i + 2 >= sortedRooms.length;
    if (!isLastPair) {
      content.push({ text: "", pageBreak: "after" });
    }
  }

  // ➕ Summary Page
  // 📋 Enhanced Summary Page (Compact Layout + Extra Columns)
  content.push({
    text: `รายการสรุปค่าใช้จ่ายรายห้อง ประจำเดือน ${
      months[selectedMonth.value]
    } ${selectedYear.value}`,
    style: "header",
    alignment: "center",
    margin: [0, 10, 0, 10],
    pageBreak: "before",
  });

  const summaryTableRows = [
    [
      { text: "อาคาร", bold: true, fillColor: "#cccccc" },
      { text: "ห้อง", bold: true, fillColor: "#cccccc" },
      {
        text: "ประเภท",
        bold: true,
        fillColor: "#cccccc",
        alignment: "left",
      },
      {
        text: "จำนวนวันที่เข้าพัก",
        bold: true,
        fillColor: "#cccccc",
        alignment: "center",
      },
      { text: "ค่าเช่า", bold: true, fillColor: "#cccccc", alignment: "right" },
      { text: "ค่าน้ำ", bold: true, fillColor: "#cccccc", alignment: "right" },
      {
        text: "ใช้ไฟฟ้า (หน่วย)",
        bold: true,
        fillColor: "#cccccc",
        alignment: "right",
      },
      {
        text: "ค่าไฟ (บาท)",
        bold: true,
        fillColor: "#cccccc",
        alignment: "right",
      },
      {
        text: "ค่าอื่น ๆ",
        bold: true,
        fillColor: "#cccccc",
        alignment: "right",
      },
      { text: "รวม", bold: true, fillColor: "#cccccc", alignment: "right" },
    ],
  ];

  const buildingRoomMap = {};
  billingRooms.value.forEach((room) => {
    const building = Number(room.name.split("/")[0]) || 0;
    if (!buildingRoomMap[building]) buildingRoomMap[building] = [];
    buildingRoomMap[building].push(room);
  });

  let overall = {
    rent: 0,
    water: 0,
    electricity: 0,
    unit: 0,
    other: 0,
    total: 0,
  };

  Object.entries(buildingRoomMap)
    .sort(([a], [b]) => a - b)
    .forEach(([building, rooms]) => {
      const openRooms = rooms
        .filter((room) => room.status !== "closed")
        .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

      if (openRooms.length === 0) return; // 🛑 Skip this building

      let buildingTotals = {
        rent: 0,
        water: 0,
        electricity: 0,
        unit: 0,
        other: 0,
        total: 0,
      };

      openRooms.forEach((room) => {
        const otherTotal = (room.otherCosts || []).reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        );
        const unit = room.usedUnit || 0;
        const elecCost = room.electricityCost || 0;

        summaryTableRows.push([
          { text: `อาคาร ${building}`, alignment: "left" },
          { text: room.name, alignment: "left" },
          { text: room.type || "Null", alignment: "left" },
          { text: `${room.stayedDays || 0}`, alignment: "center" },
          { text: formatPrice(room.rent), alignment: "right" },
          { text: formatPrice(room.waterCost), alignment: "right" },
          {
            text: `${unit} kWh`,
            alignment: "right",
          },
          {
            text: `${formatPrice(elecCost)} บาท`,
            alignment: "right",
          },
          { text: formatPrice(otherTotal), alignment: "right" },
          { text: formatPrice(room.total), alignment: "right" },
        ]);

        buildingTotals.rent += room.rent || 0;
        buildingTotals.water += room.waterCost || 0;
        buildingTotals.electricity += elecCost;
        buildingTotals.unit += unit;
        buildingTotals.other += otherTotal;
        buildingTotals.total += room.total || 0;
      });

      // Add to overall totals
      Object.keys(overall).forEach((k) => {
        overall[k] += buildingTotals[k];
      });

      // ✅ Now safe to push building subtotal row
      summaryTableRows.push([
        {
          text: `รวม อาคาร ${building}`,
          colSpan: 4,
          bold: true,
          fillColor: "#f0f0f0",
          alignment: "right",
        },
        {},
        {},
        {},
        {
          text: formatPrice(buildingTotals.rent),
          bold: true,
          alignment: "right",
          fillColor: "#f0f0f0",
        },
        {
          text: formatPrice(buildingTotals.water),
          bold: true,
          alignment: "right",
          fillColor: "#f0f0f0",
        },
        {
          text: `${buildingTotals.unit} kWh`,
          bold: true,
          alignment: "right",
          fillColor: "#f0f0f0",
        },
        {
          text: `${formatPrice(buildingTotals.electricity)} บาท`,
          bold: true,
          alignment: "right",
          fillColor: "#f0f0f0",
        },
        {
          text: formatPrice(buildingTotals.other),
          bold: true,
          alignment: "right",
          fillColor: "#f0f0f0",
        },
        {
          text: formatPrice(buildingTotals.total),
          bold: true,
          alignment: "right",
          fillColor: "#f0f0f0",
        },
      ]);
    });

  // 📌 Final overall summary row
  summaryTableRows.push([
    {
      text: "รวมทั้งหมดทุกอาคาร",
      colSpan: 4,
      bold: true,
      fillColor: "#e0e0e0",
      alignment: "right",
    },
    {},
    {},
    {},
    {
      text: formatPrice(overall.rent),
      bold: true,
      alignment: "right",
      fillColor: "#e0e0e0",
    },
    {
      text: formatPrice(overall.water),
      bold: true,
      alignment: "right",
      fillColor: "#e0e0e0",
    },
    {
      text: `${overall.unit} kWh`,
      bold: true,
      alignment: "right",
      fillColor: "#e0e0e0",
    },
    {
      text: `${formatPrice(overall.electricity)} บาท`,
      bold: true,
      alignment: "right",
      fillColor: "#e0e0e0",
    },
    {
      text: formatPrice(overall.other),
      bold: true,
      alignment: "right",
      fillColor: "#e0e0e0",
    },
    {
      text: formatPrice(overall.total),
      bold: true,
      alignment: "right",
      fillColor: "#e0e0e0",
    },
  ]);

  content.push({
    style: "summaryTableExample",
    table: {
      widths: [
        "auto", // อาคาร
        "auto", // ห้อง
        "auto", // ประเภท
        "auto", // วันที่เข้าพัก
        "auto", // ค่าเช่า
        "auto", // ค่าน้ำ
        "auto", // ใช้ไฟฟ้า (หน่วย)
        "auto", // ค่าไฟ
        "auto", // ค่าอื่น ๆ
        "auto", // รวม
      ],
      body: summaryTableRows,
    },
    layout: {
      fillColor: (rowIndex) => {
        return rowIndex > 0 && rowIndex % 2 === 0 ? "#fcfcfc" : null;
      },
      hLineColor: () => "#ddd",
      vLineColor: () => "#ddd",
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
    },
    margin: [230, 0, 0, 0],
  });

  const docDefinition = {
    content,
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [30, 5, 30, 0],
    defaultStyle: {
      font: "Prompt",
      fontSize: 10,
    },
    styles: {
      header: { fontSize: 17, bold: true },
      subheader: { fontSize: 9 },
      roomInfo: { fontSize: 10, margin: [0, 0, 0, 4], bold: true },
      roomDayInfo: { fontSize: 9, margin: [0, 0, 0, 4] },
      note: { fontSize: 9, italics: true },
      tableExample: { fontSize: 8, margin: [0, 4, 0, 4] },
      summaryTableExample: {
        fontSize: 6,
        margin: [0, 4, 0, 4],
        alignment: "center",
      },
      priceNote: {
        fontSize: 10,
        margin: [0, 2, 0, 4],
        bold: true,
        color: "#347433",
      },
      footer: {
        fontSize: 10,
        margin: [0, 5, 0, 0],
        alignment: "center",
        bold: true,
      },
    },
    fonts: {
      Prompt: {
        normal: "Prompt-Regular.ttf",
        bold: "Prompt-Bold.ttf",
        italics: "Prompt-Regular.ttf",
        bolditalics: "Prompt-Bold.ttf",
      },
    },
  };

  pdfMake.createPdf(docDefinition).download(`Billing-${monthKey.value}.pdf`);
  isLoading.value = false;
}

// ──────────────────────────────
// 💵 Formatting
// ──────────────────────────────
const formatPrice = (v) =>
  `${Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// ────────────────────────────
// 🔢 Utility Functions
// ────────────────────────────
function getAccountDisplayText(buildingNumber) {
  const b = Number(buildingNumber);
  if (b === 1) {
    return "เลขที่บัญชี(KBANK)\n210-8-32416-6\nนางอัญชลี ยะคำป้อ";
  }
  if (b === 2 || b === 3 || b === 4) {
    return "เลขที่บัญชี(KBANK)\n150-1-24517-4\nว่าที่ ร.ต.หญิง พรพรรณ ศรีบุรินทร์";
  } else {
    return "เลขที่บัญชี(KBANK)\n210-8-32416-6\nนางอัญชลี ยะคำป้อ"; // fallback case
  }
  // return "บัญชีไม่ระบุ";
}

function getDaysInSelectedMonth() {
  // `selectedMonth` is 0-based, `selectedYear` is a full year (e.g. 2025)
  return new Date(selectedYear.value, selectedMonth.value + 1, 0).getDate();
}
</script>

<style scoped>
.input {
  @apply border border-gray-300 rounded px-2 py-1 text-sm;
}
.btn {
  @apply px-4 py-2 rounded transition font-medium;
  min-width: 180px;
}
.btn:disabled {
  @apply bg-gray-400 cursor-not-allowed;
}
</style>
