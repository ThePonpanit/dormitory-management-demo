// promptpay.js
import QRCode from "qrcode";

export default async function getPromptPayQRDataURL(amount, buildingNumber) {
  try {
    const selectedAccount = getAccountByBuilding(buildingNumber);
    const payload = generatePromptPayPayload(selectedAccount, amount);
    return await QRCode.toDataURL(payload); // returns base64 image URL
  } catch (err) {
    console.error("QR Generation Error:", err);
    return "";
  }
}

// Choose account based on building number
function getAccountByBuilding(buildingNumber) {
  const bn = Number(buildingNumber);
  if (bn === 1) return "004999214440702";
  if (bn === 2 || bn === 3 || bn === 4) return "004999194796792";
  else return "004999214440702";
  // throw new Error(`Unsupported building number: ${buildingNumber}`);
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

  const payload =
    "000201" +
    "010211" +
    merchantTag +
    currencyTag +
    countryTag +
    amountTag +
    crcTag;

  const crc = computeCRC16(payload);
  return payload + crc;
}

// CRC-16/CCITT (XModem)
function computeCRC16(str) {
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
