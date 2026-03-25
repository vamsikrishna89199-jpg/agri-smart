const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'agrismart.db');

// Delete existing DB for a fresh start (optional, remove in production)
// if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath);

const GOVERNMENT_SCHEMES_DATA = {
    central: [
        {
            id: 'pm_kisan',
            name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
            nameLocal: 'పీఎం-కిసాన్ యోజన',
            category: 'Financial Support',
            benefits: '₹6,000 per year in 3 equal installments of ₹2,000 directly to bank account',
            eligibility: 'Small and marginal landholding farmers',
            minLand: 0,
            maxLand: null,
            documents: 'Aadhaar Card, Bank Account Details, Land Records',
            applicationProcess: 'Online at pmkisan.gov.in',
            officialLink: 'https://pmkisan.gov.in/',
            deadline: 'Ongoing',
            type: 'central'
        },
        {
            id: 'pmfby',
            name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
            nameLocal: 'ప్రధానమంత్రి పంట బీమా యోజన',
            category: 'Crop Insurance',
            benefits: 'Compensation for crop loss. Premium: Kharif 2%, Rabi 1.5%.',
            eligibility: 'All farmers growing notified crops',
            minLand: 0,
            maxLand: null,
            documents: 'Aadhaar Card, Bank Account, Land Records, Sowing Certificate',
            applicationProcess: 'Through banks or CSCs',
            officialLink: 'https://pmfby.gov.in/',
            deadline: 'Within 7 days of sowing',
            type: 'central'
        },
        {
            id: 'kcc',
            name: 'Kisan Credit Card (KCC)',
            nameLocal: 'కిసాన్ క్రెడిట్ కార్డు',
            category: 'Financial Support',
            benefits: 'Low-interest agricultural loans (as low as 4% with timely repayment)',
            eligibility: 'All farmers, SHGs, FPOs',
            minLand: 0,
            maxLand: null,
            documents: 'Aadhaar Card, Land Records, Photo',
            applicationProcess: 'Apply at any commercial or rural bank',
            officialLink: 'https://www.myscheme.gov.in/schemes/kcc',
            deadline: 'Ongoing',
            type: 'central'
        },
        {
            id: 'pm_kusum',
            name: 'PM-KUSUM (Solar Scheme)',
            nameLocal: 'పీఎం-కుసుమ్ (సౌర విద్యుత్)',
            category: 'Subsidy',
            benefits: '30%–50% subsidy on solar equipment/pumps. Sell surplus electricity for extra income.',
            eligibility: 'Farmers with land for solar installation',
            minLand: 0.5,
            maxLand: null,
            documents: 'Aadhaar, Land Records, Electricity Bill',
            applicationProcess: 'Apply via State Renewable Energy Agency',
            officialLink: 'https://pmkusum.mnre.gov.in/',
            deadline: 'Ongoing',
            type: 'central'
        },
        {
            id: 'aif',
            name: 'AIF (Agriculture Infrastructure Fund)',
            nameLocal: 'వ్యవసాయ మౌలిక సదుపాయాల నిధి',
            category: 'Infrastructure',
            benefits: 'Loans up to ₹2 crore with 3% interest subsidy for warehouses, cold storage.',
            eligibility: 'Farmers, FPOs, Agri-entrepreneurs',
            minLand: 0,
            maxLand: null,
            documents: 'Project Report, KYC Documents, Land Details',
            applicationProcess: 'Online portal application',
            officialLink: 'https://agriinfra.dac.gov.in/',
            deadline: 'Ongoing',
            type: 'central'
        },
        {
            id: 'pm_kisan_maandhan',
            name: 'PM-Kisan Maandhan Yojana',
            nameLocal: 'పీఎం-కిసాన్ మాన్ ధన్ యోజన',
            category: 'Pension',
            benefits: '₹3,000 per month pension after age 60.',
            eligibility: 'Small & marginal farmers (18–40 years)',
            minLand: 0,
            maxLand: 2,
            documents: 'Aadhaar, Bank Account, Age Proof',
            applicationProcess: 'Enrollment via CSC centers',
            officialLink: 'https://maandhan.in/',
            deadline: 'Ongoing',
            type: 'central'
        },
        {
            id: 'soil_health_card',
            name: 'Soil Health Card Scheme',
            nameLocal: 'మట్టి ఆరోగ్య కార్డు పథకం',
            category: 'Soil Testing',
            benefits: 'Free soil testing, nutrient status & fertilizer recommendations.',
            eligibility: 'All farmers',
            minLand: 0,
            maxLand: null,
            documents: 'Land Records, Aadhaar Card',
            applicationProcess: 'Contact local agriculture office',
            officialLink: 'https://soilhealth.dac.gov.in/',
            deadline: 'Ongoing',
            type: 'central'
        }
    ],
    states: [
        {
            id: 'rythu_bandhu',
            name: 'Rythu Bandhu (Telangana)',
            nameLocal: 'రైతు బంధు',
            category: 'Investment Support',
            benefits: '₹5,000 per acre per season as direct investment support',
            eligibility: 'Land-owning farmers of Telangana',
            minLand: 0,
            maxLand: null,
            documents: 'Land Records (Pattadar Passbook), Aadhaar, Bank Account',
            applicationProcess: 'Automatic enrollment based on land records',
            officialLink: 'https://rythubandhu.telangana.gov.in/',
            deadline: 'Ongoing',
            type: 'state',
            state: 'Telangana'
        },
        {
            id: 'rythu_bima',
            name: 'Rythu Bima (Telangana)',
            nameLocal: 'రైతు బీమా',
            category: 'Life Insurance',
            benefits: '₹5 lakhs life insurance cover for farmers (18-59 years). Zero premium',
            eligibility: 'Farmers aged 18-59 in Telangana',
            minLand: 0,
            maxLand: null,
            documents: 'Rythu Bandhu Enrollment, Aadhaar',
            applicationProcess: 'Automatic enrollment',
            officialLink: 'https://rythubandhu.telangana.gov.in/',
            deadline: 'Ongoing',
            type: 'state',
            state: 'Telangana'
        },
        {
            id: 'annadata_sukhibhava',
            name: 'Annadata Sukhibhava (Andhra Pradesh)',
            nameLocal: 'అన్నదాత సుఖీభవ',
            category: 'Financial Support',
            benefits: '₹20,000 per year assistance (includes PM-KISAN)',
            eligibility: 'Farmers resident of Andhra Pradesh',
            minLand: 0,
            maxLand: null,
            documents: 'Aadhaar, Land Records, Bank Account',
            applicationProcess: 'State agriculture portal',
            officialLink: 'https://annadathasukhibhava.ap.gov.in/',
            deadline: 'Ongoing',
            type: 'state',
            state: 'Andhra Pradesh'
        },
        {
            id: 'namo_shetkari',
            name: 'Namo Shetkari Mahasanman (Maharashtra)',
            nameLocal: 'నమో షెత్కారీ మహాసన్మాన్',
            category: 'Financial Support',
            benefits: '₹6,000 per year direct assistance (similar to PM-KISAN)',
            eligibility: 'Landholding farmers in Maharashtra',
            minLand: 0,
            maxLand: null,
            documents: 'Aadhaar, Land Records, Bank Account',
            applicationProcess: 'Registration via state portal',
            officialLink: 'https://mahabhulekh.maharashtra.gov.in/',
            deadline: 'Ongoing',
            type: 'state',
            state: 'Maharashtra'
        }
    ]
};

