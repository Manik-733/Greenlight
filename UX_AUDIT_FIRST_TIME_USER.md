# First-Time User Flow - UX Audit

## Flow Summary

1. ✅ Register → 2. ❓ Create profile → 3. ✅ Create project → 4. ✅ Publish → 5. ✅ View public

---

## 🔴 CRITICAL ISSUE: Missing Profile Creation Step

**Current State:** After registration, user is redirected to `/discover` immediately.

**Problem:** There is **NO dedicated profile creation/setup flow**. Users arrive at Discover without:

- Setting a bio
- Uploading an avatar
- Completing their profile

**User Confusion:**

- User registers → Redirected to Discover → Confused: "Where do I set up my profile?"
- Profile is auto-created but user doesn't know it exists
- Can't find where to add bio/avatar

**When would they feel this?** After step 1 (Register), before step 3 (Create Project)

---

## 📊 UX Issues by Flow Step

### Step 1: Register ⭐ GOOD

✅ Clear value proposition: _"Your profile becomes your public filmography"_
✅ Self-explanatory fields
✅ Good validation messages
✅ Username rules clearly displayed

**Minor Issue - Copy:**

- Label: "Full Name" → Consider: "Display Name" (matches backend/API)
- Currently inconsistent: form says "Full Name", but field ID is `displayName`

---

### Step 2: Create Profile ❌ MISSING

**DEAD EXPERIENCE:**
After registration, user is automatically sent to `/discover`.

**What should happen:**

1. Show "Welcome! Let's set up your profile" or similar
2. Offer user chance to:
   - Add bio
   - Upload avatar
   - Set profile visibility (if needed)
3. Optionally link to "Create your first project"

**Current experience feels like:**

- Confusing redirect
- No explanation of what to do next
- Profile page exists at `/u/@username` but user doesn't know

---

### Step 3: Create First Project ✅ GOOD

✅ Clear heading: "Create a New Project"
✅ Self-explanatory form
✅ Good validation

**Issues:**

**1. Confusing value prop:**

- Subtitle: "Add your film, short, or creative work to BMDB"
- **Problem:** For FIRST-TIME creator, unclear if they can create draft, save it, finish later
- **Better copy:** "Start creating. Save as draft or publish when ready."

**2. Unclear project type default:**

- Defaults to "SHORT"
- **Problem:** User doesn't know if this affects visibility/discoverability
- **Better label:** Add context: "Project Type — affects how your work is categorized"

**3. Missing affordance for "save as draft":**

- There IS a "Save as Draft" button on Edit page
- **But user doesn't know this until AFTER they click Create**
- **Problem:** Creates friction - user worried they must complete everything now
- **Better location:** Add help text on Create page: "You can save drafts and edit later"

**4. Description field is confusing:**

- Placeholder: "Tell us about your project..."
- Validation: Requires min 10 chars IF provided
- **Problem:** User doesn't know if optional or required (no asterisk)
- **Better:** Add "(optional)" label, or remove min-length requirement for drafts

---

### Step 4: Publish Project ⚠️ MOSTLY GOOD, ONE CLARITY GAP

**Location:** EditProject page at `/p/:slug/edit`

**Good:**
✅ Publish button clearly labeled
✅ Confirmation dialog asks "Are you sure?"

**Issues:**

**1. Confusing button labels ("Save Draft" vs "Publish Project"):**

- User might not understand the difference immediately
- **Problem:** "Save Draft" is not obviously a save action - reads like "Draft saves"
- **Better copy:**
  - "Save Changes" (for Draft status)
  - "Publish Project" (make it live)
  - OR add subtitle: "Save as Draft (can edit later)" and "Publish & Lock (can't change title)"

**2. Slug immutability not communicated:**

- User changes title → Sees slug doesn't update (once published)
- **No explanation why**
- **Better:** Add small help text when published: "⚠️ Project title is locked (published projects can't change URLs)"

**3. Publish dialog missing context:**

- Dialog: "Are you sure? This will make your project publicly visible"
- **Problem:** No mention of what happens after (no "then what?")
- **Better copy:** "Publish project? It will be visible to everyone and appear in Discover."

**4. POST-publish navigation unclear:**

- After publish, user is redirected to `/p/:slug`
- **No success message**
- **No "what's next?" guidance**
- **Problem:** Feels like something just happened but user doesn't know if it worked
- **Better:** Toast/banner: "✅ Project published! Share it with others: [link to copy]"

---

### Step 5: View as Public User ✅ GOOD

✅ Clean project page
✅ Owner info clearly displayed
✅ Edit button only shows for owner

**Minor issue:**

- "Created by" label might be confusing (sounds like single authorship)
- **Better label:** "By" or "Project by"

---

## 🎯 Key Moments Where UI Feels "Dead"

