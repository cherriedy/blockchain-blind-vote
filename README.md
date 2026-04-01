# 🗳️ Blind - Hệ thống Bầu chọn Blockchain

Hệ thống bầu chọn **nặc danh** dành cho sinh viên, xây dựng trên **Polygon Amoy Testnet**. Kết hợp Smart Contract để đảm
bảo tính **minh bạch**, NestJS + MongoDB để quản lý danh tính và RSA Blind Signature để bảo vệ sự ẩn danh của cử tri.

---

## Kiến trúc hệ thống

```
blockchain-hethongbaucu/
├── blockchain/                  # Smart Contract (Hardhat + Solidity)
│   ├── contracts/
│   │   ├── BlindBallotBox.sol   # Contract bầu chọn chính
│   │   └── utils/
│   │       └── RsaSignatureVerifier.sol
│   └── scripts/
│       └── deploy.js
├── web-dashboard/
│   ├── backend/                 # API Server (NestJS + Prisma + MongoDB)
│   │   ├── src/
│   │   └── prisma/
│   └── frontend/                # Giao diện người dùng (Next.js)
│       └── src/
│           ├── pages/
│           │   ├── index.js      # Trang chủ
│           │   ├── register.js   # Đăng ký cử tri
│           │   ├── vote.js       # Trang bầu chọn (nặc danh)
│           │   ├── dashboard.js  # Dashboard chung
│           │   └── admin.js      # Quản trị viên
│           └── constants/
│               └── index.js      # ABI + địa chỉ Smart Contract
├── docker/
│   └── mongo-init-replica.sh    # Script khởi tạo MongoDB Replica Set
├── docker-compose.yml
└── .env                         # Biến môi trường gốc (xem bên dưới)
```

---

## Tech Stack

| Layer          | Công nghệ                                      |
|----------------|------------------------------------------------|
| Smart Contract | Solidity 0.8.28, Hardhat, Polygon Amoy         |
| Backend        | NestJS 11, Prisma 5, MongoDB 7, Ethers.js v6   |
| Frontend       | Next.js 16, React 19, MUI, Ethers.js v6, Axios |
| Database       | MongoDB (Replica Set – bắt buộc cho Prisma)    |
| Ẩn danh        | RSA Blind Signature                            |
| Ví tiền        | MetaMask                                       |
| Container      | Docker + Docker Compose                        |

---

## Yêu cầu môi trường

