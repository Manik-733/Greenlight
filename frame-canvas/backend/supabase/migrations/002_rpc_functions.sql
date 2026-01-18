-- BMDB RPC Functions
-- Smart actions for credit workflows, project management, and moderation

-- ============================================================================
-- AUDIT LOG HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTIFICATION HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_related_project_id UUID DEFAULT NULL,
  p_related_credit_id UUID DEFAULT NULL,
  p_related_request_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notif_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_project_id, related_credit_id, related_request_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_project_id, p_related_credit_id, p_related_request_id)
  RETURNING id INTO notif_id;
  RETURN notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREDIT REQUEST FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_credit_request(
  p_request_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_request credit_requests%ROWTYPE;
  v_credit_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get request
  SELECT * INTO v_request FROM credit_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit request not found';
  END IF;

  -- Check permissions (must be project owner/admin)
  IF NOT is_project_admin(v_request.project_id, v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Check status
  IF v_request.status != 'PENDING' THEN
    RAISE EXCEPTION 'Credit request is not pending';
  END IF;

  -- Create credit in PENDING_ACCEPTANCE status
  INSERT INTO credits (
    project_id, credit_type, job_title, character_name,
    credited_user_id, status, created_by_user_id
  ) VALUES (
    v_request.project_id, v_request.credit_type, v_request.job_title,
    v_request.character_name, v_request.requested_by_user_id,
    'PENDING_ACCEPTANCE', v_request.requested_by_user_id
  ) RETURNING id INTO v_credit_id;

  -- Update request status
  UPDATE credit_requests
  SET status = 'APPROVED',
      responded_by_user_id = v_user_id,
      response_message = p_message,
      updated_at = NOW()
  WHERE id = p_request_id;

  -- Create notification
  PERFORM create_notification(
    v_request.requested_by_user_id,
    'CREDIT_REQUEST_APPROVED',
    'Credit Request Approved',
    'Your credit request for ' || v_request.job_title || ' has been approved.',
    v_request.project_id,
    v_credit_id,
    p_request_id
  );

  -- Log audit
  PERFORM log_audit_action(
    v_user_id,
    'approve_credit_request',
    'credit_request',
    p_request_id,
    jsonb_build_object(
      'project_id', v_request.project_id,
      'credit_id', v_credit_id,
      'job_title', v_request.job_title
    )
  );

  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deny_credit_request(
  p_request_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_request credit_requests%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_request FROM credit_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit request not found';
  END IF;

  IF NOT is_project_admin(v_request.project_id, v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF v_request.status != 'PENDING' THEN
    RAISE EXCEPTION 'Credit request is not pending';
  END IF;

  UPDATE credit_requests
  SET status = 'DENIED',
      responded_by_user_id = v_user_id,
      response_message = p_message,
      updated_at = NOW()
  WHERE id = p_request_id;

  PERFORM create_notification(
    v_request.requested_by_user_id,
    'CREDIT_REQUEST_DENIED',
    'Credit Request Denied',
    COALESCE(p_message, 'Your credit request has been denied.'),
    v_request.project_id,
    NULL,
    p_request_id
  );

  PERFORM log_audit_action(
    v_user_id,
    'deny_credit_request',
    'credit_request',
    p_request_id,
    jsonb_build_object('project_id', v_request.project_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_credit_request(p_request_id UUID) RETURNS VOID AS $$
DECLARE
  v_request credit_requests%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_request FROM credit_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit request not found';
  END IF;

  IF v_request.requested_by_user_id != v_user_id THEN
    RAISE EXCEPTION 'Can only cancel own requests';
  END IF;

  IF v_request.status != 'PENDING' THEN
    RAISE EXCEPTION 'Only pending requests can be canceled';
  END IF;

  UPDATE credit_requests
  SET status = 'CANCELED', updated_at = NOW()
  WHERE id = p_request_id;

  PERFORM log_audit_action(
    v_user_id,
    'cancel_credit_request',
    'credit_request',
    p_request_id,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREDIT CLAIM FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_unclaimed_credit(
  p_credit_id UUID,
  p_message TEXT DEFAULT NULL,
  p_proof_urls TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS UUID AS $$
DECLARE
  v_credit credits%ROWTYPE;
  v_project projects%ROWTYPE;
  v_claim_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_credit FROM credits WHERE id = p_credit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit not found';
  END IF;

  IF v_credit.status != 'UNCLAIMED' THEN
    RAISE EXCEPTION 'Credit is not unclaimed';
  END IF;

  IF v_credit.credited_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Credit is already linked to a user';
  END IF;

  SELECT * INTO v_project FROM projects WHERE id = v_credit.project_id;

  -- Create claim request
  INSERT INTO credit_claim_requests (
    credit_id, claimed_by_user_id, message, proof_urls
  ) VALUES (
    p_credit_id, v_user_id, p_message, p_proof_urls
  ) RETURNING id INTO v_claim_id;

  -- Notify project owners/admins
  PERFORM create_notification(
    pm.user_id,
    'CREDIT_CLAIM_RECEIVED',
    'Credit Claim Received',
    'A user has claimed the credit: ' || v_credit.job_title,
    v_project.id,
    p_credit_id,
    v_claim_id
  )
  FROM project_memberships pm
  WHERE pm.project_id = v_project.id AND pm.role IN ('OWNER', 'ADMIN');

  PERFORM log_audit_action(
    v_user_id,
    'claim_unclaimed_credit',
    'credit',
    p_credit_id,
    jsonb_build_object('claim_id', v_claim_id)
  );

  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_credit_claim(
  p_claim_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_claim credit_claim_requests%ROWTYPE;
  v_credit credits%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_claim FROM credit_claim_requests WHERE id = p_claim_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit claim not found';
  END IF;

  SELECT * INTO v_credit FROM credits WHERE id = v_claim.credit_id;

  IF NOT is_project_admin(v_credit.project_id, v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF v_claim.status != 'PENDING' THEN
    RAISE EXCEPTION 'Credit claim is not pending';
  END IF;

  -- Update credit to link user and set to PENDING_ACCEPTANCE
  UPDATE credits
  SET credited_user_id = v_claim.claimed_by_user_id,
      status = 'PENDING_ACCEPTANCE',
      updated_at = NOW()
  WHERE id = v_claim.credit_id;

  -- Update claim status
  UPDATE credit_claim_requests
  SET status = 'APPROVED',
      responded_by_user_id = v_user_id,
      response_message = p_message,
      updated_at = NOW()
  WHERE id = p_claim_id;

  PERFORM create_notification(
    v_claim.claimed_by_user_id,
    'CREDIT_CLAIM_APPROVED',
    'Credit Claim Approved',
    'Your claim for ' || v_credit.job_title || ' has been approved.',
    v_credit.project_id,
    v_claim.credit_id,
    p_claim_id
  );

  PERFORM log_audit_action(
    v_user_id,
    'approve_credit_claim',
    'credit_claim_request',
    p_claim_id,
    jsonb_build_object('credit_id', v_claim.credit_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deny_credit_claim(
  p_claim_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_claim credit_claim_requests%ROWTYPE;
  v_credit credits%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_claim FROM credit_claim_requests WHERE id = p_claim_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit claim not found';
  END IF;

  SELECT * INTO v_credit FROM credits WHERE id = v_claim.credit_id;

  IF NOT is_project_admin(v_credit.project_id, v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF v_claim.status != 'PENDING' THEN
    RAISE EXCEPTION 'Credit claim is not pending';
  END IF;

  UPDATE credit_claim_requests
  SET status = 'DENIED',
      responded_by_user_id = v_user_id,
      response_message = p_message,
      updated_at = NOW()
  WHERE id = p_claim_id;

  PERFORM create_notification(
    v_claim.claimed_by_user_id,
    'CREDIT_CLAIM_DENIED',
    'Credit Claim Denied',
    COALESCE(p_message, 'Your credit claim has been denied.'),
    v_credit.project_id,
    v_claim.credit_id,
    p_claim_id
  );

  PERFORM log_audit_action(
    v_user_id,
    'deny_credit_claim',
    'credit_claim_request',
    p_claim_id,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREDIT ACCEPTANCE/DECLINE
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_credit(p_credit_id UUID) RETURNS VOID AS $$
DECLARE
  v_credit credits%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_credit FROM credits WHERE id = p_credit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit not found';
  END IF;

  IF v_credit.credited_user_id != v_user_id THEN
    RAISE EXCEPTION 'Can only accept own credits';
  END IF;

  IF v_credit.status != 'PENDING_ACCEPTANCE' THEN
    RAISE EXCEPTION 'Credit is not pending acceptance';
  END IF;

  UPDATE credits
  SET status = 'VERIFIED', updated_at = NOW()
  WHERE id = p_credit_id;

  PERFORM log_audit_action(
    v_user_id,
    'accept_credit',
    'credit',
    p_credit_id,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decline_credit(p_credit_id UUID) RETURNS VOID AS $$
DECLARE
  v_credit credits%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_credit FROM credits WHERE id = p_credit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit not found';
  END IF;

  IF v_credit.credited_user_id != v_user_id THEN
    RAISE EXCEPTION 'Can only decline own credits';
  END IF;

  IF v_credit.status != 'PENDING_ACCEPTANCE' THEN
    RAISE EXCEPTION 'Credit is not pending acceptance';
  END IF;

  UPDATE credits
  SET status = 'REJECTED', updated_at = NOW()
  WHERE id = p_credit_id;

  PERFORM log_audit_action(
    v_user_id,
    'decline_credit',
    'credit',
    p_credit_id,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROJECT ADMIN FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION add_project_admin(
  p_project_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_project_admin(p_project_id, v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  INSERT INTO project_memberships (project_id, user_id, role)
  VALUES (p_project_id, p_user_id, 'ADMIN')
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'ADMIN';

  PERFORM create_notification(
    p_user_id,
    'PROJECT_ADMIN_ADDED',
    'Added as Project Admin',
    'You have been added as an admin for this project.',
    p_project_id,
    NULL,
    NULL
  );

  PERFORM log_audit_action(
    v_user_id,
    'add_project_admin',
    'project',
    p_project_id,
    jsonb_build_object('added_user_id', p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_project_admin(
  p_project_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_current_user_id UUID;
  v_membership project_memberships%ROWTYPE;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_project_admin(p_project_id, v_current_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT * INTO v_membership FROM project_memberships
  WHERE project_id = p_project_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not a project member';
  END IF;

  IF v_membership.role = 'OWNER' THEN
    RAISE EXCEPTION 'Cannot remove project owner';
  END IF;

  DELETE FROM project_memberships
  WHERE project_id = p_project_id AND user_id = p_user_id;

  PERFORM log_audit_action(
    v_current_user_id,
    'remove_project_admin',
    'project',
    p_project_id,
    jsonb_build_object('removed_user_id', p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION publish_project(p_project_id UUID) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_project_admin(p_project_id, v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE projects
  SET status = 'PUBLISHED',
      published_at = COALESCE(published_at, NOW()),
      updated_at = NOW()
  WHERE id = p_project_id;

  PERFORM log_audit_action(
    v_user_id,
    'publish_project',
    'project',
    p_project_id,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION archive_project(p_project_id UUID) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_project_admin(p_project_id, v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE projects
  SET status = 'ARCHIVED', updated_at = NOW()
  WHERE id = p_project_id;

  PERFORM log_audit_action(
    v_user_id,
    'archive_project',
    'project',
    p_project_id,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_ban_user(
  p_user_id UUID,
  p_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_platform_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE profiles
  SET is_banned = TRUE,
      banned_reason = p_reason,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  PERFORM log_audit_action(
    v_admin_id,
    'admin_ban_user',
    'profile',
    p_user_id,
    jsonb_build_object('reason', p_reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_remove_project(
  p_project_id UUID,
  p_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_platform_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE projects
  SET is_removed = TRUE,
      removed_at = NOW(),
      removed_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_project_id;

  PERFORM log_audit_action(
    v_admin_id,
    'admin_remove_project',
    'project',
    p_project_id,
    jsonb_build_object('reason', p_reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_restore_project(p_project_id UUID) RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_platform_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE projects
  SET is_removed = FALSE,
      removed_at = NULL,
      removed_reason = NULL,
      updated_at = NOW()
  WHERE id = p_project_id;

  PERFORM log_audit_action(
    v_admin_id,
    'admin_restore_project',
    'project',
    p_project_id,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_resolve_report(
  p_report_id UUID,
  p_resolution_note TEXT,
  p_status report_status
) RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_platform_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE reports
  SET status = p_status,
      resolved_by_user_id = v_admin_id,
      resolution_note = p_resolution_note,
      updated_at = NOW()
  WHERE id = p_report_id;

  PERFORM log_audit_action(
    v_admin_id,
    'admin_resolve_report',
    'report',
    p_report_id,
    jsonb_build_object('status', p_status)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_resolve_dispute(
  p_dispute_id UUID,
  p_resolution_note TEXT,
  p_status request_status
) RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
  v_dispute credit_disputes%ROWTYPE;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_platform_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_dispute FROM credit_disputes WHERE id = p_dispute_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found';
  END IF;

  UPDATE credit_disputes
  SET status = p_status,
      resolved_by_user_id = v_admin_id,
      resolution_note = p_resolution_note,
      updated_at = NOW()
  WHERE id = p_dispute_id;

  -- If approved, update credit status
  IF p_status = 'APPROVED' THEN
    UPDATE credits
    SET status = 'DISPUTED', updated_at = NOW()
    WHERE id = v_dispute.credit_id;
  END IF;

  PERFORM log_audit_action(
    v_admin_id,
    'admin_resolve_dispute',
    'credit_dispute',
    p_dispute_id,
    jsonb_build_object('status', p_status, 'credit_id', v_dispute.credit_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RATINGS & COMMENTS FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_project_rating(
  p_project_id UUID,
  p_rating SMALLINT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_rating_id UUID;
  v_project projects%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_rating < 0 OR p_rating > 10 THEN
    RAISE EXCEPTION 'Rating must be between 0 and 10';
  END IF;

  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project.status != 'PUBLISHED' OR v_project.is_removed = TRUE THEN
    RAISE EXCEPTION 'Project is not published';
  END IF;

  INSERT INTO project_ratings (project_id, user_id, rating)
  VALUES (p_project_id, v_user_id, p_rating)
  ON CONFLICT (project_id, user_id)
  DO UPDATE SET rating = p_rating, updated_at = NOW()
  RETURNING id INTO v_rating_id;

  RETURN v_rating_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_project_rating(p_project_id UUID) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM project_ratings
  WHERE project_id = p_project_id AND user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_project_comment(
  p_project_id UUID,
  p_body TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_comment_id UUID;
  v_project projects%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF LENGTH(p_body) < 3 OR LENGTH(p_body) > 1500 THEN
    RAISE EXCEPTION 'Comment must be between 3 and 1500 characters';
  END IF;

  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project.status != 'PUBLISHED' OR v_project.is_removed = TRUE THEN
    RAISE EXCEPTION 'Project is not published';
  END IF;

  INSERT INTO project_comments (project_id, user_id, body)
  VALUES (p_project_id, v_user_id, p_body)
  RETURNING id INTO v_comment_id;

  RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION edit_project_comment(
  p_comment_id UUID,
  p_body TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_comment project_comments%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF LENGTH(p_body) < 3 OR LENGTH(p_body) > 1500 THEN
    RAISE EXCEPTION 'Comment must be between 3 and 1500 characters';
  END IF;

  SELECT * INTO v_comment FROM project_comments WHERE id = p_comment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  IF v_comment.user_id != v_user_id THEN
    RAISE EXCEPTION 'Can only edit own comments';
  END IF;

  IF v_comment.status != 'VISIBLE' THEN
    RAISE EXCEPTION 'Cannot edit removed comments';
  END IF;

  UPDATE project_comments
  SET body = p_body, updated_at = NOW()
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_project_comment(
  p_comment_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_comment project_comments%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_comment FROM project_comments WHERE id = p_comment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  SELECT is_admin INTO v_is_admin FROM profiles WHERE user_id = v_user_id;

  -- Allow removal if user is comment owner OR platform admin
  IF v_comment.user_id != v_user_id AND COALESCE(v_is_admin, FALSE) = FALSE THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE project_comments
  SET status = 'REMOVED',
      removed_reason = p_reason,
      removed_by_user_id = CASE WHEN v_comment.user_id != v_user_id THEN v_user_id ELSE NULL END,
      updated_at = NOW()
  WHERE id = p_comment_id;

  IF v_comment.user_id != v_user_id THEN
    PERFORM log_audit_action(
      v_user_id,
      'remove_project_comment',
      'project_comment',
      p_comment_id,
      jsonb_build_object('reason', p_reason)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

