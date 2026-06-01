# Ecommerce-react-springboot

## Run With Docker Compose

Chạy toàn bộ hệ thống gồm PostgreSQL, Redis, RabbitMQ, Spring Boot backend và React frontend:

```bash
docker compose up --build
```

Sau khi chạy:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api`
- PostgreSQL: `localhost:5433`
- RabbitMQ management: `http://localhost:15672` (`guest` / `guest`)

## Fault Tolerance & Scalability

Các cơ chế cơ bản đã thêm:

- Client rate limiter và retry 4 giây trong `frontend/src/api/axiosInstance.ts`.
- Server rate limiter trong `backend/src/main/java/iuh/fit/se/backend/config/ServerRateLimitFilter.java`.
- Hướng dẫn scale-out/load balancer trong `docs/fault-tolerance-scalability.md`.
