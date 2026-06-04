import app from "./app";
import { logger } from "./lib/logger";
import { startScheduler } from "./lib/scheduler";
import { startScanner } from "./lib/scanner";
import { loadConfigFromDb } from "./lib/runtime-config";

// Port ayarı Render ve diğer ücretsiz platformlarla uyumlu hale getirildi
const port = Number(process.env.PORT || 3000);

const AUTO_START = process.env["SCHEDULER_AUTO_START"] !== "false";

app.listen(port, async (err) => {
  if (err) { logger.error({ err }, "Error listening"); process.exit(1); }
  logger.info({ port }, "Server listening");

  await loadConfigFromDb();
  startScanner();
  logger.info("Background scanner started (10s interval)");

  if (AUTO_START) {
    try {
      const state = startScheduler();
      logger.info({ cron: state.cronExpression }, "Reward scheduler started (every 3 min)");
    } catch (err) {
      logger.warn({ err }, "Reward scheduler failed to auto-start");
    }
  }
});