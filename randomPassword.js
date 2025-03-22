document.addEventListener("DOMContentLoaded", () => {
    // Handle page switching
    document.querySelectorAll("nav a").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const pageId = event.target.getAttribute("data-page");
            showPage(pageId);
        });
    });

    // Handle password generation
    document
        .getElementById("generateBtn")
        .addEventListener("click", generatePassword);
});

function showPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.style.display = "none";
    });
    document.getElementById(pageId).style.display = "block";
}

function generatePassword() {
    const charset =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?/{}[]";
    const passwordLength = 16;
    const randomValues = new Uint32Array(passwordLength);
    window.crypto.getRandomValues(randomValues);

    let password = Array.from(
        randomValues,
        (num) => charset[num % charset.length]
    ).join("");

    document.getElementById("generatedPassword").value = password;
}
