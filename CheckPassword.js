import { sha1 } from "./crypto.js";

document.addEventListener("DOMContentLoaded", () => {
    const checkBtn = document.getElementById("checkBtn");
    const checkPasswordPage = document.getElementById("check");
    const resultDisplay = document.getElementById("checkResult");
    const passwordInput = document.getElementById("passwordInput");

    if (checkBtn) {
        checkBtn.addEventListener("click", checkPassword);
    }

    // Function to reset the check password input and result
    function resetCheckPasswordPage() {
        if (checkPasswordPage.style.display !== "none") {
            resultDisplay.textContent = "";
            resultDisplay.style.color = "";
            passwordInput.value = "";
        }
    }

    // Listen for navigation clicks
    document.querySelectorAll("nav a").forEach((navLink) => {
        navLink.addEventListener("click", resetCheckPasswordPage);
    });
});

// Function to check password in HIBP API
async function checkPassword() {
    const passwordInput = document.getElementById("passwordInput").value;
    const resultDisplay = document.getElementById("checkResult");

    if (!passwordInput) {
        resultDisplay.textContent = "Please enter a password.";
        resultDisplay.style.color = "red";
        return;
    }

    const hash = await sha1(passwordInput);
    const hashPrefix = hash.substring(0, 5);
    const hashSuffix = hash.substring(5);

    try {
        const response = await fetch(
            `https://api.pwnedpasswords.com/range/${hashPrefix}`
        );
        const data = await response.text();

        const leakedPasswords = data
            .split("\n")
            .map((entry) => entry.split(":"));
        const found = leakedPasswords.find(([suffix]) => suffix === hashSuffix);

        if (found) {
            resultDisplay.textContent = `⚠️ This password has been leaked ${found[1]} times! Consider changing it.`;
            resultDisplay.style.color = "red";
        } else {
            resultDisplay.textContent =
                "✅ This password is safe and has not been leaked.";
            resultDisplay.style.color = "green";
        }
    } catch (error) {
        resultDisplay.textContent =
            "Error checking password. Please try again.";
        resultDisplay.style.color = "red";
        console.error("Error fetching HIBP data:", error);
    }
}
