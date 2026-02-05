# SOCI4L Roadmap

## Vision

SOCI4L is the identity and link intelligence layer for Web3. We turn wallet addresses into human-readable, measurable profiles with real analytics.

---

## Current Status (v1.0)

### ✅ Shipped
- Wallet-based authentication
- Profile claiming and customization
- Display name, bio, social links
- Profile links with categories
- Follow/unfollow system
- SOCI4L Score (reputation system)
- Public profile pages
- QR code generation
- Client-side analytics (views, clicks)
- Profile layout customization
- Theme/appearance settings
- **Admin Panel (v1)**: User management, platform metrics (`/master-console`)
- **Server-Side Analytics**: Database-backed view and click tracking

### ⚠️ Partially Complete
- NFT display (names only, no images)

---

## Planned Features

### 🎯 High Priority (Q1-Q2)

#### 1. OpenSea API Integration
**Status:** Planned (needs API key)  
**Effort:** Low  
**Value:** High (visual appeal)

- NFT images in dashboard
- NFT images on public profile
- Collection metadata
- Floor price display (optional)

**Requirements:**
- OpenSea API key
- Environment variable: `OPENSEA_API_KEY`

---

#### 4. Demo Mode
**Status:** Planned  
**Effort:** Medium  
**Value:** High (investor demos)

Purpose: Show platform with realistic fake data for presentations.

**Features:**
- Admin toggle to enable demo mode
- Pre-seeded demo profiles
- Fake analytics data
- Demo wallet simulation
- Clear visual indicator (dev only)
- One-click reset

**Implementation:**
- `DEMO_MODE=true` environment variable
- Demo data seed script
- Demo-specific API responses
- Watermark or banner in demo mode

---

#### 5. Luma Events Integration
**Status:** Planned (needs Luma Plus)  
**Effort:** Medium  
**Value:** Medium (ecosystem)

- Show hosted/attending events on profile
- Event links with RSVP counts
- Calendar integration
- Upcoming vs past events

**Requirements:**
- Luma Plus subscription
- Luma API access
- OAuth or API key

---

### 🔮 Future Features (Q3-Q4)

#### 6. On-Chain Verification
**Effort:** High  
**Value:** High (trust)

Verify ownership of social accounts on-chain.

- Twitter/X verification via signature
- GitHub verification via gist
- Discord verification via bot
- Verification badge on profile
- Verified links get score bonus

---

#### 7. NFT Showcase
**Effort:** Medium  
**Value:** Medium (personalization)

Go beyond listing - let users curate and highlight NFTs.

- Pin favorite NFTs to profile header
- NFT gallery with custom layout
- Rarity display
- Collection grouping
- "Flexing" feature (animated showcase)

---

#### 8. Achievement / Badge System
**Effort:** Medium  
**Value:** High (engagement)

Gamification layer on top of Score.

**Possible Badges:**
- Early Adopter (first 1000 users)
- Profile Complete (all fields filled)
- Popular (100+ followers)
- Verified (social accounts verified)
- Link Master (10+ links)
- Engaged (follows 50+ profiles)
- OG (profile age > 1 year)
- Event Host (Luma integration)
- NFT Collector (10+ NFTs)
- DeFi User (has DeFi positions)

---

#### 9. DeFi Position Display
**Effort:** High  
**Value:** Medium (power users)

Show on-chain financial activity.

- Lending positions (Aave, Benqi)
- LP positions (TraderJoe, Pangolin)
- Staking positions (sAVAX)
- Portfolio value (optional)
- Historical PnL (very complex)

**Privacy:** Opt-in only, can hide specific positions

---

#### 10. Multi-Chain Support
**Effort:** High  
**Value:** High (growth)

Expand beyond Avalanche C-Chain.

**Priority order:**
1. Avalanche C-Chain (current) ✅
2. Ethereum Mainnet
3. Base
4. Arbitrum
5. Polygon

**Considerations:**
- Same wallet, different balances per chain
- Chain switcher in UI
- Analytics per chain
- NFTs from multiple chains

---

#### 11. API Access (Developer Platform)
**Effort:** High  
**Value:** Medium (ecosystem)

Let developers integrate SOCI4L data.

- Public API for profile data
- API keys for rate limiting
- Webhook notifications
- Embed widgets for external sites
- "Powered by SOCI4L" badge

---

#### 12. Premium Features / Pro Plan
**Effort:** Medium  
**Value:** High (revenue)

Monetization through premium tier.

**Possible Pro Features:**
- Custom domain (yourname.soci4l.net)
- Advanced analytics (export, longer history)
- Priority support
- Custom themes
- Remove "Powered by SOCI4L"
- API access
- Team profiles

**Pricing Ideas:**
- Free tier (current features)
- Pro: $5-10/month or pay with crypto
- Enterprise: Custom pricing

---

#### 13. Referral System
**Effort:** Low  
**Value:** Medium (growth)

