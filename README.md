# Allo Hiring – Inventory API

This is a small NestJS-based inventory API used as part of a coding assessment. The codebase includes functionality for managing products, warehouses, and stock levels.

During the interview process, you will be asked to extend the application according to requirements provided by the interviewer. You are expected to review the codebase and have the application fully set up and running before the interview begins.

## Quick start: application setup

### Prerequisites

- Node.js 22+
- Yarn
- Docker and Docker Compose (for MySQL and Valkey)

### Run dependencies

```bash
docker-compose up -d
or
docker compose up -d
```

### Configure and run the app

```bash
cp .env.example .env
yarn install
yarn start:dev
```

The API runs at `http://localhost:3000`. Interactive API docs (Swagger UI) are at `http://localhost:3000/api`.

### Verify

- Create a product: `POST /products` with `{ "name": "Widget", "sku": "WID-001", "description": "A widget" }`
- Create a warehouse: `POST /warehouses` with `{ "name": "Main", "code": "WH1", "address": "123 Main St" }`
- Adjust stock: `PATCH /stock/adjust/:productId/:warehouseId` with `{ "quantityDelta": 100 }`
- Get stock: `GET /stock?productId=...&warehouseId=...`

## Architecture

- **NestJS** + **TypeORM** (MySQL), **Valkey** (Redis-compatible; available for your extension)
- **Swagger** at `/api` for interactive API docs and try-it-out
- **Modules**: `product`, `warehouse`, `stock` – each with entity, service, controller, DTOs
- **Validation**: `class-validator` on DTOs; global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`
- **Config**: `@nestjs/config`; see `.env.example` for variables
