const crypto = require("./crypto");

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed.");

    // Inject CSS for pop-up styling
    console.log("Injecting CSS for pop-up styling...");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = chrome.runtime.getURL("LoginContent.css");
    document.head.appendChild(link);

    const storage =
        typeof browser !== "undefined"
            ? browser.storage.local
            : chrome.storage.local;
    const site = window.location.hostname;
    let popupContainer;

    async function getStoredToken() {
        console.log("Fetching stored token...");
        return new Promise((resolve) => {
            storage.get("jwt_token", (result) => {
                resolve(result.jwt_token);
            });
        });
    }

    function getStoredUserName() {
        return new Promise((resolve) => {
            storage.get("username", (result) => resolve(result.username));
        });
    }

    function isLoginPage() {
        const emailSelectors = [
            'input[type="email"]',
            'input[type="text"][name*="email" i]',
            'input[type="text"][id*="email" i]',
            'input[type="text"][class*="email" i]',
            'input[placeholder*="email" i]',
            'input[aria-label*="email" i]',
            'input[type="text"][name*="user" i]',
            'input[type="text"][id*="user" i]',
            'input[type="text"][class*="user" i]',
            'input[placeholder*="username" i]',
            'input[aria-label*="username" i]',
        ];

        const passwordSelectors = [
            'input[type="password"]',
            'input[type="text"][name*="password" i]',
            'input[type="text"][id*="password" i]',
            'input[type="text"][class*="password" i]',
            'input[placeholder*="password" i]',
            'input[aria-label*="password" i]',
        ];

        const hasEmail = emailSelectors.some((selector) =>
            document.querySelector(selector)
        );
        const hasPassword = passwordSelectors.some((selector) =>
            document.querySelector(selector)
        );

        console.log(
            "Checking if current page is a login page:",
            hasEmail && hasPassword ? "Yes" : "No"
        );
        return hasEmail && hasPassword;
    }

    async function fetchStoredEmails() {
        const token = await getStoredToken();
        if (!token) {
            console.log("No token found, skipping email fetch.");
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

                    if (response.success && Array.isArray(response.data)) {
                        const emails = response.data.map(
                            (entry) => entry.siteEmail
                        );
                        console.log("Extracted emails:", emails);
                        resolve(emails);
                    } else {
                        console.log("No valid email data found.");
                        resolve([]);
                    }
                }
            );
        });
    }

    function createPopup(inputField, emails) {
        removePopup();

        // Create the main pop-up container
        popupContainer = document.createElement("div");
        popupContainer.classList.add("password-manager-popup");

        // Create the scrollable container
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

        // Append the scrollable container inside the popup
        popupContainer.appendChild(dropdownContainer);
        document.body.appendChild(popupContainer);
        positionPopup(inputField);
    }

    function removePopup() {
        if (popupContainer) {
            console.log("Removing pop-up.");
            popupContainer.remove();
            popupContainer = null;
        }
    }

    function positionPopup(inputField) {
        const rect = inputField.getBoundingClientRect();
        popupContainer.style.top = `${rect.bottom + window.scrollY + 4}px`;
        popupContainer.style.left = `${rect.left + window.scrollX}px`;
        console.log(
            "Positioning pop-up at:",
            popupContainer.style.top,
            popupContainer.style.left
        );
    }

    async function autofillPassword(selectedEmail) {
        console.log("Fetching password for selected email:", selectedEmail);
        const token = await getStoredToken();
        const userName = await getStoredUserName();
        if (!token) return;

        chrome.runtime.sendMessage(
            { action: "fetchData", site, token },
            async (response) => {
                // Use async callback
                if (response.success && Array.isArray(response.data)) {
                    const entry = response.data.find(
                        (e) => e.siteEmail === selectedEmail
                    );
                    if (entry) {
                        console.log(
                            "Decrypting and autofilling password for:",
                            selectedEmail
                        );
                        const decrypted = await crypto.decryptData(
                            userName,
                            entry.sitePassword
                        );
                        try {
                            const passwordInput = document.querySelector(
                                'input[type="password"]'
                            );
                            if (passwordInput) {
                                passwordInput.value = decrypted;
                                console.log(
                                    "Password autofilled successfully."
                                );
                            }
                        } catch (error) {
                            console.error("Error decrypting password:", error);
                        }
                    } else {
                        console.log("No matching password entry found.");
                    }
                }
            }
        );
    }

    async function setupLoginPopup() {
        if (!isLoginPage()) return;
        console.log("Setting up login pop-up...");
        const emailFields = document.querySelectorAll(
            'input[type="email"], input[type="text"]'
        );
        const storedEmails = await fetchStoredEmails();

        emailFields.forEach((inputField) => {
            inputField.addEventListener("click", (event) => {
                console.log("Input field clicked:", inputField);
                event.stopPropagation();
                createPopup(inputField, storedEmails);
            });
        });

        document.addEventListener("click", removePopup, { capture: true });
    }

    setupLoginPopup();
});
