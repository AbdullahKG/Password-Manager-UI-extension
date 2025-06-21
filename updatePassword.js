import { encryptData } from "./crypto.js";

document.addEventListener("DOMContentLoaded", () => {
    const storage =
        typeof browser !== "undefined"
            ? browser.storage.local
            : chrome.storage.local;

    async function getStoredToken() {
        try {
            return new Promise((resolve, reject) => {
                storage.get("jwt_token", (result) => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Storage error:",
                            chrome.runtime.lastError
                        );
                        reject("Failed to retrieve token.");
                    } else {
                        resolve(result.jwt_token || null);
                    }
                });
            });
        } catch (error) {
            console.error("Error getting token:", error);
            return null;
        }
    }

    async function getStoredUserName() {
        try {
            return new Promise((resolve, reject) => {
                storage.get("username", (result) => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Storage error:",
                            chrome.runtime.lastError
                        );
                        reject("Failed to retrieve username.");
                    } else {
                        resolve(result.username || "defaultUser");
                    }
                });
            });
        } catch (error) {
            console.error("Error getting username:", error);
            return "defaultUser";
        }
    }

    async function encryptPassword(password) {
        try {
            const userName = await getStoredUserName();
            if (!userName)
                throw new Error("Username not found for encryption.");
            return encryptData(userName, password);
        } catch (error) {
            console.error("Encryption failed:", error);
            throw new Error("Password encryption error.");
        }
    }

    document
        .getElementById("updatePasswordBtn")
        .addEventListener("click", function () {
            document.getElementById("passwords").style.display = "none";
            document.getElementById("updatePasswordPage").style.display =
                "block";
        });

    document
        .getElementById("updateBtn")
        .addEventListener("click", async function () {
            const siteName = document.getElementById("SiteName").value.trim();
            const email = document.getElementById("Email").value.trim();
            const password = document.getElementById("Password").value.trim();

            if (!siteName || !email || !password) {
                alert("Please fill in all fields.");
                return;
            }

            try {
                const encryptedPassword = await encryptPassword(password);
                const token = await getStoredToken();

                if (!token) {
                    alert("Authentication token missing. Please log in again.");
                    return;
                }

                chrome.runtime.sendMessage(
                    {
                        action: "updateCredentials",
                        site: siteName,
                        email,
                        password: encryptedPassword,
                        token,
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Message sending error:",
                                chrome.runtime.lastError
                            );
                            alert(
                                "Failed to communicate with the extension background."
                            );
                            return;
                        }

                        if (response && response.success) {
                            alert("Credentials Updated successfully!");
                            document.getElementById(
                                "updatePasswordPage"
                            ).style.display = "none";
                            document.getElementById("passwords").style.display =
                                "block";
                        } else {
                            alert(
                                "Failed to save credentials: " +
                                    (response?.error || "Unknown error")
                            );
                        }
                    }
                );
            } catch (error) {
                console.error("Error during credential saving:", error);
                alert("An unexpected error occurred.");
            }
        });
});
