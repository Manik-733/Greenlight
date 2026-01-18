# Fixes Applied - Summary

## Issues Fixed

### 1. ✅ Discover Page Not Wired to Real API

**File:** `src/pages/Discover.tsx`

**Changes:**

- Removed mock data imports (`mockDiscoverySections`, `mockProjects`)
- Added `useQuery` hook to fetch from `/api/bmdb/projects/discover`
- Added loading state with skeleton screens
- Added error state with user-friendly message
- Replaced hardcoded SECTIONS with dynamic data from API response
- Maintained same UI/UX but with real published projects

**Impact:**

- Users now see real published projects in Discover
- Proper loading/error states
- Data refreshes from backend

---

### 2. ✅ Profile projects_count Incorrect

**File:** `backend/app/api/bmdb/profiles/[username]/route.ts`

**Changes:**

- Changed from counting projects where user has VERIFIED credits
- Now counts user's PUBLISHED projects they own (via project_memberships with OWNER role)
- Query:
  1. Find all project_memberships where user is OWNER
  2. Filter to only PUBLISHED projects
  3. Return count of distinct published projects

**Impact:**

- Profile stats now accurately reflect user's published portfolio
- Stats no longer inflated by projects they just have credits on

---

## Files Modified

1. **src/pages/Discover.tsx** - Frontend Discover page wired to real API
2. **backend/app/api/bmdb/profiles/[username]/route.ts** - Profile projects count fixed
3. **backend/app/api/bmdb/projects/route.ts** - POST endpoint (orphan cleanup)
4. **backend/app/api/bmdb/projects/[projectId]/route.ts** - PATCH endpoint (title validation)
5. **backend/supabase/migrations/003_data_integrity_constraints.sql** - New migration (DB constraints)

---

## Phase 2: Data Integrity Constraints (Completed)

### 3. ✅ Project Without OWNER - Critical Data Corruption Risk

**File:** `backend/app/api/bmdb/projects/route.ts` (POST endpoint)

**Problem:** If membership insertion fails after project creation, orphaned project exists without OWNER, breaking the ownership model.

**Solution:** Added cleanup logic - if membership creation fails, delete the orphaned project before returning error.

```typescript
if (membershipError) {
  console.error("Error creating project membership:", membershipError);
  // Delete orphaned project if membership creation fails
  await supabase.from("projects").delete().eq("id", project.id);
  return NextResponse.json(...);
}
```

**Impact:** Guarantees every project has at least one OWNER in project_memberships.

---

### 4. ✅ Published Without Title - Data Validation Gap

**File:** `backend/app/api/bmdb/projects/[projectId]/route.ts` (PATCH endpoint)

**Problem:** Project could be published with empty/null title, creating invalid published state.

**Solution:** Added title validation before allowing publish - validates title is non-empty, returns 400 if empty.

```typescript
if (body.publish) {
  const titleToPublish =
    updateData.title !== undefined ? updateData.title : project.title;
  if (!titleToPublish || titleToPublish.trim().length === 0) {
    return NextResponse.json(
      { error: "Project must have a title to publish" },
      { status: 400 }
    );
  }
  updateData.status = "PUBLISHED";
  updateData.published_at = new Date().toISOString();
}
```

**Impact:** Prevents invalid published projects with no title.

---

### 5. ✅ Duplicate Slugs (Race Condition) - Database Constraint

**File:** `backend/supabase/migrations/003_data_integrity_constraints.sql` (New)

**Problem:** Concurrent requests could both pass slug uniqueness check then both insert same slug, breaking routing/discovery.

**Solution:** Added UNIQUE database constraint on slug column.

```sql
ALTER TABLE projects
ADD CONSTRAINT unique_slug_per_project UNIQUE (slug);
```

**Impact:**

- Database enforces slug uniqueness at storage layer
- Eliminates race condition vulnerability
- Any duplicate slug insert fails with database error

---

### 6. ✅ NULL published_at with PUBLISHED Status - Data Consistency

**File:** `backend/supabase/migrations/003_data_integrity_constraints.sql` (New)

**Problem:** State corruption possible if status=PUBLISHED but published_at=NULL (via direct DB updates or bugs).

**Solution:** Added CHECK constraint to enforce consistency.

```sql
ALTER TABLE projects
ADD CONSTRAINT published_requires_timestamp
CHECK (
  (status != 'PUBLISHED'::project_status) OR (published_at IS NOT NULL)
);
```

**Impact:**

- Database enforces: if status='PUBLISHED', then published_at IS NOT NULL
- Prevents invalid state at storage layer
- Protects against direct database updates or application bugs

---

## Defense in Depth Strategy

| Layer       | Fix                                 | Benefit                           |
| ----------- | ----------------------------------- | --------------------------------- |
| Application | Delete orphaned projects on failure | Handles runtime errors gracefully |
| Application | Validate title before publishing    | Prevents invalid user inputs      |
| Database    | UNIQUE constraint on slug           | Prevents race conditions          |
| Database    | CHECK constraint on published_at    | Enforces state consistency        |

All fixes maintain backward compatibility with existing data.

---

## Testing the Fixes

### Discover Page

1. Create a PUBLISHED project (Create → Publish)
2. Navigate to /discover
3. Should see the project in Trending/Recent sections
4. Click sections to filter by category
5. Loading spinner should show briefly

### Profile Stats

1. Create a PUBLISHED project as User A
2. Go to /u/@userA
3. projects_count should show 1
4. Create another PUBLISHED project
5. projects_count should update to 2
6. Note: Only PUBLISHED projects count (DRAFT projects don't show in stats)

---

## Backward Compatibility

✅ No breaking changes

- Same component API (ProjectCard still receives same props)
- Same UI/UX flows
- Fallback handling for empty data

---

## Security

✅ No security regressions

- Backend visibility rules unchanged (DRAFT blocked, PUBLISHED allowed)
- Auth checks still in place on GET /api/bmdb/projects/discover
- Profile endpoint still public but properly filtered

---

## Conclusion

Both critical issues resolved:

1. Real published projects now shown in Discover
2. Profile stats now accurate for published portfolio
