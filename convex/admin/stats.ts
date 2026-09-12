import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAdmin } from "../lib/admin.ts";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    // Return null gracefully instead of throwing for non-admins
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user?.isAdmin) return null;

    const [developers, projects, reviews, users, pendingReviews, pendingClaims] = await Promise.all([
      ctx.db.query("developers").withIndex("by_status", (q) => q.eq("status", "active")).take(1000),
      ctx.db.query("projects").take(1000),
      ctx.db.query("reviews").take(1000),
      ctx.db.query("users").take(1000),
      ctx.db.query("reviews").withIndex("by_status", (q) => q.eq("status", "pending")).take(100),
      ctx.db.query("developerClaims").withIndex("by_status", (q) => q.eq("status", "pending")).take(100),
    ]);

    const approvedReviews = reviews.filter((r) => r.status === "approved");
    const avgScore =
      approvedReviews.length > 0
        ? approvedReviews.reduce((s, r) => s + r.overallScore, 0) / approvedReviews.length
        : 0;

    return {
      totalDevelopers: developers.length,
      totalProjects: projects.length,
      totalReviews: reviews.length,
      totalUsers: users.length,
      pendingReviews: pendingReviews.length,
      pendingClaims: pendingClaims.length,
      approvedReviews: approvedReviews.length,
      averageScore: Math.round(avgScore * 10) / 10,
    };
  },
});

export const listUsers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user?.isAdmin) return { page: [], isDone: true, continueCursor: "" };
    return await ctx.db.query("users").order("desc").paginate(paginationOpts);
  },
});

export const toggleAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) return null;
    await ctx.db.patch(userId, { isAdmin: !user.isAdmin });
    return { isAdmin: !user.isAdmin };
  },
});
