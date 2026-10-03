/**
 * Single source of truth for the Money Habits tool's public page identity.
 *
 * This is deliberately separate from narration/source files: changing the
 * page name must never rewrite approved voice-over, captions or historical
 * artifact names. Renderers and the review UI should import this lock instead
 * of carrying their own display-name/handle literals.
 */
export const LOCKED_PAGE_BRAND = {
  displayName: "DifferentActually",
  handle: "@differentactually",
  tagline: "DAILY HABITS",
  avatarAsset: "assets/money-habits-avatar.svg",
} as const;

export type LockedPageBrand = typeof LOCKED_PAGE_BRAND;
