import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";
import { requireAdmin } from "./lib/admin.ts";

export const listFaqs = query({
  args: { locale: v.optional(v.string()) },
  handler: async (ctx, { locale }) => {
    const docs = await ctx.db
      .query("faqItems")
      .withIndex("by_order")
      .collect();
    const active = docs.filter((d) => d.isActive);
    return active.map((d) => localizeFields(d, locale, ["question", "answer"]));
  },
});

export const listAllFaqs = query({
  args: { locale: v.optional(v.string()) },
  handler: async (ctx, { locale }) => {
    await requireAdmin(ctx);
    const docs = await ctx.db.query("faqItems").withIndex("by_order").collect();
    return docs.map((d) => localizeFields(d, locale, ["question", "answer"]));
  },
});

export const createFaq = mutation({
  args: {
    order: v.number(),
    isActive: v.boolean(),
    category: v.optional(v.string()),
    translations: v.record(
      v.string(),
      v.object({ question: v.string(), answer: v.string() }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("faqItems", args);
  },
});

export const updateFaq = mutation({
  args: {
    id: v.id("faqItems"),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    category: v.optional(v.string()),
    translations: v.optional(
      v.record(v.string(), v.object({ question: v.string(), answer: v.string() })),
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, updates);
  },
});

export const reorderFaqs = mutation({
  args: { orderedIds: v.array(v.id("faqItems")) },
  handler: async (ctx, { orderedIds }) => {
    await requireAdmin(ctx);
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i + 1 });
    }
  },
});

export const toggleFaq = mutation({
  args: { id: v.id("faqItems"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { isActive });
  },
});
