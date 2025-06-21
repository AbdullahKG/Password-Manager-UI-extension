const runtime = typeof browser !== "undefined" ? browser : chrome;

runtime.runtime.onInstalled.addListener(() => {
    console.log("Password Manager Extension Installed!");
});

runtime.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            if (!request.action) {
                throw new Error("Invalid request: Action is missing.");
            }

            if (request.action === "fetchData") {
                if (!request.token || !request.site) {
                    throw new Error(
                        "Missing required parameters for fetchData."
                    );
                }

                const response = await fetch(
                    `http://localhost:3000/passwords/${encodeURIComponent(
                        request.site
                    )}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${request.token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Server error: ${response.status} ${response.statusText}`
                    );
                }

                const data = await response.json();
                sendResponse({ success: true, data });
            } else if (request.action === "saveCredentials") {
                if (
                    !request.token ||
                    !request.site ||
                    !request.email ||
                    !request.password
                ) {
                    throw new Error(
                        "Missing required parameters for saveCredentials."
                    );
                }

                const response = await fetch(
                    "http://localhost:3000/passwords",
                    {
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
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Server error: ${response.status} ${response.statusText}`
                    );
                }

                await response.json();
                sendResponse({
                    success: true,
                    message: "Credentials saved successfully.",
                });
            } else if (request.action === "updateCredentials") {
                if (
                    !request.token ||
                    !request.site ||
                    !request.email ||
                    !request.password
                ) {
                    throw new Error(
                        "Missing required parameters for updateCredentials."
                    );
                }

                const response = await fetch(
                    "http://localhost:3000/passwords",
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${request.token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            siteName: request.site,
                            siteEmail: request.email,
                            newPassword: request.password,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Server error: ${response.status} ${response.statusText}`
                    );
                }

                await response.json();
                sendResponse({
                    success: true,
                    message: "Credentials updated successfully.",
                });
            } else {
                throw new Error("Unknown action.");
            }
        } catch (error) {
            console.error("Error handling message:", error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    return true; // Keeps the message channel open for async responses.
});
