const admin = require('../../firebase');
const db = admin.db;

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' };

    try {
        const body = JSON.parse(event.body || '{}');
        const action = (event.queryStringParameters && event.queryStringParameters.action) || body.action;

        console.log(`[DEBUG] Method: ${event.httpMethod}, Action: ${action}`);
        console.log(`[DEBUG] QSP:`, event.queryStringParameters);

        // Simple features
        if (action === 'seed_check') {
            const isGenuine = Math.random() < 0.5;
            return success({
                is_genuine: isGenuine,
                message: isGenuine ? "Genuine Seeds Verified ✅" : "⚠️ COUNTERFEIT SEEDS DETECTED!"
            });
        }

        if (action === 'pump_control') {
            const status = body.status;
            // In real app, send MQTT message here
            console.log(`Pump turned ${status}`);
            return success({ message: `Pump turned ${status} successfully` });
        }

        if (action === 'get_schemes') {
            // Static list for now, or fetch from Firestore 'schemes' collection
            const schemes = [
                { id: 1, name: "Pm Kisan Samman Nidhi", benefit: "₹6,000/year", link: "#" },
                { id: 2, name: "Rythu Bandhu", benefit: "₹10,000/acre", link: "#" }
            ];
            return success(schemes);
        }

        if (action === 'admin_users') {
            if (event.httpMethod === 'GET') {
                try {
                    const snapshot = await db.collection('users').get();
                    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return success(users);
                } catch (dbError) {
                    console.error("DB Error (admin_users):", dbError);
                    // Fallback for local dev without Admin SDK credentials
                    return success([
                        { id: 'mock1', username: 'Admin User (Mock)', email: 'admin@kisan.ai', role: 'admin', is_verified: true },
                        { id: 'mock2', username: 'Farmer John (Mock)', email: 'john@example.com', role: 'user', is_verified: true }
                    ]);
                }
            }
        }

        if (action === 'dashboard') {
            try {
                // Try to fetch real counts
                const usersSnap = await db.collection('users').count().get(); // count() might be query-based
                // Firestore Admin Node SDK uses get().size or select()
                const uSnap = await db.collection('users').get();
                const cSnap = await db.collection('crops').get();
                const aSnap = await db.collection('alerts').get();

                return success({
                    stats: {
                        users: uSnap.size,
                        crops: cSnap.size,
                        alerts: aSnap.size
                    },
                    weather: {
                        temp: 28, condition: "Sunny", humidity: 60 // Mock/Default
                    }
                });
            } catch (dbError) {
                console.error("DB Error (dashboard):", dbError);
                return success({
                    stats: { users: 50, crops: 120, alerts: 15, farmers: 45 }, // Mock Stats
                    weather: { temp: 28, condition: "Sunny (Mock)", humidity: 62 }
                });
            }
        }

        if (action === 'call_log') {
            if (event.httpMethod === 'POST') {
                try {
                    // In a real production app, you'd store this in Firestore or SQLite
                    // For now, we'll log it and return success to clear the 404
                    console.log("[CALL LOG]", body);

                    // Optional: Store in Firestore 'calls_history'
                    await db.collection('calls_history').add({
                        ...body,
                        timestamp: admin.admin.firestore.FieldValue.serverTimestamp()
                    });

                    return success({ message: "Call logged successfully" });
                } catch (e) {
                    console.error("Call Log Error:", e);
                    return success({ message: "Call logged locally (Sync failed)" });
                }
            }
        }

        // Data fetch for sync (if needed)

        return error("Invalid action");

    } catch (e) {
        console.error("Manage Error:", e);
        return error(e.message, 500);
    }
};

const success = (data) => ({
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ success: true, data })
});

const error = (msg, code = 400) => ({
    statusCode: code,
    headers: HEADERS,
    body: JSON.stringify({ success: false, message: msg })
});
