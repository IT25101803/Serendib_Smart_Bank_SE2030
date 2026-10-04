# Serendib Smart Bank Database Architecture

The persistence layer has been standardized on **MySQL 8.0+ / 8.4** with automated migration management using **Flyway**.

---

## 1. Automated Migrations (Flyway)

DDL and seed data migrations are located in `backend/smartbank-api/src/main/resources/db/migration/`:
- **`V1__init_schema.sql`**: Full schema creation for all 19 entities, foreign key constraints, and performance indexes.
- **`V2__seed_initial_data.sql`**: Initial baseline fixture data including roles (`Admin`, `Customer`, `Manager`, `Employee`), initial users with BCrypt-hashed credentials (`DemoBank!2026`), customer CIF mappings, employee records, bank accounts, and AI assistant definitions.

Flyway runs automatically on application startup (`spring.flyway.enabled=true`), followed by Hibernate schema validation (`spring.jpa.hibernate.ddl-auto=validate`).

---

## 2. Docker Compose Provisioning

Use the root `docker-compose.yml` to provision the MySQL 8 container:

```bash
docker compose up -d
```

- **Container Name**: `nutricare_mysql`
- **Database**: `nutricare` (default, or customized via `DB_NAME`)
- **Port**: `3306`
- **Timezone**: `Asia/Colombo` (+05:30)
- **Persistent Volume**: `nutricare_mysql_data`

---

## 3. Standalone Database Dump

A standalone baseline MySQL dump is available at:
- `bank.sql` (Root directory)
- `database/bank.sql` (Database directory)

Manual import command:
```bash
mysql -u root -p < database/bank.sql
```
