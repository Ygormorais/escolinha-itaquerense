// Importe primeiro (`import "../scripts/env"`) em scripts que usam lib/db:
// carrega .env/.env.local antes de o client resolver DATABASE_URL.
import { loadEnv } from "./load-env"

loadEnv()
