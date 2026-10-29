
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    getMessaging,
    getToken,
    isSupported
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCI4pL8pfQJh_6hjspgw-19Btdn7dtHLx0",
    authDomain: "fireguard-5b48c.firebaseapp.com",
    projectId: "fireguard-5b48c",
    storageBucket: "fireguard-5b48c.firebasestorage.app",
    messagingSenderId: "582631223976",
    appId: "1:582631223976:web:167a48703115b6dc0a889d",
    measurementId: "G-4PJGR0P7D7"
};

// Paste your Firebase Web Push public key here
const vapidKey = "PASTE_YOUR_PUBLIC_VAPID_KEY_HERE";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const message = document.getElementById("message");

function showMessage(text, isError = true) {
    if (!message) return;

    message.textContent = text;
    message.style.color = isError ? "red" : "green";
}

// =====================================
// FIREBASE CLOUD MESSAGING
// =====================================

async function enablePushNotifications(user) {
    try {
        if (!("Notification" in window)) {
            console.warn("Notifications are not supported by this browser.");
            return;
        }

        if (!(await isSupported())) {
            console.warn("Firebase Messaging is not supported here.");
            return;
        }

        if (Notification.permission !== "granted") {
            console.warn("Notification permission was not granted.");
            return;
        }

        if (
            !vapidKey ||
            vapidKey === "PASTE_YOUR_PUBLIC_VAPID_KEY_HERE"
        ) {
            console.warn("Add your Firebase Web Push public key first.");
            return;
        }

        // Register the background notification service worker
        const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
        );

        await navigator.serviceWorker.ready;

        const messaging = getMessaging(app);

        // Get this browser's FCM registration token
        const token = await getToken(messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration
        });

        if (!token) {
            console.warn("Firebase did not return an FCM token.");
            return;
        }

        // Save the token to the signed-in user's profile.
        // Existing profile fields are preserved.
        await setDoc(
            doc(db, "users", user.uid),
            {
                fcmToken: token,
                fcmTokenUpdatedAt: serverTimestamp()
            },
            { merge: true }
        );

        console.log("FireGuard push notification registration succeeded.");
        showMessage("Login successful! Notifications are enabled.", false);

    } catch (error) {
        // A notification setup problem should not block login.
        console.error("Push notification setup failed:", error);
        showMessage(
            "Login succeeded, but notifications could not be enabled. Check browser permission and Firebase settings.",
            true
        );
    }
}

// =====================================
// RESIDENT REGISTRATION
// =====================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value;
        const building = document.getElementById("regBuilding").value.trim();
        const floor = document.getElementById("regFloor").value;
        const flat = document.getElementById("regFlat").value.trim();

        const registerButton =
            this.querySelector('button[type="submit"]');

        try {
            registerButton.disabled = true;
            showMessage("Creating your resident account...", false);

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            try {
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: email,
                    role: "resident",
                    building: building,
                    floor: Number(floor),
                    flat: flat,
                    createdAt: serverTimestamp()
                });
            } catch (profileError) {
                await signOut(auth);

                throw new Error(
                    "Your authentication account was created, but its profile could not be saved. Contact the administrator before retrying."
                );
            }

            showMessage(
                "Account created successfully! You can now log in as a Resident.",
                false
            );

            document.getElementById("registerForm").reset();
            document.getElementById("registerSection").hidden = true;
            document.getElementById("loginSection").hidden = false;

            document.getElementById("email").value = email;
            document.getElementById("role").value = "resident";
            document.getElementById("password").value = "";

        } catch (error) {
            console.error("Registration error:", error);

            let errorMessage = error.message;

            if (error.code === "auth/email-already-in-use") {
                errorMessage = "This email is already registered. Please log in.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Please enter a valid email address.";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "Please use a stronger password with at least 6 characters.";
            } else if (error.code === "auth/network-request-failed") {
                errorMessage = "Network error. Check your internet connection.";
            } else if (
                error.code === "permission-denied" ||
                error.code === "firestore/permission-denied"
            ) {
                errorMessage =
                    "Permission denied while saving your profile. Check Firestore security rules.";
            }

            showMessage(errorMessage);
        } finally {
            if (registerButton) registerButton.disabled = false;
        }
    });
}

// =====================================
// LOGIN — ADMIN AND RESIDENT
// =====================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const selectedRole = document.getElementById("role").value;

        const loginButton =
            this.querySelector('button[type="submit"]');

        try {
            loginButton.disabled = true;
            showMessage("Logging in...", false);

            // Ask permission during the login button interaction,
            // before awaiting the authentication network request.
            if (
                "Notification" in window &&
                Notification.permission === "default"
            ) {
                try {
                    await Notification.requestPermission();
                } catch (permissionError) {
                    console.warn(
                        "Notification permission request failed:",
                        permissionError
                    );
                }
            }

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (!userDoc.exists()) {
                await signOut(auth);
                showMessage(
                    "User profile not found. Please contact the administrator."
                );
                return;
            }

            const userData = userDoc.data();
            const actualRole = userData.role;

            if (selectedRole !== actualRole) {
                await signOut(auth);
                showMessage(
                    "Wrong role selected. Your account is " +
                    actualRole +
                    "."
                );
                return;
            }

            if (
                actualRole !== "admin" &&
                actualRole !== "resident"
            ) {
                await signOut(auth);
                showMessage(
                    "Invalid role. Please contact the administrator."
                );
                return;
            }

            // Try to enable push notifications.
            // Failure here must not prevent dashboard access.
            await enablePushNotifications(user);

            // Open the correct dashboard
            if (actualRole === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "resident.html";
            }

        } catch (error) {
            console.error("Login error:", error);

            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password"
            ) {
                showMessage("Invalid email or password.");
            } else {
                showMessage(
                    "Login failed. Check your connection and try again."
                );
            }
        } finally {
            if (loginButton) loginButton.disabled = false;
        }
    });
}
