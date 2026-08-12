# Monev Revenue Harian — Regarmarket

Form realisasi harian dan pembebanan target revenue. Kekurangan hari berjalan langsung dilimpahkan ke hari kerja tersisa. Mendukung banyak periode bulan, ekspor Excel, dan penyimpanan bersama lewat jsonbin.io.

Baru pertama kali deploy? Ikuti **[PANDUAN-DEPLOY.md](PANDUAN-DEPLOY.md)** — panduan langkah demi langkah dari nol sampai alamatnya bisa diakses. Berkas ini ringkasan teknisnya.

```
.
├─ public/index.html    aplikasi (satu berkas, tanpa build)
├─ PANDUAN-DEPLOY.md    panduan langkah demi langkah
├─ api/data.js          fungsi serverless: jembatan ke jsonbin.io
├─ vercel.json          header cache
├─ package.json
└─ .env.example         daftar environment variable
```

Tidak ada tahap build. Vercel menyajikan `public/` sebagai statis dan `api/` sebagai fungsi Node.

---

## 1. Siapkan bin di jsonbin.io

1. Daftar di [jsonbin.io](https://jsonbin.io), buka **API Keys**, salin **X-Master-Key**.
2. Buka **Bins → Create Bin**, isi dengan JSON kosong:

   ```json
   {}
   ```

3. Simpan, lalu salin **Bin ID** dari URL bin (deretan huruf-angka setelah `/b/`).

Satu bin menampung seluruh periode sekaligus, jadi cukup satu bin untuk semua bulan.

## 2. Naikkan ke Vercel

**Lewat GitHub**

1. Dorong folder ini ke sebuah repositori.
2. Di Vercel: **Add New → Project → Import** repositori tersebut.
3. Framework Preset biarkan **Other**. Build Command dan Output Directory dikosongkan.
4. Deploy.

**Lewat terminal**

```bash
npm i -g vercel
vercel          # pratinjau
vercel --prod   # produksi
```

## 3. Isi Environment Variables

Vercel → **Settings → Environment Variables** (pilih Production dan Preview):

| Nama | Wajib | Isi |
|---|---|---|
| `JSONBIN_MASTER_KEY` | ya | X-Master-Key dari jsonbin.io |
| `JSONBIN_BIN_ID` | ya | ID bin dari langkah 1 |
| `JSONBIN_ACCESS_KEY` | tidak | bila memakai Access Key terpisah |
| `APP_TOKEN` | tidak | kunci akses aplikasi, lihat bagian Keamanan |

Setelah menambah atau mengubah variabel, jalankan **Redeploy** — nilai baru hanya terbaca oleh deployment berikutnya.

## 4. Uji

Buka alamat produksi, masuk tab **Pengaturan Periode → Koneksi Data**. Chip di kanan atas halaman Monitoring harus berbunyi **Tersimpan di jsonbin**. Bila masih **Mode lokal**, teks di sebelahnya menyebut penyebabnya:

| Pesan | Artinya |
|---|---|
| `JSONBIN_MASTER_KEY ... belum diisi` | environment variable belum terpasang atau belum redeploy |
| `Bin tidak ditemukan` | `JSONBIN_BIN_ID` salah |
| `jsonbin menolak kunci` | master key salah atau sudah dicabut |
| `Kunci akses salah` | `APP_TOKEN` aktif tapi kunci di form kosong/keliru |
| `HTTP 404` | `api/data.js` tidak ikut terunggah — pastikan foldernya bernama persis `api` |

---

## Cara kerja penyimpanan

Perubahan tersimpan otomatis sekitar 2,5 detik setelah berhenti mengetik, dan hanya dikirim bila isinya benar-benar berubah — paket gratis jsonbin memberi 10.000 panggilan sekali pakai, jadi setiap panggilan dihemat. Setiap penyimpanan menulis ke dua tempat:

1. **localStorage browser** — cadangan, selalu ditulis lebih dulu.
2. **jsonbin.io** lewat `PUT /api/data` — sumber bersama.

Saat dibuka, aplikasi menarik dari jsonbin lalu membandingkan cap waktu `savedAt` dengan cadangan lokal. Yang lebih baru dipakai, dan bila ternyata cadangan lokal lebih baru, isinya langsung disusulkan ke jsonbin. Bila server tidak terjangkau, aplikasi tetap jalan dari cadangan lokal dan chip berubah jadi **Mode lokal**; klik **Kirim ke jsonbin** setelah jaringan pulih.

Penyimpanan memakai aturan tulisan terakhir menang. Hindari dua orang menyunting periode yang sama bersamaan — bila terjadi, tarik dulu data terbaru sebelum melanjutkan.

Master key jsonbin tidak pernah masuk ke berkas yang diunduh browser. Semua panggilan ke jsonbin terjadi di dalam fungsi serverless.

## Keamanan

Tanpa `APP_TOKEN`, siapa pun yang tahu alamat deployment bisa membaca dan menulis data. Untuk internal perusahaan, isi `APP_TOKEN` dengan kata sandi acak, lalu di tab **Koneksi Data** masukkan kunci yang sama dan tekan **Simpan kunci & uji**. Kunci tersimpan di browser masing-masing pengguna. Alternatifnya bagikan tautan `https://alamat-anda.vercel.app/?token=KUNCI` sekali saja.

Untuk pengamanan lebih ketat, aktifkan **Vercel Authentication** di Settings → Deployment Protection sehingga hanya anggota tim Vercel yang bisa membuka.

## API

```
GET  /api/data           → { "data": { ...snapshot... }, "source": "jsonbin" }
PUT  /api/data           → { "ok": true, "savedAt": "..." }
     body: { "data": { ...snapshot... } }
     header: x-app-token (bila APP_TOKEN dipasang)
```

Bentuk snapshot:

```json
{
  "v": 2,
  "savedAt": "2026-08-12T08:20:00.000Z",
  "mode": "flat",
  "surplus": "spread",
  "basis": "plan",
  "active": "2026-08",
  "periods": {
    "2026-08": {
      "bulan": 8, "tahun": 2026, "target": 13100000000, "dpDefault": 0.5,
      "days": [
        { "tgl": "2026-08-01", "base": 500000000, "baseAsli": 500000000,
          "dpPct": 0.5, "peak": false, "strategi": "Reguler", "ket": "",
          "total": 501936773, "dp": null }
      ]
    }
  }
}
```

`base` rencana harian, `baseAsli` rencana sebelum revisi, `dpPct` porsi Slot DP (sisanya Pelunasan), `total` realisasi harian, `dp` realisasi Slot DP. Hari yang belum closing bernilai `null` pada `total`.

## Pengembangan lokal

```bash
cp .env.example .env.local   # isi kuncinya
npx vercel dev               # buka http://localhost:3000
```

Membuka `public/index.html` langsung lewat berkas juga bisa — aplikasi jalan penuh dalam Mode lokal, hanya tanpa sinkron ke jsonbin.

## Memindahkan data lama

Bila sebelumnya memakai berkas HTML tunggal, tekan **Cadangan** di sana untuk mengunduh JSON, lalu di versi ini tekan **Muat cadangan** dan pilih berkas tersebut. Data langsung terkirim ke jsonbin pada penyimpanan berikutnya.
