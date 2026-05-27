import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Add it to your environment (locally in .env, on Vercel in Project Settings → Environment Variables) and rebuild."
  );
}

export const convex = new ConvexReactClient(convexUrl);
