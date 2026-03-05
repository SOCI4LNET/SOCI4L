# SOCI4L Score System

A reputation and activity scoring system for SOCI4L profiles. Scores are designed to be valuable - even 10 points matters.

## Overview

The SOCI4L Score measures profile completeness and social engagement. It uses a tiered system where early actions are worth more than later ones, keeping scores meaningful and not inflated.

## Score Categories

### Profile Completion

| Action | Points | Description |
|--------|--------|-------------|
| Claim Profile | +5 | Claiming ownership of your wallet address |
| Display Name | +2 | Adding a display name to your profile |
| Bio | +3 | Adding a bio/description |
| Social Links | +1 each (max 5) | Adding Twitter, GitHub, LinkedIn, etc. |
| Profile Links | +1 each (max 10) | Adding custom links to your profile |

**Maximum from Profile Completion: 25 points**

### Social & Activity

| Action | Points | Description |
|--------|--------|-------------|
| Verified Social | +3 each (max 9) | Authenticating your social accounts (Twitter, GitHub) via OAuth to prove Sybil resistance. |
| Donations Sent | +1 each (max 10) | Actively sending donations to other users on the platform. |

### Followers (Diminishing Returns)

Followers use a **tiered diminishing returns** system to prevent score inflation:

| Follower Range | Points per Follower | Cumulative Max |
|----------------|---------------------|----------------|
| 1-10 | 1.0 | 10 |
| 11-50 | 0.5 | 30 |
| 51-200 | 0.25 | 67.5 |
| 200+ | 0.1 | Unlimited |

### Examples

| Profile | Followers | Activity | Score |
|---------|-----------|----------|-------|
| New user | 5 | None | 5 |
| Active user | 20 | Verified Twitter (+3), 2 Donations Sent (+2) | 10 + 5 + 3 + 2 = **20** |
| Popular | 100 | Verified Github & Twitter (+6), 15 Donations (+10 max) | 10 + 20 + 12.5 + 6 + 10 = **58.5** |
| Influencer | 500 | 10+ Donations (+10), 3 Verified Socials (+9) | 10 + 20 + 37.5 + 30 + 19 = **116.5** |

## Score Tiers

| Tier | Label | Minimum Score |
|------|-------|---------------|
| starter | Starter | 0 |
| newcomer | Newcomer | 5 |
| rising | Rising | 10 |
| established | Established | 25 |
| elite | Elite | 50 |
| legendary | Legendary | 100 |

## Sample Profiles

### Minimal Profile (Starter)
- Not claimed, no info
- **Score: 0**

### Basic Claimed Profile (Newcomer)
- Claimed (+5)
- Display name (+2)
- **Score: 7**

### Complete Profile with Some Followers (Rising)
- Claimed (+5)
- Display name (+2)
- Bio (+3)
- 3 social links (+3)
- 5 profile links (+5)
- 15 followers (+12.5)
- 1 Verified Twitter (+3)
- **Score: 33.5**

### Popular Profile (Elite)
- Claimed (+5)
- Display name (+2)
- Bio (+3)
- 5 social links (+5)
- 10 profile links (+10)
- 100 followers (+42.5)
- 2 Verified Socials (+6)
- 5 Donations Sent (+5)
- **Score: 78.5**

## API Endpoint

```
GET /api/profile/{address}/score
```

### Response

```json
{
  "address": "0x...",
  "score": 33.5,
  "tier": "rising",
  "tierLabel": "Rising",
  "breakdown": {
    "profileClaimed": 5,
    "displayName": 2,
    "bio": 3,
    "socialLinks": 3,
    "profileLinks": 5,
    "verifiedSocials": 3,
    "donationsSent": 0,
    "followers": 12.5,
    "total": 33.5
  }
}
```

## Future Extensions

The score system is designed to be extensible. Planned additions:

| Feature | Points | Status |
|---------|--------|--------|
| NFT Showcase | +1 per NFT (max 5) | Planned |
| Transaction Activity | Tiered | Planned |
| Profile Age | +1 per month (max 12) | Planned |
| Verified Links | +2 per verified | Planned |
| Following Count | Tiered | Planned |

## Implementation

- **Score Calculation**: `lib/score.ts`
- **API Endpoint**: `app/api/profile/[address]/score/route.ts`
- **Database Helpers**: `lib/db.ts` (getFollowersCount, getProfileLinks, getSocialLinks, getVerifiedSocialsCount, getDonationsSentCount)
- **UI Display**: `app/p/[id]/page.tsx` (Badge in profile header)

## Design Principles

1. **Every point matters** - Scores stay low enough that 10 points is meaningful
2. **Diminishing returns** - Prevents whales from having astronomically high scores
3. **Completeness rewarded** - Filling out your profile is valuable
4. **Social engagement** - Building a following and verifying accounts increases your score
5. **Platform usage** - Using core platform features like donations increases score (capped to prevent farming)
6. **Extensible** - Easy to add new scoring factors in the future
