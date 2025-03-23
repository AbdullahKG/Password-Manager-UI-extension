const FIXED_SALT = new Uint8Array([
    212, 98, 47, 55, 162, 198, 11, 93, 77, 204, 145, 23, 88, 39, 254, 102,
]);

// Convert Uint8Array to Base64
function uint8ArrayToBase64(uint8Array) {
    return btoa(String.fromCharCode(...uint8Array));
}

// Convert Base64 to Uint8Array
function base64ToUint8Array(base64String) {
    return new Uint8Array(
        atob(base64String)
            .split("")
            .map((char) => char.charCodeAt(0))
    );
}

// Key Derivation Function using PBKDF2
async function deriveKey(password) {
    if (!password) {
        throw new Error("Password cannot be empty.");
    }

    try {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: FIXED_SALT,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    } catch (error) {
        console.error("Key derivation failed:", error);
        throw new Error("Key derivation error.");
    }
}

// Encrypt Function
export async function encryptData(master, text) {
    if (!master || !text) {
        throw new Error("Master password and text cannot be empty.");
    }

    try {
        const key = await deriveKey(master);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate IV

        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv, tagLength: 128 },
            key,
            new TextEncoder().encode(text)
        );

        const encryptedBytes = new Uint8Array(iv.length + encrypted.byteLength);
        encryptedBytes.set(iv, 0);
        encryptedBytes.set(new Uint8Array(encrypted), iv.length);

        return uint8ArrayToBase64(encryptedBytes);
    } catch (error) {
        console.error("Encryption failed:", error);
        throw new Error("Encryption error.");
    }
}

// Decrypt Function
export async function decryptData(master, encryptedBase64) {
    if (!master || !encryptedBase64) {
        throw new Error("Master password and encrypted data cannot be empty.");
    }

    try {
        const key = await deriveKey(master);
        const encryptedBytes = base64ToUint8Array(encryptedBase64);

        if (encryptedBytes.length < 13) {
            throw new Error("Invalid encrypted data.");
        }

        const iv = encryptedBytes.slice(0, 12);
        const encryptedData = encryptedBytes.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv, tagLength: 128 },
            key,
            encryptedData
        );

        return new TextDecoder().decode(new Uint8Array(decrypted));
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}

// SHA-1 Hashing Function
export async function sha1(password) {
    if (!password) {
        throw new Error("Password cannot be empty.");
    }

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-1", data);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
    } catch (error) {
        console.error("SHA-1 hashing failed:", error);
        throw new Error("SHA-1 hashing error.");
    }
}
