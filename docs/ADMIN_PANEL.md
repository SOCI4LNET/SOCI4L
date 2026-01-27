# SOCI4L Admin Panel

## Overview

Admin panel for managing the SOCI4L platform. Accessible only to whitelisted wallet addresses.

**Route:** `/admin`  
**Auth:** Wallet-based, address whitelist

---

## Pages & Features

### 1. Overview (Dashboard)

**Route:** `/admin`

| Metric | Description |
|--------|-------------|
| Total Users | Count of claimed profiles |
| Daily/Weekly Active | Users with recent activity |
| Total Follows | Platform-wide follow relationships |
| Total Link Clicks | Aggregated click count |
| New Signups (24h) | Recent profile claims |
| Growth Charts | Trend visualization |

---

### 2. Users

**Route:** `/admin/users`

**Features:**
- Paginated user list
- Search by address, slug, display name
- Filter by: claimed/unclaimed, date range, score tier
- Sort by: created date, score, followers

**User Detail View:**
- Profile information
- Links and categories
- Followers/following list
- Activity history
- Score breakdown

**Actions:**
- View public profile
- View dashboard (read-only)
- Flag/ban (future)

---

### 3. Analytics

**Route:** `/admin/analytics`

**Platform Metrics:**
- Most viewed profiles
- Most clicked links
- Top followed users
- Score distribution by tier
- Daily/weekly/monthly trends

**Traffic Analysis:**
- Source breakdown (direct, QR, referral)
- Geographic distribution (future)
- Device/browser stats (future)

---

### 4. Content

**Route:** `/admin/content`

**Features:**
- Recent links added
- Flagged/reported content (future)
- Spam detection queue (future)
- Link validation status

---

### 5. Subscribers

**Route:** `/admin/subscribers`

**Features:**
- Email subscriber list
- Export to CSV
- Subscription date
- Unsubscribe management

---

### 6. System

**Route:** `/admin/system`

**Features:**
- API usage stats
- Error logs
- Cache management
- Database stats

---

### 7. Settings

**Route:** `/admin/settings`

**Features:**
- Admin user management (add/remove addresses)
- Feature flags
- Platform configuration
- Maintenance mode toggle

---

## Implementation Phases

### Phase 1 (MVP)
- [ ] Admin auth middleware
- [ ] Overview dashboard with key metrics
- [ ] Users list with search
- [ ] Basic analytics

### Phase 2
- [ ] Email subscribers management
- [ ] Detailed analytics charts
- [ ] User detail view
- [ ] Settings page

### Phase 3
- [ ] Content moderation
- [ ] Spam detection
- [ ] Advanced reporting
- [ ] Export functionality

---

## Security

- Wallet-based authentication only
- Address whitelist in environment variable
- All admin actions logged
- Read-only by default, explicit write permissions

---

## Technical Notes

### Admin Address Whitelist

```typescript
// Environment variable
ADMIN_ADDRESSES=0xaddr1,0xaddr2,0xaddr3

// Middleware check
const isAdmin = ADMIN_ADDRESSES.includes(sessionAddress.toLowerCase())
```

### Route Protection

```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  // Check session, redirect if not admin
  // Render admin shell with sidebar
}
```
