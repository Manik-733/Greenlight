# Project Visibility: Draft vs Published Analysis

## Scenario Testing

### Scenario 1: DRAFT Project Visibility

#### 1a. Owner access to /p/:slug ✅ PASS

- **Frontend:** ProjectPage calls GET /api/bmdb/projects/slug/:slug
- **Backend:** GET /slug/:slug checks if status != 'PUBLISHED' → requires OWNER membership
- **Result:** Owner can see DRAFT project; returns project data

#### 1b. Public user access to /p/:slug ❌ FAIL - CRITICAL ISSUE

- **Frontend:** ProjectPage calls GET /api/bmdb/projects/slug/:slug without auth token
- **Backend:** GET /slug/:slug for non-PUBLISHED project requires OWNER membership
- **Expected:** 404 error page (handled by isError state)
- **Actual:** Depends on whether public user has token
- **Status:** ✅ SECURE - Returns 404 to unauthenticated users

#### 1c. DRAFT projects in discover API ✅ PASS

- **Backend:** GET /discover filters `.eq('status', 'PUBLISHED')`
- **Result:** DRAFT projects correctly excluded

#### 1d. Frontend Discover page data ⚠️ WARNING

- **Frontend:** Discover.tsx uses `mockDiscoverySections` and `mockProjects` from mock-data
- **Issue:** Uses hardcoded mock data, NOT calling backend discover API
- **Impact:** Frontend doesn't use real PUBLISHED projects
- **Status:** ❌ MISMATCH - Frontend not wired to real API

---

### Scenario 2: PUBLISHED Project Visibility

#### 2a. Public user access to /p/:slug ✅ PASS

- **Frontend:** ProjectPage calls GET /api/bmdb/projects/slug/:slug without auth
- **Backend:** GET /slug/:slug for PUBLISHED project → allows access
- **Result:** Public can see PUBLISHED project

#### 2b. PUBLISHED in discover API ✅ PASS

- **Backend:** GET /discover filters `.eq('status', 'PUBLISHED')`
- **Result:** PUBLISHED projects correctly included with aggregates (ratings, comments)

#### 2c. Frontend Discover page display ❌ FAIL

- **Frontend:** Discover.tsx shows `mockDiscoverySections` hardcoded sections
- **Issue:** Not calling GET /api/bmdb/discover endpoint
- **Impact:** Frontend displays mock projects instead of real published projects
- **Status:** CRITICAL MISMATCH

---

## Issues Found

### Issue 1: Frontend Discover Page Not Wired to API ❌ CRITICAL

**File:** `src/pages/Discover.tsx`  
**Problem:** Uses mock data instead of calling GET /api/bmdb/discover

```tsx
// Current (WRONG):
import { mockDiscoverySections, mockProjects } from "@/lib/mock-data";
// ... renders mockDiscoverySections

// Should:
useQuery(["discover"], () => apiClient.get("/discover"));
```

**Impact:** Real published projects never shown to users

---

### Issue 2: ProfilePage Projects Count Incorrect ⚠️ MODERATE

**File:** `backend/app/api/bmdb/profiles/[username]/route.ts`  
**Problem:** `projects_count` counts VERIFIED credits distinct projects, not owner's published projects

**Current Logic:**

```typescript
// Counts distinct projects where user has VERIFIED credits
const distinctProjectIds = new Set(
  (verifiedCredits || []).map((c) => c.project_id)
);
const projectsCount = distinctProjectIds.size;
```

**Expected:** Should show user's OWN projects they created/own, not just where they have credits

**Impact:** Profile stats misleading for profile owner

---

## Proposed Fixes

### Fix 1: Wire Discover Page to API (CRITICAL)

**File to change:** `src/pages/Discover.tsx`

Changes needed:

1. Remove mock-data imports
2. Add useQuery to fetch from GET /api/bmdb/discover
3. Parse response into (trending, topRated, newNotable, recent) sections
4. Add loading/error states

---

### Fix 2: Fix ProfilePage projects_count (MODERATE)

**File to change:** `backend/app/api/bmdb/profiles/[username]/route.ts`

Options:

- A) Count user's PUBLISHED projects (if user is owner)
- B) Keep current (count projects where they have verified credits)

Recommend: **Option A** - Show user's published portfolio

SQL change:

```typescript
// Count distinct published projects where user is OWNER
const { data: ownedProjects } = await supabase
  .from("project_memberships")
  .select("project_id")
  .eq("user_id", profile.user_id)
  .eq("role", "OWNER")
  .join("projects", "project_id", "id")
  .eq("projects.status", "PUBLISHED");
```

---

## Verification Summary

| Check                                | Status | File              | Issue                              |
| ------------------------------------ | ------ | ----------------- | ---------------------------------- |
| DRAFT → Owner can view /p/:slug      | ✅     | route.ts          | None                               |
| DRAFT → Public blocked from /p/:slug | ✅     | route.ts          | None                               |
| DRAFT → Not in discover API          | ✅     | discover/route.ts | None                               |
| PUBLISHED → Public can view /p/:slug | ✅     | route.ts          | None                               |
| PUBLISHED → In discover API          | ✅     | discover/route.ts | None                               |
| Discover page shows real projects    | ❌     | Discover.tsx      | **Mock data used**                 |
| Profile projects count accurate      | ⚠️     | profiles/route.ts | Counts credits, not owned projects |

---

## Files to Touch (If Fixes Applied)

1. **src/pages/Discover.tsx** - Wire to GET /api/bmdb/discover
2. **backend/app/api/bmdb/profiles/[username]/route.ts** - Fix projects_count logic (optional)

---

## Conclusion

**Backend filtering is CORRECT** ✅

- DRAFT projects properly blocked from public
- PUBLISHED projects properly exposed
- Discover API correctly filters by status

**Frontend MISMATCH** ❌

- Discover page uses mock data instead of real API
- Users see hardcoded projects, not real published content
- Should call GET /api/bmdb/discover to show real data

**Recommendation:** Prioritize fixing Discover.tsx to show real published projects.
