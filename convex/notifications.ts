import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const registerPushToken = mutation({
  args: {
    token: v.string(),
    role: v.union(v.literal("staff"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }

    return await ctx.db.insert("pushTokens", {
      token: args.token,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

export const removePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getAllPushTokens = query({
  handler: async (ctx) => {
    return await ctx.db.query("pushTokens").collect();
  },
});

export const sendNewOrderNotification = action({
  args: {
    orderNumber: v.string(),
    customerName: v.string(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(api.notifications.getAllPushTokens);

    if (tokens.length === 0) return;

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: "New Order!",
      body: `Order ${args.orderNumber} from ${args.customerName || "Customer"} - PHP ${args.total.toFixed(2)}`,
      sound: "default",
      data: { orderNumber: args.orderNumber },
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      if (result.data) {
        for (let i = 0; i < result.data.length; i++) {
          if (
            result.data[i].status === "error" &&
            result.data[i].details?.error === "DeviceNotRegistered"
          ) {
            await ctx.runMutation(api.notifications.removePushToken, {
              token: tokens[i].token,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to send push notifications:", error);
    }
  },
});
