/**
 * GET  /api/data  → ambil snapshot terakhir dari jsonbin.io
 * PUT  /api/data  → simpan snapshot ke jsonbin.io
 *
 * Kunci jsonbin hanya hidup di sisi server (Environment Variables Vercel),
 * jadi tidak pernah ikut terkirim ke browser.
 *
 * Env yang dipakai:
 *   JSONBIN_MASTER_KEY  (wajib)  X-Master-Key dari jsonbin.io
 *   JSONBIN_BIN_ID      (wajib)  ID bin tempat data disimpan
 *   JSONBIN_ACCESS_KEY  (opsional) bila memakai Access Key terpisah
 *   APP_TOKEN           (opsional) kunci akses aplikasi; bila diisi, setiap
 *                                  permintaan wajib mengirim header x-app-token
 */

const JSONBIN = "https://api.jsonbin.io/v3/b";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const {
    JSONBIN_MASTER_KEY,
    JSONBIN_BIN_ID,
    JSONBIN_ACCESS_KEY,
    APP_TOKEN,
  } = process.env;

  if (APP_TOKEN && req.headers["x-app-token"] !== APP_TOKEN) {
    return res.status(401).json({ error: "Kunci akses salah atau belum diisi" });
  }

  if (!JSONBIN_MASTER_KEY || !JSONBIN_BIN_ID) {
    return res.status(500).json({
      error:
        "JSONBIN_MASTER_KEY atau JSONBIN_BIN_ID belum diisi di Environment Variables Vercel",
    });
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Master-Key": JSONBIN_MASTER_KEY,
    "X-Bin-Meta": "false",
  };
  if (JSONBIN_ACCESS_KEY) headers["X-Access-Key"] = JSONBIN_ACCESS_KEY;

  try {
    if (req.method === "GET") {
      const r = await fetch(`${JSONBIN}/${JSONBIN_BIN_ID}/latest`, { headers });
      const text = await r.text();
      if (!r.ok) {
        return res.status(r.status).json({ error: pesan(r.status, text) });
      }
      let body = {};
      try {
        body = JSON.parse(text);
      } catch (_) {
        body = {};
      }
      // X-Bin-Meta:false mengembalikan record langsung, tapi tetap kita jaga
      // bila jsonbin membungkusnya dalam { record: ... }
      const data = body && body.record !== undefined ? body.record : body;
      return res.status(200).json({ data: data || null, source: "jsonbin" });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const raw =
        typeof req.body === "string" ? safeParse(req.body) : req.body || {};
      const payload = raw && raw.data !== undefined ? raw.data : raw;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Isi permintaan bukan objek JSON" });
      }
      const r = await fetch(`${JSONBIN}/${JSONBIN_BIN_ID}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      if (!r.ok) {
        return res.status(r.status).json({ error: pesan(r.status, text) });
      }
      return res
        .status(200)
        .json({ ok: true, savedAt: new Date().toISOString() });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Metode tidak didukung" });
  } catch (e) {
    return res
      .status(502)
      .json({ error: "Gagal menghubungi jsonbin: " + (e && e.message ? e.message : e) });
  }
}

function safeParse(t) {
  try {
    return JSON.parse(t || "{}");
  } catch (_) {
    return {};
  }
}

function pesan(status, text) {
  if (status === 401 || status === 403)
    return "jsonbin menolak kunci — periksa JSONBIN_MASTER_KEY";
  if (status === 404) return "Bin tidak ditemukan — periksa JSONBIN_BIN_ID";
  return "jsonbin (" + status + "): " + String(text).slice(0, 180);
}
