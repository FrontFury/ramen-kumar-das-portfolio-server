# 🚀 Ramen Kumar Das - Academic & Portfolio Server

This repository contains the backend RESTful API for **Ramen Kumar Das's Academic & Professional Portfolio Website**. Built with Node.js, Express, and MongoDB, this server handles data management for research publications, supervised projects, course teaching materials, and contact inquiries.

---

## 🛠 Tech Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.org/) with [Mongoose](https://mongoosejs.com/)
- **Authentication & Security:** JSON Web Tokens (JWT), CORS, Dotenv
- **Deployment:** Vercel / Render / Railway

---

## ✨ Features & API Capabilities

- **Academic Projects & Supervision:** Manage, fetch, and structure student projects, deliverables (Full Reports, Presentation Slides), and supervision statuses (Ongoing/Completed).
- **Research & Publications:** API endpoints for dynamic research papers, journals, and conference links.
- **Direct Messaging & Contact:** Handles user inquiries and processes communications.
- **Course & Resource Management:** Serve academic course materials, lecture slides, and notices.
- **Secure Admin Routes:** JWT-authenticated routes for updating portfolio content dynamically.

---

## 📁 Directory Structure

```text
├── config/             # Database connection & third-party configurations
├── controllers/        # Request handlers & core business logic
├── middleware/         # Auth, validation, and error handling middlewares
├── models/             # Mongoose schemas & database models
├── routes/             # Express API routes
├── .env.example        # Environment variable templates
├── index.js            # Server entry point
├── package.json        # Project dependencies and scripts
└── README.md           # Documentation
