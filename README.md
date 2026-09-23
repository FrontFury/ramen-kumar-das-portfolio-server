# 🍜 Ramen Kuman Das Server

Welcome to the backend REST API repository for **Ramen Kuman Das**. This server is built with Node.js, Express.js, and MongoDB, handling authentication, OTP verification, user management, and secure API endpoints.

---

## 🚀 Live Server URL

- **Production API Base URL:** `https://ramen-kuman-das-server.vercel.app`

---

## ✨ Key Features

- **Email OTP Authentication:** Send and verify 6-digit OTP codes for email verification.
- **User Management:** Create, update, and manage user roles (Admin/User).
- **Firebase Auth Integration:** Secure backend verification for Firebase users.
- **JWT Protection:** Token-based route protection for private/secure resources.
- **CORS Configured:** Managed cross-origin access for frontend applications.

---

## 🛠️ Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via official MongoDB Node.js Driver)
- **Deployment:** Vercel

---

## 📡 API Endpoints

### 🔓 Public Routes (No Auth Required)

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/send-otp` | Send 6-digit OTP to user email | `{ "email": "user@example.com" }` |
| `POST` | `/api/verify-otp` | Verify the sent OTP | `{ "email": "user@example.com", "otp": "123456" }` |
| `POST` | `/users` | Register/Save a new user to DB | `{ "uid": "...", "fullName": "...", "email": "..." }` |

### 🔒 Secure Routes (Token Required)

| Method | Endpoint | Description | Headers Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Fetch all users (Admin only) | `Authorization: Bearer <TOKEN>` |
| `GET` | `/users/:email` | Get single user details | `Authorization: Bearer <TOKEN>` |

---

## ⚙️ Environment Variables

To run this project locally, create a `.env` file in the root directory and add the following keys:

```env
PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_nodemailer_email
EMAIL_PASS=your_app_specific_password
