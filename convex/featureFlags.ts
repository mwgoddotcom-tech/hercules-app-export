import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin.ts";

const DEFAULT_FLAGS: Array<{ key: string; isEnabled: boolean; description: string }> = [
  { key: "registration", isEnabled: true, description: "Allow new user registrations" },
  { key: "reviews", isEnabled: true, description: "Allow review submissions" },
  { key: "claims", isEnabled: true, description: "Allow developer claims" },
  { key: "developer_responses", isEnabled: true, description: "Allow developer responses to reviews" },
  { key: "compare", isEnabled: true, description: "Enable developer comparison feature" },
  { key: "featured_content", isEnabled: true, description: "Show featured content sections" },
  { key: "contact_form", isEnabled: true, description: "Enable contact form" },
];

export const getFlag = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const flag = await ctx.db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return flag?.isEnabled ?? false;
  },
});

export const getFlags = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("featureFlags").collect();
  },
});

export const setFlag = mutation({
  args: { key: v.string(), isEnabled: v.boolean() },
  handler: async (ctx, { key, isEnabled }) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique()
      : null;

    const existing = await ctx.db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { isEnabled, updatedBy: user?._id });
    } else {
      await ctx.db.insert("featureFlags", {
        key,
        isEnabled,
        description: "",
        updatedBy: user?._id,
      });
    }
  },
});

export const initializeFlags = mutation({
  args: {},
  handler: async (ctx) => {
    for (const f of DEFAULT_FLAGS) {
      const existing = await ctx.db
        .query("featureFlags")
        .withIndex("by_key", (q) => q.eq("key", f.key))
        .first();
      if (!existing) {
        await ctx.db.insert("featureFlags", f);
      }
    }
  },
});
