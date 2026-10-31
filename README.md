# OrderCraft: Enterprise Manufacturing Order Management System (OMS)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://ayushpatel25-prog.github.io/ordercraft/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fayushpatel25-prog%2Fordercraft&root-directory=frontend)
[![Build & Test](https://github.com/ayushpatel25-prog/ordercraft/actions/workflows/ci.yml/badge.svg)](https://github.com/ayushpatel25-prog/ordercraft/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-17.3-red.svg)](https://angular.io/)
[![Currency](https://img.shields.io/badge/Currency-INR%20(%E2%82%B9)-orange.svg)](#)

> **OrderCraft** is an enterprise-grade full-stack Manufacturing Order Management System that automates the end-to-end **Order-to-Cash (O2C)** and **Procure-to-Pay (P2P)** manufacturing lifecycle.

### 🌐 Live Production Deployments
- **Production Frontend (Vercel)**: 👉 [https://frontend-xi-nine-noivtlmj7b.vercel.app](https://frontend-xi-nine-noivtlmj7b.vercel.app)
- **Production Frontend (GitHub Pages)**: 👉 [https://ayushpatel25-prog.github.io/ordercraft/](https://ayushpatel25-prog.github.io/ordercraft/)
- **Production Backend API (Render)**: 👉 [https://ordercraft-backend-dvfg.onrender.com](https://ordercraft-backend-dvfg.onrender.com)
- **Interactive Swagger UI Docs**: 👉 [https://ordercraft-backend-dvfg.onrender.com/swagger-ui/index.html](https://ordercraft-backend-dvfg.onrender.com/swagger-ui/index.html)
- **Cloud Database**: Managed PostgreSQL on Render (`ordercraft-db`)

---

## 🚀 Key Features

- **Automated Multi-Level BOM Explosion**: Recursively explodes Bills of Materials across raw materials and sub-assemblies to calculate exact component demand and identify real-time inventory shortages.
- **Automated Shortage Purchase Orders (PO)**: Automatically groups material shortages by preferred supplier and generates Purchase Orders to replenish inventory.
- **Goods Receipt (GRN) & Auto-Unblocking**: Receiving components automatically updates on-hand stock and transitions blocked Sales Orders to `READY_FOR_PRODUCTION`.
- **Work Order & Shopfloor Tracking**: Real-time progress monitoring from assembly to testing, packaging, and dispatch.
- **GST Tax Invoicing & Rupee Currency**: Full Indian Rupee (`₹` / INR) native currency support across financial summaries, automated GST calculations, and OpenPDF invoice generation.
- **Role-Based Access Control (RBAC)**: Secure JWT-authenticated roles for Admin, Sales Manager, Production Planner, Procurement Officer, and Finance Controller.
- **Modern Angular 17+ UI**: Built with Angular Signals, Reactive Forms, Tailwind CSS, Lucide Icons, interactive status badges, and animated workflow pipelines.

---

## 🏗️ Architecture

```
ordercraft/
├── backend/                  # Spring Boot 3.3 (Java 21) REST API
│   ├── src/main/java/com/ordercraft/
│   │   ├── config/           # Security, JWT, CORS, OpenAPI, Data Seed
│   │   ├── controller/       # REST Controllers (O2C, P2P, BOM, Invoices)
│   │   ├── entity/           # JPA Entities with Optimistic Locking
│   │   ├── repository/       # Spring Data Repositories
│   │   ├── service/          # Core Business Engines (BOM, Sales, PO, GRN)
│   │   └── dto/              # Strongly-typed Records & Requests
│   └── pom.xml
├── frontend/                 # Angular 17.3+ Enterprise Dashboard
│   ├── src/app/
│   │   ├── core/             # Auth interceptors, guards, API services
│   │   ├── features/         # Sales, BOM Studio, Inventory, Procurement, Invoices
│   │   └── shared/           # Sidebar, Navbar, Metric Cards, Status Badges
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml        # Multi-container orchestration (App + DB)
├── render.yaml               # 1-Click Render Cloud deployment
└── .github/workflows/ci.yml  # Automated CI/CD pipeline
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+ & npm
- Java 17+ or 21 (JDK) & Maven
- (Optional) Docker & Docker Compose

### 1. Run with Docker Compose
```bash
docker-compose up --build
```
- Frontend: [http://localhost:4200](http://localhost:4200)
- Backend API: [http://localhost:8085](http://localhost:8085)
- Swagger API Docs: [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html)

### 2. Run Manually

#### Backend:
```bash
cd backend
mvn clean spring-boot:run
```

#### Frontend:
```bash
cd frontend
npm install
npm start
```
Open your browser at `http://localhost:4200`.

---

## 🌐 Cloud Deployment Guide

### Option A: 1-Click Deployment with Render
This repository contains a [`render.yaml`](./render.yaml) blueprint:
1. Fork or push this repository to your GitHub account.
2. Sign in to [Render](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Connect this repository and click **Apply**.
5. Render will automatically build and deploy both the Spring Boot backend and Angular frontend containers.

### Option B: Deploy Frontend to Vercel / Netlify
1. Connect your repository to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist/ordercraft-frontend/browser`
5. The included [`frontend/vercel.json`](./frontend/vercel.json) handles client-side Angular routing automatically.

### Option C: Deploy Backend to Railway / Render / AWS
1. Point Railway or Render to the Dockerfile in `backend/Dockerfile`.
2. Port: `8085`
3. Environment variables:
   - `SPRING_PROFILES_ACTIVE=prod`

---

## 🔐 Pre-Seeded Default Accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `password` |
| Sales Manager | `sales` | `password` |
| Production Planner | `production` | `password` |
| Procurement Officer | `procurement` | `password` |
| Finance Controller | `finance` | `password` |

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
