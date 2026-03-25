const { queryDB, runDB } = require('./database');

async function handleGetUsers(req, res) {
    try {
        const users = await queryDB("SELECT * FROM users");
        res.json({ success: true, data: users });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}

async function handleGetDashboard(req, res) {
    try {
        const users = await queryDB("SELECT COUNT(*) as count FROM users");
        const schemes = await queryDB("SELECT COUNT(*) as count FROM schemes");
        res.json({
            success: true,
            data: {
                stats: { users: users[0].count, schemes: schemes[0].count, crops: 12, alerts: 5 },
                weather: { temp: 28, condition: "Sunny" }
            }
        });
    } catch (e) {
        res.json({ success: true, data: { stats: { users: 0 } } });
    }
}

module.exports = { handleGetUsers, handleGetDashboard };
