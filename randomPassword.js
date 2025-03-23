document.addEventListener("DOMContentLoaded", () => {
    try {
        console.log(
            "DOM fully loaded. Initializing page switching and password generation."
        );

        // Handle page switching
        const navLinks = document.querySelectorAll("nav a");
        if (navLinks.length === 0) {
            console.warn("No navigation links found.");
        } else {
            navLinks.forEach((link) => {
                link.addEventListener("click", (event) => {
                    try {
                        event.preventDefault();
                        const pageId = event.target.getAttribute("data-page");
                        if (!pageId) {
                            console.warn(
                                "No data-page attribute found on clicked link."
                            );
                            return;
                        }
                        showPage(pageId);
                    } catch (error) {
                        console.error("Error handling page switch:", error);
                    }
                });
            });
        }

        // Handle password generation
        const generateBtn = document.getElementById("generateBtn");
        if (!generateBtn) {
            console.warn("Generate button not found.");
        } else {
            generateBtn.addEventListener("click", () => {
                try {
                    generatePassword();
                } catch (error) {
                    console.error("Error generating password:", error);
                }
            });
        }
    } catch (error) {
        console.error("Error initializing DOM event listeners:", error);
    }
});

function showPage(pageId) {
    try {
        console.log(`Switching to page: ${pageId}`);

        const pages = document.querySelectorAll(".page");
        if (pages.length === 0) {
            console.warn("No page elements found.");
            return;
        }

        pages.forEach((page) => {
            page.style.display = "none";
        });

        const targetPage = document.getElementById(pageId);
        if (!targetPage) {
            console.warn(`Page with ID '${pageId}' not found.`);
            return;
        }

        targetPage.style.display = "block";
        console.log(`Successfully switched to page: ${pageId}`);
    } catch (error) {
        console.error("Error switching pages:", error);
    }
}

function generatePassword() {
    try {
        console.log("Generating a secure password...");

        const charset =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?/{}[]";
        const passwordLength = 16;

        if (!window.crypto || !window.crypto.getRandomValues) {
            console.error("Crypto API not supported in this browser.");
            return;
        }

        const randomValues = new Uint32Array(passwordLength);
        window.crypto.getRandomValues(randomValues);

        let password = Array.from(
            randomValues,
            (num) => charset[num % charset.length]
        ).join("");

        const passwordField = document.getElementById("generatedPassword");
        if (!passwordField) {
            console.warn("Generated password field not found.");
            return;
        }

        passwordField.value = password;
        console.log("Password generated successfully.");
    } catch (error) {
        console.error("Error generating password:", error);
    }
}
