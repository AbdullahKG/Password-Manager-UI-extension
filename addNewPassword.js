import { encryptData } from "./crypto.js";

document.addEventListener("DOMContentLoaded", () => {
    const storage =
        typeof browser !== "undefined"
            ? browser.storage.local
            : chrome.storage.local;

    async function getStoredToken() {
        return new Promise((resolve) => {
            storage.get("jwt_token", (result) => resolve(result.jwt_token));
        });
    }

    function getStoredUserName() {
        return new Promise((resolve) => {
            storage.get("username", (result) => resolve(result.username));
        });
    }

    async function encryptPassword(password) {
        const userName = await getStoredUserName();
        return encryptData(userName, password); // Encrypt and return result
    }

    document
        .getElementById("newPasswordBtn")
        .addEventListener("click", function () {
            document.getElementById("passwords").style.display = "none";
            document.getElementById("newPasswordPage").style.display = "block";
        });

    document
        .getElementById("createNewBtn")
        .addEventListener("click", async function () {
            // Make event handler async
            const siteName = document.getElementById("siteName").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!siteName || !email || !password) {
                alert("Please fill in all fields.");
                return;
            }

            try {
                const encryptedPassword = await encryptPassword(password); // Encrypt the password
                const token = await getStoredToken(); // Get token

                // Send encrypted password to the background script
                chrome.runtime.sendMessage(
                    {
                        action: "saveCredentials",
                        site: siteName,
                        email,
                        password: encryptedPassword, // Use encrypted password
                        token,
                    },
                    (response) => {
                        if (response && response.success) {
                            alert("Credentials saved successfully!");
                            // Navigate back to Saved Passwords
                            document.getElementById(
                                "newPasswordPage"
                            ).style.display = "none";
                            document.getElementById("passwords").style.display =
                                "block";
                        } else {
                            alert(
                                "Failed to save credentials: " + response.error
                            );
                        }
                    }
                );
            } catch (error) {
                console.error("Encryption failed:", error);
                alert("An error occurred while encrypting the password.");
            }
        });
});
