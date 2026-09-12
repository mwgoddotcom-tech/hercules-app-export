import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";
import { requireAdmin } from "./lib/admin.ts";

export const listCriteria = query({
  args: { locale: v.optional(v.string()) },
  handler: async (ctx, { locale }) => {
    const docs = await ctx.db
      .query("ratingCriteria")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    docs.sort((a, b) => a.order - b.order);
    return docs.map((d) => localizeFields(d, locale, ["name", "description"]));
  },
});

export const listAllCriteria = query({
  args: { locale: v.optional(v.string()) },
  handler: async (ctx, { locale }) => {
    const docs = await ctx.db.query("ratingCriteria").collect();
    docs.sort((a, b) => a.order - b.order);
    return docs.map((d) => localizeFields(d, locale, ["name", "description"]));
  },
});

export const createCriteria = mutation({
  args: {
    slug: v.string(),
    weight: v.number(),
    order: v.number(),
    isActive: v.boolean(),
    translations: v.record(
      v.string(),
      v.object({ name: v.string(), description: v.optional(v.string()) }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("ratingCriteria", args);
  },
});

export const updateCriteria = mutation({
  args: {
    id: v.id("ratingCriteria"),
    slug: v.optional(v.string()),
    weight: v.optional(v.number()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    translations: v.optional(
      v.record(
        v.string(),
        v.object({ name: v.string(), description: v.optional(v.string()) }),
      ),
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, updates);
  },
});

export const reorderCriteria = mutation({
  args: { orderedIds: v.array(v.id("ratingCriteria")) },
  handler: async (ctx, { orderedIds }) => {
    await requireAdmin(ctx);
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i + 1 });
    }
  },
});
