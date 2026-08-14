/**
 * GET  /api/data  → ambil snapshot terakhir
 * PUT  /api/data  → simpan snapshot
 *
 * Dua penyimpanan didukung, dipilih otomatis dari environment variable:
 *
 *   1. Vercel KV / Upstash Redis — dipakai bila ada KV_REST_API_URL + KV_REST_API_TOKEN
 *      (atau UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *   2. jsonbin.io                — dipakai bila hanya JSONBIN_* yang terisi
 *
 * Bila keduanya terisi, Redis yang dipakai. Saat kunci Redis masih kosong dan
 * jsonbin masih terpasang, isinya dibaca sekali dari jsonbin lalu berpindah
 * sendiri ke Redis pada penyimpanan berikutnya.
 *
 * Env:
 *   KV_REST_API_URL / KV_REST_API_TOKEN   kredensial Redis (disuntik Vercel)
 *   KV_KEY                                opsional, nama kunci (bawaan: monev-revenue)
 *   JSONBIN_MASTER_KEY / JSONBIN_BIN_ID   kredensial jsonbin
 *   JSONBIN_ACCESS_KEY                    opsional
 *   APP_TOKEN                             opsional, kunci akses aplikasi
 */

const JSONBIN = "https://api.jsonbin.io/v3/b";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const { APP_TOKEN } = process.env;
  if (APP_TOKEN && req.headers["x-app-token"] !== APP_TOKEN) {
    return res.status(401).json({ error: "Kunci akses salah atau belum diisi" });
  }

  const redis = konfRedis();
  const bin = konfBin();

  if (!redis && !bin) {
    return res.status(500).json({
      error:
        "Belum ada penyimpanan yang tersetel. Isi KV_REST_API_URL + KV_REST_API_TOKEN " +
        "(Vercel KV / Upstash Redis) atau JSONBIN_MASTER_KEY + JSONBIN_BIN_ID di Environment Variables Vercel",
    });
  }

  try {
    if (req.method === "GET") {
      if (redis) {
        const isi = await redisCmd(redis, ["GET", kunci()]);
        if (isi) return res.status(200).json({ data: uraikan(isi), source: "vercel-kv" });
        if (bin) {
          const lama = await binBaca(bin); // pindahan sekali jalan dari jsonbin
          if (lama) return res.status(200).json({ data: lama, source: "jsonbin-migrasi" });
        }
        return res.status(200).json({ data: null, source: "vercel-kv" });
      }
      const data = await binBaca(bin);
      return res.status(200).json({ data: data || null, source: "jsonbin" });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const mentah = typeof req.body === "string" ? uraikan(req.body) : req.body || {};
      const isi = mentah && mentah.data !== undefined ? mentah.data : mentah;
      if (!isi || typeof isi !== "object") {
        return res.status(400).json({ error: "Isi permintaan bukan objek JSON" });
      }
      if (redis) {
        await redisCmd(redis, ["SET", kunci(), JSON.stringify(isi)]);
        return res.status(200).json({ ok: true, source: "vercel-kv", savedAt: new Date().toISOString() });
      }
      await binTulis(bin, isi);
      return res.status(200).json({ ok: true, source: "jsonbin", savedAt: new Date().toISOString() });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Metode tidak didukung" });
  } catch (e) {
    const pesan = e && e.message ? e.message : String(e);
    const kode = e && e.status ? e.status : 502;
    return res.status(kode).json({ error: pesan });
  }
}

/* ---------------- Vercel KV / Upstash Redis ---------------- */

const kunci = () => process.env.KV_KEY || "monev-revenue";

function konfRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

async function redisCmd(conf, perintah) {
  const r = await fetch(conf.url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + conf.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(perintah),
  });
  const teks = await r.text();
  const j = uraikan(teks) || {};
  if (!r.ok || j.error) {
    const e = new Error(pesanRedis(r.status, j.error || teks));
    e.status = r.status >= 400 && r.status < 500 ? 500 : 502;
    throw e;
  }
  return j.result;
}

function pesanRedis(status, teks) {
  if (status === 401 || status === 403)
    return "Redis menolak token — periksa KV_REST_API_TOKEN";
  if (status === 404) return "Alamat Redis tidak ditemukan — periksa KV_REST_API_URL";
  if (status === 429) return "Kuota perintah Redis bulan ini habis";
  if (status >= 500)
    return "Redis sedang bermasalah (" + status + ") — coba beberapa saat lagi";
  return "Redis (" + status + "): " + bersih(teks);
}

/* ---------------- jsonbin.io ---------------- */

function konfBin() {
  const key = process.env.JSONBIN_MASTER_KEY;
  const id = process.env.JSONBIN_BIN_ID;
  if (!key || !id) return null;
  const headers = {
    "Content-Type": "application/json",
    "X-Master-Key": key,
    "X-Bin-Meta": "false",
  };
  if (process.env.JSONBIN_ACCESS_KEY)
    headers["X-Access-Key"] = process.env.JSONBIN_ACCESS_KEY;
  return { id, headers };
}

async function binBaca(bin) {
  const r = await fetch(`${JSONBIN}/${bin.id}/latest`, { headers: bin.headers });
  const teks = await r.text();
  if (!r.ok) throw lempar(r.status, teks);
  const body = uraikan(teks) || {};
  const data = body && body.record !== undefined ? body.record : body;
  return data && Object.keys(data).length ? data : null;
}

async function binTulis(bin, isi) {
  const r = await fetch(`${JSONBIN}/${bin.id}`, {
    method: "PUT",
    headers: bin.headers,
    body: JSON.stringify(isi),
  });
  const teks = await r.text();
  if (!r.ok) throw lempar(r.status, teks);
  return true;
}

function lempar(status, teks) {
  const e = new Error(pesanBin(status, teks));
  e.status = status === 401 || status === 403 || status === 404 ? 500 : 502;
  return e;
}

function pesanBin(status, teks) {
  if (status === 401 || status === 403)
    return "jsonbin menolak kunci — periksa JSONBIN_MASTER_KEY";
  if (status === 404) return "Bin tidak ditemukan — periksa JSONBIN_BIN_ID";
  if (status === 429) return "Kuota jsonbin habis atau terlalu sering — coba lagi nanti";
  if (status >= 520 && status <= 527)
    return "jsonbin sedang tidak menjawab (" + status + ") — gangguan di sisi mereka, data aman di cadangan lokal";
  if (status >= 500)
    return "jsonbin bermasalah (" + status + ") — coba beberapa saat lagi";
  return "jsonbin (" + status + "): " + bersih(teks);
}

/* ---------------- pembantu ---------------- */

function uraikan(t) {
  if (t && typeof t === "object") return t;
  try {
    return JSON.parse(t || "null");
  } catch (_) {
    return null;
  }
}

function bersih(t) {
  return String(t).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
}
