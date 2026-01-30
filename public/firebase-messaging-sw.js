importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
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
