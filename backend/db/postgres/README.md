# PostgreSQL setup

The application now uses PostgreSQL by default.

## Start local services

```powershell
cd backend
docker compose --env-file .env up -d postgres redis rabbitmq pgadmin
```

PostgreSQL runs on `localhost:5433`.
pgAdmin runs on `http://localhost:5050`.

## Seed data

`handbagdb_postgres.sql` is mounted into the PostgreSQL container and runs automatically only when the `postgres_data` volume is created for the first time.

If the volume already exists and you want to recreate the database from the seed file:

```powershell
cd backend
docker compose down
docker volume rm backend_postgres_data
docker compose --env-file .env up -d postgres
```

To import manually into an existing database:

```powershell
psql -h localhost -p 5433 -U postgres -d handbagdb -f db/postgres/handbagdb_postgres.sql
```
