import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin.ts";

export const listMedia = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    return await ctx.db.query("mediaItems").order("desc").paginate(paginationOpts);
  },
});

export const createMediaItem = mutation({
  args: {
    url: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    altText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique()
      : null;

    return await ctx.db.insert("mediaItems", {
      ...args,
      uploadedBy: user?._id,
    });
  },
});

export const deleteMediaItem = mutation({
  args: { id: v.id("mediaItems") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
