// Statik siteyi dist/ klasörüne derler ve config.js'i ortam değişkenlerinden üretir.
// Yerelde .env dosyasını, GitHub Actions'ta depo secret'larını kullanır.
// Yalnızca tarayıcıya gitmesi güvenli olan değerler config.js'e yazılır.
import { existsSync, mkdirSync, rmSync, copyFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");
const env = process.env;

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "PLAKCI_EMAIL"];
const missing = required.filter((k) => !env[k]);
if (missing.length) {
  console.error(`Eksik ortam değişkenleri: ${missing.join(", ")} (.env.example dosyasına bak)`);
  process.exit(1);
}

// Gizli anahtarın yanlışlıkla siteye gömülmesini engelle
const anon = env.SUPABASE_ANON_KEY;
const jwtRole = (() => {
  try { return JSON.parse(Buffer.from(anon.split(".")[1], "base64url").toString()).role; } catch { return null; }
})();
if (anon.startsWith("sb_secret_") || jwtRole === "service_role") {
  console.error("SUPABASE_ANON_KEY gizli (service_role / secret) bir anahtar. Publishable/anon key kullan.");
  process.exit(1);
}

const config = {
  supabaseUrl: env.SUPABASE_URL,
  supabaseAnonKey: anon,
  ownerEmail: env.PLAKCI_EMAIL,
  lastfmKey: env.LASTFM_API_KEY || "",
  spotifyClientId: env.SPOTIFY_CLIENT_ID || ""
};

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
copyFileSync("src/index.html", "dist/index.html");
writeFileSync("dist/config.js", `window.PLAKCI_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
writeFileSync("dist/.nojekyll", "");
console.log("dist/ hazır.");
