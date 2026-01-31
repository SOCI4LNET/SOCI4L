# Project Sitemap & Information Architecture (IA)

This sitemap documents the real-world structure and navigation of the Avalanche Project.

## 1. Domains & Responsibilities

The product is explicitly split into three distinct domains with no overlap:

| Domain | Responsibility | Access |
| :--- | :--- | :--- |
| **Dashboard** | Wallet data, assets, activity, social graph. | **READ-ONLY** |
| **Studio** | Profile composition, content, analytics. | **WRITE / COMPOSE** |
| **Account** | Privacy, safety, global settings. | **CONTROL** |

---

## 2. Application Routes (`/app`)

### 🏠 Public Access
- **`/`**: Home page (Marketing / Entry).
- **`/p/[id]`**: **Public Profile**. View a user's digital identity.
  - Sub-views: `/insights` (Publicly visible analytics).
- **`/r/[linkId]/track`**: **Link Redirection**. Analytics tracking for outgoing clicks.

### 📊 Dashboard (`/dashboard/[address]`)
**Root: Wallet & Read-Only Data**
- **Overview** (`?tab=overview`): High-level wallet summary & activity.
- **Assets** (`?tab=assets`): Detailed token & NFT inventory.
- **Activity** (`?tab=activity`): Transaction history.
- **Social** (`?tab=social`): Network graph (Following/Followers).

### 🎨 Studio (`/dashboard/[address]`)
**Root: Composition & Performance**
- **Builder** (`?tab=builder`): **Studio Entry**. Identity editor (Bio, Roles, Socials).
- **Links** (`?tab=links`): Link stack management.
  - Sub-route: `/links/[linkId]` (Individual link details).
- **Insights** (`?tab=insights`): Profile performance metrics.

### ⚙️ Account (`/dashboard/[address]`)
**Root: Settings & Control**
- **Settings** (`?tab=settings`): **Account Entry**. Global config (Display Name, URL).
- **Safety** (`?tab=safety`): Blocked users, mute lists, privacy controls.

---

## 3. Global UI Features

### 🧭 Navigation
- **`AppSidebar`**: Persistent nav enforcing the Dashboard/Studio/Account hierarchy.
- **`AppTopbar`**: Context-aware breadcrumbs (`Dashboard > Overview`, `Studio > Links`).

### 👛 Wallet Menu
- Quick access to Public Profile and Disconnect.

---

## 4. Implementation Status
- **Routes**: Universally mapped to `/dashboard/[address]` with `?tab` query parameters acting as sub-routes.
- **Breadcrumbs**: "Virtual" routing implemented to simulate distinct domain paths.
