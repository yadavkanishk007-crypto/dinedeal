import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
})();

const safeStorage = (() => {
  try {
    return localStorage;
  } catch {
    return memoryStorage;
  }
})();

export const supabase = createClient<Database>(
  "https://api.dinedeal.in",
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: safeStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
