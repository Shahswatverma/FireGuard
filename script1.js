import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyCI4pL8pfQJh_6hjspgw-19Btdn7dtHLx0",
    authDomain: "fireguard-5b48c.firebaseapp.com",
    projectId: "fireguard-5b48c",
    storageBucket: "fireguard-5b48c.firebasestorage.app",
    messagingSenderId: "582631223976",
    appId: "1:582631223976:web:167a48703115b6dc0a889d",
    measurementId: "G-4PJGR0P7D7"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


document.getElementById("loginForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Get selected role from dropdown
    const selectedRole = document.getElementById("role").value;

    const message = document.getElementById("message");


    try {

        // Login using Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;


        // Get user information from Firestore
        const userDoc = await getDoc(
            doc(db, "users", user.uid)
        );


        if (!userDoc.exists()) {

            message.textContent = "User data not found.";

            return;
        }


        const userData = userDoc.data();

        const actualRole = userData.role;


        console.log("Selected Role:", selectedRole);
        console.log("Actual Role:", actualRole);


        // Check selected role against Firestore role
        if (selectedRole !== actualRole) {

            message.textContent =
                "Wrong role selected. Your account is " + actualRole + ".";

            return;
        }


        // Login successful
        message.textContent = "Login successful!";


        // Open correct dashboard
        if (actualRole === "admin") {

            window.location.href = "admin.html";

        }

        else if (actualRole === "security") {

            window.location.href = "security.html";

        }

        else if (actualRole === "resident") {

            window.location.href = "resident.html";

        }

        else {

            message.textContent = "Invalid role.";

        }


    } catch (error) {

        console.log(error);

        message.textContent = "Invalid email or password.";

    }

});