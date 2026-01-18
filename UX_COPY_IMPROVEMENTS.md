# UX Copy Improvements - Implementation Guide

## Quick Reference: All Copy Changes

### 1. Register Page - Display Name Label

**File:** `src/pages/Register.tsx` line ~163

```tsx
// BEFORE
<Label htmlFor="displayName">Full Name</Label>

// AFTER
<Label htmlFor="displayName">Display Name</Label>
```

**Why:** Matches backend terminology, less confusing. User understands this is what appears publicly.

---

### 2. Register Page - Add Reassurance in Heading

**File:** `src/pages/Register.tsx` line ~121

```tsx
// BEFORE
<p className="mt-2 text-muted-foreground">
  Your profile becomes your public filmography
</p>

// AFTER (if keeping same) - this is actually good
// OPTIONAL ADD: After form, before submit:
<div className="text-xs text-muted-foreground/60">
  ✓ Your profile is ready. You can add bio & avatar after signing up.
</div>
```

**Why:** Sets expectation that profile editing happens after registration.

---

### 3. CreateProject Page - Description Field Clarity

**File:** `src/pages/CreateProject.tsx` line ~143

```tsx
// BEFORE
<Label htmlFor="description">Description</Label>

// AFTER
<Label htmlFor="description">
  Description
  <span className="text-xs text-muted-foreground ml-2">(optional)</span>
</Label>
```

**Why:** Removes ambiguity. User doesn't wonder "is this required?"

---

### 4. CreateProject Page - Draft Affordance

**File:** `src/pages/CreateProject.tsx` line ~107 (after heading)

```tsx
// ADD after the intro paragraph:
<div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
  <p className="text-xs text-blue-700 dark:text-blue-300">
    💡 <span className="font-medium">Pro tip:</span> You can save as a draft and
    finish editing later. No need to publish right away.
  </p>
</div>
```

**Why:** Reduces anxiety about commitment. Users feel they can iterate.

---

### 5. CreateProject Page - Project Type Help

**File:** `src/pages/CreateProject.tsx` line ~128

```tsx
// BEFORE
<Label htmlFor="projectType">Project Type *</Label>

// AFTER
<Label htmlFor="projectType">
  Project Type *
  <span className="text-xs text-muted-foreground ml-2">
    (helps others discover your work)
  </span>
</Label>
```

**Why:** Explains WHY we're asking. Increases perceived value of the field.

---

### 6. EditProject Page - Button Labels & Tooltips

**File:** `src/pages/EditProject.tsx` line ~262-268

```tsx
// BEFORE
<Button type="submit" variant="gold" disabled={loading}>
  {loading ? "Saving..." : "Save Draft"}
</Button>

// AFTER
<Button
  type="submit"
  variant="gold"
  disabled={loading}
  title="Save your changes as a draft. You can edit anytime."
>
  {loading ? "Saving..." : project?.status === "DRAFT" ? "Save Changes" : "Save Changes"}
</Button>

// PUBLISH BUTTON (if exists)
<Button
  type="button"
  variant="outline"
  disabled={loading || project?.status === "PUBLISHED"}
  onClick={() => setShowPublishDialog(true)}
  title="Make this project visible to everyone"
>
  Publish Project
</Button>
```

**Why:**

- "Save Changes" is clearer than "Save Draft" (more familiar)
- Tooltips explain what each action does

---

### 7. EditProject Page - Published Slug Lock Indicator

**File:** `src/pages/EditProject.tsx` line ~210 (after title input)

```tsx
// ADD after title input, if project?.status === "PUBLISHED":
{
  project?.status === "PUBLISHED" && (
    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
      <span>📌</span>
      <span>Project title is locked (published projects keep their URL)</span>
    </div>
  );
}
```

**Why:** Explains WHY title is disabled when published. Prevents user confusion.

---

### 8. EditProject Page - Publish Dialog Copy

