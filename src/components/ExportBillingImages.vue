<!-- #cspell:disable -->
<template>
  <div>
    <!-- (A) Hidden container for html2canvas snapshots: -->
    <div ref="hiddenContainer" class="hidden-container">
      <div
        v-for="room in billingRooms.filter((r) => r.status !== 'closed')"
        :key="room.id"
        class="invoice-card"
        :data-room-name="room.name"
      >
        <!-- ─── HEADER ─── -->
        <div class="invoice-header">
          <h2>หอพักคำป้อเปี่ยมสุข</h2>
          <p class="address">
            147 หมู่ 11 บ้านหนองท่า ตำบลป่าสัก อำเภอเมือง จังหวัดลำพูน 51000<br />
            081-9526545(แม่แดง) , 081-0331677(พี่ต๋อม)
          </p>
        </div>

        <!-- ─── ROOM INFO ─── -->
        <div class="room-info">
          <p>
            ค่าเช่าประจำเดือน:
            <strong> {{ months[selectedMonth] }} {{ selectedYear }} </strong>
          </p>
          <p>
            หมายเลขห้อง:
            <strong>
              {{ room.name }}
            </strong>
          </p>

          <p>
            ยอดทั้งหมด:
            <strong> {{ formatPrice(room.total) }} บาท </strong>
          </p>
          <p v-if="room.stayedDays !== getDaysInSelectedMonth()">
            เดือนนี้เข้าพัก: <strong> {{ room.stayedDays }} </strong> วัน จาก
            <strong> {{ getDaysInSelectedMonth() }} </strong> วัน
            <strong>
              คิดเป็นค่าเช่า:
              {{ formatPrice(room.rent) }}
              บาท <br />
              ( คิดจาก: [
              {{
                formatPrice(
                  (room.rent * getDaysInSelectedMonth()) / room.stayedDays
                )
              }}
              บาท / {{ getDaysInSelectedMonth() }} วัน ] x
              {{ room.stayedDays }} วัน = {{ formatPrice(room.rent) }} บาท )
            </strong>
          </p>
          <p>
            วันที่ออกบิล:
            <strong>
              {{
                new Date().toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Bangkok",
                })
              }}
            </strong>
          </p>
        </div>

        <!-- ─── CHARGES TABLE ─── -->
        <table class="charges-table">
          <thead>
            <tr>
              <th class="left-cell">รายการ</th>
              <th class="right-cell">จำนวน</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="left-cell">ค่าเช่า</td>
              <td class="right-cell">{{ formatPrice(room.rent) }} บาท</td>
            </tr>
            <tr>
              <td class="left-cell">ค่าน้ำ</td>
              <td class="right-cell">{{ formatPrice(room.waterCost) }} บาท</td>
            </tr>
            <tr>
              <td class="left-cell">เลขมิเตอร์ไฟฟ้าครั้งก่อน</td>
              <td class="right-cell">{{ room.lastMeter }} หน่วย</td>
            </tr>
            <tr>
              <td class="left-cell">เลขมิเตอร์ไฟฟ้าครั้งนี้</td>
              <td class="right-cell">{{ room.currentMeter }} หน่วย</td>
            </tr>
            <tr>
              <td class="left-cell">หน่วยที่ใช้ (kWh)</td>
              <td class="right-cell">{{ room.usedUnit }} หน่วย</td>
            </tr>
            <tr>
              <td class="left-cell">
                ค่าไฟฟ้า = {{ room.usedUnit }} หน่วย x
                {{ getRate(room) }} บาท/หน่วย
              </td>
              <td class="right-cell">
                {{ formatPrice(room.electricityCost) }} บาท
              </td>
            </tr>

            <tr>
              <td class="left-cell">ค่าใช้จ่ายอื่น ๆ*</td>
              <td class="right-cell">
                {{ formatPrice(otherTotal(room)) }} บาท
              </td>
            </tr>
            <tr class="total-row">
              <td class="left-cell">
                <strong>รวมทั้งหมด</strong>
              </td>
              <td class="right-cell">
                <strong>{{ formatPrice(room.total) }} บาท</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <p class="note">
          *หมายเหตุ: ค่าใช้จ่ายอื่น ๆ อาจรวมค่าบริการต่าง ๆ เช่น ค่าซ่อมบำรุง,
          ค่าทำความสะอาด ฯลฯ โปรดติดต่อหอพักหากมีข้อสงสัย
        </p>

        <p class="note underline">
          กรุณาโอนเงินโดยใช้ QR code ด้านล่าง หรือเลขที่บัญชี
          *โดยไม่ปัดเศษ(หากมี)*
        </p>

        <!-- ─── PAYMENT DEADLINE NOTICE ─── -->
        <div class="mx-auto flex justify-center items-center w-fit mt-4">
          <span
            class="text-yellow-600 font-bold text-sm flex items-center gap-1"
          >
            ⚠️ <strong>กำหนดชำระเงิน: ภายในวันที่ 5 ของทุกเดือน</strong> ⚠️
          </span>
        </div>

        <!-- ─── QR / ACCOUNT INFO ─── -->
        <div class="qr-section">
          <div class="qr-content-box border-2 rounded p-2">
            <img class="qr-header" :src="thaiQrHeaderBase64" alt="QR Header" />
            <img class="qr-image" :src="room.qrImageUrl" alt="PromptPay QR" />
            <p class="account-info">
              <span
                class="font-bold text-emerald-600"
                style="margin-top: -10px"
              >
                แสกน QR เพื่อโอนเข้าบัญชี
              </span>
              <br />
              <span v-html="getAccountText(room.name)"></span>
              <br />
              <span
                >ยอดโอน:
                <span class="font-bold text-emerald-600">{{
                  formatPrice(room.total)
                }}</span>
                บาท</span
              >
            </p>
          </div>
        </div>

        <p class="footer">ขอบคุณที่ใช้บริการหอพักคำป้อเปี่ยมสุข</p>
      </div>
    </div>

    <!-- (B) Visible button to trigger ZIP creation -->
    <button
      @click="exportAllAsZip"
      class="btn-export bg-green-600 text-white hover:bg-green-700"
      :disabled="isExporting"
    >
      <span v-if="!isExporting">📦 Export All Images as ZIP</span>
      <span v-else>กำลังสร้าง ZIP...</span>
    </button>

    <!-- (C) Hidden summary section for export -->
    <div ref="summaryContainer" class="hidden-container">
      <div class="summary-card" v-if="billingRooms.length > 0">
        <h2 class="summary-title">
          รายงานสรุปค่าใช้จ่ายหอพัก ประจำเดือน
          {{ months[selectedMonth] }} {{ selectedYear }}
        </h2>
        <p class="summary-note">
          *หมายเหตุ: คอลัมน์ "ค่าเช่า"
          จะแสดงค่าเช่าที่คำนวณตามจำนวนวันที่เข้าพัก หากอยู่ไม่ครบเดือน
          จะมีเครื่องหมาย * แสดงที่ท้ายค่าเช่า
        </p>
        <br />
        <table class="summary-table">
          <thead>
            <tr>
              <th>อาคาร</th>
              <th>ห้อง</th>
              <th>ประเภท</th>
              <th>วันที่เข้าพัก</th>
              <th>ค่าเช่า</th>
              <th>ค่าน้ำ</th>
              <th>ใช้ไฟฟ้า (หน่วย)</th>
              <th>ค่าไฟฟ้า (บาท)</th>
              <th>ค่าอื่น ๆ</th>
              <th>รวม</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="[building, rooms] in groupedRoomsByBuilding">
              <tr v-for="room in rooms" :key="room.id">
                <td>{{ building }}</td>
                <td>{{ room.name }}</td>
                <td>{{ room.type }}</td>
                <td>{{ room.stayedDays }}</td>
                <td>
                  {{ formatPrice(room.rent)
                  }}<span
                    v-if="room.stayedDays < getDaysInSelectedMonth()"
                    class="font-bold ml-1"
                    >*</span
                  >
                </td>
                <td>{{ formatPrice(room.waterCost) }}</td>
                <td>{{ formatPrice(room.usedUnit) }}</td>
                <td>{{ formatPrice(room.electricityCost) }}</td>
                <td>{{ formatPrice(otherTotal(room)) }}</td>
                <td>{{ formatPrice(room.total) }}</td>
              </tr>

              <!-- Subtotal Row per Building -->
              <tr class="subtotal-row">
                <td colspan="4" style="text-align: right; font-weight: bold">
                  รวม อาคาร {{ building }}
                </td>
                <td style="text-align: right; font-weight: bold">
                  {{
                    formatPrice(rooms.reduce((s, r) => s + (r.rent || 0), 0))
                  }}
                </td>
                <td style="text-align: right; font-weight: bold">
                  {{
                    formatPrice(
                      rooms.reduce((s, r) => s + (r.waterCost || 0), 0)
                    )
                  }}
                </td>
                <td style="text-align: right; font-weight: bold">
                  {{
                    formatPrice(
                      rooms.reduce((s, r) => s + (r.usedUnit || 0), 0)
                    )
                  }}
                </td>
                <td style="text-align: right; font-weight: bold">
                  {{
                    formatPrice(
                      rooms.reduce((s, r) => s + (r.electricityCost || 0), 0)
                    )
                  }}
                </td>
                <td style="text-align: right; font-weight: bold">
                  {{
                    formatPrice(rooms.reduce((s, r) => s + otherTotal(r), 0))
                  }}
                </td>
                <td style="text-align: right; font-weight: bold">
                  {{
                    formatPrice(rooms.reduce((s, r) => s + (r.total || 0), 0))
                  }}
                </td>
              </tr>
            </template>
            <tr class="grand-total-row bg-green-400">
              <td colspan="4" style="text-align: right; font-weight: bold">
                รวมทั้งหมดทุกอาคาร
              </td>
              <td style="text-align: right; font-weight: bold">
                {{ formatPrice(grandTotalSummary.rent) }}
              </td>
              <td style="text-align: right; font-weight: bold">
                {{ formatPrice(grandTotalSummary.water) }}
              </td>
              <td style="text-align: right; font-weight: bold">
                {{ formatPrice(grandTotalSummary.power) }}
              </td>
              <td style="text-align: right; font-weight: bold">
                {{ formatPrice(grandTotalSummary.electricity) }}
              </td>
              <td style="text-align: right; font-weight: bold">
                {{ formatPrice(grandTotalSummary.other) }}
              </td>
              <td style="text-align: right; font-weight: bold">
                {{ formatPrice(grandTotalSummary.total) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from "vue";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { thaiQrHeaderBase64 } from "../assets/thaiQrHeaderBase64.js";
import getPromptPayQRDataURL from "../utils/promptpay";

// ─────────────────────────────────────────────────────────────────────────────
// (0) Utilities for generating QR codes
// ─────────────────────────────────────────────────────────────────────────────
async function attachQrImagesToBillingRooms() {
  for (const room of billingRooms) {
    const buildingNumber = Number(String(room.name).split("/")[0]) || 0;
    room.qrImageUrl = await getPromptPayQRDataURL(room.total, buildingNumber);
  }
}

function getAccountText(roomName) {
  const building = Number(String(roomName).split("/")[0]) || 0;
  if (building === 1) {
    return "เลขที่บัญชี(KBANK)<br/>210-8-32416-6<br/>นางอัญชลี ยะคำป้อ";
  }
  if (building === 2 || building === 3 || building === 4) {
    return "เลขที่บัญชี(KBANK)<br/>150-1-24517-4<br/>ว่าที่ ร.ต.หญิง พรพรรณ ศรีบุรินทร์";
  } else {
    return "เลขที่บัญชี(KBANK)<br/>210-8-32416-6<br/>นางอัญชลี ยะคำป้อ"; // Fallback for unknown buildings
  }
}

function getDaysInSelectedMonth() {
  // `selectedMonth` is 0-based, `selectedYear` is a full year (e.g. 2025)
  return new Date(selectedYear, selectedMonth + 1, 0).getDate();
}

const summaryContainer = ref(null);

const groupedRoomsByBuilding = computed(() => {
  const map = new Map();
  billingRooms
    .filter((room) => room.status !== "closed") // ✅ Exclude closed rooms
    .forEach((room) => {
      const building = String(room.name).split("/")[0];
      if (!map.has(building)) map.set(building, []);
      map.get(building).push(room);
    });

  // Sort rooms within each building
  map.forEach((rooms) =>
    rooms.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }))
  );

  return map;
});
// ─────────────────────────────────────────────────────────────────────────────

