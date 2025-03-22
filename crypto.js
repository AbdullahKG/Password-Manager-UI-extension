const FIXED_SALT = new Uint8Array([
    212, 98, 47, 55, 162, 198, 11, 93, 77, 204, 145, 23, 88, 39, 254, 102,
]);

// Convert Uint8Array to Base64
function uint8ArrayToBase64(uint8Array) {
    return btoa(String.fromCharCode.apply(null, uint8Array));
}

// Convert Base64 to Uint8Array
function base64ToUint8Array(base64String) {
    return new Uint8Array(
        atob(base64String)
            .split("")
            .map((char) => char.charCodeAt(0))
    );
}

// Key Derivation Function
const deriveKey = async (password) => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
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
};

// Encrypt Function
export async function encryptData(master, text) {
    const key = await deriveKey(master);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate IV

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(text)
    );

    const encryptedBytes = new Uint8Array(iv.length + encrypted.byteLength);
    encryptedBytes.set(iv, 0);
    encryptedBytes.set(new Uint8Array(encrypted), iv.length);

    const base64Encrypted = uint8ArrayToBase64(encryptedBytes);

    return base64Encrypted;
}

// Decrypt Function
export async function decryptData(master, encryptedBase64) {
    const key = await deriveKey(master);

    // Convert Base64 to Uint8Array
    const encryptedBytes = base64ToUint8Array(encryptedBase64);

    // Extract IV
    const iv = encryptedBytes.slice(0, 12);
    const encryptedData = encryptedBytes.slice(12);

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encryptedData
        );

        const decryptedText = new TextDecoder().decode(
            new Uint8Array(decrypted)
        );

        return decryptedText;
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}

export async function sha1(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}
