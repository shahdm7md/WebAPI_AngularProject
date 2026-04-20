# 🛒 E-Commerce Platform

<div align="center">

[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge\&logo=angular\&logoColor=white)](https://angular.io/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-8.0-512BD4?style=for-the-badge\&logo=dotnet\&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?style=for-the-badge\&logo=microsoftsqlserver\&logoColor=white)](https://www.microsoft.com/sql-server)
[![Entity Framework](https://img.shields.io/badge/Entity_Framework_Core-8.0-512BD4?style=for-the-badge\&logo=dotnet\&logoColor=white)](https://docs.microsoft.com/ef/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge\&logo=stripe\&logoColor=white)](#)
[![PayMob](https://img.shields.io/badge/PayMob-Egypt-00AEEF?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**A production-ready full-stack e-commerce platform built with Angular 17, ASP.NET Core 8, and SQL Server — featuring real payment integration (Stripe & PayMob), product reviews, wishlist, discount system, advanced product image management, and a complete admin dashboard.**

[Live Demo](#) · [API Docs](#api-documentation) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📌 Overview

This project is a **full-stack e-commerce platform** that delivers a complete online shopping experience.

It supports multiple roles:

* 🛍️ **Customers** — browse, review, wishlist, and purchase products
* 🏪 **Sellers** — manage products, orders, and earnings
* 🛠️ **Admins** — control and monitor the entire platform

The system handles the full lifecycle:

> Product listing → Cart → Checkout → Payment → Order tracking

---

## 🚀 Features

### 🛍️ Customer Side

* Browse products with search & filtering
* Product details with image gallery
* Shopping cart & checkout flow
* Wishlist (save products for later)
* Product reviews & rating system
* Apply discount coupons
* Order history & tracking

---

### 💳 Payments & Orders

* Secure payments using **Stripe & PayMob**
* Real transaction processing
* Order confirmation via email
* Full order lifecycle tracking

---

### 🏪 Seller Dashboard

* Product CRUD (with multi-image upload)
* Edit product images (reorder / delete)
* Category management
* Inventory tracking
* Order management workflow
* Earnings dashboard

---

### 🛠️ Admin Panel

* Manage users, products, and categories
* Monitor platform activity
* Full dashboard control

---

### 📧 Notifications

* HTML email templates for:

  * OTP verification
  * Order confirmation
  * Password reset

---

### 🔐 Authentication & Security

* JWT Authentication
* Role-based authorization (Customer / Seller / Admin)
* Email OTP verification
* Secure password reset flow

---

## 🧱 Tech Stack

| Layer    | Technology               |
| -------- | ------------------------ |
| Frontend | Angular 17, Tailwind CSS |
| Backend  | ASP.NET Core 8 Web API   |
| Database | SQL Server               |
| ORM      | Entity Framework Core    |
| Auth     | Identity + JWT           |
| Payments | Stripe & PayMob          |
| Docs     | Swagger                  |

---

## 🏗️ System Architecture

Frontend (Angular SPA) communicates with Backend (ASP.NET API) via secure JWT-based HTTP requests.

```
Angular → API Controllers → Services → Repositories → SQL Server
```

---

## ⚙️ Getting Started

### 🔧 Backend

```bash
git clone https://github.com/shahdm7md/WebAPI_AngularProject.git
cd backend
dotnet ef database update
dotnet run
```

---

### 💻 Frontend

```bash
cd frontend
npm install
ng serve
```

---

## 📡 API Documentation

Base URL:

```
https://localhost:44395/api
```

Auth Header:

```
Authorization: Bearer <token>
```

---

## 📸 Screenshots

> Add real screenshots here

---

## 📁 Folder Structure

```
backend/
frontend/
```

---

## 🔮 Future Enhancements

* [ ] Real-time notifications (SignalR)
* [ ] Advanced analytics dashboard
* [ ] PWA support
* [ ] Docker deployment
* [ ] Automated testing

---

## ✅ Implemented Features

* [x] Stripe & PayMob payments
* [x] Product reviews & ratings
* [x] Wishlist system
* [x] Discount & coupon system
* [x] Multi-image product editing
* [x] Email templates system
* [x] Admin dashboard



<div align="center">

⭐ If you like this project, give it a star!

</div>
