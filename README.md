# 🛒 E-Commerce Platform

<div align="center">

[![Angular](https://img.shields.io/badge/Angular-21+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-.NET_10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Entity Framework](https://img.shields.io/badge/Entity_Framework_Core-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://learn.microsoft.com/ef/core)
[![PayPal](https://img.shields.io/badge/PayPal-Payments-003087?style=for-the-badge&logo=paypal&logoColor=white)](#)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](#)

**A full-stack e-commerce platform built with Angular + ASP.NET Core + SQL Server, with role-based access for Customer/Seller/Admin, real checkout flow, and dashboard management features.**

</div>

---

## 📌 Overview

This project provides a complete online shopping workflow:

Product listing → Cart → Checkout → Payment → Order history

Supported roles:

- 🛍️ Customer
- 🏪 Seller
- 🛠️ Admin

---

## 🚀 Features

### Customer

- Product browsing with search/filter
- Product details + image gallery
- Cart + checkout
- Wishlist
- Coupon apply/validation
- Order history + order details

### Seller Dashboard

- Product CRUD with images
- Category management
- Order management + status updates
- Earnings overview

### Admin Panel

- Manage users, products, categories
- Manage orders, coupons, banners
- Platform dashboard stats

### Auth & Security

- ASP.NET Identity + JWT
- Role-based authorization
- Google login support (configurable)
- OTP / email-based flows

### Payments

- ✅ PayPal
- ✅ Stripe
- ❌ Paymob (not used)

---

## 🧱 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Angular 21, Tailwind, Bootstrap |
| Backend | ASP.NET Core Web API (.NET 10) |
| Database | SQL Server |
| ORM | Entity Framework Core |
| Auth | ASP.NET Identity + JWT |
| Payments | PayPal, Stripe |

---

## 📁 Repository Structure

```text
EcommerceProject.sln
API/
Core/
Infrastructure/
SharedKernel/
frontend/
```

---

## ⚙️ Local Setup (Step by Step)

### 1. Prerequisites

Install:

1. .NET SDK 10.x
2. Node.js 22+ and npm
3. SQL Server
4. Git

### 2. Clone

```bash
git clone <your-repo-url>
cd WebAPI_AngularProject
```

### 3. Restore backend packages

```bash
dotnet restore EcommerceProject.sln
```

### 4. Configure local secrets (important)

Project uses placeholders in committed config files. Set real values locally with User Secrets:

```bash
dotnet user-secrets init --project API/API.csproj

dotnet user-secrets set "Jwt:Key" "your-jwt-key" --project API/API.csproj
dotnet user-secrets set "Authentication:Google:ClientId" "your-google-client-id" --project API/API.csproj
dotnet user-secrets set "Authentication:Google:ClientSecret" "your-google-client-secret" --project API/API.csproj

dotnet user-secrets set "EmailSettings:SmtpUser" "your-smtp-user" --project API/API.csproj
dotnet user-secrets set "EmailSettings:SmtpPassword" "your-smtp-password" --project API/API.csproj
dotnet user-secrets set "EmailSettings:SenderEmail" "your-sender-email" --project API/API.csproj

dotnet user-secrets set "Stripe:SecretKey" "your-stripe-secret" --project API/API.csproj
dotnet user-secrets set "Stripe:PublishableKey" "your-stripe-publishable" --project API/API.csproj

dotnet user-secrets set "PayPal:ClientId" "your-paypal-client-id" --project API/API.csproj
dotnet user-secrets set "PayPal:Secret" "your-paypal-secret" --project API/API.csproj

dotnet user-secrets set "SendGrid:ApiKey" "your-sendgrid-key" --project API/API.csproj
dotnet user-secrets set "SendGrid:FromEmail" "your-from-email" --project API/API.csproj
```

### 5. Update database

```bash
dotnet ef database update --project Infrastructure --startup-project API
```

If needed:

```bash
dotnet tool install --global dotnet-ef
```

### 6. Run backend API

```bash
dotnet run --project API/API.csproj
```

Backend URL:

- http://localhost:5199

API docs (Development):

- http://localhost:5199/swagger

### 7. Run frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Frontend URL:

- http://localhost:4200

---

## 🔑 Seeded Admin User

Default admin is seeded automatically:

- Email: admin@webapiangularproject.com
- Password: Admin123!

File: Infrastructure/Identity/IdentitySeeder.cs

Change this password immediately in non-local environments.

---

## 🧪 Build Commands

From repository root:

```bash
dotnet build EcommerceProject.sln
```

From frontend folder:

```bash
npm run build
npm test
```

---

## 🛡️ Security Checklist Before Public GitHub

1. Never commit real secrets in `appsettings*.json`, `.env`, or source files.
2. Rotate all previously exposed keys immediately:
	- PayPal
	- Stripe
	- Google OAuth
	- SMTP app password
	- SendGrid API key
	- JWT signing key
3. Use User Secrets for local dev and environment variables in production.
4. If secrets were previously committed, rewrite git history before publishing.

---

## 🧭 Notes

- API local port is `5199`.
- Frontend local port is `4200`.
- About navbar link was removed because it had no working route.

