import { v } from "convex/values";
import { query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";

export const globalSearch = query({
  args: { q: v.string(), locale: v.optional(v.string()) },
  handler: async (ctx, { q, locale }) => {
    if (!q || q.length < 2) return { developers: [], projects: [], areas: [] };

    const search = q.toLowerCase();

    const developers = await ctx.db
      .query("developers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(200);

    const matchedDevelopers = developers
      .filter((d) => {
        const enName = d.translations["en"]?.name?.toLowerCase() ?? "";
        const arName = d.translations["ar"]?.name?.toLowerCase() ?? "";
        return enName.includes(search) || arName.includes(search);
      })
      .slice(0, 5)
      .map((d) => localizeFields(d, locale, ["name", "shortDescription"]));

    const projects = await ctx.db.query("projects").take(500);
    const matchedProjects = projects
      .filter((p) => {
        const enName = p.translations["en"]?.name?.toLowerCase() ?? "";
        const arName = p.translations["ar"]?.name?.toLowerCase() ?? "";
        return enName.includes(search) || arName.includes(search);
      })
      .slice(0, 5)
      .map((p) => localizeFields(p, locale, ["name", "description"]));

    const areas = await ctx.db.query("areas").take(200);
    const matchedAreas = areas
      .filter((a) => {
        const enName = a.translations["en"]?.name?.toLowerCase() ?? "";
        const arName = a.translations["ar"]?.name?.toLowerCase() ?? "";
        return enName.includes(search) || arName.includes(search);
      })
      .slice(0, 5)
      .map((a) => localizeFields(a, locale, ["name", "description"]));

    return {
      developers: matchedDevelopers,
      projects: matchedProjects,
      areas: matchedAreas,
    };
  },
});
