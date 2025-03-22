import { decryptData } from "./crypto.js";

document.addEventListener("DOMContentLoaded", () => {
    const passwordList = document.getElementById("passwordList");
    const searchInput = document.getElementById("searchInput");

    const storage =
        typeof browser !== "undefined"
            ? browser.storage.local
            : chrome.storage.local;

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

    async function fetchPasswords() {
        const token = await getStoredToken();
        if (!token) {
            console.warn("No token found in storage");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/passwords", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            displayPasswords(data);
        } catch (error) {
            console.error("Error fetching passwords:", error);
        }
    }

    async function displayPasswords(passwords) {
        const userName = await getStoredUserName();
        passwordList.innerHTML = "";

        for (const item of passwords) {
            try {
                const decryptedPassword = await decryptData(
                    userName,
                    item.sitePassword
                );

                const div = document.createElement("div");
                div.classList.add("password-item");

                div.innerHTML = `
                    <div>
                        <strong>${item.siteName}</strong> <br>
                        <span class="site-email">${item.siteEmail}</span> <br>
                        <span class="decrypted-password">${decryptedPassword}</span>
                    </div>
                    <button class="delete-btn" data-id="${item.siteName}">Delete</button>`;

                passwordList.appendChild(div);
            } catch (error) {
                console.error(
                    `Error decrypting password for ${item.siteName}:`,
                    error
                );
            }
        }

        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const parentDiv = button.closest(".password-item");
                const siteName = parentDiv.querySelector("strong").innerText;
                const siteEmail =
                    parentDiv.querySelector(".site-email").innerText;

                console.log(siteEmail);
                deletePassword(siteName, siteEmail);
            });
        });

        // Search functionality
        searchInput.addEventListener("input", (e) => {
            const searchValue = e.target.value.toLowerCase();
            const items = document.querySelectorAll(".password-item");
            items.forEach((item) => {
                const siteName = item
                    .querySelector("strong")
                    .innerText.toLowerCase();
                item.style.display = siteName.includes(searchValue)
                    ? "flex"
                    : "none";
            });
        });
    }

    // Delete password
    async function deletePassword(siteName, siteEmail) {
        const token = await getStoredToken();
        if (!token) {
            console.warn("No token found in storage");
            return;
        }

        if (confirm("Are you sure you want to delete this password?")) {
            try {
                await fetch(
                    `http://localhost:3000/passwords/${siteName}/${siteEmail}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                fetchPasswords();
            } catch (error) {
                console.error("Error deleting password:", error);
            }
        }
    }

    fetchPasswords();
});
