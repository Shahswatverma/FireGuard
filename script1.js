
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Display messages
const message = document.getElementById("message");

function showMessage(text, isError = true) {
    message.textContent = text;
    message.style.color = isError ? "red" : "green";
}

// ===============================
// RESIDENT REGISTRATION
// ===============================

document.getElementById("registerForm").addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value;
        const building = document.getElementById("regBuilding").value.trim();
        const floor = document.getElementById("regFloor").value;
        const flat = document.getElementById("regFlat").value.trim();

        const registerButton = this.querySelector('button[type="submit"]');

        try {
            registerButton.disabled = true;
            showMessage("Creating your resident account...", false);

            // Create account in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            try {
                // Save resident details in Firestore
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
                // Avoid leaving an unregistered account signed in
                await signOut(auth);
                throw new Error(
                    "Your authentication account was created, but your profile could not be saved. " +
                    "Please contact the administrator before trying again."
                );
            }

            showMessage(
                "Account created successfully! You can now log in as a Resident.",
                false
            );

            document.getElementById("registerForm").reset();
            document.getElementById("registerSection").hidden = true;
            document.getElementById("loginSection").hidden = false;

            // Fill in the email and select Resident
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
                errorMessage = "Network error. Please check your internet connection.";
            } else if (error.code === "permission-denied" ||
                       error.code === "firestore/permission-denied") {
                errorMessage =
                    "Permission denied while saving your profile. Please check Firestore security rules.";
            }

            showMessage(errorMessage);
        } finally {
            registerButton.disabled = false;
        }
    }
);

// ===============================
// LOGIN
// ===============================

document.getElementById("loginForm").addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const selectedRole = document.getElementById("role").value;
        const loginButton = this.querySelector('button[type="submit"]');

        try {
            loginButton.disabled = true;
            showMessage("Logging in...", false);

            // Sign in with Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // Find the user's profile in Firestore
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

            // Check selected role
            if (selectedRole !== actualRole) {
                await signOut(auth);
                showMessage(
                    "Wrong role selected. Your account is " + actualRole + "."
                );
                return;
            }

            showMessage("Login successful!", false);

            // Open the correct dashboard
            if (actualRole === "admin") {
                window.location.href = "admin.html";
            } else if (actualRole === "resident") {
                window.location.href = "resident.html";
            } else {
                await signOut(auth);
                showMessage("Invalid role. Please contact the administrator.");
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
                    "Login failed. Please check your connection and try again."
                );
            }
        } finally {
            loginButton.disabled = false;
        }
    }
);
