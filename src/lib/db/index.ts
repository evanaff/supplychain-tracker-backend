import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";
import config from "../../common/config/index";

const pool = new Pool({
  connectionString: config.db.url,
});

export const db = drizzle(pool, { schema });