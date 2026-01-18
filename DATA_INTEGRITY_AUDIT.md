# Data Integrity Edge Case Audit

## Edge Case 1: Project without OWNER in project_memberships

**Can this happen?** ✅ YES - **CRITICAL**

**Location:** POST /api/bmdb/projects (line 113-130)

```typescript
// Create project
const { data: project, error: projectError } = await supabase
  .from("projects")
  .insert({ ... })
  .single();

if (projectError || !project) {
  // Return error, project already inserted
}

// Add creator as project owner in memberships
const { error: membershipError } = await supabase
  .from("project_memberships")
  .insert({ project_id: project.id, ... });

if (membershipError) {
  // Return error, but PROJECT EXISTS WITHOUT OWNER
  return NextResponse.json({ error: "..." }, { status: 500 });
}
```

**Scenario:** Network timeout after project insert but before membership insert → project exists without OWNER

**Fix Needed:** ✅ CRITICAL - Wrap in transaction

---

## Edge Case 2: Published project without title

**Can this happen?** ✅ YES - **MODERATE**

**Location:** PATCH /api/bmdb/projects/:id (line 150-156)

```typescript
// Handle publish/unpublish
if (body.publish !== undefined) {
  if (body.publish) {
    updateData.status = "PUBLISHED";
    updateData.published_at = new Date().toISOString();
    // NO CHECK: is title empty?
  }
}
```

**Scenario:**

1. Create project with title
2. PATCH with publish=true but empty title
3. Project published with title="" or null

**Actually impossible due to schema?** Check: title is NOT NULL in database? Likely yes.

**Fix Needed:** ✅ Add validation before publish

---

## Edge Case 3: Two projects with same slug

**Can this happen?** ✅ POSSIBLE - **RACE CONDITION**

**Location:** POST /api/bmdb/projects (line 85-102)

```typescript
async function generateUniqueSlug(baseSlug, supabase) {
  while (true) {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .single();

    if (error && error.code === "PGRST116") {
      return slug; // Appears unique
    }
    // ...
  }
}

// THEN INSERT - but another request could insert between check and insert
const { data: project } = await supabase
  .from("projects")
  .insert({ slug: uniqueSlug, ... })
```

**Scenario:** Two simultaneous POST requests both check uniqueness, both get same slug, both insert → duplicate slugs

**Fix Needed:** ✅ Database unique constraint on slug

---

## Edge Case 4: PUBLISHED with null published_at

**Can this happen?** ✅ YES - **DATA CORRUPTION**

**Location:** Any UPDATE that sets status=PUBLISHED without published_at

**Scenario:**

- Direct database update, or
- Existing data from old code that didn't set published_at, or
- Bug in PATCH that updates status but published_at stays null

**Check:** PATCH line 150 DOES set published_at when publishing ✅
But no constraint prevents direct DB corruption.

**Fix Needed:** ✅ Database constraint: `status = PUBLISHED → published_at IS NOT NULL`

---

## Proposed Fixes (Smallest & Safest)

### Fix 1: Transaction for Project + Membership (CRITICAL)

**File:** `backend/app/api/bmdb/projects/route.ts`
**Type:** API Defensive Check (safest, no DB schema change)

Wrap POST creation in transaction to ensure OWNER is created atomically:

```typescript
try {
  await supabase.rpc('create_project_with_owner', {
    title: ...,
    user_id: user.id,
    ...
  });
} catch (err) {
  // Transaction rolled back, project not created
}
```

**OR (simpler):** Add defensive check in PATCH/GET to verify OWNER exists

- If not found and user is trying to edit → reject 403

---

### Fix 2: Validate Title on Publish

**File:** `backend/app/api/bmdb/projects/[projectId]/route.ts`
**Type:** API Defensive Check

Before setting status=PUBLISHED, check:

```typescript
if (body.publish) {
  if (!updatedProject.title || updatedProject.title.trim().length === 0) {
    return NextResponse.json(
      { error: "Project must have a title to publish" },
      { status: 400 }
    );
  }
  updateData.status = "PUBLISHED";
  updateData.published_at = new Date().toISOString();
}
```

---

### Fix 3: Database Constraint on Slug

**File:** Database migration
**Type:** Database Constraint (strongest guarantee)

Add unique constraint:

```sql
ALTER TABLE projects
ADD CONSTRAINT unique_slug UNIQUE (slug);
```

This prevents ANY code path from creating duplicates.

---

### Fix 4: Check published_at NOT NULL when PUBLISHED

**File:** Database migration
**Type:** Database Constraint

Add check constraint:

```sql
ALTER TABLE projects
ADD CONSTRAINT published_requires_timestamp
CHECK (
  (status != 'PUBLISHED') OR (published_at IS NOT NULL)
);
```

---

## Recommendations

| Edge Case             | Severity | Fix                     | Location    | Status     |
| --------------------- | -------- | ----------------------- | ----------- | ---------- |
| Project without OWNER | CRITICAL | Delete orphaned on fail | POST route  | ✅ APPLIED |
| Publish without title | MODERATE | Add validation          | PATCH route | ✅ APPLIED |
| Duplicate slugs       | MODERATE | DB constraint           | Migration   | ✅ APPLIED |
| NULL published_at     | MODERATE | DB constraint           | Migration   | ✅ APPLIED |

## Fixes Applied

1. ✅ **Fix 1 (CRITICAL):** POST /api/bmdb/projects

   - Added cleanup: deletes orphaned project if membership creation fails
   - Prevents projects existing without OWNER
   - File: `backend/app/api/bmdb/projects/route.ts` (lines 113-126)

2. ✅ **Fix 2 (MODERATE):** PATCH /api/bmdb/projects/:id

   - Added title validation before publishing
   - Validates title is non-empty, returns 400 if empty
   - File: `backend/app/api/bmdb/projects/[projectId]/route.ts` (lines 138-151)

3. ✅ **Fix 3 (MODERATE):** Database constraint on slug

   - Added UNIQUE constraint to prevent duplicate slugs
   - Eliminates race condition in slug generation
   - File: `backend/supabase/migrations/003_data_integrity_constraints.sql`

4. ✅ **Fix 4 (MODERATE):** Database constraint on published_at
   - Added CHECK constraint: `status='PUBLISHED' → published_at IS NOT NULL`
   - Prevents state corruption if status/timestamp get out of sync
   - File: `backend/supabase/migrations/003_data_integrity_constraints.sql`

## Status Summary

All 4 edge case vulnerabilities have been addressed with minimal, targeted fixes:

- Application-level fixes (1 & 2) protect against runtime failures
- Database constraints (3 & 4) prevent invalid state at storage layer
- Defense in depth: both layers now prevent data corruption
