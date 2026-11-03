#!/bin/bash
# Build script for Tauri
# Must be run from project root

echo "Building frontend-node..."
cd frontend-node && pnpm build && cd ..

echo "Building Tauri..."
cargo tauri build --no-verify

echo "Build complete!"