db.serialize(() => {
    // Create Schemes Table
    db.run(`CREATE TABLE IF NOT EXISTS schemes (
        id TEXT PRIMARY KEY,
        name TEXT,
        nameLocal TEXT,
        category TEXT,
        benefits TEXT,
        eligibility TEXT,
        minLand REAL,
        maxLand TEXT,
        documents TEXT,
        applicationProcess TEXT,
        officialLink TEXT,
        deadline TEXT,
        type TEXT
    )`);

    // Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        username TEXT,
        email TEXT,
        state TEXT,
        land_size REAL,
        primary_crop TEXT,
        social_category TEXT,
        last_updated DATETIME
    )`);

    // Seed Schemes
    const stmt = db.prepare(`INSERT OR REPLACE INTO schemes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);

    GOVERNMENT_SCHEMES_DATA.central.forEach(s => {
        stmt.run(s.id, s.name, s.nameLocal, s.category, s.benefits, s.eligibility, s.minLand, s.maxLand, s.documents, s.applicationProcess, s.officialLink, s.deadline, s.type);
    });

    GOVERNMENT_SCHEMES_DATA.states.forEach(s => {
        stmt.run(s.id, s.name, s.nameLocal, s.category, s.benefits, s.eligibility, s.minLand, s.maxLand, s.documents, s.applicationProcess, s.officialLink, s.deadline, s.type);
    });

    stmt.finalize();

    console.log("Database initialized and seeded successfully.");
});

db.close();
