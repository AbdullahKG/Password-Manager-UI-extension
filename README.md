## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Installation](#installation)
5. [Usage](#usage)
6. [API](#api)
7. [Security_Features](#security_features)
8. [Project_Structure](#project_structure)

---

## Introduction

A browser extension that provides a secure and easy-to-use interface for managing passwords. This extension integrates with the Password Manager API, allowing users to store, retrieve, and generate strong passwords securely.

---

## Features

-   Secure Password Storage – Store and retrieve passwords safely.
-   Random Password Generator – Generate strong, random passwords.
-   User Authentication – Login and sign up securely.
-   Encrypted Data Handling – Uses cryptographic methods for security.
-   Modern UI – Built with HTML, CSS, and JavaScript.
-   Built-in random password generator
-   Built-in password breached checker
-   API communication with JWT-based authentication
-   Firefox extension support

--

## Technologies Used

-   JavaScript (ES6+)
-   HTML5 & CSS3
-   Webpack
-   Crypto (Web Crypto API)
-   Firefox WebExtensions API

--

## Installation

1. Prerequisites

    Node.js and npm

    Firefox (latest version)

    Your Password Manager API running (backend)

2. Clone the Repository

```bash
git clone https://github.com/AbdullahKG/Password-Manager-UI-Extension.git
cd Password-Manager-UI-Extension
```

3. Install Dependencies

```bash
npm install
```

4. Build the Project

```bash
npx webpack
```

5. Load the Extension in Firefox

    Open Firefox and go to about:debugging#/runtime/this-firefox

    Click “Load Temporary Add-on”

    Select the manifest.json file inside the project directory

    The extension will now be loaded for testing.

Note: The extension will be removed when Firefox restarts. For a permanent installation, it must be packaged and signed.

--

## Usage

-   Open the extension from your browser toolbar.
-   Login or Sign Up to your account.
-   Store new passwords using the Add Password form.
-   View stored credentials in the Vault.
-   Use the Random Password Generator if needed.
-   Use Password Checker to see if your password is breached or not.
-   If it detects a Login page your accounts for this page will be displayed when clicking on email/username field
-   If signup page is detected it will ask you to save or cancel after you fill email/username and password fileds

--

## API

This extension communicates with the Password Manager API for user authentication and password storage.

    Update the API URL in background.js or any relevant service files.

    JWT tokens are securely stored and used for authenticated requests.

-   **Note**: this is needed https://github.com/AbdullahKG/Password-Manager-API

--

## Security_Features

-   JWT Authentication for secure communication
-   Web Crypto API for client-side encryption
-   Random password generator for strong password creation
-   Password Checker to see if its breached or not

--

## Project Structure

```bash
.   PASSWORD-MANAGER-UI-EXTENSION
├── dist/                     # Compiled output
├── node_modules/             # Dependencies
├── .gitignore                # Files to ignore in version control
├── addNewPassword.js         # Add new password functionality
├── background.js             # Background script for extension
├── CheckPassword.js          # Password validation logic to if its breached or not
├── crypto.js                 # Cryptographic functions
├── login.html / login.js     # Login page and logic
├── signup.html / signup.js   # Signup page and logic
├── vault.html / vault.js     # Secure password vault
├── manifest.json             # firefox extension manifest
├── webpack.config.js         # Webpack configuration
├── package.json              # Project metadata and dependencies
├── README.md                 # Project documentation
└── style.css / vault.css     # Styling

```
