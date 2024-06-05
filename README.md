# Polynomial Server

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

Polynomial is a project management tool designed to streamline team collaboration and task management, integrated with
Discord. The server system is built using Node.js and Express, providing a robust back-end infrastructure to support the
front-end functionalities. It handles user authentication, real-time updates, and notifications, making it ideal for
remote teams working on multiple projects simultaneously.

## Key Features

- **Project Management API:** Endpoints for creating, updating, and managing multiple projects.
- **Team Member Management API:** Endpoints for adding or removing team members using the UI or Discord roles.
- **Real-Time Updates:** WebSocket implementation for real-time updates on project statuses and task changes.
- **Notification System:** API to send notifications about task progress directly to designated Discord channels.

## System Requirements

- **Node.js:** v14.x or later
- **npm:** v6.x or later
- **MongoDB:** v4.x or later
- **Discord:** Account and server for integration

## Installation

To set up the server system locally, follow these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/polynomial115/polynomial-server.git
   cd polynomial-server
   ```

2. **Install Dependencies:**
   ```bash
   npm install
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

