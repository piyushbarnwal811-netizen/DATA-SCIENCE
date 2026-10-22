/**
 * Enterprise Password Policy Validator for College CodeRank
 *
 * Requirements:
 * - Minimum 8 characters (max 128)
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{};':"|,.<>/?~`)
 */
export function validatePasswordStrength(password) {
  if (typeof password !== "string" || !password) {
    return {
      isValid: false,
      message: "Password is required."
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long."
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: "Password cannot exceed 128 characters."
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter (A-Z)."
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter (a-z)."
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one numeric digit (0-9)."
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character (e.g. !@#$%^&*)."
    };
  }

  return { isValid: true };
}

/**
 * Returns a human-friendly list of password policy requirements.
 */
export const PASSWORD_POLICY_DESCRIPTION = [
  "Minimum 8 characters",
  "At least 1 uppercase letter (A-Z)",
  "At least 1 lowercase letter (a-z)",
  "At least 1 number (0-9)",
  "At least 1 special character (!@#$%^&*...)"
];
