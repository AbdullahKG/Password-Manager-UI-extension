import { sha1 } from "./crypto.js";

document.addEventListener("DOMContentLoaded", () => {
    const checkBtn = document.getElementById("checkBtn");
    const checkPasswordPage = document.getElementById("check");
    const resultDisplay = document.getElementById("checkResult");
    const passwordInput = document.getElementById("passwordInput");

    if (checkBtn) {
        checkBtn.addEventListener("click", checkPassword);
    }

    function resetCheckPasswordPage() {
        if (checkPasswordPage && checkPasswordPage.style.display !== "none") {
            if (resultDisplay) {
                resultDisplay.textContent = "";
                resultDisplay.style.color = "";
            }
            if (passwordInput) {
                passwordInput.value = "";
            }
        }
    }

    document.querySelectorAll("nav a").forEach((navLink) => {
        navLink.addEventListener("click", resetCheckPasswordPage);
    });
});

// Function to check password in HIBP API
async function checkPassword() {
    const passwordInputField = document.getElementById("passwordInput");
    const resultDisplay = document.getElementById("checkResult");

    if (!passwordInputField || !resultDisplay) {
        console.error("Required elements not found.");
        return;
    }

    const password = passwordInputField.value.trim();

    if (!password) {
        resultDisplay.textContent = "Please enter a password.";
        resultDisplay.style.color = "red";
        return;
    }

    try {
        const hash = await sha1(password);
        const hashPrefix = hash.substring(0, 5);
        const hashSuffix = hash.substring(5);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

        const response = await fetch(
            `https://api.pwnedpasswords.com/range/${hashPrefix}`,
            { signal: controller.signal }
        );

        clearTimeout(timeoutId); // Clear timeout on successful response

        if (!response.ok) {
            throw new Error(
                `API error: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.text();

        const leakedPasswords = data
            .split("\n")
            .map((entry) => entry.split(":"));

        const found = leakedPasswords.find(
            ([suffix]) => suffix.toUpperCase() === hashSuffix.toUpperCase()
        );

        if (found) {
            resultDisplay.textContent = `⚠️ This password has been leaked ${found[1]} times! Consider changing it.`;
            resultDisplay.style.color = "red";
        } else {
            resultDisplay.textContent =
                "✅ This password is safe and has not been leaked.";
            resultDisplay.style.color = "green";
        }
    } catch (error) {
        if (error.name === "AbortError") {
            resultDisplay.textContent = "Request timed out. Please try again.";
        } else {
            resultDisplay.textContent =
                "Error checking password. Please try again.";
        }
        resultDisplay.style.color = "red";
        console.error("Error fetching HIBP data:", error);
    }
}
