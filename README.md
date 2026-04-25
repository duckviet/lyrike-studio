# 1. Tạo virtual environment và cài dependencies

uv sync --extra cpu # Dùng CPU (khuyến nghị ban đầu)

# uv sync --extra cuda # Dùng GPU nếu có CUDA

# 2. Chạy project

uv run main.py

# 3. Chạy frontend mới (Lyrics Studio shell)

Frontend mới đang chạy song song để migrate dần, không thay thế ngay UI cũ.

cd frontend
npm install
npm run dev

Mặc định:

- Backend legacy + API: http://localhost:8080
- Frontend Lyrics Studio shell: http://localhost:5173
