import { query } from "./_generated/server";
import { v } from "convex/values";

const VALID_PASSWORD = "DonMacchiatos2026@";

export const validatePassword = query({
  args: { password: v.string() },
  handler: async (_ctx, args) => {
    return args.password === VALID_PASSWORD;
  },
});