**File:** `src/pages/EditProject.tsx` lines ~266-280

```tsx
// BEFORE
<AlertDialogDescription>
  Are you sure? This action cannot be undone.
</AlertDialogDescription>

// AFTER
<AlertDialogDescription>
  <div className="space-y-2">
    <p>Publish your project? Once published:</p>
    <ul className="text-xs space-y-1 ml-4 list-disc">
      <li>It will appear in Discover and searches</li>
      <li>Everyone can view and share it</li>
      <li>You can still edit details (except the title)</li>
    </ul>
  </div>
</AlertDialogDescription>
```

**Why:**

- Explains consequences (what happens after)
- Builds confidence in the decision
- Clarifies what CAN'T change (title)

---

### 9. EditProject Page - Post-Publish Success Message

**File:** `src/pages/EditProject.tsx` after line ~171 (after handlePublish success)

```tsx
// ADD after successful publish, before redirect:
const successMessage = `✨ Project published! 
Help others discover it by sharing the link.`;

// Show as toast using your existing toast system
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// In handlePublish, after success:
toast({
  title: "✨ Project Published!",
  description: "Your project is now live and visible in Discover",
  action: (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
        toast({ title: "Link copied!" });
      }}
    >
      Copy Link
    </Button>
  ),
});
```

**Why:**

- Confirms success
- Prompts next action (sharing)
- Celebration moment (✨ emoji)

---

### 10. ProjectPage - "Created by" Label

**File:** `src/pages/ProjectPage.tsx` line ~181

```tsx
// BEFORE
<p className="text-sm text-muted-foreground mb-2">
  Created by
</p>

// AFTER
<p className="text-sm text-muted-foreground mb-2">
  By
</p>
```

**Why:** Less formal, clearer. "By" is industry standard (like IMDb).

---

### 11. ProjectPage - Add Share Affordance (Optional)

**File:** `src/pages/ProjectPage.tsx` after owner section

```tsx
// ADD after owner section, before credits:
<div className="mt-4 pt-4 border-t border-border flex gap-2">
  <Button
    size="sm"
    variant="outline"
    onClick={() => navigator.clipboard.writeText(window.location.href)}
  >
    Share Project
  </Button>
</div>
```

**Why:** Encourages discovery and sharing.

---

### 12. ProfilePage - Edit Profile CTA (For Own Profile)

**File:** `src/pages/ProfilePage.tsx` line ~76 (near owner info)

```tsx
// ADD after profile header, if viewing own profile:
import { useAuth } from "@/auth/useAuth";

const { user } = useAuth();
const isOwnProfile = user?.username === profile?.username;

{
  isOwnProfile && (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        // TODO: Implement profile edit modal/page
        console.log("Edit profile");
      }}
      className="mt-4"
    >
      Edit Profile
    </Button>
  );
}
```

**Why:** Users don't know where to edit their own profile. This provides clear CTA.

---

## Implementation Priority

**P1 (Do immediately):**

- ✅ Change "Full Name" → "Display Name"
- ✅ Add "(optional)" to Description
- ✅ Add draft affordance help text on Create page
- ✅ Improve publish dialog copy

**P2 (Next iteration):**

- ✅ Change button labels (Save Draft → Save Changes)
- ✅ Add published URL lock indicator
- ✅ Add post-publish success toast

**P3 (Future improvements):**

- ✅ Add project type context
- ✅ Add "Created by" → "By"
- ✅ Add profile edit button
- ✅ Add share affordance on project page

---

## Testing These Changes

**After implementing, test with first-time user:**

1. Register account
2. Try to create project - can they find "Save as Draft"?
3. Try to publish - do they understand what happens?
4. Post-publish - do they feel success/guidance?
5. View published project - is author clear?

**Success metrics:**

- Users mention feeling "guided" not "confused"
- Fewer questions about "Can I save as draft?"
- More projects published (fewer abandoned drafts)
