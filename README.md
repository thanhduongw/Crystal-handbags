<div align="center">

# 👜 Crystal Handbags

**Website thương mại điện tử bán túi xách** — Spring Boot · React · PostgreSQL · Redis · RabbitMQ

🔗 Demo: [crystal-handbags.online](https://crystal-handbags.online/)

</div>

---

## 📖 Giới thiệu

Crystal Handbags là hệ thống bán hàng trực tuyến full-stack, gồm trang mua sắm cho khách hàng và trang quản trị (admin) cho người bán. Dự án được xây dựng theo kiến trúc client-server tách biệt: backend cung cấp REST API bằng Spring Boot, frontend là ứng dụng SPA bằng React + TypeScript.

## ✨ Tính năng chính

**Khách hàng**
- Đăng ký / đăng nhập bằng JWT, xác thực OTP qua email, quên & đặt lại mật khẩu
- Duyệt sản phẩm theo danh mục, xem chi tiết sản phẩm
- Giỏ hàng cho cả khách vãng lai (session/Redis) và người dùng đã đăng nhập (lưu DB)
- Đặt hàng, thanh toán online qua **VNPay**, xem lịch sử & chi tiết đơn hàng
- Quản lý sổ địa chỉ giao hàng
- Trợ lý mua sắm **AI Chatbot** (tích hợp qua Spring AI)
- Nhận email xác nhận đơn hàng (template Thymeleaf)

**Quản trị (Admin)**
- Quản lý sản phẩm, danh mục, tồn kho
- Quản lý đơn hàng, cập nhật trạng thái đơn
- Quản lý người dùng
- Thống kê doanh thu / đơn hàng (Dashboard)

**Hạ tầng & vận hành**
- Xử lý bất đồng bộ đơn hàng/thanh toán qua **RabbitMQ** (event: tạo đơn, huỷ đơn, thanh toán thành công/thất bại)
- Cache & khoá tồn kho bằng **Redis** (tránh oversell khi nhiều người đặt cùng lúc)
- Lưu trữ hình ảnh sản phẩm trên **AWS S3**
- Rate limiting ở cả client (retry/backoff) và server (`ServerRateLimitFilter`)
- CI/CD pipeline cho backend (GitHub Actions)

## 🛠️ Công nghệ sử dụng

**Backend**
| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ / Framework | Java 21, Spring Boot 3.5.7 |
| Bảo mật | Spring Security, JWT, OAuth2 Resource Server |
| Dữ liệu | Spring Data JPA, PostgreSQL 16 |
| Cache / Session | Redis (Jedis, Spring Session Data Redis) |
| Message Queue | RabbitMQ (Spring AMQP) |
| AI | Spring AI (OpenAI-compatible starter) |
| Thanh toán | VNPay |
| Lưu trữ file | AWS S3 SDK |
| Email | Spring Mail + Thymeleaf template |
| Khác | Lombok, spring-dotenv |

**Frontend**
| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| UI | Ant Design 6, Tailwind CSS 4, lucide-react |
| Routing | React Router 6 |
| Gọi API | Axios |

**Hạ tầng chạy local**: Docker & Docker Compose (PostgreSQL, Redis, RabbitMQ, backend, frontend)

## 🏗️ Kiến trúc

Tài liệu thiết kế (C4 Context/Container, Class Diagram, Database Diagram, Layered Architecture) nằm trong thư mục [`docs/`](./docs), cùng tài liệu đồ án đầy đủ (`.docx`, `.pptx`).

```
Client (React SPA)
        │  REST/JSON, JWT
        ▼
Backend API (Spring Boot)
   ├── PostgreSQL   – dữ liệu nghiệp vụ (sản phẩm, đơn hàng, người dùng...)
   ├── Redis        – session giỏ hàng khách vãng lai, cache, khoá tồn kho
   └── RabbitMQ     – xử lý bất đồng bộ sự kiện đơn hàng/thanh toán
        │
        ▼
Dịch vụ ngoài: VNPay (thanh toán) · AWS S3 (ảnh) · SMTP Gmail (email) · AI provider (chatbot)
```

## 📁 Cấu trúc thư mục

```
Crystal-handbags/
├── backend/                # Spring Boot REST API
│   ├── src/main/java/iuh/fit/se/backend/
│   │   ├── controller/     # REST controllers
│   │   ├── service/        # Business logic (+ impl/)
│   │   ├── repository/     # Spring Data JPA repositories
│   │   ├── model/          # JPA entities
│   │   ├── dto/            # Request/Response DTOs
│   │   ├── config/         # Security, Redis, RabbitMQ, S3, Mail, VNPay...
│   │   └── messaging/      # RabbitMQ publisher/consumer/event
│   ├── db/postgres/        # Script khởi tạo & seed dữ liệu PostgreSQL
│   └── docker-compose.yaml # Compose riêng cho backend (kèm pgAdmin)
├── frontend/                # React + TypeScript SPA
│   └── src/
│       ├── pages/          # Trang người dùng & Admin/
│       ├── components/     # Component dùng chung
│       ├── api/            # Axios API clients
│       ├── contexts/ hooks/ # Auth context, custom hooks
│       └── types/          # Type definitions
├── docs/                    # Sơ đồ kiến trúc & tài liệu đồ án
└── docker-compose.yaml      # Compose tổng chạy toàn bộ hệ thống
```

## 🚀 Chạy nhanh với Docker Compose

Yêu cầu: Docker & Docker Compose.

```bash
docker compose up --build
```

Sau khi các service khởi động:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api |
| PostgreSQL | localhost:5433 |
| RabbitMQ Management | http://localhost:15672 (`guest` / `guest`) |
| Redis | localhost:6379 |

## ⚙️ Cấu hình biến môi trường

Sao chép `backend/.env.example` thành `backend/.env` và điền các giá trị cần thiết (JWT secret, VNPay, Gmail SMTP, AWS S3, AI API key...) trước khi chạy ở môi trường thật. Khi chạy bằng `docker compose up`, các biến DB/Redis/RabbitMQ đã có giá trị mặc định phù hợp cho môi trường local.

## 💻 Chạy riêng từng phần (development)

**Backend**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

> Cần PostgreSQL, Redis, RabbitMQ đang chạy (có thể dùng `docker compose up postgres redis rabbitmq` từ thư mục gốc, hoặc xem hướng dẫn chi tiết trong [`backend/db/postgres/README.md`](./backend/db/postgres/README.md)).

## 🛡️ Fault Tolerance & Scalability

- Client: rate limiter + retry (4 giây) trong `frontend/src/api/axiosInstance.ts`
- Server: rate limiter trong `backend/.../config/ServerRateLimitFilter.java`
- Khoá tồn kho qua Redis để tránh oversell khi có nhiều request đặt hàng đồng thời
- Xử lý sự kiện đơn hàng/thanh toán bất đồng bộ qua RabbitMQ để tách rời và tăng khả năng chịu lỗi giữa các service
- Hướng dẫn scale-out / load balancer: xem `docs/fault-tolerance-scalability.md` (nếu có)

## Thành viên

- Lê Vũ Thanh Dương
- Nguyễn Văn Huy
