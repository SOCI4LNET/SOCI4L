#!/bin/bash
# Excalidraw Canvas Server Başlatma Scripti
# Bu script canvas server'ı başlatır

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_EXCALIDRAW_PATH="$PROJECT_ROOT/../mcp_excalidraw"

if [ ! -d "$MCP_EXCALIDRAW_PATH" ]; then
    echo "Hata: mcp_excalidraw klasörü bulunamadı!"
    echo "Lütfen önce mcp_excalidraw'ı klonlayın:"
    echo "  cd .."
    echo "  git clone https://github.com/yctimlin/mcp_excalidraw.git"
    exit 1
fi

if [ ! -d "$MCP_EXCALIDRAW_PATH/dist" ]; then
    echo "Hata: mcp_excalidraw build edilmemiş!"
    echo "Lütfen önce build edin:"
    echo "  cd $MCP_EXCALIDRAW_PATH"
    echo "  npm install"
    echo "  npm run build"
    exit 1
fi

echo "Excalidraw Canvas Server başlatılıyor..."
echo "Canvas: http://localhost:3000"

cd "$MCP_EXCALIDRAW_PATH"
HOST=0.0.0.0 PORT=3000 npm run canvas
