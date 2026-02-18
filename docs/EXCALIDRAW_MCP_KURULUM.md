# Excalidraw MCP Kurulum Kılavuzu

Bu kılavuz, projenizin mimari diagramını Excalidraw MCP ile çizmek için gerekli kurulum adımlarını içerir.

## 📋 İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [Kurulum](#kurulum)
3. [Canvas Server'ı Başlatma](#canvas-serverı-başlatma)
4. [Cursor MCP Yapılandırması](#cursor-mcp-yapılandırması)
5. [Kullanım](#kullanım)
6. [Sorun Giderme](#sorun-giderme)

## Ön Gereksinimler

- Node.js >= 18.0.0
- npm veya pnpm
- Git
- Cursor IDE

## Kurulum

### Adım 1: mcp_excalidraw Repository'sini Klonlayın

Proje dizininizin bir üst klasörüne gidin ve repository'yi klonlayın:

```bash
cd ..
git clone https://github.com/yctimlin/mcp_excalidraw.git
```

### Adım 2: Bağımlılıkları Yükleyin ve Build Edin

```bash
cd mcp_excalidraw
npm install
npm run build
```

Build işlemi tamamlandığında `dist` klasörü oluşturulacaktır.

## Canvas Server'ı Başlatma

Canvas server, Excalidraw arayüzünü ve REST API'yi sağlar. Canvas server çalışırken MCP server çalışabilir.

### Windows (PowerShell)

```powershell
.\scripts\start-excalidraw-canvas.ps1
```

veya manuel olarak:

```powershell
cd ..\mcp_excalidraw
$env:HOST = "0.0.0.0"
$env:PORT = "3000"
npm run canvas
```

### Linux/macOS

```bash
chmod +x scripts/start-excalidraw-canvas.sh
./scripts/start-excalidraw-canvas.sh
```

veya manuel olarak:

```bash
cd ../mcp_excalidraw
HOST=0.0.0.0 PORT=3000 npm run canvas
```

Canvas server başladıktan sonra tarayıcıda `http://localhost:3000` adresini açarak Excalidraw arayüzünü görebilirsiniz.

## Cursor MCP Yapılandırması

MCP yapılandırması proje root dizininde `.cursor/mcp.json` dosyasında yapılır.

### Otomatik Yapılandırma (Önerilen)

Script ile otomatik yapılandırma:

```powershell
.\scripts\setup-cursor-mcp.ps1
```

Bu script:
- `.cursor` klasörünü oluşturur
- `mcp_excalidraw` path'ini otomatik bulur
- `.cursor/mcp.json` dosyasını oluşturur

### Manuel Yapılandırma

`.cursor/mcp.json` dosyasını manuel olarak oluşturun:

```json
{
  "mcpServers": {
    "excalidraw": {
      "command": "node",
      "args": ["C:\\Users\\meric\\.gemini\\antigravity\\scratch\\mcp_excalidraw\\dist\\index.js"],
      "env": {
        "EXPRESS_SERVER_URL": "http://localhost:3000",
        "ENABLE_CANVAS_SYNC": "true"
      }
    }
  }
}
```

**Önemli**: `args` içindeki path'i kendi sisteminize göre güncelleyin!

Path'i bulmak için:
```powershell
Resolve-Path "..\mcp_excalidraw\dist\index.js"
```

### Cursor'ı Yeniden Başlatın

Yapılandırma değişikliklerinin etkili olması için Cursor IDE'yi yeniden başlatmanız gerekebilir.

## Kullanım

### 1. Canvas Server'ı Başlatın

İlk terminalde canvas server'ı çalıştırın:

```powershell
.\scripts\start-excalidraw-canvas.ps1
```

### 2. Cursor'da MCP Araçlarını Kullanın

Cursor'da AI asistanınıza şu şekilde komutlar verebilirsiniz:

- **"Projenin mimari diagramını çiz"** - Projenin genel mimarisini oluşturur
- **"Dashboard bileşenlerinin akış diyagramını çiz"** - Belirli bir bileşen akışını gösterir
- **"Veritabanı şemasını görselleştir"** - Prisma schema'yı diagram olarak gösterir

### 3. Canvas'ı Görüntüleyin

Tarayıcıda `http://localhost:3000` adresini açarak çizilen diagramları görüntüleyebilirsiniz.

## MCP Araçları

Excalidraw MCP server'ı 26 farklı araç sağlar:

### Element CRUD
- `create_element` - Yeni element oluştur
- `get_element` - Element bilgilerini getir
- `update_element` - Element güncelle
- `delete_element` - Element sil
- `query_elements` - Elementleri sorgula
- `batch_create_elements` - Toplu element oluştur
- `duplicate_elements` - Elementleri çoğalt

### Layout
- `align_elements` - Elementleri hizala
- `distribute_elements` - Elementleri dağıt
- `group_elements` - Elementleri grupla
- `ungroup_elements` - Grupları çöz
- `lock_elements` - Elementleri kilitle
- `unlock_elements` - Kilitleri aç

### Scene Awareness
- `describe_scene` - Canvas'ı metin olarak açıkla
- `get_canvas_screenshot` - Canvas ekran görüntüsü al

### File I/O
- `export_scene` - Sahneyi dışa aktar
- `import_scene` - Sahneyi içe aktar
- `export_to_image` - Görüntü olarak dışa aktar
- `export_to_excalidraw_url` - Paylaşılabilir URL oluştur
- `create_from_mermaid` - Mermaid diagramından oluştur

### State Management
- `clear_canvas` - Canvas'ı temizle
- `snapshot_scene` - Sahne anlık görüntüsü al
- `restore_snapshot` - Anlık görüntüyü geri yükle

### Viewport
- `set_viewport` - Görünüm alanını ayarla

### Design Guide
- `read_diagram_guide` - Tasarım kılavuzunu oku

## Sorun Giderme

### Canvas Server Başlamıyor

1. Port 3000'in kullanımda olmadığından emin olun:
   ```powershell
   netstat -ano | findstr :3000
   ```

2. mcp_excalidraw'ın build edildiğinden emin olun:
   ```bash
   cd ../mcp_excalidraw
   npm run build
   ```

### MCP Server Bağlanamıyor

1. Canvas server'ın çalıştığından emin olun (`http://localhost:3000` açılabilmeli)
2. `.cursor/mcp.json` dosyasındaki path'in doğru olduğundan emin olun
3. Cursor IDE'yi yeniden başlatın

### Canvas Güncellenmiyor

1. `ENABLE_CANVAS_SYNC` environment variable'ının `"true"` olduğundan emin olun
2. Canvas server'ın çalıştığından emin olun
3. WebSocket bağlantısını kontrol edin (tarayıcı console'unda hata var mı?)

## Örnek Kullanım Senaryoları

### Senaryo 1: Proje Mimarisi Diagramı

```
Cursor AI'ya: "Bu projenin mimari diagramını çiz. 
- Frontend: Next.js App Router
- Backend: Next.js API Routes
- Database: Prisma + SQLite/PostgreSQL
- Blockchain: wagmi + viem (Avalanche)
- External APIs: Snowtrace, OpenSea, CoinGecko, Avalanche RPC
```

### Senaryo 2: Dashboard Akış Diyagramı

```
Cursor AI'ya: "Dashboard sayfasının kullanıcı akış diyagramını çiz.
Adımlar: Cüzdan bağlama -> Profil kontrolü -> Dashboard görüntüleme"
```

### Senaryo 3: API Endpoint Diyagramı

```
Cursor AI'ya: "API endpoint'lerinin akış diyagramını çiz.
/api/wallet, /api/profile, /api/claim endpoint'lerini göster"
```

## Kaynaklar

- [mcp_excalidraw GitHub Repository](https://github.com/yctimlin/mcp_excalidraw)
- [Excalidraw Resmi Sitesi](https://excalidraw.com/)
- [Model Context Protocol Dokümantasyonu](https://modelcontextprotocol.io/)

## Notlar

- Canvas server'ı durdurduğunuzda tüm elementler kaybolur (in-memory storage)
- Kalıcılık için `export_scene` ve `import_scene` araçlarını kullanabilirsiniz
- Canvas server'ı arka planda çalıştırmak için PowerShell'de `Start-Process` kullanabilirsiniz
