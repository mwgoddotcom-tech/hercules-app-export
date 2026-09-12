import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";
import { requireAdmin } from "./lib/admin.ts";

export const getNavItems = query({
  args: { locale: v.optional(v.string()) },
  handler: async (ctx, { locale }) => {
    const docs = await ctx.db.query("navigationItems").withIndex("by_order").collect();
    const active = docs.filter((d) => d.isActive && !d.isAdminOnly);
    return active.map((d) => localizeFields(d, locale, ["label", "url"]));
  },
});

export const getAllNavItems = query({
  args: { locale: v.optional(v.string()) },
  handler: async (ctx, { locale }) => {
    await requireAdmin(ctx);
    const docs = await ctx.db.query("navigationItems").withIndex("by_order").collect();
    return docs.map((d) => localizeFields(d, locale, ["label", "url"]));
  },
});

export const createNavItem = mutation({
  args: {
    order: v.number(),
    isActive: v.boolean(),
    requiresAuth: v.optional(v.boolean()),
    isAdminOnly: v.optional(v.boolean()),
    translations: v.record(v.string(), v.object({ label: v.string(), url: v.string() })),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("navigationItems", args);
  },
});

export const updateNavItem = mutation({
  args: {
    id: v.id("navigationItems"),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    requiresAuth: v.optional(v.boolean()),
    isAdminOnly: v.optional(v.boolean()),
    translations: v.optional(
      v.record(v.string(), v.object({ label: v.string(), url: v.string() })),
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, updates);
  },
});

export const reorderNavItems = mutation({
  args: { orderedIds: v.array(v.id("navigationItems")) },
  handler: async (ctx, { orderedIds }) => {
    await requireAdmin(ctx);
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i + 1 });
    }
  },
});
