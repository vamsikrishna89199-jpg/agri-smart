// Firebase Configuration
// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA483NjEi32a7D0X3pHpkrqYxkV_XiW5Eg",
    authDomain: "agrismart-c36de.firebaseapp.com",
    databaseURL: "https://agrismart-c36de-default-rtdb.firebaseio.com",
    projectId: "agrismart-c36de",
    storageBucket: "agrismart-c36de.firebasestorage.app",
    messagingSenderId: "271659192597",
    appId: "1:271659192597:web:9c8ff471d25ecfb11e991c",
    measurementId: "G-6FG1HMW5S2"
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
    if (typeof firebase.messaging.isSupported === 'function') {
        const supportedResult = firebase.messaging.isSupported();
        if (supportedResult instanceof Promise) {
            supportedResult.then(supported => {
                if (supported) window.messaging = firebase.messaging();
            }).catch(() => { /* Silent fallback */ });
        } else if (supportedResult) {
            messaging = firebase.messaging();
        }
    }
} catch (e) {
    // Suppressed: Firebase Messaging not supported in this context
}

// Expose to window for index.html access
window.auth = auth;
window.db = db;
window.storage = storage;
window.messaging = messaging;
