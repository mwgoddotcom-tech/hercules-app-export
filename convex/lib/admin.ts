import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

// Helper to check if current user is admin
// Throws ConvexError with FORBIDDEN if not admin
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not authenticated" });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!user || !user.isAdmin) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

// Returns the current user or throws if not authenticated
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not authenticated" });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  }

  return user;
}
