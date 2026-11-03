#!/bin/bash
# Build Tauri Desktop - CRM Gráfica

echo "=== Building Frontend ==="
cd frontend-node && pnpm build && cd ..

echo ""
echo "=== Building Tauri .deb/.exe ==="
cd src-tauri && cargo tauri build && cd ..

echo ""
echo "=== Build Complete! ==="
ls -la src-tauri/target/release/bundle/debian/*.deb 2>/dev/null && echo ".deb file created!"
ls -la src-tauri/target/release/*.exe 2>/dev/null && echo ".exe file created!"