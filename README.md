# Polynomial Server

## Table of Contents

-   [Introduction](#introduction)
-   [System Requirements](#system-requirements)
-   [Installation](#installation)

# Introduction

This is the backend system for the Polynomial project.

## System Requirements

-   **Node.js**
-   **pnpm**
-   **Discord:** Account and server for integration

## Installation

To set up the server locally, follow these steps:

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/polynomial115/polynomial-server.git
    cd polynomial-server
    ```

2. **Install Dependencies:**

    ```bash
    pnpm install
    ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following:
    ```env
    CLIENT_ID=your-discord-client-id
     CLIENT_SECRET=your-discord-client-secret
    DISCORD_TOKEN=your-discord-token
    JWT_SECRET=your-jwt-secret
    ```
4. **Configure Firebase.json:**
   Create a `firebase.json` file in the root directory and add the following:
    ```json
    {
    	"type": "service_account",
    	"project_id": "your-project-id",
    	"private_key_id": "your-private-key-id",
    	"private_key": "your-private-key",
    	"client_email": "your-client-email",
    	"client_id": "your-client-id",
    	"auth_uri": "your-auth-uri",
    	"token_uri": "your-token-uri",
    	"auth_provider_x509_cert_url": "your-auth-provider-x509-cert-url",
    	"client_x509_cert_url": "your-client-x509-cert-url"
    }
    ```

5.**Run the Server:**

```bash
pnpm dev
```

6.**Access the Server:**
Use the client application to interact with the server system.
