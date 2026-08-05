import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orders: defineTable({
    orderNumber: v.string(),
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
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Set when the order reaches a closed status (completed/cancelled).
    // Optional because rows predating this field have no closing time.
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  pushTokens: defineTable({
    token: v.string(),
    role: v.union(v.literal("staff"), v.literal("owner")),
    createdAt: v.number(),
  }).index("by_token", ["token"]),
});
