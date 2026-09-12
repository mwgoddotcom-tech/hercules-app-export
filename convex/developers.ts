import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";
import { requireAdmin } from "./lib/admin.ts";

export const getDeveloperBySlug = query({
  args: { slug: v.string(), locale: v.optional(v.string()) },
  handler: async (ctx, { slug, locale }) => {
    const doc = await ctx.db
      .query("developers")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!doc) return null;
    return localizeFields(doc, locale, ["name", "description", "shortDescription", "metaTitle", "metaDescription"]);
  },
});

export const listDevelopers = query({
  args: {
    locale: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
    areaId: v.optional(v.id("areas")),
    governorateId: v.optional(v.id("governorates")),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, { locale, paginationOpts, status = "active", areaId, governorateId }) => {
    const result = await ctx.db
      .query("developers")
      .withIndex("by_status", (q) => q.eq("status", status))
      .paginate(paginationOpts);

    let filtered = result.page;
    if (areaId) {
      filtered = filtered.filter((d) => d.areaIds.includes(areaId));
    }
    if (governorateId) {
      filtered = filtered.filter((d) => d.governorateIds.includes(governorateId));
    }

    return {
      ...result,
      page: filtered.map((d) =>
        localizeFields(d, locale, ["name", "description", "shortDescription", "metaTitle", "metaDescription"])
      ),
    };
  },
});

export const getFeaturedDevelopers = query({
  args: { locale: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { locale, limit = 6 }) => {
    const docs = await ctx.db
      .query("developers")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .take(limit);
    return docs.map((d) =>
      localizeFields(d, locale, ["name", "description", "shortDescription", "metaTitle", "metaDescription"])
    );
  },
});

export const createDeveloper = mutation({
  args: {
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    isVerified: v.boolean(),
    isFeatured: v.boolean(),
    governorateIds: v.array(v.id("governorates")),
    cityIds: v.array(v.id("cities")),
    areaIds: v.array(v.id("areas")),
    translations: v.record(
      v.string(),
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        shortDescription: v.optional(v.string()),
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("developers").withIndex("by_slug", (q) => q.eq("slug", args.slug)).first();
    if (existing) throw new ConvexError({ code: "CONFLICT", message: "Slug already exists" });
    return await ctx.db.insert("developers", { ...args, status: "active" });
  },
});

export const updateDeveloper = mutation({
  args: {
    id: v.id("developers"),
    slug: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    governorateIds: v.optional(v.array(v.id("governorates"))),
    cityIds: v.optional(v.array(v.id("cities"))),
    areaIds: v.optional(v.array(v.id("areas"))),
    translations: v.optional(
      v.record(
        v.string(),
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
          shortDescription: v.optional(v.string()),
          metaTitle: v.optional(v.string()),
          metaDescription: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, updates);
  },
});

export const archiveDeveloper = mutation({
  args: { id: v.id("developers") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status: "archived" });
  },
});

export const verifyDeveloper = mutation({
  args: { id: v.id("developers") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { isVerified: true });
  },
});
