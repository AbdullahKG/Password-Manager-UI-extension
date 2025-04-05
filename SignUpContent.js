const crypto = require("./crypto");

document.addEventListener("DOMContentLoaded", () => {
    try {
        console.log("Signup script loaded.");

        // Inject external CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("SignUpContent.css");
        document.head.appendChild(link);

        // Determine storage API (Firefox uses `browser`, Chromium uses `chrome`)
        const storage =
            typeof browser !== "undefined"
                ? browser.storage.local
                : chrome?.storage?.local;

        if (!storage) {
            console.error("Storage API is unavailable.");
            return;
        }

        // Function to get token from storage
        function getStoredToken() {
            return new Promise((resolve, reject) => {
                try {
                    storage.get("jwt_token", (result) => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Error fetching token:",
                                chrome.runtime.lastError
                            );
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(result.jwt_token || null);
                    });
                } catch (error) {
                    console.error("Failed to retrieve stored token:", error);
                    reject(error);
                }
            });
        }

        function getStoredUserName() {
            return new Promise((resolve, reject) => {
                try {
                    storage.get("username", (result) => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Error fetching username:",
                                chrome.runtime.lastError
                            );
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(result.username || null);
                    });
                } catch (error) {
                    console.error("Failed to retrieve stored username:", error);
                    reject(error);
                }
            });
        }

        let popupContainer = null;

        function detectSignupForm() {
            try {
                const usernameSelectors = [
                    'input[type="text"]',
                    'input[name*="user"]',
                    'input[id*="user"]',
                    'input[placeholder*="user"]',
                ];

                const emailSelectors = [
                    'input[type="email"]',
                    'input[name*="email"]',
                    'input[id*="email"]',
                    'input[placeholder*="email"]',
                ];

                const passwordSelectors = [
                    'input[type="password"]',
                    'input[name*="pass"]',
                    'input[id*="pass"]',
                    'input[placeholder*="password"]',
                ];

                const usernameField = document.querySelector(
                    usernameSelectors.join(", ")
                );
                const emailField = document.querySelector(
                    emailSelectors.join(", ")
                );
                const passwordField = document.querySelector(
                    passwordSelectors.join(", ")
                );

                return { usernameField, emailField, passwordField };
            } catch (error) {
                console.error("Error detecting signup form fields:", error);
                return {
                    usernameField: null,
                    emailField: null,
                    passwordField: null,
                };
            }
        }

        function createSignupPopup(username, email, password, referenceField) {
            try {
                removePopup();

                if (!email || !password) {
                    console.warn(
                        "Missing email or password, skipping popup creation."
                    );
                    return;
                }

                popupContainer = document.createElement("div");
                popupContainer.classList.add("password-manager-popup");

                const message = document.createElement("div");
                message.textContent = "Save credentials?";
                message.classList.add("popup-message");

                const saveButton = document.createElement("button");
                saveButton.textContent = "Save";
                saveButton.classList.add("popup-button");
                saveButton.addEventListener("click", async () => {
                    await sendSignupData(username, email, password);
                    removePopup();
                });

                const cancelButton = document.createElement("button");
                cancelButton.textContent = "Cancel";
                cancelButton.classList.add("popup-cancel-button");
                cancelButton.addEventListener("click", removePopup);

                popupContainer.appendChild(message);
                popupContainer.appendChild(saveButton);
                popupContainer.appendChild(cancelButton);
                document.body.appendChild(popupContainer);

                positionPopup(referenceField);
            } catch (error) {
                console.error("Error creating signup popup:", error);
            }
        }

        function removePopup() {
            if (popupContainer) {
                popupContainer.remove();
                popupContainer = null;
            }
        }

        function positionPopup(referenceField) {
            try {
                if (!popupContainer || !referenceField) return;

                const rect = referenceField.getBoundingClientRect();
                popupContainer.style.top = `${
                    window.scrollY + rect.top + 3 - 10
                }px`;
                popupContainer.style.left = `${
                    window.scrollX + rect.left + 900 - 414
                }px`;
            } catch (error) {
                console.error("Error positioning signup popup:", error);
            }
        }

        async function sendSignupData(username, email, password) {
            try {
                const token = await getStoredToken();
                const userName = await getStoredUserName();

                if (!email || !password) {
                    console.warn(
                        "Email or password missing. Skipping data submission."
                    );
                    return;
                }

                const site = window.location.hostname;

                if (!crypto?.encryptData) {
                    console.error(
                        "Crypto module is missing or not properly loaded."
                    );
                    return;
                }

                const encryptPassword = await crypto.encryptData(
                    userName,
                    password
                );

                if (!chrome.runtime?.sendMessage) {
                    console.error("Chrome messaging API is unavailable.");
                    return;
                }

                chrome.runtime.sendMessage(
                    {
                        action: "saveCredentials",
                        site,
                        username,
                        email,
                        password: encryptPassword,
                        token,
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Error sending signup data:",
                                chrome.runtime.lastError
                            );
                            return;
                        }

                        if (response && response.success) {
                            console.log("Signup data sent successfully.");
                        } else {
                            console.error("Failed to send signup data.");
                        }
                    }
                );
            } catch (error) {
                console.error("Error in sendSignupData:", error);
            }
        }

        function setupSignupPopup() {
            try {
                const { usernameField, emailField, passwordField } =
                    detectSignupForm();

                if (!emailField || !passwordField || !usernameField) {
                    console.warn(
                        "Signup form fields not detected. Popup setup aborted."
                    );
                    return;
                }

                passwordField.addEventListener("blur", () => {
                    createSignupPopup(
                        usernameField ? usernameField.value : "",
                        emailField.value,
                        passwordField.value,
                        emailField || usernameField // Position near email or username
                    );
                });
            } catch (error) {
                console.error("Error setting up signup popup:", error);
            }
        }

        setupSignupPopup();
    } catch (error) {
        console.error("Error initializing signup script:", error);
    }
});
