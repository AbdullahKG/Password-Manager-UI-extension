const crypto = require("./crypto");

document.addEventListener("DOMContentLoaded", () => {
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
            : chrome.storage.local;

    // Function to get token from storage
    function getStoredToken() {
        return new Promise((resolve) => {
            storage.get("jwt_token", (result) => resolve(result.jwt_token));
        });
    }

    function getStoredUserName() {
        return new Promise((resolve) => {
            storage.get("username", (result) => resolve(result.username));
        });
    }

    let popupContainer;

    function detectSignupForm() {
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
        const emailField = document.querySelector(emailSelectors.join(", "));
        const passwordField = document.querySelector(
            passwordSelectors.join(", ")
        );

        return { usernameField, emailField, passwordField };
    }

    function createSignupPopup(username, email, password, referenceField) {
        removePopup();

        popupContainer = document.createElement("div");
        popupContainer.classList.add("password-manager-popup");

        const message = document.createElement("div");
        message.textContent = "Save credentials?";
        message.classList.add("popup-message");

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.classList.add("popup-button");
        saveButton.addEventListener("click", () => {
            sendSignupData(username, email, password);
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
    }

    function removePopup() {
        if (popupContainer) {
            popupContainer.remove();
            popupContainer = null;
        }
    }

    function positionPopup(referenceField) {
        if (!popupContainer || !referenceField) return;

        const rect = referenceField.getBoundingClientRect();
        popupContainer.style.top = `${window.scrollY + rect.top + 3 - 10}px`;
        popupContainer.style.left = `${
            window.scrollX + rect.left + 900 - 414
        }px`;
    }

    async function sendSignupData(username, email, password) {
        const token = await getStoredToken();
        const userName = await getStoredUserName();
        if (!email || !password) return;

        const site = window.location.hostname;

        const encryptPassword = await crypto.encryptData(userName, password);

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
                if (response && response.success) {
                    console.log("Signup data sent successfully.");
                } else {
                    console.error("Failed to send signup data.");
                }
            }
        );
    }

    function setupSignupPopup() {
        const { usernameField, emailField, passwordField } = detectSignupForm();
        if (!emailField || !passwordField) return;

        passwordField.addEventListener("blur", () => {
            createSignupPopup(
                usernameField ? usernameField.value : "",
                emailField.value,
                passwordField.value,
                emailField || usernameField // Position near email or username
            );
        });
    }

    setupSignupPopup();
});
