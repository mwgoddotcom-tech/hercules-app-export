/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_stats from "../admin/stats.js";
import type * as auditLogs from "../auditLogs.js";
import type * as claims from "../claims.js";
import type * as content from "../content.js";
import type * as developers from "../developers.js";
import type * as faqs from "../faqs.js";
import type * as featureFlags from "../featureFlags.js";
import type * as geography from "../geography.js";
import type * as homepage from "../homepage.js";
import type * as leads from "../leads.js";
import type * as lib_admin from "../lib/admin.js";
import type * as lib_i18n from "../lib/i18n.js";
import type * as media from "../media.js";
import type * as navigation from "../navigation.js";
import type * as projects from "../projects.js";
import type * as ranking from "../ranking.js";
import type * as ratingCriteria from "../ratingCriteria.js";
import type * as reviews from "../reviews.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seedDevelopers from "../seedDevelopers.js";
import type * as seedProjects from "../seedProjects.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/stats": typeof admin_stats;
  auditLogs: typeof auditLogs;
  claims: typeof claims;
  content: typeof content;
  developers: typeof developers;
  faqs: typeof faqs;
  featureFlags: typeof featureFlags;
  geography: typeof geography;
  homepage: typeof homepage;
  leads: typeof leads;
  "lib/admin": typeof lib_admin;
  "lib/i18n": typeof lib_i18n;
  media: typeof media;
  navigation: typeof navigation;
  projects: typeof projects;
  ranking: typeof ranking;
  ratingCriteria: typeof ratingCriteria;
  reviews: typeof reviews;
  search: typeof search;
  seed: typeof seed;
  seedDevelopers: typeof seedDevelopers;
  seedProjects: typeof seedProjects;
  settings: typeof settings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
