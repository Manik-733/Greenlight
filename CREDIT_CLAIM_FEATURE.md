# Credit Claiming Feature - MVP Implementation

## Overview

Logged-in users can now claim UNCLAIMED credits that match their display name (case-insensitive).

## Flow

### User Discovery

On **ProjectPage**, for each UNCLAIMED credit:

- If `credit.status='UNCLAIMED'` AND `credited_name` matches `user.display_name` (case-insensitive)
- Show **"Claim"** button with gift icon next to the credit

### Claiming Action

When user clicks "Claim":

1. POST `/api/bmdb/credits/:creditId/claim` (requires Bearer token)
2. Backend verifies:
   - Credit exists and is UNCLAIMED
   - User's display_name matches credit's credited_name (case-insensitive)
3. On success:
   - Sets `credited_user_id = current_user.id`
   - Sets `status = 'PENDING_ACCEPTANCE'`
   - Credit moves to user's pending credits
4. User receives notification via their Pending Credits section in ProfilePage

## Implementation Details

### Backend Endpoint

**POST `/api/bmdb/credits/:creditId/claim`**

- Location: `backend/app/api/bmdb/credits/[creditId]/claim/route.ts`
- Authorization: Bearer token required (401 if missing)
- Validation:
  - Credit must be UNCLAIMED (400 if not)
  - credited_user_id must be null (400 if already claimed)
  - User's display_name must match credit's credited_name case-insensitively (403 if mismatch)
- Response: Updated credit object with new status and credited_user_id
- Errors: 401, 403, 404, 500

### Frontend Changes

**ProjectPage.tsx**

- Added `Gift` icon import from lucide-react
- Updated `Credit` interface to include `status?: string`
- Added state: `claimingCredits` (Set of credit IDs being claimed)
- Added state: `claimErrors` (Record of error messages by credit ID)
- Added function: `handleClaimCredit(creditId)` - POSTs to claim endpoint
- Updated credits rendering:
  - Show "Claim" button only if:
    - User is logged in
    - Credit is NOT verified
    - Credit status is UNCLAIMED
    - Credit name matches user display name (case-insensitive)
  - Button is disabled while claiming
  - Shows error message if claim fails
  - Removes error when attempting again

### Backend Query Update

**GET `/api/bmdb/projects/slug/[slug]`**

- Changed credit filtering from `status='VERIFIED'` to `status IN ['VERIFIED', 'UNCLAIMED']`
- Now includes `status` field in response so frontend can determine if claim button should show
- `is_verified` boolean indicates if credit is verified (for badge display)

## Security

- Claim endpoint requires Bearer token (401 unauthorized)
- Backend verifies display name match (403 forbidden if mismatch)
- Only works for UNCLAIMED credits (400 if already claimed or verified)
- No data leak of other users' credentials

## User Experience

1. User sees their name in UNCLAIMED credits on projects
2. Clicks "Claim" button
3. Credit moves to PENDING_ACCEPTANCE status
4. Sees it in ProfilePage "Pending Credits" section
5. Can verify or reject

## Testing Checklist

- [ ] Logged-out user does NOT see claim button
- [ ] Logged-in user with matching display name sees claim button
- [ ] Logged-in user with non-matching display name does NOT see claim button
- [ ] Clicking claim transitions credit to PENDING_ACCEPTANCE
- [ ] Claimed credit appears in user's Pending Credits
- [ ] Claiming twice fails (409 or 400 error)
- [ ] Claiming non-matching credit fails (403 error)
- [ ] Network error handling shows error message

## Future Enhancements

- Batch claim multiple credits at once
- Email notification when credit claimed
- Admin override to assign credits to users
- Credit claim disputes/appeals
- Claim request history/audit log