- **Docker** >= 24 & **Docker Compose** >= 2.20
- **MetaMask** (browser extension)
- Tài khoản ví có **MATIC testnet** trên Polygon Amoy → [Polygon Faucet](https://faucet.polygon.technology)

> **Nếu chạy thủ công (không dùng Docker):** Node.js >= 18 và MongoDB đang chạy local với Replica Set.

---

## Hướng dẫn chạy bằng Docker Compose

### 1. Clone repository về máy:

```bash
git clone <repo-url>
cd blockchain-hethongbaucu
```

### 2. Cấu hình biến môi trường

Sao chép và chỉnh sửa file `.env` ở thư mục gốc:

```bash
cp .env .env.local   # tuỳ chọn – giữ nguyên .env nếu muốn
```

Các biến quan trọng cần điền:

```env
# Private key của ví Admin (không có 0x prefix)
ADMIN_PRIVATE_KEY=<your_admin_private_key>

# Địa chỉ Smart Contract sau khi deploy (xem bước 3)
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Địa chỉ ví Admin hiển thị trên frontend
NEXT_PUBLIC_ADMIN_ADDRESS=<your_admin_wallet_address>

# RPC endpoint (mặc định: Polygon Amoy)
RPC_URL=https://rpc-amoy.polygon.technology

# RSA Blind Signature key (để trống → tự tạo ephemeral key, chỉ dùng cho dev)
RSA_BLIND_PRIVATE_KEY=
```

### 3. (Tùy chọn) Deploy Smart Contract lên Polygon Amoy

> Bỏ qua bước này nếu contract đã được deploy sẵn.

```bash
# Deploy contract từ container blockchain
docker compose run --rm blockchain \
  npx hardhat run scripts/deploy.js --network amoy
```

Sau khi deploy, cập nhật `CONTRACT_ADDRESS` và `NEXT_PUBLIC_CONTRACT_ADDRESS` trong `.env`.

### 4. Khởi động toàn bộ hệ thống

```bash
docker compose up --build
```

Dịch vụ sẽ khởi động theo thứ tự:

| Thứ tự | Service      | Mô tả                                      |
|--------|--------------|--------------------------------------------|
| 1      | `mongodb`    | MongoDB 7 với Replica Set (rs0)            |
| 2      | `mongo-init` | Khởi tạo Replica Set (chạy 1 lần rồi dừng) |
| 3      | `backend`    | NestJS API tại `http://localhost:5000`     |
| 4      | `frontend`   | Next.js UI tại `http://localhost:3000`     |

### 5. Truy cập ứng dụng

| URL                            | Mô tả                     |
|--------------------------------|---------------------------|
| http://localhost:3000          | Giao diện người dùng      |
| http://localhost:3000/register | Đăng ký cử tri            |
| http://localhost:3000/vote     | Trang bầu chọn            |
| http://localhost:3000/admin    | Dashboard quản trị        |
| http://localhost:5000/api/docs | Swagger API Documentation |

### 6. Xem logs

```bash
# Xem logs tất cả service
docker compose logs -f

# Xem logs theo service cụ thể
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### 7. Dừng hệ thống

```bash
docker compose down

# Dừng và xoá cả volume (dữ liệu MongoDB)
docker compose down -v
```

---

## Hướng dẫn chạy thủ công

### Backend

```bash
cd web-dashboard/backend
npm install
```

Cập nhật `web-dashboard/backend/.env`:

```env
PORT=5000
DATABASE_URL=mongodb://127.0.0.1:27017/voting_db?replicaSet=rs0&directConnection=true
FRONTEND_URL=http://localhost:3000
RPC_URL=https://rpc-amoy.polygon.technology
CONTRACT_ADDRESS=<contract_address>
ADMIN_PRIVATE_KEY=<admin_private_key>
RSA_BLIND_PRIVATE_KEY=
```

```bash
npm run start:dev    # development mode
# hoặc
npm run build && npm run start:prod
```

### Frontend

```bash
cd web-dashboard/frontend
npm install
```

Cập nhật `web-dashboard/frontend/.env`:

```env
NEXT_PUBLIC_ADMIN_ADDRESS=<admin_wallet_address>
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_CONTRACT_ADDRESS=<contract_address>
```

```bash
npm run dev     # development mode (http://localhost:3000)
```

### Blockchain (Hardhat)

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```

---

## Luồng hoạt động

### Cử tri (Sinh viên)

1. Vào `/register` → nhập MSSV + kết nối **Ví A** (ví đăng ký danh tính).
2. Chờ Admin duyệt tài khoản.
3. Sau khi được duyệt, vào `/vote` → nhấn **"Đổi ví bầu chọn"** để chuyển sang **Ví B** (ví nặc danh).
4. Chữ ký mù RSA được tạo để tách liên kết giữa danh tính và lá phiếu.
5. Bầu chọn bằng Ví B — giao dịch ghi lên Blockchain, danh tính được bảo vệ hoàn toàn.

### Quản trị viên (Admin)

[//]: # (1. Vào `/admin` → kết nối ví Admin.)

[//]: # (2. Tạo kỳ bầu chọn &#40;tiêu đề, danh sách ứng viên, thời gian&#41;.)

[//]: # (3. Duyệt sinh viên đã đăng ký.)

[//]: # (4. Theo dõi kết quả thời gian thực qua WebSocket.)

[//]: # (5. Kết thúc kỳ bầu chọn khi cần.)

---

## Smart Contract

Contract `BlindBallotBox` được deploy trên **Polygon Amoy Testnet**.

Nếu muốn deploy lại:

```bash
# Bằng Docker
docker compose run --rm blockchain \
  npx hardhat run scripts/deploy.js --network amoy

# Bằng Hardhat trực tiếp
cd blockchain
npx hardhat run scripts/deploy.js --network amoy
```

Sau khi deploy, cập nhật các giá trị sau trong `.env`:

- `CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_ADMIN_ADDRESS` (địa chỉ ví dùng để deploy)
- `ADMIN_PRIVATE_KEY` (private key của ví deploy)

---

## Biến môi trường tổng hợp

| Biến                           | Service  | Mô tả                                            |
|--------------------------------|----------|--------------------------------------------------|
| `ADMIN_PRIVATE_KEY`            | Backend  | Private key ví Admin (không có 0x)               |
| `CONTRACT_ADDRESS`             | Backend  | Địa chỉ Smart Contract đã deploy                 |
| `RPC_URL`                      | Backend  | RPC endpoint của blockchain network              |
| `RSA_BLIND_PRIVATE_KEY`        | Backend  | RSA private key cho Blind Signature (PEM)        |
| `DATABASE_URL`                  | Backend  | Chuỗi kết nối MongoDB (tự động set trong Docker) |

[//]: # (| `NEXT_PUBLIC_BACKEND_URL`      | Frontend | URL của Backend API                              |)

[//]: # (| `NEXT_PUBLIC_ADMIN_ADDRESS`    | Frontend | Địa chỉ ví Admin                                 |)

[//]: # (| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Frontend | Địa chỉ Smart Contract                           |)
