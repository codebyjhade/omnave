export const maxDuration = 60;

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { monitorOperationalHealth, processMaterial, purgeOperationalData, recoverStaleMaterialJobs } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processMaterial,
    recoverStaleMaterialJobs,
    monitorOperationalHealth,
    purgeOperationalData,
  ],
});
