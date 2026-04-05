# 1. Tạo virtual environment và cài dependencies

uv sync --extra cpu # Dùng CPU (khuyến nghị ban đầu)

# uv sync --extra cuda # Dùng GPU nếu có CUDA

# 2. Chạy project

uv run main.py
