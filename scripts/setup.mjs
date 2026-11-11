// Tek seferlik Supabase kurulumu:
//  1) SUPABASE_DB_URL verilmişse supabase/schema.sql'i veritabanına uygular
//  2) PLAKCI_EMAIL + PLAKCI_PASSWORD ile sahip hesabını oluşturur (varsa şifresini günceller)
// Kullanım: npm install && npm run setup
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env")) process.loadEnvFile(".env");
const env = process.env;

const need = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PLAKCI_EMAIL", "PLAKCI_PASSWORD"];
const missing = need.filter((k) => !env[k]);
if (missing.length) {
  console.error(`Eksik ortam değişkenleri: ${missing.join(", ")}`);
  process.exit(1);
}

// 1) Şema
if (env.SUPABASE_DB_URL) {
  const { default: pg } = await import("pg");
  // Şifrede ?, #, @ gibi kodlanmamış karakterler olabilir; adresi elle ayrıştır
  const m = env.SUPABASE_DB_URL.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^@:\/]+)(?::(\d+))?\/([^?]*)/);
  if (!m) throw new Error("SUPABASE_DB_URL biçimi anlaşılamadı");
  const [, user, password, host, port, database] = m;
  const db = new pg.Client({ user, password, host, port: +(port || 5432), database: database || "postgres", ssl: { rejectUnauthorized: false } });
  await db.connect();
  await db.query(readFileSync("supabase/schema.sql", "utf8"));
  await db.end();
  console.log("✓ Şema uygulandı (app_state + RLS).");
} else {
  console.log("• SUPABASE_DB_URL yok: supabase/schema.sql dosyasını Supabase → SQL Editor'de bir kez çalıştır.");
}

// 2) Sahip hesabı
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let existing = null;
for (let page = 1; !existing; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  existing = data.users.find((u) => u.email?.toLowerCase() === env.PLAKCI_EMAIL.toLowerCase()) || null;
  if (data.users.length < 200) break;
}
if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, { password: env.PLAKCI_PASSWORD });
  if (error) throw error;
  console.log("✓ Sahip hesabı zaten vardı, şifresi .env'deki değerle güncellendi.");
} else {
  const { error } = await admin.auth.admin.createUser({ email: env.PLAKCI_EMAIL, password: env.PLAKCI_PASSWORD, email_confirm: true });
  if (error) throw error;
  console.log("✓ Sahip hesabı oluşturuldu.");
}
