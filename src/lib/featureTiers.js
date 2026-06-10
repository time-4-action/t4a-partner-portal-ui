/**
 * Early-access programs — which features sit behind which tier role.
 *
 * Tiers are Auth0 roles ('alpha' / 'beta') delivered through the same Post-Login-Action
 * claim as 'export'. Everyone still SEES the feature in the navbar; without the role the
 * page renders <TierGate> (join-the-program screen) instead of the feature, and the API
 * enforces the same role server-side (requireTier middleware).
 *
 * To graduate a feature: change its `tier` here AND in the API route file
 * (api/src/routes/{shopify,external}Routes.js), or remove the gate entirely.
 */
export const ROLES_CLAIM = "https://time-4-action.com/roles";

export const FEATURE_TIERS = {
  shopify: {
    tier: "alpha",
    name: "Shopify Integration",
    tagline:
      "Connect your own Shopify store and let the portal keep it in sync — live stock, product creation, prices, descriptions, images and sales channels, fully automatic.",
    perks: [
      "Push live stock to your store on every catalogue refresh",
      "Auto-create products with variants, prices, images and tags",
      "Portal-authoritative mode keeps listings healed and in order",
    ],
  },
  ownSources: {
    tier: "alpha",
    name: "Own Sources",
    tagline:
      "Bring the other brands you resell — register your own supplier feeds and push them through the same Shopify pipeline as the Patrik catalogue.",
    perks: [
      "Register any supplier feed that follows the published format",
      "Scheduled imports with validation and health reporting",
      "Same matching, pricing and image pipeline as the main catalogue",
    ],
  },
};

/** True when the given roles satisfy a tier (no tier = open to everyone). */
export const hasTierAccess = (roles, tier) => !tier || (roles ?? []).includes(tier);
