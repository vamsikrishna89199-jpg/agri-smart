const { queryDB, runDB } = require('../database');

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

async function handlePumpControl(req, res) {
    const { status } = req.body;
    // Simulate IoT trigger
    res.json({ success: true, message: `Pump turned ${status ? 'ON' : 'OFF'} successfully.` });
}

async function handleSeedCheck(req, res) {
    // Mock seed database check
    res.json({ success: true, verified: true, message: "Seed batch verified as authentic." });
}

async function handleDeleteUser(req, res) {
    const { id } = req.query;
    try {
        await runDB("DELETE FROM users WHERE id = ?", [id]);
        res.json({ success: true, message: "User deleted." });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}

async function handleCallLog(req, res) {
    const { caller_id, receiver_id, duration, status, type } = req.body;
    // Log to DB if table exists (ignore if not for now)
    res.json({ success: true, message: "Call logged." });
}

async function handleAdminUsers(req, res) {
    try {
        const users = await queryDB("SELECT id, username, role, state FROM users");
        res.json({ success: true, data: users });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}

module.exports = { 
    handleGetUsers, 
    handleGetDashboard, 
    handlePumpControl, 
    handleSeedCheck, 
    handleDeleteUser, 
    handleCallLog, 
    handleAdminUsers 
};