Incentivize user-driven growth.

- Unique referral links
- Track signups from referrals
- Score bonus for referrals
- Leaderboard for top referrers
- Possible: Token rewards (if token exists)

---

#### 14. White-Label Solution
**Effort:** High  
**Value:** High (B2B revenue)

Sell SOCI4L as a service to DAOs/projects.

- Custom branding
- Custom domain
- Project-specific profiles
- Integrated with project's ecosystem
- Managed hosting


#### 15. Web3 Social Integration (Lens / Farcaster)
**Effort:** High  
**Value:** High (network effect)  

Import social graph and content from decentralized social protocols.

- "Import from Lens/Farcaster" on onboarding
- Cross-posting content
- Sync profile picture and bio
- Display social graph (followers) on profile

---

#### 16. Degen Mode / Pro Themes
**Effort:** Medium  
**Value:** High (engagement/fun)  

Profile personalization for power users.

- **Themes:** "Whale" (Gold), "Degen" (Matrix/Dark), "Builder" (Minimal)
- Custom fonts and background effects
- Unlockable via achievements or "Pro" status

---


### 💡 Ideas (Backlog)

| Idea | Effort | Value | Notes |
|------|--------|-------|-------|
| ENS/ANS integration | Medium | Medium | Show .eth/.avax names |
| POAP display | Low | Low | Show attendance tokens |
| Farcaster integration | Medium | Medium | Cross-post, import |
| Lens Protocol integration | Medium | Medium | Decentralized social |
| Email notifications | Low | Medium | Follow alerts, weekly digest |
| Mobile app | Very High | Medium | Native iOS/Android |
| Browser extension | Medium | Low | Quick profile lookup |
| DAO membership display | Medium | Medium | Show governance tokens |
| Reputation attestations | High | High | On-chain reputation |
| AI profile summary | Low | Low | Auto-generate bio from activity |

---

## Prioritization Framework

### Scoring Criteria

| Factor | Weight |
|--------|--------|
| User Value | 40% |
| Revenue Potential | 25% |
| Technical Effort | 20% |
| Strategic Alignment | 15% |

### Current Priority Stack

1. **Admin Panel** - Operations necessity
2. **Server-Side Analytics** - Data integrity
3. **OpenSea API** - Quick win, high visual impact
4. **Demo Mode** - Investor readiness
5. **Luma Integration** - Ecosystem expansion

---

## Timeline (Tentative)

### Q1 2026
- [ ] Admin Panel MVP
- [ ] Server-side analytics migration
- [ ] OpenSea API integration

### Q2 2026
- [ ] Demo Mode
- [ ] Luma Events integration
- [ ] Achievement system v1

### Q3 2026
- [ ] On-chain verification
- [ ] NFT Showcase
- [ ] Multi-chain (Ethereum)

### Q4 2026
- [ ] Premium/Pro tier
- [ ] API platform
- [ ] White-label exploration

---

## Technical Debt & V2 Specifics (Immediate)

### 1. Top Interacted (Social Engagement Analysis)
**Status:** Placeholder ("Privacy setting required")
- **File:** `components/dashboard/social-kpi-cards.tsx` and `app/api/profile/[address]/social-stats/route.ts`
- **Plan:** Build privacy consent UI. Once approved, calculate top interacted profiles via `AnalyticsEvent` table.

### 2. Verified Builder Badge
- **Goal:** Auto-verify status based on GitHub repos or smart contract ownership verified via signature.

### 3. Global Leaderboard
- **Goal:** Public ranking page based on "SOCI4L Score". Special rewards for Elite/Legendary ranks.

---

## Dependencies

| Feature | Depends On |
|---------|------------|
| OpenSea NFT images | OpenSea API key |
| Luma Events | Luma Plus subscription |
| Demo Mode | Admin Panel (for toggle) |
| Server-side Analytics | Database schema update |
| Verification | Smart contract or signing service |
| Premium tier | Payment integration (Stripe/crypto) |

---

## Success Metrics

### North Star
**Monthly Active Profiles** - Profiles with at least 1 view in 30 days

### Supporting Metrics
| Metric | Target (6 months) |
|--------|-------------------|
| Claimed Profiles | 10,000 |
| Monthly Profile Views | 100,000 |
| Link Click-Through Rate | 15% |
| Average Score | 25+ |
| Follow Ratio (follows/user) | 5+ |

---

## Open Questions

1. **Token?** - Should SOCI4L have a token? For what utility?
2. **DAO?** - Should governance be decentralized?
3. **Chain focus?** - Stay Avalanche-first or go multi-chain early?
4. **Monetization timing?** - When to introduce Pro tier?
5. **Mobile priority?** - PWA sufficient or native app needed?

---

## Changelog

| Date | Update |
|------|--------|
| 2026-01-30 | Shipping v2 soon 🚢 - Investor Mode & Demo System complete |
| 2026-01-27 | Initial roadmap created |
