import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin.ts";

const DEFAULT_SETTINGS: Array<{
  key: string;
  value: string;
  description: string;
  category: string;
}> = [
  { key: "site.name.en", value: "Aqarcom", description: "Site name in English", category: "site" },
  { key: "site.name.ar", value: "عقارات كوم", description: "Site name in Arabic", category: "site" },
  { key: "site.tagline.en", value: "Egypt's Most Trusted Real Estate Review Platform", description: "Tagline EN", category: "site" },
  { key: "site.tagline.ar", value: "منصة تقييم العقارات الأكثر موثوقية في مصر", description: "Tagline AR", category: "site" },
  { key: "site.contact.email", value: "contact@aqarcom.com", description: "Contact email", category: "site" },
  { key: "site.contact.phone", value: "+20 2 1234 5678", description: "Contact phone", category: "site" },
  { key: "review.editable_days", value: "7", description: "Days a review can be edited", category: "reviews" },
  { key: "ranking.min_reviews_threshold", value: "5", description: "Minimum reviews for Bayesian ranking", category: "ranking" },
  { key: "ranking.global_mean", value: "6.5", description: "Global mean score for Bayesian prior", category: "ranking" },
];

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return setting?.value ?? null;
  },
});

export const getSettings = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const result: Record<string, string> = {};
    for (const key of keys) {
      const setting = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (setting) result[key] = setting.value;
    }
    return result;
  },
});

export const updateSetting = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique()
      : null;

    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedBy: user?._id });
    } else {
      await ctx.db.insert("platformSettings", {
        key,
        value,
        description: "",
        category: "general",
        updatedBy: user?._id,
      });
    }
  },
});

export const initializeSettings = mutation({
  args: {},
  handler: async (ctx) => {
    for (const s of DEFAULT_SETTINGS) {
      const existing = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q) => q.eq("key", s.key))
        .first();
      if (!existing) {
        await ctx.db.insert("platformSettings", s);
      }
    }
  },
});
