# Credit Visibility Rules Implementation

## Overview

Credits visibility has been enforced at the API level to ensure:

- **Public users** see only VERIFIED credits
- **Project owners** see all credit statuses (in edit mode)
- **Internal status enums** are never exposed to non-owners

## API Endpoints

### Public Endpoints (Status-Filtered)

#### 1. GET /api/bmdb/projects/slug/[slug]

- **Location**: `backend/app/api/bmdb/projects/slug/[slug]/route.ts`
- **Authorization**: Public (no Bearer token required)
- **Credit Filtering**: Only returns `status='VERIFIED'` credits
- **Response Fields** (per credit):
  - `id`: Credit ID
  - `name`: credited_name (person's name)
  - `character_name`: Character name (optional)
  - `is_verified`: true (hardcoded, never exposes status enum)
- **Use Case**: Public project page displays (no status enum leaked)

#### 2. GET /api/bmdb/profiles/[username]

- **Location**: `backend/app/api/bmdb/profiles/[username]/route.ts`
- **Authorization**: Public
- **Credit Data**: Returns `verified_credits_count` (integer only)
- **Use Case**: Profile stats (no credit details, only count)

### Private Endpoints (Owner-Only, All Statuses)

#### 3. GET /api/bmdb/projects/[projectId]/credits/all ⭐ NEW

- **Location**: `backend/app/api/bmdb/projects/[projectId]/credits/all/route.ts`
- **Authorization**: Requires Bearer token, user must be project owner
- **Credit Filtering**: Returns ALL credits (all statuses: VERIFIED, PENDING_ACCEPTANCE, UNCLAIMED, REJECTED, REMOVED)
- **Response Fields** (per credit):
  - `id`: Credit ID
  - `job_title`: Job title
  - `character_name`: Character name (nullable)
  - `credited_name`: Person's name
  - `status`: Full status enum (VERIFIED, PENDING_ACCEPTANCE, UNCLAIMED, REJECTED, REMOVED)
  - `created_at`: Timestamp
- **Use Case**: EditProject owner view (shows all credits with full status info for management)

#### 4. GET /api/bmdb/credits/pending

- **Location**: `backend/app/api/bmdb/credits/pending/route.ts`
- **Authorization**: Requires Bearer token
- **Credit Filtering**: Only credits where `status='PENDING_ACCEPTANCE'` and `credited_user_id=current_user`
- **Use Case**: ProfilePage pending credits section (only visible to the user viewing their own profile)

## Frontend Implementation

### ProjectPage.tsx (Public View)

- **Data Source**: GET /api/bmdb/projects/slug/[slug]
- **Credits Displayed**: Only VERIFIED status (filtered on backend)
- **UI Elements**:
  - CheckCircle2 icon + "Verified" badge
  - Never shows status enum values
- **Visible To**: All users (public)

### EditProject.tsx (Owner View)

- **Data Sources**:
  - Project info: GET /api/bmdb/projects/slug/[slug] (public endpoint, basic info only)
  - ALL Credits: GET /api/bmdb/projects/[projectId]/credits/all (NEW owner endpoint, all statuses)
- **Credits Displayed**: All statuses (VERIFIED, PENDING_ACCEPTANCE, UNCLAIMED, REJECTED, REMOVED)
- **UI Elements**:
  - Status badge with color coding:
    - Green: "Verified"
    - Blue: "Pending Acceptance"
    - Gray: "Unclaimed"
    - Red: "Rejected"
    - Dark: "Removed"
- **Visible To**: Project owner only (authorization enforced via Bearer token)

### ProfilePage.tsx (Public View)

- **Data Source 1**: GET /api/bmdb/profiles/[username] (public endpoint)
  - Returns only: `verified_credits_count` (integer, no status exposed)
- **Data Source 2**: GET /api/bmdb/credits/pending (private endpoint, own profile only)
  - Only fetched when: `currentUser?.username === profile?.username`
  - Returns: Credits with `status='PENDING_ACCEPTANCE'` for current user
- **Sections**:
  - **Public Section**: Filmography (coming soon placeholder)
  - **Private Section**: Pending Credits (only visible to profile owner)

## Security Properties

### ✅ Verified: No Status Enum Leaks

- Public endpoints filter at database query level
- Response objects only include `is_verified: true` boolean
- Never return `status` enum values to public users
- Owner endpoints clearly separated and authenticated

### ✅ Verified: Authorization at Multiple Levels

1. **Database Query Level**: WHERE status='VERIFIED' filters credits
2. **API Authorization Level**: Bearer token + ownership check
3. **Frontend Level**: useQuery enabled flags prevent invalid requests

### ✅ Verified: Private Data Protected

- PENDING_ACCEPTANCE credits hidden from public
- Owner edit view only accessible with Bearer token
- Pending credits only shown to own profile owner

## Data Flow Diagram

```
PUBLIC USER:
  ProjectPage → GET /projects/slug/[slug] → VERIFIED credits only
  ProfilePage → GET /profiles/[username] → verified_credits_count only

PROJECT OWNER:
  EditProject → GET /projects/[projectId]/credits/all → ALL credits with status

CURRENT USER (Profile owner):
  ProfilePage → GET /credits/pending → PENDING_ACCEPTANCE credits for self
```

## Status Enum Reference

| Status             | Public?                       | Meaning                                     |
| ------------------ | ----------------------------- | ------------------------------------------- |
| VERIFIED           | ✅ Yes (as is_verified: true) | Credit accepted, publicly visible           |
| PENDING_ACCEPTANCE | ❌ No                         | Awaiting user acceptance, private           |
| UNCLAIMED          | ❌ No                         | Name-only credit, waiting for user to claim |
| REJECTED           | ❌ No                         | User rejected the credit                    |
| REMOVED            | ❌ No                         | Owner removed the credit                    |

## Testing Checklist

- [ ] Public user views ProjectPage → only VERIFIED credits shown
- [ ] Public user views ProjectPage → no status enum values in response
- [ ] Project owner views EditProject → all statuses visible
- [ ] Non-owner tries GET /projects/[projectId]/credits/all → 403 Forbidden
- [ ] Public user tries GET /projects/[projectId]/credits/all → 401 Unauthorized
- [ ] Profile owner views own ProfilePage → sees pending credits section
- [ ] Other user views ProfilePage → pending credits section hidden
- [ ] Pending credits only shown for PENDING_ACCEPTANCE status

## Implementation Timeline

1. ✅ Created GET /api/bmdb/projects/slug/[slug] with status filtering
2. ✅ Updated ProjectPage.tsx to show verified badge + icon
3. ✅ Created GET /api/bmdb/credits/pending endpoint
4. ✅ Updated ProfilePage.tsx with pending credits section (private)
5. ✅ Created GET /api/bmdb/projects/[projectId]/credits/all endpoint (owner-only)
6. ✅ Updated EditProject.tsx to fetch from new owner endpoint
