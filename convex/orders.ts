import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  CLOSED_STATUSES,
  selectHistoryOrders,
  statusPatch,
} from "./lib/orderHistory";

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

    await ctx.scheduler.runAfter(0, api.notifications.sendNewOrderNotification, {
      orderNumber,
      customerName: args.customerName,
      total: args.total,
      orderId: orderId,
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
    await ctx.db.patch(args.orderId, statusPatch(args.status, Date.now()));
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
    // Fetched by status rather than by a createdAt index range: History windows
    // on closing time, and `completedAt` is absent on legacy rows, so no single
    // timestamp index covers the set. Closed orders are a bounded working set
    // for a single cafe, so filtering the window in memory is fine here.
    const byStatus = await Promise.all(
      CLOSED_STATUSES.map((status) =>
        ctx.db
          .query("orders")
          .withIndex("by_status", (idx) => idx.eq("status", status))
          .collect()
      )
    );

    return selectHistoryOrders(byStatus.flat(), {
      startTime: args.startTime,
      endTime: args.endTime,
    });
  },
});
