import admin from "firebase-admin";
import firebaseConfig from "../../serviceAccountKey.json" with { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

async function sendNotification(token, title, body) {
  if (!token || typeof token !== 'string') {
    console.warn("Invalid FCM token");
    return;
  }

  const message = {
    notification: { title, body },
    android: { priority: 'high' },
    apns: {
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          contentAvailable: true,
        },
      },
    },
    webpush: {
      headers: { Urgency: 'high' },
      notification: { title, body, vibrate: [200, 100, 200] },
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Notification failed:", error.code, error.message);
    throw error;
  }
}

export default {
  sendNotification,
};
