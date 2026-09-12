import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";
import { requireAdmin } from "./lib/admin.ts";

export const getContentPage = query({
  args: { slug: v.string(), locale: v.optional(v.string()) },
  handler: async (ctx, { slug, locale }) => {
    const doc = await ctx.db
      .query("contentPages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!doc || doc.status !== "published") return null;
    return localizeFields(doc, locale, ["title", "body", "metaTitle", "metaDescription", "seoTitle", "seoDescription"]);
  },
});

export const listContentPages = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("contentPages").collect();
  },
});

export const createContentPage = mutation({
  args: {
    slug: v.string(),
    locale: v.string(),
    title: v.string(),
    body: v.string(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("contentPages").withIndex("by_slug", (q) => q.eq("slug", args.slug)).first();
    if (existing) throw new ConvexError({ code: "CONFLICT", message: "Slug already exists" });

    return await ctx.db.insert("contentPages", {
      slug: args.slug,
      status: "draft",
      translations: {
        [args.locale]: {
          title: args.title,
          body: args.body,
          metaTitle: args.metaTitle,
          metaDescription: args.metaDescription,
        },
      },
    });
  },
});

export const updateContentPage = mutation({
  args: {
    id: v.id("contentPages"),
    locale: v.string(),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, { id, locale, status, ...fields }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(id);
    if (!existing) throw new ConvexError({ code: "NOT_FOUND", message: "Page not found" });

    const updatedTranslations = {
      ...existing.translations,
      [locale]: { ...existing.translations[locale], ...fields },
    };

    const patch: Record<string, unknown> = { translations: updatedTranslations };
    if (status) patch.status = status;
    await ctx.db.patch(id, patch);
  },
});

export const publishContentPage = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, {
      status: "published",
      publishedAt: new Date().toISOString(),
    });
  },
});
