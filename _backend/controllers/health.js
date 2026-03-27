const { admin, db } = require('../firebase');

const handleGetFamilyMembers = async (req, res) => {
    try {
        const { uid } = req.user || { uid: 'demo_user' }; // Fallback for demo
        const snapshot = await db.collection('family_members')
            .where('uid', '==', uid)
            .get();
        
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: members });
    } catch (err) {
        console.error("[Health API] Get Members Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

const handleCreateFamilyMember = async (req, res) => {
    try {
        const { uid } = req.user || { uid: 'demo_user' };
        const { name, relation, age, gender, blood_group } = req.body;
        
        if (!name || !relation) {
            return res.status(400).json({ success: false, message: "Name and Relation are required." });
        }

        const newMember = {
            uid,
            name,
            relation,
            age: parseInt(age),
            gender,
            blood_group,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('family_members').add(newMember);
        res.json({ success: true, id: docRef.id, message: "Family member added successfully!" });
    } catch (err) {
        console.error("[Health API] Create Member Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

const handleGetHealthRecords = async (req, res) => {
    try {
        const { member_id } = req.query;
        if (!member_id) {
            return res.status(400).json({ success: false, message: "Member ID is required." });
        }

        const snapshot = await db.collection('health_records')
            .where('member_id', '==', member_id)
            .orderBy('date', 'desc')
            .get();
        
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: records });
    } catch (err) {
        console.error("[Health API] Get Records Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

const handleCreateHealthRecord = async (req, res) => {
    try {
        const { member_id, diagnosis, date, doctor, notes } = req.body;
        
        if (!member_id || !diagnosis || !date) {
            return res.status(400).json({ success: false, message: "Member ID, Diagnosis, and Date are required." });
        }

        const newRecord = {
            member_id,
            diagnosis,
            date,
            doctor,
            notes,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('health_records').add(newRecord);
        res.json({ success: true, id: docRef.id, message: "Health record added successfully!" });
    } catch (err) {
        console.error("[Health API] Create Record Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    handleGetFamilyMembers,
    handleCreateFamilyMember,
    handleGetHealthRecords,
    handleCreateHealthRecord
};
