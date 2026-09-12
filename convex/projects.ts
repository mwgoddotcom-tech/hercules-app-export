import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";
import { requireAdmin } from "./lib/admin.ts";

export const getProjectBySlug = query({
  args: { slug: v.string(), locale: v.optional(v.string()) },
  handler: async (ctx, { slug, locale }) => {
    const doc = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!doc) return null;
    return localizeFields(doc, locale, ["name", "description", "metaTitle", "metaDescription"]);
  },
});

export const getProjectById = query({
  args: { projectId: v.id("projects"), locale: v.optional(v.string()) },
  handler: async (ctx, { projectId, locale }) => {
    const doc = await ctx.db.get(projectId);
    if (!doc) return null;
    return localizeFields(doc, locale, ["name", "description", "metaTitle", "metaDescription"]);
  },
});

export const listProjects = query({
  args: {
    locale: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
    developerId: v.optional(v.id("developers")),
    areaId: v.optional(v.id("areas")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { locale, paginationOpts, developerId, areaId, status }) => {
    let baseQuery;
    if (developerId) {
      baseQuery = ctx.db.query("projects").withIndex("by_developer", (q) => q.eq("developerId", developerId));
    } else if (areaId) {
      baseQuery = ctx.db.query("projects").withIndex("by_area", (q) => q.eq("areaId", areaId));
    } else {
      baseQuery = ctx.db.query("projects");
    }

    const result = await baseQuery.paginate(paginationOpts);

    let filtered = result.page;
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    return {
      ...result,
      page: filtered.map((d) => localizeFields(d, locale, ["name", "description", "metaTitle", "metaDescription"])),
    };
  },
});

export const listProjectsByDeveloper = query({
  args: { developerId: v.id("developers"), locale: v.optional(v.string()) },
  handler: async (ctx, { developerId, locale }) => {
    const docs = await ctx.db
      .query("projects")
      .withIndex("by_developer", (q) => q.eq("developerId", developerId))
      .collect();
    return docs.map((d) => localizeFields(d, locale, ["name", "description", "metaTitle", "metaDescription"]));
  },
});

export const getFeaturedProjects = query({
  args: { locale: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { locale, limit = 6 }) => {
    const docs = await ctx.db
      .query("projects")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .take(limit);
    return docs.map((d) => localizeFields(d, locale, ["name", "description", "metaTitle", "metaDescription"]));
  },
});

export const createProject = mutation({
  args: {
    slug: v.string(),
    developerId: v.id("developers"),
    governorateId: v.id("governorates"),
    cityId: v.id("cities"),
    areaId: v.id("areas"),
    phaseId: v.optional(v.id("phases")),
    status: v.union(
      v.literal("under_construction"),
      v.literal("delivered"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("unknown"),
    ),
    imageUrls: v.array(v.string()),
    isFeatured: v.boolean(),
    translations: v.record(
      v.string(),
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("projects").withIndex("by_slug", (q) => q.eq("slug", args.slug)).first();
    if (existing) throw new ConvexError({ code: "CONFLICT", message: "Slug already exists" });
    return await ctx.db.insert("projects", args);
  },
});

export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    slug: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("under_construction"),
        v.literal("delivered"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("unknown"),
      ),
    ),
    imageUrls: v.optional(v.array(v.string())),
    isFeatured: v.optional(v.boolean()),
    translations: v.optional(
      v.record(
        v.string(),
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
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

export const archiveProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status: "cancelled" });
  },
});
