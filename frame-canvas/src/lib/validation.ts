/**
 * Validation helpers for user registration
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate username format
 * Requirements:
 * - 3-20 characters
 * - Only lowercase letters, numbers, and underscores
 * - No spaces or special characters
 */
export function validateUsername(username: string): ValidationError | null {
  if (!username) {
    return { field: "username", message: "Username is required" };
  }

  if (username.length < 3) {
    return {
      field: "username",
      message: "Username must be at least 3 characters",
    };
  }

  if (username.length > 20) {
    return {
      field: "username",
      message: "Username must be at most 20 characters",
    };
  }

  // Check for valid characters (lowercase letters, numbers, underscore)
  if (!/^[a-z0-9_]+$/.test(username)) {
    return {
      field: "username",
      message:
        "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return { field: "email", message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: "email", message: "Please enter a valid email address" };
  }

  return null;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: "password", message: "Password is required" };
  }

  if (password.length < 8) {
    return {
      field: "password",
      message: "Password must be at least 8 characters",
    };
  }

  return null;
}

/**
 * Validate display name
 */
export function validateDisplayName(
  displayName: string
): ValidationError | null {
  if (!displayName) {
    return { field: "displayName", message: "Full name is required" };
  }

  if (displayName.length < 2) {
    return {
      field: "displayName",
      message: "Full name must be at least 2 characters",
    };
  }

  if (displayName.length > 50) {
    return {
      field: "displayName",
      message: "Full name must be at most 50 characters",
    };
  }

  return null;
}

/**
 * Check if error message is due to unique constraint violation
 */
export function isUniqueConstraintError(errorMessage: string): boolean {
  return (
    errorMessage.includes("unique") ||
    errorMessage.includes("Unique constraint") ||
    errorMessage.includes("duplicate key")
  );
}
