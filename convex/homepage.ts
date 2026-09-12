import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { localizeFields } from "./lib/i18n.ts";
import { requireAdmin } from "./lib/admin.ts";

const DEFAULT_SECTIONS = [
  {
    key: "hero",
    order: 1,
    isVisible: true,
    sectionType: "hero",
    translations: {
      en: {
        title: "Egypt's Most Trusted Real Estate Review Platform",
        subtitle: "Genuine reviews from real buyers, owners, and residents. Find the developer you can trust.",
        ctaText: "Browse Rankings",
        ctaUrl: "/rankings",
      },
      ar: {
        title: "منصة تقييم العقارات الأكثر موثوقية في مصر",
        subtitle: "تقييمات حقيقية من مشترين وملاك وسكان فعليين. ابحث عن المطور الذي يمكنك الوثوق به.",
        ctaText: "تصفح التصنيفات",
        ctaUrl: "/rankings",
      },
    },
  },
  {
    key: "featured_developers",
    order: 2,
    isVisible: true,
    sectionType: "grid",
    translations: {
      en: { title: "Top Ranked Developers", subtitle: "Based on verified customer reviews" },
      ar: { title: "أفضل المطورين تصنيفاً", subtitle: "بناءً على تقييمات العملاء الموثقة" },
    },
  },
  {
    key: "how_it_works",
    order: 3,
    isVisible: true,
    sectionType: "steps",
    translations: {
      en: { title: "How Aqarcom Works", subtitle: "Transparent rankings you can trust" },
      ar: { title: "كيف يعمل عقارات كوم", subtitle: "تصنيفات شفافة يمكنك الوثوق بها" },
    },
  },
  {
    key: "methodology_callout",
    order: 4,
    isVisible: true,
    sectionType: "callout",
    translations: {
      en: {
        title: "No Pay-to-Rank",
        body: "Developers cannot pay to improve their ranking. Every score is earned through genuine customer experience.",
        ctaText: "Read Our Methodology",
        ctaUrl: "/methodology",
      },
      ar: {
        title: "لا دفع مقابل التصنيف",
        body: "لا يمكن للمطورين الدفع لتحسين تصنيفهم. كل درجة تُكسب من خلال تجربة العميل الحقيقية.",
        ctaText: "اقرأ منهجيتنا",
        ctaUrl: "/methodology",
      },
    },
  },
  {
    key: "featured_areas",
    order: 5,
    isVisible: true,
    sectionType: "grid",
    translations: {
      en: { title: "Explore By Area", subtitle: "Find developers active in your preferred location" },
      ar: { title: "استكشف حسب المنطقة", subtitle: "ابحث عن المطورين النشطين في موقعك المفضل" },
    },
  },
];

export const getHomepageSections = query({
  args: { locale: v.optional(v.string()) },
  handler: async (ctx, { locale }) => {
    const docs = await ctx.db
      .query("homepageSections")
      .withIndex("by_order")
      .collect();
    const visible = docs.filter((d) => d.isVisible);
    return visible.map((d) =>
      localizeFields(d, locale, ["title", "subtitle", "body", "ctaText", "ctaUrl", "imageUrl"])
    );
  },
});

export const getHomepageSection = query({
  args: { key: v.string(), locale: v.optional(v.string()) },
  handler: async (ctx, { key, locale }) => {
    const doc = await ctx.db
      .query("homepageSections")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (!doc) return null;
    return localizeFields(doc, locale, ["title", "subtitle", "body", "ctaText", "ctaUrl", "imageUrl"]);
  },
});

export const updateHomepageSection = mutation({
  args: {
    key: v.string(),
    locale: v.string(),
    translations: v.object({
      title: v.optional(v.string()),
      subtitle: v.optional(v.string()),
      body: v.optional(v.string()),
      ctaText: v.optional(v.string()),
      ctaUrl: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
    isVisible: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { key, locale, translations, isVisible, order }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("homepageSections")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      const updatedTranslations = { ...existing.translations, [locale]: translations };
      const patch: Record<string, unknown> = { translations: updatedTranslations };
      if (isVisible !== undefined) patch.isVisible = isVisible;
      if (order !== undefined) patch.order = order;
      await ctx.db.patch(existing._id, patch);
    }
  },
});

export const initializeHomepageSections = mutation({
  args: {},
  handler: async (ctx) => {
    for (const s of DEFAULT_SECTIONS) {
      const existing = await ctx.db
        .query("homepageSections")
        .withIndex("by_key", (q) => q.eq("key", s.key))
        .first();
      if (!existing) {
        await ctx.db.insert("homepageSections", s);
      }
    }
  },
});
