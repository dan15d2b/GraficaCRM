// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// ⚠️ EDGE RUNTIME DESATIVADO: better-sqlite3 não funciona no Edge Runtime
// Para produção, usar apenas Node.js runtime ou configurar separadamente.

import * as Sentry from "@sentry/nextjs";
import { resolveSentryDsn, isCommunityDsn } from "./lib/sentry/dsn";

const sentryDsn = resolveSentryDsn(process.env.SENTRY_DSN);

// Só inicializa se DSN foi configurado
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: isCommunityDsn(sentryDsn) ? 0 : 1,
    // Coleta mínima para evitar carregar melhor-sqlite3 no Edge Runtime
    enabled: false,
  });
}

export {};