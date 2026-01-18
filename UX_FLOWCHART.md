# First-Time User Flow - Visual Audit

## Current vs. Ideal Flow

```
CURRENT FLOW:
═════════════

1. REGISTER ✅
   ↓ [Auto-redirect, no context]

2. DISCOVER PAGE ❓ (Feels dropped off)
   ↓ [User confused: "What now?"]

3. CREATE PROJECT ✅ (But unclear if can save draft)
   ↓ [Submit form]

4. EDIT PROJECT (Auto-opened, no explanation) ⚠️
   ↓ [Confusing: "Save Draft" or "Publish"?]

5. PUBLISH ⚠️ (Dialog is minimal)
   ↓ [Silent redirect to project page]

6. VIEW PUBLISHED ✅ (But no "what next?")


IDEAL FLOW WITH COPY IMPROVEMENTS:
═══════════════════════════════════

1. REGISTER ✅
   └─ Copy: "Your profile becomes your public filmography"
   ↓ [Redirect with context]

2. WELCOME SCREEN 🎯 (NEW - Optional but recommended)
   └─ "Welcome! Your profile is ready to go"
   └─ Quick link: "Edit profile" or "Create first project"
   ↓ [Guided choice]

3. CREATE PROJECT ✅
   └─ Heading: "Create a New Project"
   └─ NEW: Info box: "💡 Save as draft & finish later"
   └─ Title: "Project Title *"
   └─ Description: "Description (optional)"
   └─ Type: "Project Type (helps others discover your work)"
   ↓ [User clicks "Create Project" with confidence]

4. EDIT PROJECT PAGE ✅
   └─ Heading: "Edit Project"
   └─ NEW: "📌 Title locked on published projects"
   └─ Save button: "Save Changes" (not "Save Draft")
   └─ Publish button: "Publish Project" with tooltip
   ↓ [User clicks "Publish Project" with understanding]

5. PUBLISH DIALOG ✅
   └─ Header: "Publish your project?"
   └─ NEW Details:
      • It will appear in Discover and searches
      • Everyone can view and share it
      • You can edit details (except the title)
   ↓ [User clicks "Publish" with confidence]

6. SUCCESS FEEDBACK 🎯 (NEW)
   └─ Toast: "✨ Project Published!"
   └─ Description: "Your project is live in Discover"
   └─ Action: "Copy Link" button
   ↓ [Celebration moment]

7. PROJECT PAGE ✅
   └─ Owner: "By [Name]"
   └─ NEW: "Share Project" button
   ↓ [User understands what to do]
```

---

## Confusion Points Eliminated

### ❌ BEFORE → ✅ AFTER

| Problem             | Current UX                     | Improved UX                          |
| ------------------- | ------------------------------ | ------------------------------------ |
| Field terminology   | "Full Name" (confusing)        | "Display Name" (clear)               |
| Unclear if optional | "Description" no marker        | "Description (optional)"             |
| No draft affordance | Form just appears              | "💡 Tip: Save as draft & edit later" |
| Confusing buttons   | "Save Draft" sounds passive    | "Save Changes" (familiar)            |
| No publish context  | Button just says "Publish"     | Tooltip + clear dialog               |
| Silent redirect     | Project goes live, user unsure | "✨ Project Published!" toast        |
| No sharing CTA      | User doesn't know what to do   | "Share Project" button               |
| Unclear author      | "Created by" (formal)          | "By [Name]" (clear)                  |

---

## Copy by Page

### 📄 Register Page

```
Heading:      "Join BMDB"
Subtitle:     "Your profile becomes your public filmography" ✅
Labels:
  - "Display Name" (not "Full Name") 🔄
  - "Email" ✅
  - "Username" ✅
  - "Password" ✅
Success:      "Account created successfully! Redirecting..."
After:        → Discover page (consider welcome screen)
```

### 📄 Create Project Page

```
Heading:      "Create a New Project" ✅
Subtitle:     "Add your film, short, or creative work to BMDB" ✅
NEW Tip Box:  "💡 You can save as draft and edit later" 🆕
Fields:
  - Title:        "Project Title *" ✅
  - Type:         "Project Type (helps others discover)" 🔄
  - Description:  "Description (optional)" 🔄
Button:       "Create Project" ✅
```

### 📄 Edit Project Page

```
Heading:      "Edit Project" ✅
Subtitle:     "Update your project details" ✅
NEW Status:   If published: "📌 Title is locked (published projects keep their URL)" 🆕
Fields:       [Same as create]
Buttons:
  - "Save Changes" (was "Save Draft") 🔄
  - "Publish Project" + tooltip 🔄
Published:    Publish dialog improved 🔄
Post-publish: Success toast 🆕
```

### 📄 Project Page

```
Owner:        "By [Name]" (was "Created by") 🔄
Description:  [Project description] ✅
Credits:      [Verified credits] ✅
NEW Button:   "Share Project" 🆕
```

---

## Error States / Edge Cases

### When title is too short

```
CURRENT: "Title must be at least 2 characters"
BETTER:  [Same - already clear] ✅
```

### When trying to publish without title

```
NEW: "Project must have a title to publish"
→ This is now validated by backend 🆕
```

### When viewing own project

```
Button appears: "Edit Project" ✅
NEW Option: Profile page shows "Edit Profile" button 🆕
```

---

## Copy Tone

**Current tone:** Professional, minimal
**Improved tone:** Professional + Supportive + Encouraging

Examples:

- "💡 You can save as draft" (supportive)
- "✨ Project Published!" (celebrating)
- "Help others discover it" (encouraging)
- "📌 Title locked" (informative icon)

---

## Accessibility Notes

All copy improvements include:

- ✅ Clear language (no jargon)
- ✅ Descriptive labels
- ✅ Context in dialogs
- ✅ Icons for visual emphasis (not information-only)
- ✅ Tooltips on hover for extra context

---

## Summary: What Changes

| Element                    | Current              | Improved                    | Priority |
| -------------------------- | -------------------- | --------------------------- | -------- |
| Register "Full Name" label | Full Name            | Display Name                | P1       |
| Create description label   | Description          | Description (optional)      | P1       |
| Create form help text      | None                 | 💡 Draft affordance tip     | P1       |
| Edit button label          | Save Draft           | Save Changes                | P2       |
| Publish confirmation       | Minimal              | Rich context                | P1       |
| Post-publish feedback      | Silent redirect      | Success toast               | P2       |
| Project "Created by"       | Created by           | By                          | P3       |
| Published title behavior   | Disabled (no reason) | Disabled + explanation icon | P2       |
| Profile edit               | No CTA               | Edit Profile button         | P3       |
| Project share              | No button            | Share Project button        | P3       |

**Total changes: 10 text improvements, 0 new features**
