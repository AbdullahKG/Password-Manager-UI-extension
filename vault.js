import { decryptData } from "./crypto.js";

document.addEventListener("DOMContentLoaded", () => {
    const passwordList = document.getElementById("passwordList");
    const searchInput = document.getElementById("searchInput");

    if (!passwordList || !searchInput) {
        console.error("Required DOM elements are missing.");
        return;
    }

    const storage =
        typeof browser !== "undefined"
            ? browser.storage.local
            : chrome.storage.local;

    function getStoredToken() {
        return new Promise((resolve) => {
            try {
                storage.get("jwt_token", (result) => resolve(result.jwt_token));
            } catch (error) {
                console.error("Error retrieving JWT token:", error);
                resolve(null);
            }
        });
    }

    function getStoredUserName() {
        return new Promise((resolve) => {
            try {
                storage.get("username", (result) => resolve(result.username));
            } catch (error) {
                console.error("Error retrieving username:", error);
                resolve(null);
            }
        });
    }

    async function fetchPasswords() {
        const token = await getStoredToken();
        if (!token) {
            console.warn("No token found in storage.");
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

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            displayPasswords(data);
        } catch (error) {
            console.error("Error fetching passwords:", error);
        }
    }

    async function displayPasswords(passwords) {
        const userName = await getStoredUserName();
        if (!userName) {
            console.warn("No username found in storage.");
            return;
        }

        passwordList.innerHTML = "";

        for (const item of passwords) {
            try {
                if (!item.siteName || !item.siteEmail || !item.sitePassword) {
                    console.warn("Skipping incomplete password entry:", item);
                    continue;
                }

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
            button.addEventListener("click", (event) => {
                const parentDiv = event.target.closest(".password-item");
                if (!parentDiv) {
                    console.warn("Could not find the parent password item.");
                    return;
                }

                const siteName = parentDiv.querySelector("strong")?.innerText;
                const siteEmail =
                    parentDiv.querySelector(".site-email")?.innerText;

                if (!siteName || !siteEmail) {
                    console.warn("Site name or email is missing.");
                    return;
                }

                deletePassword(siteName, siteEmail);
            });
        });

        // Search functionality
        searchInput.addEventListener("input", (e) => {
            const searchValue = e.target.value.toLowerCase();
            document.querySelectorAll(".password-item").forEach((item) => {
                const siteName = item
                    .querySelector("strong")
                    ?.innerText.toLowerCase();
                if (siteName) {
                    item.style.display = siteName.includes(searchValue)
                        ? "flex"
                        : "none";
                }
            });
        });
    }

    // Delete password
    async function deletePassword(siteName, siteEmail) {
        const token = await getStoredToken();
        if (!token) {
            console.warn("No token found in storage.");
            return;
        }

        if (!siteName || !siteEmail) {
            console.warn("Missing siteName or siteEmail for deletion.");
            return;
        }

        if (!confirm("Are you sure you want to delete this password?")) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3000/passwords/${encodeURIComponent(
                    siteName
                )}/${encodeURIComponent(siteEmail)}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to delete password. Status: ${response.status}`
                );
            }

            fetchPasswords();
        } catch (error) {
            console.error("Error deleting password:", error);
        }
    }

    fetchPasswords();
});
