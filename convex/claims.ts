import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth } from "./lib/admin.ts";

export const submitClaim = mutation({
  args: {
    developerId: v.id("developers"),
    companyName: v.string(),
    contactName: v.string(),
    businessEmail: v.string(),
    phone: v.string(),
    role: v.string(),
    reason: v.string(),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check for existing pending claim
    const existing = await ctx.db
      .query("developerClaims")
      .withIndex("by_developer", (q) => q.eq("developerId", args.developerId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existing && existing.status === "pending") {
      throw new ConvexError({ code: "CONFLICT", message: "You already have a pending claim for this developer" });
    }

    return await ctx.db.insert("developerClaims", {
      ...args,
      userId: user._id,
      status: "pending",
    });
  },
});

export const getClaimsByDeveloper = query({
  args: { developerId: v.id("developers") },
  handler: async (ctx, { developerId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("developerClaims")
      .withIndex("by_developer", (q) => q.eq("developerId", developerId))
      .collect();
  },
});

export const listClaims = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { status, paginationOpts }) => {
    await requireAdmin(ctx);
    if (status) {
      return await ctx.db
        .query("developerClaims")
        .withIndex("by_status", (q) => q.eq("status", status))
        .paginate(paginationOpts);
    }
    return await ctx.db.query("developerClaims").paginate(paginationOpts);
  },
});

export const approveClaim = mutation({
  args: { claimId: v.id("developerClaims") },
  handler: async (ctx, { claimId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(claimId, { status: "approved" });
  },
});

export const rejectClaim = mutation({
  args: { claimId: v.id("developerClaims"), reason: v.string() },
  handler: async (ctx, { claimId, reason }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(claimId, { status: "rejected", adminNote: reason });
  },
});
