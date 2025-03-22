document.getElementById("login-button").addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok && data.accessToken) {
        // Use `browser.storage.local` for Firefox, `chrome.storage.local` for Chromium
        const storage =
            typeof browser !== "undefined"
                ? browser.storage.local
                : chrome.storage.local;

        storage.set({ jwt_token: data.accessToken }, () => {
            console.log("Token saved");
        });

        storage.set({ userid: data.userid }, () => {
            console.log("User ID saved");
        });

        storage.set({ username: data.username }, () => {
            console.log("Username saved");
        });

        window.location.href = "vault.html";
    } else {
        alert("Login Failed!");
    }
});
