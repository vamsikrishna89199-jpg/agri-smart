const admin = require('firebase-admin');

if (!admin.apps.length) {
    // backend/AI services will use environment variables
    // FIREBASE_SERVICE_ACCOUNT must be a JSON string of the service account or standard env vars
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
    } catch (e) {
        console.error("Firebase Admin Init Error (check env vars):", e);
        // Fallback for local dev or if env vars are missing to avoid crash
        admin.initializeApp();
    }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
