# Project Sitemap & Information Architecture (IA)

This sitemap documents the real-world structure and navigation of the Avalanche Project.

## 1. Application Routes (`/app`)

### 🏠 Public Access
- **`/`**: Home page (Marketing / Entry).
- **`/p/[id]`**: **Public Profile**. View a user's digital identity by address or custom slug.
  - Sub-views: `/insights` (Publicly visible profile analytics).
- **`/r/[linkId]/track`**: **Link Redirection**. Handles analytics tracking and outgoing redirects for profile links.

### 📊 Dashboard (`/dashboard/[address]`)
The main workspace for connected users, organized by the Sidebar groups:

#### **Group: Platform**
- **Overview** (`?tab=overview`): High-level wallet summary, top holdings, and recent activity.
  - *Actions*: Profile Readiness Checklist (Onboarding).
- **Assets** (`?tab=assets`): Detailed inventory of standard tokens and NFTs.
  - *Actions*: Refresh, Search, Sort, View on Explorer.
- **Activity** (`?tab=activity`): Full transaction history with status filtering.
- **Social** (`?tab=social`): Follower/Following management and networking.

#### **Group: Studio**
- **Builder** (`?tab=builder`): Core identity editor (Bio, Roles, Social Links).
- **Links** (`?tab=links`): Link stack management (CRUD for custom links).
  - *Sub-route*: `/links/[linkId]` (Individual link detailed analytics/edit).
- **Insights** (`?tab=insights`): Real-time metrics for profile views and link clicks.

#### **Group: Account**
- **Safety** (`?tab=safety`): Management for Blocked and Muted users.
- **Settings** (`?tab=settings`): Account-level configuration (Display Name, custom URL claiming).

### 🛠 Administrative
- **`/master-console`**: Super-admin specialized dashboard.
  - Routes: `/users`, `/content`, `/analytics`, `/subscribers`, `/system`.

---

## 2. Global UI Features

### 👛 Wallet Menu (Top Right)
Available on all authenticated pages.
- **Navigation**: View Profile (Public), Dashboard, Master Console (Admin only).
- **Actions**:
  - `Copy`: Copy wallet address / profile link.
  - `Share`: Social sharing options.
  - `QR`: Generate profile QR code.
- **System**: Disconnect wallet.

### 🧭 Navigation (`/components/app-shell`)
- **`AppSidebar`**: Persistent side-nav implementing the Platform vs Studio/Profile hierarchy.
- **`AppTopbar`**: Context-aware breadcrumbs and search.

---

## 3. Implementation Status
- **`/coming-soon`**: 🚧 Empty directory. Route exists but currently renders a blank page (Pending UI implementation).
- **Redirects**: `/dashboard/safety` and `/dashboard/settings` legacy routes now redirect to tab-based versions.
