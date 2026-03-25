importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/img/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
