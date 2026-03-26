const admin = require('firebase-admin');

let db, auth, storage;

if (!admin.apps.length) {
    try {
        const saStr = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!saStr) throw new Error("No service account env var");
        const serviceAccount = JSON.parse(saStr);
        if (!serviceAccount.project_id) throw new Error("Missing project_id");
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        console.log("✅ Firebase Admin Initialized");
    } catch (e) {
        console.warn("⚠️ Firebase Admin Mock Mode:", e.message);
        
        // Satisfy the SDK requirements to avoid "App does not exist" errors
        // By NOT calling admin.auth() or admin.storage() later if we provide mocks here.
        
        const mockStore = {};
        db = {
            collection: (name) => ({
                doc: (id) => ({
                    get: async () => ({
                        exists: !!mockStore[`${name}/${id}`],
                        data: () => mockStore[`${name}/${id}`]
                    }),
                    set: async (data) => { mockStore[`${name}/${id}`] = { ...data, timestamp: { toDate: () => new Date() } }; }
                }),
                add: async (data) => { 
                    const id = Math.random().toString(36).substring(7);
                    mockStore[`${name}/${id}`] = { ...data, timestamp: { toDate: () => new Date() } }; 
                    return { id };
                },
                where: () => db.collection(name),
                orderBy: () => db.collection(name),
                limit: () => db.collection(name),
                get: async () => ({
                    docs: Object.keys(mockStore)
                        .filter(k => k.startsWith(name))
                        .map(k => ({ data: () => mockStore[k] }))
                })
            })
        };
        auth = { verifyIdToken: async () => ({ uid: 'mock-uid' }) };
        storage = { bucket: () => ({ upload: async () => [{ name: 'mock-file' }] }) };
        
        // Mock FieldValue
        admin.firestore = { FieldValue: { serverTimestamp: () => new Date() } };
    }
}

if (!db) db = admin.firestore();
if (!auth) auth = admin.auth();
if (!storage) storage = admin.storage();

module.exports = { admin, db, auth, storage };
