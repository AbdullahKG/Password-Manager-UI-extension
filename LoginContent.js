const crypto = require("./crypto");

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed.");

    // Inject CSS for pop-up styling
    try {
        console.log("Injecting CSS for pop-up styling...");
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = chrome.runtime.getURL("LoginContent.css");
        document.head.appendChild(link);
    } catch (error) {
        console.error("Error injecting CSS:", error);
    }

    const storage =
        typeof browser !== "undefined"
            ? browser.storage.local
            : chrome.storage.local;
    const site = window.location.hostname;
    let popupContainer;

    async function getStoredToken() {
        try {
            console.log("Fetching stored token...");
            return new Promise((resolve) => {
                storage.get("jwt_token", (result) => {
                    resolve(result.jwt_token || null);
                });
            });
        } catch (error) {
            console.error("Error fetching token:", error);
            return null;
        }
    }

    async function getStoredUserName() {
        try {
            return new Promise((resolve) => {
                storage.get("username", (result) =>
                    resolve(result.username || null)
                );
            });
        } catch (error) {
            console.error("Error fetching username:", error);
            return null;
        }
    }

    function isLoginPage() {
        try {
            const links = document.querySelectorAll("a");
            const resetLinks = Array.from(links).filter((link) => {
                const text = link.innerText.toLowerCase();
                const href = link.href.toLowerCase();

                return (
                    text.includes("forgot your password?") ||
                    text.includes("forget your password?") ||
                    text.includes("reset your password?") ||
                    text.includes("forgot password?") ||
                    text.includes("forget password?") ||
                    text.includes("reset password?") ||
                    text.includes("recover your password") ||
                    href.includes("forgot") ||
                    href.includes("forget") ||
                    href.includes("reset") ||
                    href.includes("recover")
                );
            });

            console.log(
                "Checking if current page is a login page:",
                resetLinks.length > 0 ? "Yes" : "No"
            );
            console.log(resetLinks);
            return resetLinks.length > 0;
        } catch (error) {
            console.error("Error checking login page:", error);
            return false;
        }
    }

    async function fetchStoredEmails() {
        try {
            const token = await getStoredToken();
            if (!token) {
                console.warn("No token found, skipping email fetch.");
                return [];
            }

            console.log("Requesting stored emails from background script...");
            return new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { action: "fetchData", site, token },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Runtime error:",
                                chrome.runtime.lastError
                            );
                            resolve([]);
                            return;
                        }

                        if (response?.success && Array.isArray(response.data)) {
                            const emails = response.data.map(
                                (entry) => entry.siteEmail
                            );
                            console.log("Extracted emails:", emails);
                            resolve(emails);
                        } else {
                            console.warn("No valid email data found.");
                            resolve([]);
                        }
                    }
                );
            });
        } catch (error) {
            console.error("Error fetching stored emails:", error);
            return [];
        }
    }

    function createPopup(inputField, emails) {
        try {
            removePopup();

            popupContainer = document.createElement("div");
            popupContainer.classList.add("password-manager-popup");

            const dropdownContainer = document.createElement("div");
            dropdownContainer.classList.add("dropdown-container");

            if (!emails.length) {
                const noDataMessage = document.createElement("div");
                noDataMessage.classList.add("popup-option");
                noDataMessage.textContent = "No saved emails found";
                dropdownContainer.appendChild(noDataMessage);
            } else {
                emails.forEach((email) => {
                    const optionContainer = document.createElement("div");
                    optionContainer.classList.add("popup-option-container");

                    const siteLabel = document.createElement("div");
                    siteLabel.classList.add("popup-site-label");
                    siteLabel.textContent = `${site}:`;

                    const option = document.createElement("div");
                    option.classList.add("popup-option");
                    option.textContent = email;
                    option.addEventListener("click", () => {
                        console.log("Email selected for autofill:", email);
                        inputField.value = email;
                        autofillPassword(email);
                        removePopup();
                    });

                    optionContainer.appendChild(siteLabel);
                    optionContainer.appendChild(option);
                    dropdownContainer.appendChild(optionContainer);
                });
            }

            popupContainer.appendChild(dropdownContainer);
            document.body.appendChild(popupContainer);
            positionPopup(inputField);
        } catch (error) {
            console.error("Error creating popup:", error);
        }
    }

    function removePopup() {
        try {
            if (popupContainer) {
                console.log("Removing pop-up.");
                popupContainer.remove();
                popupContainer = null;
            }
        } catch (error) {
            console.error("Error removing pop-up:", error);
        }
    }

    function positionPopup(inputField) {
        try {
            const rect = inputField.getBoundingClientRect();
            popupContainer.style.top = `${rect.bottom + window.scrollY + 4}px`;
            popupContainer.style.left = `${rect.left + window.scrollX}px`;
            console.log(
                "Positioning pop-up at:",
                popupContainer.style.top,
                popupContainer.style.left
            );
        } catch (error) {
            console.error("Error positioning pop-up:", error);
        }
    }

    async function autofillPassword(selectedEmail) {
        try {
            console.log("Fetching password for selected email:", selectedEmail);
            const token = await getStoredToken();
            const userName = await getStoredUserName();
            if (!token || !userName) return;

            chrome.runtime.sendMessage(
                { action: "fetchData", site, token },
                async (response) => {
                    if (response?.success && Array.isArray(response.data)) {
                        const entry = response.data.find(
                            (e) => e.siteEmail === selectedEmail
                        );
                        if (entry) {
                            try {
                                console.log(
                                    "Decrypting and autofilling password for:",
                                    selectedEmail
                                );
                                const decrypted = await crypto.decryptData(
                                    userName,
                                    entry.sitePassword
                                );

                                const passwordInput = document.querySelector(
                                    'input[type="password"]'
                                );
                                if (passwordInput) {
                                    passwordInput.value = decrypted;
                                    console.log(
                                        "Password autofilled successfully."
                                    );
                                } else {
                                    console.warn(
                                        "No password input field found."
                                    );
                                }
                            } catch (error) {
                                console.error(
                                    "Error decrypting password:",
                                    error
                                );
                            }
                        } else {
                            console.warn("No matching password entry found.");
                        }
                    }
                }
            );
        } catch (error) {
            console.error("Error autofilling password:", error);
        }
    }

    async function setupLoginPopup() {
        try {
            if (!isLoginPage()) return;
            console.log("Setting up login pop-up...");

            const emailFields = document.querySelectorAll(
                'input[type="email"], input[type="text"]'
            );

            emailFields.forEach((inputField) => {
                inputField.addEventListener("click", async (event) => {
                    console.log("Input field clicked:", inputField);
                    event.stopPropagation();
                    const storedEmails = await fetchStoredEmails();
                    createPopup(inputField, storedEmails);
                });
            });

            document.addEventListener("click", removePopup, { capture: true });
        } catch (error) {
            console.error("Error setting up login pop-up:", error);
        }
    }

    setupLoginPopup();
});
