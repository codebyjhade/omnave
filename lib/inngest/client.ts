import { Inngest } from "inngest";

// Initialize the Inngest client for the Omnave AI Engine
export const inngest = new Inngest({
  id: "omnave-engine",
  isDev: process.env.NODE_ENV !== "production",
});