| Step | Moment            | Problem                                     | Fix                                                    |
| ---- | ----------------- | ------------------------------------------- | ------------------------------------------------------ |
| 1→2  | After register    | No redirect context                         | Show "Welcome!" screen                                 |
| 2    | Profile setup     | Can't find where to edit profile            | Link to profile page or show setup flow                |
| 3    | Creating project  | Unknown if can save as draft                | Add help text: "Save as draft to edit later"           |
| 3→4  | After create      | Auto-redirects to edit page without context | Show success: "✅ Project created! Now edit & publish" |
| 4    | Before publish    | Unclear what publish means                  | Explain in button/dialog: "Make live & visible to all" |
| 4→5  | After publish     | No confirmation or share prompt             | Show success toast + share link                        |
| 5    | Viewing published | No call-to-action for non-owners            | Add "Interested? Message creator" or similar (future)  |

---

## 📝 Recommended Copy/UI Changes (Priority Order)

### P1 - CRITICAL (Resolve confusion)

**1. Register page - Field label consistency**

```
CURRENT: "Full Name"
BETTER:  "Display Name"
```

File: `src/pages/Register.tsx` line 163
Reason: Matches backend terminology, less confusing

---

**2. Create Project page - Add draft affordance**

```
CURRENT: [Form subtitle only]
ADD:     "💡 Tip: You can save as a draft and finish editing later."
```

File: `src/pages/CreateProject.tsx` after line 107
Reason: Removes friction of feeling pressured to complete everything

---

**3. Create Project page - Make description field status clear**

```
CURRENT: <Label>Description</Label>
BETTER:  <Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
```

File: `src/pages/CreateProject.tsx` line 143
Reason: User doesn't know if required or optional (no asterisk unlike title)

---

### P2 - HIGH (Clarify workflow)

**4. EditProject page - Better button labels**

```
CURRENT: "Save Draft" button
BETTER:  "Save Changes" button (when status=DRAFT)

CURRENT: "Publish Project" button
ADD:     Tooltip: "Make this project publicly visible"
```

File: `src/pages/EditProject.tsx` lines 262-268
Reason: Clearer action names, tooltip explains consequence

---

**5. EditProject page - Post-publish success message**

```
CURRENT: [Silent redirect to /p/:slug]
ADD:     Toast after publish: "✅ Project published! Now visible in Discover"
         OR with share link: "Share your project: [copy link button]"
```

File: `src/pages/EditProject.tsx` after line 171 (after handlePublish)
Reason: Confirms success, prompts next action (sharing)

---

**6. EditProject page - Explain published slug immutability**

```
ADD:     When status=PUBLISHED, disable title field OR add:
         <div className="text-xs text-muted-foreground/60 mt-1">
           📌 Title is locked on published projects (affects your project URL)
         </div>
```

File: `src/pages/EditProject.tsx` after title input (line 210)
Reason: Explains why title can't change

---

**7. ProjectPage - Improve "Created by" label**

```
CURRENT: "Created by"
BETTER:  "By" OR "Project by"
```

File: `src/pages/ProjectPage.tsx` line 181
Reason: Less formal, clearer that it's the project owner

---

### P3 - MEDIUM (Post-publish guidance)

**8. Add onboarding/welcome flow after registration**

```
After register redirect, show 1-time welcome:
- "Welcome to BMDB! 👋"
- "Your profile: [link to profile]"
- "Next step: Create your first project [button] or Explore [button]"
```

File: Create new component or modify Register redirect
Reason: Guides first-time users, prevents confusion

---

**9. ProfilePage - Add edit profile button for own profile**

```
If user.username === profile.username:
  Show button: "Edit Profile"
  Link to: [future profile edit page or modal]
```

File: `src/pages/ProfilePage.tsx` near line 76
Reason: Users can't find where to edit their own profile

---

**10. Publish confirmation dialog - Add context**

```
CURRENT: "Are you sure? This will make your project publicly visible"
BETTER:  "Publish project?
          Once published:
          • Project will appear in Discover
          • It will be visible to everyone
          • You can still edit details (but not the title)"
```

File: `src/pages/EditProject.tsx` lines 266-280
Reason: Prepares user for what happens after, builds confidence

---

## 🚨 Missing Features (Out of scope, but noted)

- Profile editing (bio, avatar) - Currently no UI for this
- Welcome/onboarding screen - No first-time UX
- Copy-to-share functionality on published projects
- Profile setup modal after registration

---

## Summary

**Where users feel confused:**

1. **After Register** - No guidance on next step, auto-redirects
2. **Before Create** - Unclear if can save as draft
3. **Before Publish** - Unclear what "publish" does
4. **After Publish** - No confirmation or celebration

**Moments UI feels "dead":**

1. Auto-redirect after register (no ceremony)
2. Publish button with minimal context
3. Post-publish silent redirect (no feedback)

**Non-self-explanatory labels:**

1. "Full Name" vs "Display Name" (inconsistent terminology)
2. "Save Draft" vs "Save Changes" (confusing action names)
3. "Created by" (sounds singular, could be clearer)
4. Description field optionality (no "(optional)" marker)

**All fixes are copy/UI text improvements - no feature changes needed.**
