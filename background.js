const runtime = typeof browser !== "undefined" ? browser : chrome;

runtime.runtime.onInstalled.addListener(() => {
    console.log("Password Manager Extension Installed!");
});

runtime.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchData") {
        fetch(`http://localhost:3000/passwords/${request.site}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${request.token}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) =>
                sendResponse({ success: false, error: error.message })
            );
        return true;
    }
    if (request.action === "saveCredentials") {
        fetch("http://localhost:3000/passwords", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${request.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                siteName: request.site,
                siteEmail: request.email,
                sitePassword: request.password,
            }),
        })
            .then((response) => response.json())
            .then((data) =>
                sendResponse({ success: true, message: "Credentials saved." })
            )
            .catch((error) =>
                sendResponse({ success: false, error: error.message })
            );
        return true;
    }
});
