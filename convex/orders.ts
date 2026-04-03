import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
  args: {
    customerName: v.string(),
    contactNumber: v.string(),
    serviceType: v.union(
      v.literal("dine-in"),
      v.literal("pickup"),
      v.literal("delivery")
    ),
    address: v.optional(v.string()),
    pickupTime: v.optional(v.string()),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("gcash"),
      v.literal("bank-transfer"),
      v.literal("cards")
    ),
    referenceNumber: v.optional(v.string()),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        totalPrice: v.number(),
        variations: v.optional(
          v.array(v.object({ type: v.string(), name: v.string() }))
        ),
        servingPreference: v.optional(v.string()),
        addOns: v.optional(v.array(v.string())),
      })
    ),
    bundleItems: v.optional(
      v.array(
        v.object({
          bundleName: v.string(),
          quantity: v.number(),
          bundlePrice: v.number(),
          items: v.array(
            v.object({
              name: v.string(),
              variations: v.optional(
                v.array(v.object({ type: v.string(), name: v.string() }))
              ),
              servingPreference: v.optional(v.string()),
              addOns: v.optional(v.array(v.string())),
            })
          ),
        })
      )
    ),
    notes: v.optional(v.string()),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const todaysOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", startOfDay))
      .collect();
    const orderNum = (todaysOrders.length + 1).toString().padStart(3, "0");
    const orderNumber = `ORD-${dateStr}-${orderNum}`;

    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      customerName: args.customerName,
      contactNumber: args.contactNumber,
      serviceType: args.serviceType,
      address: args.address,
      pickupTime: args.pickupTime,
      paymentMethod: args.paymentMethod,
      referenceNumber: args.referenceNumber,
      items: args.items,
      bundleItems: args.bundleItems,
      notes: args.notes,
      total: args.total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, orderNumber };
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getActiveOrders = query({
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
    return orders.filter(
      (o) => !["completed", "cancelled"].includes(o.status)
    );
  },
});

export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const getOrdersByDateRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) =>
        q.gte("createdAt", args.startTime).lte("createdAt", args.endTime)
      )
      .order("desc")
      .collect();
  },
});

export const getCompletedOrders = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q;
    if (args.startTime !== undefined && args.endTime !== undefined) {
      q = ctx.db
        .query("orders")
        .withIndex("by_createdAt", (idx) =>
          idx.gte("createdAt", args.startTime!).lte("createdAt", args.endTime!)
        );
    } else {
      q = ctx.db.query("orders").withIndex("by_createdAt");
    }
    const orders = await q.order("desc").collect();
    return orders.filter((o) =>
      ["completed", "cancelled"].includes(o.status)
    );
  },
});
