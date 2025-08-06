const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");

admin.initializeApp();

const db = admin.firestore();

// 🔁 List all users
exports.listUsers = functions.https.onCall(async (data, context) => {
  const users = [];
  const listUsersRecursively = async (nextPageToken) => {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    result.users.forEach((user) => {
      users.push({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.customClaims?.role || "None",
        providerData: user.providerData.map((p) => p.providerId),
      });
    });
    if (result.pageToken) {
      await listUsersRecursively(result.pageToken);
    }
  };

  await listUsersRecursively();
  return { users };
});

// 🛠️ Set user role
exports.setRole = functions.https.onCall(async (incoming, context) => {
  const { uid, role } = incoming?.uid ? incoming : incoming.data || {};
  console.log("Setting role for user:", uid, "to role:", role);

  if (!uid || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Must provide uid and role."
    );
  }

  const userToModify = await admin.auth().getUser(uid);

  if (
    (userToModify.uid === "z3eOEI8zsgf3DT5hVjEYbkJe0X43" ||
      userToModify.email === "hostit313@gmail.com") &&
    role !== "admin"
  ) {
    console.warn(
      `⚠️ Role change attempt blocked: tried to set protected user ${uid} to role "${role}"`
    );
    throw new functions.https.HttpsError(
      "permission-denied",
      "Cannot change the role of this protected user."
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    return {
      message: `✅ Role '${role}' assigned to user ${uid}`,
    };
  } catch (err) {
    console.error("Error setting custom claims:", err);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to assign role. Try again later."
    );
  }
});

// ❌ Remove user
exports.removeUser = functions.https.onCall(async (incoming, context) => {
  const { uid } = incoming?.uid ? incoming : incoming.data || {};
  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Must provide a uid."
    );
  }

  const userToRemove = await admin.auth().getUser(uid);

  if (
    userToRemove.uid === "z3eOEI8zsgf3DT5hVjEYbkJe0X43" ||
    userToRemove.email === "hostit313@gmail.com"
  ) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "This user cannot be removed."
    );
  }

  try {
    await admin.auth().deleteUser(uid);
    return {
      message: `Successfully deleted user ${uid}`,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError("internal", "Unable to delete user.");
  }
});

// 🌤️ Cache Monthly Weather - Firebase Functions Gen 2
// #cspell:disable-next-line
const API_KEY = "GWTLBVNG4Q36WVUAGB9YYJKDR";
// #cspell:disable-next-line
const CITY = "Lamphun,Thailand"; // 🔄 updated from "Bangkok"
const UNIT = "metric";

exports.cacheMonthlyWeather = onSchedule(
  {
    schedule: "every day 01:00",
    timeZone: "Asia/Bangkok",
    memory: "256MiB",
    region: "asia-southeast1",
    retryCount: 2,
    timeoutSeconds: 60,
  },
  async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${CITY}/${startStr}/${endStr}?unitGroup=${UNIT}&key=${API_KEY}&include=days`;

      const response = await axios.get(url);
      const days = response.data?.days;

      if (!Array.isArray(days) || days.length === 0) {
        throw new Error("No weather data received.");
      }

      const avgTemp =
        days.reduce((sum, day) => sum + (day.temp || 0), 0) / days.length;
      const maxTemp = Math.max(...days.map((d) => d.tempmax || 0));
      const minTemp = Math.min(...days.map((d) => d.tempmin || 0));

      const docId = `${year}-${String(month + 1).padStart(2, "0")}`;

      await db
        .collection("weather")
        .doc(docId)
        .set({
          city: CITY,
          month: docId,
          avgTemp: parseFloat(avgTemp.toFixed(1)),
          maxTemp: parseFloat(maxTemp.toFixed(1)),
          minTemp: parseFloat(minTemp.toFixed(1)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.log(`✅ Saved weather data for ${docId}`);
    } catch (error) {
      logger.error("❌ Failed to fetch or save weather data:", error.message);
    }
  }
);

// 📅 Backfill Monthly Weather Dat a
exports.backfillMonthlyWeather = functions.https.onRequest(async (req, res) => {
  const axios = require("axios");
  const admin = require("firebase-admin");
  const db = admin.firestore();

  // start from January 2024 to the current month
  const startYear = 2024;
  const startMonth = 0; // Jan = 0
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth(); // current month

  const monthsToFetch = [];

  for (let y = startYear; y <= endYear; y++) {
    const startM = y === startYear ? startMonth : 0;
    const endM = y === endYear ? endMonth : 11;
    for (let m = startM; m <= endM; m++) {
      monthsToFetch.push({ year: y, month: m });
    }
  }

  const errors = [];

  for (const { year, month } of monthsToFetch) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    const docId = `${year}-${String(month + 1).padStart(2, "0")}`;

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${CITY}/${startStr}/${endStr}?unitGroup=${UNIT}&key=${API_KEY}&include=days`;

    try {
      const response = await axios.get(url);
      const days = response.data?.days;

      if (!Array.isArray(days) || days.length === 0) {
        throw new Error("No data for " + docId);
      }

      const avgTemp =
        days.reduce((sum, d) => sum + (d.temp || 0), 0) / days.length;
      const maxTemp = Math.max(...days.map((d) => d.tempmax || 0));
      const minTemp = Math.min(...days.map((d) => d.tempmin || 0));

      await db
        .collection("weather")
        .doc(docId)
        .set({
          city: CITY,
          month: docId,
          avgTemp: parseFloat(avgTemp.toFixed(1)),
          maxTemp: parseFloat(maxTemp.toFixed(1)),
          minTemp: parseFloat(minTemp.toFixed(1)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`✅ Stored ${docId}`);
    } catch (err) {
      console.error(`❌ Failed for ${docId}:`, err.message);
      errors.push({ docId, error: err.message });
    }
  }

  res.status(200).json({
    status: "completed",
    failed: errors.length,
    errors,
  });
});
