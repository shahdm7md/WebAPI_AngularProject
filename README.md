# [Project Name]

<div align="center">

![Project Banner](https://via.placeholder.com/900x200/0045a3/ffffff?text=Project+Name)

[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Entity Framework](https://img.shields.io/badge/Entity_Framework_Core-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://docs.microsoft.com/ef/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**A full-stack e-commerce platform built with Angular 17, ASP.NET Core 8, and SQL Server — featuring a complete seller dashboard, product management, order tracking, and secure JWT authentication.**

[Live Demo](#) · [API Docs](#api-documentation) · [Report Bug](#) · [Request Feature](#)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Folder Structure](#folder-structure)
- [Future Enhancements](#future-enhancements)
- [Author](#author)

---

## Overview

**[Project Name]** is a full-stack web application that provides a complete e-commerce experience. It supports two roles — **Customers** who browse and purchase products, and **Sellers** who manage their own storefront through a dedicated dashboard.

The platform covers the full order lifecycle: product listing → cart → checkout → payment → order fulfillment, with a rich seller panel for managing inventory, tracking orders, and reviewing earnings.

---

## Features

### 🛍️ Customer Side
- Browse products with search, filtering, and category navigation
- Product detail pages with image galleries and reviews
- Shopping cart and checkout flow
- Order history and tracking
- User registration, login, OTP email verification, and password reset

### 🏪 Seller Dashboard
- Seller registration and profile management
- Full product CRUD — create products with main image + multiple extra images
- Category management (add / remove categories inline)
- Real-time inventory tracking with stock status indicators
- Order management with status workflow (Pending → Processing → Shipped → Delivered)
- Earnings summary and detailed order revenue breakdown

### 🔐 Auth & Security
- JWT Bearer authentication
- Role-based authorization (`Customer`, `Seller`, `Admin`)
- OTP email verification on registration
- Forgot password / reset password flow

### ⚙️ Admin
- Platform-wide product and user management
- Category administration

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 17 (Standalone Components), Tailwind CSS, RxJS |
| **Backend** | ASP.NET Core 8 Web API, C# 12 |
| **ORM** | Entity Framework Core 8 (Code First) |
| **Database** | Microsoft SQL Server 2022 |
| **Auth** | ASP.NET Core Identity + JWT Bearer Tokens |
| **File Storage** | Local file system (`wwwroot/images/products`) |
| **API Docs** | Swagger / OpenAPI |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  Angular 17 SPA                         │  │
│   │                                                         │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│   │  │  Auth Module │  │ Shop Module  │  │Seller Module │  │  │
│   │  │  login/reg.  │  │ browse/cart  │  │  dashboard   │  │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│   │                                                         │  │
│   │  Services: AuthService · ProductService · SellerService │  │
│   │  Guards: AuthGuard · RoleGuard                          │  │
│   └─────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────────┘
                      │ HTTP/JSON (JWT in Authorization header)
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   ASP.NET Core 10 Web API                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Controllers                          │  │
│  │ AuthController · ProductsController · CategoriesController  │  │
│  │ SellerDashboardController · OrdersController            │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │               Application Services                       │  │
│  │   SellerService · AuthService · FileStorageService       │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │              Repository Layer (EF Core)                  │  │
│  │   IProductRepository · ISellerRepository · IOrderRepo    │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              SQL Server Database (EF Core Code First)           │
│                                                                 │
│   Users · Products · ProductImages · Categories · Orders       │
│   OrderItems · Payments · Reviews · Carts · CartItems          │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture
The Angular app is organized as a feature-based module structure using standalone components. Each feature area (auth, shop, seller) is lazy-loaded. All HTTP calls go through injectable services that read the `API_BASE_URL` injection token. The `ChangeDetectionStrategy.OnPush` strategy is used throughout for performance, with `ChangeDetectorRef` injected via `inject()`.

### Backend Architecture
The API follows a clean layered architecture: Controllers → Services → Repositories → EF Core. The `Repository Pattern` abstracts all database access. JWT middleware handles authentication, and ASP.NET Core Identity manages user lifecycle. File uploads are handled via `IFormFile` and saved to `wwwroot/images/products`.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| .NET SDK | 8.0+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| Node.js | 18.0+ | [nodejs.org](https://nodejs.org/) |
| Angular CLI | 17.0+ | `npm install -g @angular/cli` |
| SQL Server | 2019+ | [microsoft.com](https://www.microsoft.com/sql-server) |
| Git | any | [git-scm.com](https://git-scm.com/) |

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/shahdm7md/WebAPI_AngularProject.git
cd project-name/backend
```

**2. Configure the database connection**

Open `appsettings.json` and update the connection string:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=ProjectDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_SUPER_SECRET_KEY_AT_LEAST_32_CHARS",
    "Issuer": "ProjectApi",
    "Audience": "ProjectClient",
    "ExpiryInDays": 7
  },
  "EmailSettings": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your@email.com",
    "Password": "your_app_password"
  }
}
```

**3. Apply database migrations**
```bash
cd API
dotnet ef database update
```

**4. Run the API**
```bash
dotnet run
```

The API will be available at:
- `https://localhost:44395` (HTTPS)
- `http://localhost:5000` (HTTP)
- Swagger UI: `https://localhost:44395/swagger`

---

### Frontend Setup

**1. Navigate to the frontend directory**
```bash
cd project-name/frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure the API base URL**

Open `src/app/core/config/api.config.ts`:
```typescript
export const DEFAULT_API_BASE_URL = 'https://localhost:44395';
```

**4. Provide the token in `app.config.ts`**
```typescript
import { API_BASE_URL, DEFAULT_API_BASE_URL } from './core/config/api.config';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_BASE_URL, useValue: DEFAULT_API_BASE_URL },
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

**5. Start the development server**
```bash
ng serve
```

The app will be available at `http://localhost:4200`

---

## API Documentation

Base URL: `https://localhost:44395/api`

All protected endpoints require the header:
```
Authorization: Bearer <token>
```

---

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register/customer` | ❌ | Register new customer |
| `POST` | `/auth/register/seller` | ❌ | Register new seller |
| `POST` | `/auth/login` | ❌ | Login and receive JWT |
| `POST` | `/auth/verify-email-otp` | ❌ | Verify email with OTP |
| `POST` | `/auth/resend-otp` | ❌ | Resend OTP email |
| `POST` | `/auth/forgot-password` | ❌ | Request password reset |
| `POST` | `/auth/reset-password` | ❌ | Reset password with token |

**Login Request:**
```json
POST /api/auth/login
{
  "email": "seller@example.com",
  "password": "Password123!"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "seller@example.com",
  "fullName": "Yalla Bena",
  "role": "Seller"
}
```

---

### 📦 Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/products` | ❌ | Get all products (search, filter, paginate) |
| `GET` | `/products/{id}` | ❌ | Get product by ID |
| `POST` | `/products` | ✅ Seller | Create product with images |
| `PUT` | `/products/{id}` | ✅ Seller | Update product |
| `DELETE` | `/products/{id}` | ✅ Seller/Admin | Delete product |

**Create Product (multipart/form-data):**
```
POST /api/products
Content-Type: multipart/form-data

name          = "Eames Heritage Lounge"
price         = 4250.00
stockQuantity = 42
categoryId    = 1
description   = "Classic mid-century modern lounge chair"
mainImage     = [binary file]
extraImages   = [binary file]   ← can repeat multiple times
extraImages   = [binary file]
```

---

### 🏪 Seller Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/sellerdashboard/profile` | ✅ Seller | Get seller profile |
| `PUT` | `/sellerdashboard/profile` | ✅ Seller | Update seller profile |
| `GET` | `/sellerdashboard/products` | ✅ Seller | Get seller's products |
| `POST` | `/sellerdashboard/products` | ✅ Seller | Create product |
| `PUT` | `/sellerdashboard/products/{id}` | ✅ Seller | Update product |
| `DELETE` | `/sellerdashboard/products/{id}` | ✅ Seller | Delete product |
| `PATCH` | `/sellerdashboard/products/{id}/stock` | ✅ Seller | Update stock only |
| `POST` | `/sellerdashboard/products/{id}/images` | ✅ Seller | Add image to product |
| `DELETE` | `/sellerdashboard/products/{id}/images/{imgId}` | ✅ Seller | Delete product image |
| `GET` | `/sellerdashboard/orders` | ✅ Seller | Get seller's orders |
| `GET` | `/sellerdashboard/orders/{id}` | ✅ Seller | Get order details |
| `PATCH` | `/sellerdashboard/orders/{id}/status` | ✅ Seller | Update order status |
| `GET` | `/sellerdashboard/earnings/summary` | ✅ Seller | Earnings summary |
| `GET` | `/sellerdashboard/earnings` | ✅ Seller | Earnings detail list |

**Update Order Status:**
```json
PATCH /api/sellerdashboard/orders/5/status
{
  "status": "Shipped"
}
```

---

### 🗂️ Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/categories` | ❌ | Get all categories |
| `POST` | `/categories` | ✅ Admin | Create category |
| `DELETE` | `/categories/{id}` | ✅ Admin | Delete category |

---

## Screenshots

> Replace the placeholders below with actual screenshots from your app.

### Customer Shop
![Shop Page](https://via.placeholder.com/800x450/f9f9fc/0045a3?text=Shop+Page+-+Product+Listing)

### Product Detail
![Product Detail](https://via.placeholder.com/800x450/f9f9fc/0045a3?text=Product+Detail+Page)

### Seller Dashboard — Overview
![Seller Overview](https://via.placeholder.com/800x450/f9f9fc/0045a3?text=Seller+Dashboard+-+Overview)

### Seller Dashboard — Products
![Product Management](https://via.placeholder.com/800x450/f9f9fc/0045a3?text=Seller+Dashboard+-+Product+Management)

### Seller Dashboard — Orders
![Order Management](https://via.placeholder.com/800x450/f9f9fc/0045a3?text=Seller+Dashboard+-+Order+Management)

### Add Product Modal
![Add Product](https://via.placeholder.com/800x450/f9f9fc/0045a3?text=Add+Product+Modal+with+Multi-Image+Upload)

---

## Folder Structure

```
project-name/
│
├── backend/                          # ASP.NET Core Solution
│   ├── API/                          # Web API project
│   │   ├── Controllers/              # HTTP controllers
│   │   ├── Contracts/                # Request/Response DTOs
│   │   │   ├── Auth/
│   │   │   ├── Products/
│   │   │   └── Seller/
│   │   ├── Middleware/               # Error handling middleware
│   │   ├── Services/                 # IFileStorageService etc.
│   │   ├── wwwroot/
│   │   │   └── images/products/      # Uploaded product images
│   │   └── Program.cs
│   │
│   ├── Core/                         # Domain layer
│   │   ├── Entities/                 # EF Core entity classes
│   │   │   ├── ApplicationUser.cs
│   │   │   ├── Product.cs
│   │   │   ├── ProductImage.cs
│   │   │   ├── Order.cs
│   │   │   ├── OrderItem.cs
│   │   │   ├── Payment.cs
│   │   │   ├── Review.cs
│   │   │   ├── Cart.cs
│   │   │   └── Category.cs
│   │   └── Interfaces/
│   │       ├── Repositories/         # Repository interfaces
│   │       └── Services/             # Service interfaces
│   │
│   ├── Application/                  # Business logic layer
│   │   └── Services/
│   │       └── SellerService.cs
│   │
│   ├── Infrastructure/               # Data access layer
│   │   ├── Persistence/
│   │   │   └── AppDbContext.cs
│   │   └── Repositories/
│   │       ├── SellerRepository.cs
│   │       └── ProductRepository.cs
│   │
│   └── SharedKernel/
│       └── Enums/                    # OrderStatus, PaymentStatus etc.
│
└── frontend/                         # Angular 17 project
    └── src/
        └── app/
            ├── core/
            │   ├── config/
            │   │   └── api.config.ts         # API_BASE_URL token
            │   ├── services/
            │   │   ├── auth.service.ts
            │   │   ├── product.service.ts
            │   │   └── seller.service.ts
            │   ├── guards/
            │   │   ├── auth.guard.ts
            │   │   └── role.guard.ts
            │   ├── interceptors/
            │   │   └── auth.interceptor.ts
            │   └── models/
            │       └── auth.models.ts
            │
            ├── features/
            │   ├── auth/
            │   │   ├── login/
            │   │   ├── register/
            │   │   ├── verify-otp/
            │   │   └── reset-password/
            │   ├── shop/
            │   │   ├── home/
            │   │   ├── product-list/
            │   │   ├── product-detail/
            │   │   └── cart/
            │   └── seller/
            │       ├── dashboard/            # Overview page
            │       ├── products/             # Product management
            │       ├── orders/               # Order management
            │       ├── earnings/             # Earnings page
            │       └── settings/             # Profile settings
            │
            └── app.config.ts
```

---

## Future Enhancements

- [ ] **Real-time notifications** — SignalR integration for live order updates
- [ ] **Payment gateway** — Stripe or PayMob integration for real payments
- [ ] **Advanced analytics** — Charts and graphs for seller earnings trends
- [ ] **Product reviews** — Customer review and rating system with moderation
- [ ] **Wishlist** — Save products for later feature for customers
- [ ] **Discount & coupon system** — Promo codes and percentage discounts
- [ ] **Multi-image edit** — Ability to reorder and delete images from existing products
- [ ] **Email templates** — Branded HTML email notifications for orders
- [ ] **PWA support** — Offline capability and installable app experience
- [ ] **Docker deployment** — Containerized deployment with Docker Compose
- [ ] **Unit & integration tests** — xUnit for backend, Jasmine/Karma for frontend
- [ ] **Admin panel** — Full admin dashboard for platform management

---

## Author

<div align="center">

**[Your Name]**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/your-profile)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:your@email.com)

*Built with ❤️ as a full-stack portfolio project.*

</div>

---

<div align="center">

⭐ If you found this project useful, please give it a star!

</div>
