<!-- components/PromptPayQR.vue -->
<!-- #cspell:disable -->
<template>
  <img
    v-if="qrCodeDataUrl"
    :src="qrCodeDataUrl"
    alt="PromptPay QR"
    class="w-40 h-40 object-contain"
  />
</template>

<script setup>
import { ref, watchEffect } from "vue";
import QRCode from "qrcode";

const props = defineProps({
  amount: {
    type: [String, Number],
    required: true,
  },
  buildingNumber: {
    type: [String, Number],
    required: true,
  },
});

const qrCodeDataUrl = ref("");
const qrPayload = ref("");

// Define both PromptPay accounts
const accountForBuilding1 = "004999214440702";
const accountForOthers = "004999194796792";

// Function to select correct PromptPay account
function getAccountByBuilding(buildingNumber) {
  const bn = Number(buildingNumber);
  return bn === 1 ? accountForBuilding1 : accountForOthers;
}

// Generate EMVCo-compliant PromptPay payload
function generatePromptPayPayload(account, amountValue) {
  const amt = parseFloat(amountValue || 0).toFixed(2);
  const amountTag = `54${String(amt.length).padStart(2, "0")}${amt}`;

  const guid = "A000000677010111";
  const accField = `0315${account}`;
  const merchantAccount = `0016${guid}${accField}`;
  const merchantTag = `2939${merchantAccount}`;

  const currencyTag = "5303764";
  const countryTag = "5802TH";
  const crcTag = "6304";

  const payloadWithoutCRC =
    "000201" +
    "010211" +
    merchantTag +
    currencyTag +
    countryTag +
    amountTag +
    crcTag;

  const crc = computeCRC16_CCITT(payloadWithoutCRC);
  return payloadWithoutCRC + crc;
}

// CRC-16/CCITT (XModem)
function computeCRC16_CCITT(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Reactive QR generation
watchEffect(async () => {
  const amount = Number(props.amount);
  const buildingNumber = Number(props.buildingNumber);

  if (!amount || isNaN(amount) || amount <= 0) {
    qrCodeDataUrl.value = "";
    return;
  }

  const selectedAccount = getAccountByBuilding(buildingNumber);
  const payload = generatePromptPayPayload(selectedAccount, amount);
  qrPayload.value = payload;

  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(payload);
  } catch (err) {
    console.error("QR Code generation failed", err);
    qrCodeDataUrl.value = "";
  }
});
</script>
