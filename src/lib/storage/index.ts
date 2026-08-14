import { createClient } from "@supabase/supabase-js";
import config from "../../common/config";

export const supabaseClient = createClient(
    config.supabase.url,
    config.supabase.serviceKey
);