const grandTotalSummary = computed(() => {
  return billingRooms
    .filter((room) => room.status !== "closed") // ✅ Exclude closed rooms
    .reduce(
      (acc, room) => {
        const other = otherTotal(room);
        acc.rent += room.rent || 0;
        acc.water += room.waterCost || 0;
        acc.power += room.usedUnit || 0;
        acc.electricity += room.electricityCost || 0;
        acc.other += other;
        acc.total += room.total || 0;
        return acc;
      },
      {
        rent: 0,
        water: 0,
        power: 0,
        electricity: 0,
        other: 0,
        total: 0,
      }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// (1) Explicitly destructure props so that selectedYear, selectedMonth, etc. exist
// ─────────────────────────────────────────────────────────────────────────────
const { billingRooms, selectedMonth, selectedYear, months } = defineProps({
  billingRooms: {
    type: Array,
    required: true,
    // each room must have at least:
    // { id, name, lastMeter, currentMeter, usedUnit, electricityCost, waterCost, rent, otherCosts[], total, qrImageUrl }
  },
  selectedMonth: { type: Number, required: true },
  selectedYear: { type: Number, required: true },
  months: { type: Array, required: true },
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) Local state
// ─────────────────────────────────────────────────────────────────────────────
const hiddenContainer = ref(null);
const isExporting = ref(false);

// ─────────────────────────────────────────────────────────────────────────────
// (3) Helper functions
// ─────────────────────────────────────────────────────────────────────────────
const formatPrice = (v) =>
  `${Number(v || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;

const otherTotal = (room) =>
  (room.otherCosts || []).reduce((sum, item) => sum + (item.amount || 0), 0);

// หาก usedUnit > 0: คำนวณ rate = (electricityCost / usedUnit).toFixed(1)
const getRate = (room) =>
  room.usedUnit > 0 ? (room.electricityCost / room.usedUnit).toFixed(1) : "0";

// ─────────────────────────────────────────────────────────────────────────────
// (4) exportAllAsZip(): สร้าง PNG ทีละห้อง แล้ว zip และดาวน์โหลด
// ─────────────────────────────────────────────────────────────────────────────
async function exportAllAsZip() {
  if (!hiddenContainer.value) return;
  isExporting.value = true;

  // ✅ Call the function to attach QR images to billing rooms
  await attachQrImagesToBillingRooms();

  // Allow DOM to render .invoice-card
  await nextTick();

  const cards = Array.from(
    hiddenContainer.value.querySelectorAll(".invoice-card")
  );

  const zip = new JSZip();

  for (const cardEl of cards) {
    const roomName = cardEl.dataset.roomName || "room";
    try {
      const canvas = await html2canvas(cardEl, { scale: 2 });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      const filename = `${roomName}_${selectedYear}-${String(
        selectedMonth + 1
      ).padStart(2, "0")}.png`;

      zip.file(filename, blob);
    } catch (err) {
      console.error("Error capturing ", roomName, err);
    }
  }

  // 🔚 After looping through room cards, create summary PNG
  if (summaryContainer.value) {
    await nextTick(); // ensure DOM rendered
    try {
      const canvas = await html2canvas(summaryContainer.value, { scale: 2 });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      const summaryFilename = `Summary_${selectedYear}-${String(
        selectedMonth + 1
      ).padStart(2, "0")}.png`;

      zip.file(summaryFilename, blob);
    } catch (error) {
      console.error("❌ Failed to create summary image:", error);
    }
  }

  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(
      content,
      `BillingImages_${selectedYear}-${String(selectedMonth + 1).padStart(
        2,
        "0"
      )}.zip`
    );
    isExporting.value = false;
  });
}
</script>

<style scoped>
/* ─── Hide the container off-screen, but keep its children at full size ─── */
.hidden-container {
  position: absolute;
  left: -9999px;
  top: -9999px;
}

/* ─── Styles for each “invoice-card” ─── */
.invoice-card {
  width: 800px; /* Must be non-zero so html2canvas can render */
  padding: 16px;
  margin-bottom: 24px;
  background: white;
  border: 1px solid #ccc;
  font-family: "Prompt", sans-serif;
  color: #333;
}

/* Header */
.invoice-header {
  text-align: center;
}
.invoice-header h2 {
  font-size: 20px;
  margin-bottom: 4px;
  text-decoration: underline;
}
.invoice-header .address {
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 12px;
}

/* Room Info */
.room-info {
  margin: 0 auto; /* ✅ center the entire box */
  width: fit-content; /* ✅ box shrinks to fit content */
  text-align: left; /* ✅ keep text aligned left inside */
  font-size: 13px;
  margin-bottom: 8px;
  padding: 4px 12px; /* ✅ optional padding for spacing */
}

/* Charges Table */
.charges-table {
  display: table;
  width: 50%;
  margin: 8px auto;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: auto;
}

.charges-table th,
.charges-table td {
  border: 1px solid #ccc;
  padding: 8px 12px;
  vertical-align: middle;
  height: 40px; /* ✅ This makes vertical centering visually effective */
  line-height: 1.2;
}

.charges-table thead {
  background-color: #e0e0e0;
}

.left-cell {
  text-align: left;
}

.right-cell {
  text-align: right;
}

.total-row {
  background-color: #f0f0f0;
}

/* Note sections */
.note {
  font-size: 12px;
  font-style: italic;
  margin-top: 4px;
}
.underline {
  text-decoration: underline;
  margin-bottom: 8px;
}

/* QR section */
.qr-section {
  text-align: center;
  margin-top: 20px;
  margin-bottom: 15px;
}

.qr-content-box {
  display: inline-block;
  max-width: 375px; /* Adjust as needed */
  text-align: center;
}

.qr-section img {
  display: block;
  margin: 0 auto;
  max-width: 135px;
}

/* QR Instructions */
.qr-instructions {
  background-color: #e8f5e8;
  border: 1px solid #28a745;
  border-radius: 6px;
  padding: 10px;
  margin: 10px 0;
  text-align: left;
}

.instruction-title {
  font-size: 11px;
  font-weight: bold;
  color: #155724;
  margin-bottom: 6px;
  text-align: center;
}

.instruction-list {
  font-size: 9px;
  color: #155724;
  margin: 0;
  padding-left: 16px;
  line-height: 1.4;
}

.instruction-list li {
  margin-bottom: 2px;
}

.account-info {
  font-size: 10px;
  line-height: 1.3;
}

/* Footer */
.footer {
  text-align: center;
  font-size: 10px;
  margin-top: 8px;
  font-weight: bold;
}

/* Visible export button */
.btn-export {
  @apply px-4 py-2 rounded transition font-medium;
  min-width: 180px;
}
.btn-export:disabled {
  @apply bg-gray-400 cursor-not-allowed;
}

/* Summary Image */
.summary-card {
  width: 1200px;
  background: #fff;
  padding: 24px;
  border: 1px solid #ccc;
  font-family: "Prompt", sans-serif;
  font-size: 12px;
  color: #333;
}

.summary-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
}

.summary-table {
  border-collapse: collapse;
  table-layout: auto; /* 🔧 allow column width to follow content */
  margin: 0 auto; /* 🎯 center horizontally */
  font-size: 12px;
}

.summary-table th,
.summary-table td {
  border: 1px solid #ccc;
  padding: 6px 12px;
  text-align: center;
  white-space: nowrap; /* ✅ avoid wrapping to keep width compact */
}

.summary-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.subtotal-row {
  font-weight: bold;
  @apply bg-blue-400;
}

.grand-total-row {
  font-weight: bold;
}

.summary-note {
  font-size: 12px;
  font-style: italic;
  margin-top: 4px;
  text-align: center;
}
</style>
