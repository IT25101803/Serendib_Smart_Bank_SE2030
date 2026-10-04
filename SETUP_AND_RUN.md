# Serendib Smart Bank — Database Setup & Run Guide

This document describes the standardized database persistence and schema management architecture for Serendib Smart Bank.

---

## 1. Architecture & Persistence Standard

- **Database Engine**: MySQL 8.0+ / 8.4 via Docker Compose (`nutricare_mysql` container).
- **Default Database**: `nutricare` (or configured via `${DB_NAME}`).
- **Timezone**: `Asia/Colombo` (+05:30).
- **Connection URL**: `jdbc:mysql://localhost:3306/nutricare?createDatabaseIfNotExist=true&serverTimezone=Asia/Colombo`
- **Schema & Migration Management**: Automated via **Flyway** (`spring.flyway.enabled=true`).
  - Migration location: `src/main/resources/db/migration/`
  - `V1__init_schema.sql`: Complete DDL creating all 19 entities, foreign keys, and indexes.
  - `V2__seed_initial_data.sql`: Seed data for roles, users, customer profiles, staff profiles, accounts, and demo fixtures.
- **ORM & JPA DDL Mode**: `spring.jpa.hibernate.ddl-auto=validate` (Hibernate validates entities against Flyway migrations rather than generating/mutating schema directly).

---

## 2. Prerequisites

- **Java JDK**: 17+ (JDK 21 or 24 recommended).
- **Maven**: 3.9+ (or use the provided `mvnw` wrapper).
- **Docker & Docker Compose**: (for local containerized MySQL 8+).

---

## 3. Quick Start with Docker Compose

### Step 1: Start MySQL 8.4 via Docker Compose

Run the following command from the repository root:

```bash
docker compose up -d
```

This launches the `nutricare_mysql` container:
- **Port**: `3306`
- **Database**: `nutricare`
- **User**: `root`
- **Password**: `root` (or customized via environment variable)
- **Timezone**: `Asia/Colombo`
- **Volume**: `nutricare_mysql_data` (mapped to `/var/lib/mysql`)

To inspect container logs:

```bash
docker compose logs -f nutricare_mysql
```

To stop the container:

```bash
docker compose down
```

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env` in `backend/smartbank-api/.env` or repository root:

```bash
cp .env.example backend/smartbank-api/.env
```

Key environment properties:

| Variable | Default Value | Description |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/nutricare?createDatabaseIfNotExist=true&serverTimezone=Asia/Colombo` | JDBC connection string |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | `root` | Database password |
| `JWT_SECRET` | *(Random 32+ chars)* | Cryptographic HMAC secret for JWT auth |
| `PORT` | `8081` | Spring Boot HTTP server port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origin URLs |
| `BANK_OTP_SIMULATION_ENABLED` | `true` | Allows dev OTP simulation |
| `BANK_DEMO_ADMIN_ENABLED` | `true` | Automatically provisions demo admin |
| `BANK_DEMO_STAFF_ENABLED` | `true` | Automatically provisions demo staff |

---

## 5. Running the Backend Application

Navigate to the `backend/smartbank-api` directory and run:

```bash
mvn clean spring-boot:run
```

Or using the Maven Wrapper:

```bash
./mvnw clean spring-boot:run
```

During startup:
1. Flyway automatically executes `V1__init_schema.sql` and `V2__seed_initial_data.sql`.
2. Hibernate validates all `@Entity` and `@Table` mappings with `ddl-auto=validate`.
3. The API server starts on `http://localhost:8081`.

---

## 6. Standalone SQL Dump

For manual or isolated database initialization, a baseline standalone SQL dump is provided:

- `bank.sql` (repository root)
- `database/bank.sql` (database directory)

Import with MySQL CLI:

```bash
mysql -u root -p < bank.sql
```

---

## 7. Demo Accounts & Credentials

Password for all pre-seeded demonstration accounts: **`DemoBank!2026`**

| Role | Username | Password | Email |
|---|---|---|---|
| **Customer** | `john_customer` | `DemoBank!2026` | `customer@test.com` |
| **Customer** | `jane_customer` | `DemoBank!2026` | `jane@test.com` |
| **Employee** | `bank_employee` | `DemoBank!2026` | `employee@test.com` |
| **Manager** | `branch_manager` | `DemoBank!2026` | `manager@test.com` |
| **Admin** | `system_admin` | `DemoBank!2026` | `admin@test.com` |

---

## 8. Running Automated Tests

Run unit and integration tests:

```bash
mvn test
```
