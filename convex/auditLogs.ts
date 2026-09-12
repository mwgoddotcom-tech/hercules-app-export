import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internalMutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin.ts";
import type { Id } from "./_generated/dataModel.d.ts";

export const logAction = internalMutation({
  args: {
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    details: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const listAuditLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, entityType, entityId }) => {
    await requireAdmin(ctx);

    if (entityType && entityId) {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_entity", (q) => q.eq("entityType", entityType).eq("entityId", entityId))
        .order("desc")
        .paginate(paginationOpts);
    }

    return await ctx.db.query("auditLogs").order("desc").paginate(paginationOpts);
  },
});
