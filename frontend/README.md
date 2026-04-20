# EcommerceProject Setup Guide

This repository contains a full-stack ecommerce app:

- Backend: ASP.NET Core Web API (`API`, `Core`, `Infrastructure`)
- Frontend: Angular (`frontend`)
- Database: SQL Server (Entity Framework Core)

## Payments

The project currently uses:

- PayPal (enabled)
- Stripe (also configured in backend)

It does not use Paymob.

## Prerequisites

Install the following before running the project:

1. .NET SDK 10.x
2. Node.js 22+ and npm
3. SQL Server (local or remote)
4. Git

Optional but useful:

1. Visual Studio 2022 / VS Code
2. SQL Server Management Studio

## Project Structure

- `API`: Web API project (runs on `http://localhost:5199` in Development)
- `Core`: Domain entities, DTOs, interfaces
- `Infrastructure`: EF Core, repositories, Identity, migrations
- `frontend`: Angular app (runs on `http://localhost:4200`)

## Configuration

### Backend settings

Update backend settings in:

- `API/appsettings.json`
- `API/appsettings.Development.json`

Important sections:

1. `ConnectionStrings:DefaultConnection`
2. `Jwt`
3. `PayPal`
4. `Stripe`
5. `EmailSettings`
6. `Authentication:Google`

Security note:

Do not commit real secrets (PayPal/Stripe/SMTP/JWT keys) to public repositories. Prefer environment variables or user secrets.

### Frontend API base URL

Frontend points to backend on `http://localhost:5199` via:

- `frontend/src/app/core/config/api.config.ts`

If backend URL changes, update this file.

## Run The Project (First Time)

### 1. Clone and open repo

```bash
git clone <your-repo-url>
cd WebAPI_AngularProject
```

### 2. Restore backend dependencies

```bash
dotnet restore EcommerceProject.sln
```

### 3. Apply database migrations

Run from repository root:

```bash
dotnet ef database update --project Infrastructure --startup-project API
```

If `dotnet ef` is missing:

```bash
dotnet tool install --global dotnet-ef
```

### 4. Start backend API

From repository root:

```bash
dotnet run --project API/API.csproj
```

Expected URL:

- `http://localhost:5199`

Optional API docs in Development:

- `http://localhost:5199/openapi/v1.json`
- `http://localhost:5199/swagger`

### 5. Install frontend dependencies

Open a second terminal:

```bash
cd frontend
npm install
```

### 6. Start frontend

```bash
npm start
```

Open:

- `http://localhost:4200`

## Seeded Admin Account

The app seeds roles and a default admin user on startup.

- Email: `admin@webapiangularproject.com`
- Password: `Admin123!`

Seeder location:

- `Infrastructure/Identity/IdentitySeeder.cs`

## Useful Commands

From repository root:

```bash
dotnet build EcommerceProject.sln
```

From `frontend`:

```bash
npm run build
npm test
```

## Troubleshooting

### API build fails with locked DLL (`MSB3021` / `MSB3027`)

Stop existing API process, then rebuild:

```bash
taskkill /F /IM API.exe
dotnet build EcommerceProject.sln
```

### Frontend cannot reach backend

Check:

1. API is running on `http://localhost:5199`
2. `frontend/src/app/core/config/api.config.ts` points to the same URL
3. CORS policy in `API/Program.cs` allows `http://localhost:4200`

### Coupon type seems wrong (percentage vs fixed)

Make sure coupon type mapping in frontend matches backend enum:

- Percentage = `1`
- Fixed = `2`

## Notes

1. `About` navbar link was removed because it had no route/page.
2. Admin/Seller category pages are available through sidebar navigation.
