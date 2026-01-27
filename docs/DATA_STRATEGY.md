# SOCI4L Data Strategy

## Purpose

This document outlines what data SOCI4L collects, what we should collect, and the strategy for future analytics.

---

## Current Data (What We Store)

### Database (PostgreSQL via Prisma)

| Table | Fields | Status |
|-------|--------|--------|
| **Profile** | id, address, slug, displayName, bio, socialLinks, layoutConfig, appearanceConfig, status, visibility, claimedAt, createdAt, updatedAt | ✅ Active |
| **Follow** | id, followerAddress, followingAddress, createdAt | ✅ Active |
| **ProfileLink** | id, profileId, categoryId, title, url, enabled, order, createdAt, updatedAt | ✅ Active |
| **LinkCategory** | id, profileId, name, slug, description, order, isVisible, isDefault, createdAt, updatedAt | ✅ Active |
| **ShowcaseItem** | id, profileId, tokenId, contractAddress, createdAt | ✅ Active |
| **EmailSubscription** | id, email, createdAt, updatedAt | ✅ Active |

### Client-Side (localStorage)

| Key | Data | Problem |
|-----|------|---------|
| `soci4l.events.v1` | Profile views, link clicks with timestamps | ⚠️ Client-only, lost on browser clear |
| `soci4l.links.v1` | Link data cache | ⚠️ Redundant with database |
| `soci4l.profileLayout.v2` | Layout preferences | ⚠️ Redundant with database |

---

## Missing Data (What We Should Store)

### High Priority 🔴

| Data | Why Important | Proposed Solution |
|------|---------------|-------------------|
| **Profile Views** | Real analytics, not client-side | `AnalyticsEvent` table |
| **Link Clicks** | Accurate CTR, conversion tracking | `AnalyticsEvent` table |
| **View/Click Source** | Know where traffic comes from | `source` field |
| **Referrer URL** | Attribution tracking | `referrer` field |

### Medium Priority 🟡

| Data | Why Important | Proposed Solution |
|------|---------------|-------------------|
| **Session History** | Security, login patterns | `Session` table |
| **Country/Region** | Geographic insights (anonymized) | `country` field |
| **Device Type** | Mobile vs desktop usage | `device` field |
| **Unfollow Events** | Churn analysis | `FollowEvent` table |

### Low Priority 🟢

| Data | Why Important | Proposed Solution |
|------|---------------|-------------------|
| **Score History** | Track reputation over time | `ScoreSnapshot` table |
| **Profile Edit History** | Audit trail | `ProfileAudit` table |
| **Link Performance History** | Historical CTR | Aggregated tables |

---

## Proposed Database Schema

### AnalyticsEvent (High Priority)

```prisma
model AnalyticsEvent {
  id          String   @id @default(cuid())
  type        String   // 'profile_view' | 'link_click'
  profileId   String   // Profile address (normalized)
  linkId      String?  // For link_click events only
  linkTitle   String?  // Snapshot of link title at click time
  
  // Attribution
  source      String   @default("direct") // 'direct' | 'qr' | 'share' | 'copy'
  referrer    String?  // Referrer URL if available
  
  // Context (privacy-safe)
  country     String?  // 2-letter ISO code
  device      String?  // 'mobile' | 'desktop' | 'tablet'
  
  createdAt   DateTime @default(now())
  
  @@index([profileId])
  @@index([profileId, type])
  @@index([profileId, createdAt])
  @@index([linkId])
  @@index([createdAt])
}
```

### ScoreSnapshot (Medium Priority)

```prisma
model ScoreSnapshot {
  id          String   @id @default(cuid())
  profileId   String   // Profile address
  score       Float
  tier        String
  
  // Breakdown
  profileClaimed  Int   @default(0)
  displayName     Int   @default(0)
  bio             Int   @default(0)
  socialLinks     Int   @default(0)
  profileLinks    Int   @default(0)
  followers       Float @default(0)
  
  createdAt   DateTime @default(now())
  
  @@index([profileId])
  @@index([profileId, createdAt])
}
```

### AdminAuditLog (For Admin Panel)

```prisma
model AdminAuditLog {
  id           String   @id @default(cuid())
  adminAddress String
  action       String   // 'login' | 'view_user' | 'export_data'
  targetType   String?  // 'profile' | 'link' | 'subscriber'
  targetId     String?
  metadata     String?  // JSON additional context
  ipHash       String?  // Hashed IP for security audit
  createdAt    DateTime @default(now())
  
  @@index([adminAddress])
  @@index([action])
  @@index([createdAt])
}
```

---

## Migration Strategy

### Phase 1: Add AnalyticsEvent Table
1. Add `AnalyticsEvent` model to Prisma schema
2. Run migration: `prisma migrate dev`
3. Create API endpoint: `POST /api/analytics/event`
4. Update public profile page to record views
5. Update link redirect to record clicks
6. Keep localStorage as temporary fallback

### Phase 2: Backfill & Transition
1. Create migration script for localStorage → database
2. Run backfill for existing users
3. Update Insights panel to read from database API
4. Deprecate localStorage analytics

### Phase 3: Advanced Analytics
1. Add `ScoreSnapshot` table
2. Create daily cron job for score snapshots
3. Add geographic/device detection
4. Build aggregation queries for admin panel

---

## Privacy Considerations

| Principle | Implementation |
|-----------|----------------|
| No raw IP storage | Derive country at request time, discard IP |
| Pseudonymous | All data tied to wallet address only |
| Session anonymity | Random session IDs, not tied to identity |
| User control | Data deletion on request (GDPR ready) |
| Minimal collection | Only collect what's needed for features |

---

## Data Retention Policy

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| AnalyticsEvent | 12 months | Historical analysis needs |
| ScoreSnapshot | Indefinite | Reputation history is valuable |
| AdminAuditLog | 24 months | Compliance and security |
| Aggregated stats | Indefinite | Anonymized, no privacy concern |

---

## API Endpoints (Proposed)

### Record Event
```
POST /api/analytics/event
{
  "type": "profile_view" | "link_click",
  "profileId": "0x...",
  "linkId": "clxxx..." (optional),
  "source": "direct" | "qr" | "share"
}
```

### Get Profile Analytics
```
GET /api/analytics/profile/{address}?range=7d|30d|all
Response: {
  views: number,
  clicks: number,
  topLinks: [...],
  sourceBreakdown: {...}
}
```

### Admin: Platform Analytics
```
GET /api/admin/analytics?range=7d
Response: {
  totalViews: number,
  totalClicks: number,
  topProfiles: [...],
  growth: {...}
}
```

---

## Implementation Checklist

### Immediate (Before Launch)
- [ ] Add `AnalyticsEvent` to Prisma schema
- [ ] Create `/api/analytics/event` endpoint
- [ ] Update public profile to POST view events
- [ ] Update link redirect to POST click events

### Short-term (Post-Launch)
- [ ] Admin analytics dashboard
- [ ] Insights panel reads from API
- [ ] Remove localStorage dependency

### Long-term
- [ ] Score snapshots and history
- [ ] Geographic analytics
- [ ] Advanced reporting and exports
