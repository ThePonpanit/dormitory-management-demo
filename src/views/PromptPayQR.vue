<!-- #cspell:disable -->
<template>
  <div class="p-4 max-w-sm mx-auto">
    <h2 class="text-lg font-semibold mb-2">🔲 PromptPay QR Generator</h2>

    <!-- Amount Input -->
    <div>
      <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
        จำนวนเงิน (THB)
      </label>
      <input
        id="amount"
        type="number"
        step="0.01"
        v-model="amount"
        placeholder="เช่น 500"
        class="w-full px-3 py-2 border rounded-md mb-4 text-gray-50"
      />
    </div>

    <!-- Generate Button -->
    <button
      @click="generateQRCode"
      class="w-full bg-green-600 text-white font-medium py-2 rounded-md hover:bg-green-700 mb-4"
    >
      สร้าง QR
    </button>

    <!-- Show QR (when ready) -->
    <div v-if="qrCodeDataUrl" class="text-center">
      <img
        :src="qrCodeDataUrl"
        alt="PromptPay QR"
        class="mx-auto w-48 h-48 mb-2"
      />
      <p class="text-sm text-gray-600">
        Payload: <code class="break-all">{{ qrPayload }}</code>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import QRCode from "qrcode";

// 📌 PromptPay Account: “004” + 12-digit account = 15 digits total
// (ตัวอย่าง: 150-1-24517-4 → 004999194796792)
const bankAccountPromptPay = "004999194796792";

const amount = ref(""); // bind to <input type="number">
const qrPayload = ref("");
const qrCodeDataUrl = ref("");

// Build the EMVCo‐compliant PromptPay QR payload
function generatePromptPayPayload(account, amountValue) {
  // 1) Format amount to two decimal places (e.g. "500.00")
  const amt = parseFloat(amountValue || 0).toFixed(2);

  // 2) Tag 54 = “Transaction Amount”
  //    ID = "54", Length = amt.length (as two digits), Value = amt
  const amountTag = `54${String(amt.length).padStart(2, "0")}${amt}`;

  // 3) Tag 29 (Merchant Account Information) for PromptPay:
  //    – GUID = "A000000677010111"
  //    – account → prefix with "0315" (ID= “01” length= “15” + 15‐digit account)
  const guid = "A000000677010111";
  const accField = `0315${account}`; // “01” + length “15” + account
  const merchantAccount = `0016${guid}${accField}`; // “00” + length “16” + (GUID + accField)
  const merchantTag = `2939${merchantAccount}`; // “29” + length “39” + (merchantAccount)

  // 4) Tag 53 = “Merchant Currency Code” → Numeric ISO code for THB is “764”
  //    ID = "53", Length = "03", Value = "764"
  const currencyTag = "5303764";

  // 5) Tag 58 = “Country Code”
  //    ID = "58", Length = "02", Value = "TH"
  const countryTag = "5802TH";

  // 6) Tag 63 = “CRC”
  //    ID = "63", Length = "04". We append the CRC last, so just put "6304" now.
  const crcTag = "6304";

  // 7) Concatenate everything (in exactly this order), then compute CRC
  const payloadWithoutCRC =
    "000201" + // Payload Format Indicator
    "010211" + // Point of Initiation Method (static = “11”)
    merchantTag + // Tag 29: Merchant Account Information (PromptPay)
    currencyTag + // Tag 53: Currency (numeric “764”)
    countryTag + // Tag 58: Country (“TH”)
    amountTag + // Tag 54: Amount
    crcTag; // Tag 63: CRC (placeholder)

  const crc = computeCRC16_CCITT(payloadWithoutCRC);
  return payloadWithoutCRC + crc;
}

// CRC-16/CCITT (XModem) implementation
function computeCRC16_CCITT(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Generate a QR Code data URL from the payload
async function generateQRCode() {
  if (!amount.value || isNaN(amount.value) || Number(amount.value) <= 0) {
    alert("กรุณาใส่จำนวนเงินที่ถูกต้อง (เช่น 500)");
    return;
  }

  const payload = generatePromptPayPayload(bankAccountPromptPay, amount.value);
  qrPayload.value = payload;
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(payload);
  } catch (err) {
    console.error("Cannot generate QR:", err);
    qrCodeDataUrl.value = "";
  }
}
</script>

<style scoped>
/* เล็กน้อยให้ดูสวยงาม */
input {
  outline: none;
  border: 1px solid #ccc;
}
input:focus {
  border-color: #3182ce;
}
</style>
