// Firebase Configuration
// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCesJt2xAK0JaNkrlk58gm0MdDhyptuGgc",
    authDomain: "agrismart-3a789.firebaseapp.com",
    projectId: "agrismart-3a789",
    storageBucket: "agrismart-3a789.firebasestorage.app",
    messagingSenderId: "989430916342",
    appId: "1:989430916342:web:63cf786e49217af07838d7",
    measurementId: "G-41PRY3N5HL"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
let messaging = null;
try {
    if (firebase.messaging.isSupported()) {
        messaging = firebase.messaging();
    }
} catch (e) {
    console.warn("Firebase Messaging not supported in this context");
}

// Expose to window for index.html access
window.auth = auth;
window.db = db;
window.storage = storage;
window.messaging = messaging;
