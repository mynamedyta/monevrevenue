# Panduan Deploy — dari nol sampai bisa diakses

Perkiraan waktu 20–30 menit. Tidak perlu menginstal apa pun bila memakai Jalur A.

Yang akan dihasilkan: satu alamat seperti `https://monev-revenue.vercel.app` yang bisa dibuka siapa pun di tim, dengan data tersimpan di jsonbin.io sehingga terlihat sama di semua perangkat.

Siapkan lebih dulu:

- Akun email yang sama untuk mendaftar GitHub, Vercel, dan jsonbin.io
- Berkas `monev-revenue-vercel.zip`

---

## Bagian 1 — Bikin tempat penyimpanan di jsonbin.io

**1.1** Buka [jsonbin.io](https://jsonbin.io), tekan **Sign In**, pilih masuk dengan Google atau GitHub. Tidak perlu isi kartu kredit.

**1.2** Setelah masuk, buka menu **API Keys** di sisi kiri. Di sana ada baris **X-Master-Key** berisi deretan panjang huruf-angka. Tekan ikon salin, lalu tempel sementara di Notepad. Beri label "MASTER KEY".

> Kunci ini setara kata sandi. Jangan dikirim lewat grup WhatsApp, jangan ditempel di dokumen bersama.

**1.3** Buka menu **Bins**, tekan **Create Bin** atau tombol **+**.

**1.4** Kotak editor akan terbuka. Hapus isinya, ganti dengan dua karakter ini saja:

```json
{}
```

**1.5** Beri nama bin, misalnya `monev-revenue`, lalu tekan **Create** atau **Save**.

**1.6** Perhatikan alamat di bilah browser, bentuknya seperti:

```
https://jsonbin.io/app/bins/68a1f9c2ad19ca34f8b7d210
                              ^^^^^^^^^^^^^^^^^^^^^^^^
```

Deretan terakhir itulah **Bin ID**. Salin dan tempel di Notepad, beri label "BIN ID".

Sekarang Notepad berisi dua nilai. Keduanya dipakai di Bagian 3.

---

## Bagian 2 — Naikkan kode ke GitHub

Lewati bagian ini bila memilih **Jalur B** di bawah.

**2.1** Buka [github.com](https://github.com), daftar bila belum punya akun, lalu verifikasi email.

**2.2** Ekstrak `monev-revenue-vercel.zip` di komputer. Hasilnya satu folder `monev-revenue-vercel` berisi `public`, `api`, `vercel.json`, `package.json`, `README.md`.

**2.3** Di GitHub tekan tanda **+** di kanan atas → **New repository**.

- Repository name: `monev-revenue`
- Pilih **Private** — ini penting, jangan Public
- Jangan centang "Add a README file"
- Tekan **Create repository**

**2.4** Muncul halaman berisi perintah git. Abaikan semuanya, cari tautan kecil bertuliskan **uploading an existing file** di kalimat "…or upload files".

**2.5** Buka folder `monev-revenue-vercel` di komputer, blok seluruh isinya — folder `public`, folder `api`, dan berkas-berkas lainnya — lalu seret ke area unggah di halaman GitHub.

> Yang diseret adalah **isi** folder, bukan foldernya. Setelah selesai, tampilan repositori harus menampilkan `public` dan `api` di tingkat paling atas. Bila yang muncul justru satu folder `monev-revenue-vercel`, hapus dan ulangi.

**2.6** Tunggu semua berkas terunggah, lalu tekan **Commit changes**.

---

## Bagian 3 — Deploy ke Vercel

### Jalur A — lewat GitHub (disarankan)

**3.1** Buka [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub** → **Authorize**.

**3.2** Di dasbor tekan **Add New…** → **Project**.

**3.3** Cari `monev-revenue` di daftar repositori, tekan **Import**. Bila repositori tidak muncul, tekan **Adjust GitHub App Permissions**, beri akses ke repositori itu, lalu kembali.

**3.4** Di halaman konfigurasi:

- **Framework Preset**: `Other`
- **Root Directory**: biarkan apa adanya
- **Build Command**, **Output Directory**, **Install Command**: biarkan kosong, jangan diaktifkan

**3.5** Buka bagian **Environment Variables**, tambahkan dua baris:

| Name | Value |
|---|---|
| `JSONBIN_MASTER_KEY` | tempel MASTER KEY dari Notepad |
| `JSONBIN_BIN_ID` | tempel BIN ID dari Notepad |

Tekan **Add** setiap selesai satu baris. Pastikan tidak ada spasi ikut tersalin di ujung nilai.

**3.6** Tekan **Deploy**. Tunggu sekitar satu menit sampai muncul layar ucapan selamat dan gambar pratinjau.

**3.7** Tekan **Continue to Dashboard**. Alamat aplikasi ada di kotak **Domains**, bentuknya `https://monev-revenue-xxxx.vercel.app`. Itulah alamat yang dibagikan ke tim.

### Jalur B — lewat terminal, tanpa GitHub

Perlu Node.js terpasang di komputer.

```bash
npm i -g vercel
cd monev-revenue-vercel
vercel login
vercel                 # jawab: Set up and deploy? Y · scope: akun Anda ·
                       # link to existing project? N · project name: monev-revenue ·
                       # directory: ./ · modify settings? N
vercel env add JSONBIN_MASTER_KEY production
vercel env add JSONBIN_BIN_ID production
vercel --prod
```

Setiap `vercel env add` akan meminta nilainya, tempel lalu tekan Enter. Alamat produksi tercetak di baris terakhir.

---

## Bagian 4 — Pastikan sudah tersambung

**4.1** Buka alamat `.vercel.app` tadi di browser.

**4.2** Lihat chip kecil di kanan atas, sejajar tombol Unduh Excel.

- **Tersimpan di jsonbin** dengan latar hijau → berhasil, lanjut ke Bagian 5
- **Mode lokal** dengan latar oranye → ada yang perlu diperbaiki, lihat tabel di bawah

**4.3** Uji tulis-baca: ubah satu angka realisasi, tunggu tiga detik sampai chip menampilkan jam, lalu buka alamat yang sama di ponsel. Angka yang sama harus muncul di sana.

**4.4** Untuk memastikan datanya benar-benar mendarat, buka bin di jsonbin.io. Isinya kini bukan lagi `{}` melainkan struktur berisi `periods`.

### Bila masih Mode lokal

Teks di sebelah chip menyebutkan sebabnya.

| Pesan | Penyebab | Tindakan |
|---|---|---|
| `JSONBIN_MASTER_KEY ... belum diisi` | variabel belum terpasang, atau sudah dipasang tapi belum redeploy | Vercel → Settings → Environment Variables, periksa nama variabel; lalu Deployments → titik tiga pada deployment teratas → **Redeploy** |
| `Bin tidak ditemukan` | Bin ID keliru | salin ulang dari alamat bin, ambil bagian setelah `/bins/` saja |
| `jsonbin menolak kunci` | Master Key keliru atau ada spasi ikut tersalin | salin ulang dari halaman API Keys |
| `HTTP 404` | folder `api` tidak ikut terunggah | periksa repositori GitHub, folder `api` harus terlihat di tingkat paling atas |
| `Kunci akses salah` | `APP_TOKEN` aktif tapi belum diisi di form | lihat Bagian 6 |

Perubahan environment variable **tidak berlaku sampai redeploy**. Ini penyebab tersering aplikasi masih Mode lokal padahal nilainya sudah benar.

---

## Bagian 5 — Pakai sehari-hari

**Bagikan alamatnya.** Kirim tautan `.vercel.app` ke tim. Di ponsel, buka lewat Chrome atau Safari lalu pilih **Tambahkan ke Layar Utama** supaya tampil seperti aplikasi.

**Alamat lebih pendek.** Vercel → Settings → Domains → ubah nama proyek, atau tambahkan domain sendiri seperti `monev.regarmarket.com` bila punya.

**Isi harian.** Buka tab Monitoring, isi kolom Realisasi Total pada HK hari itu. Tunggu chip menampilkan jam terbaru — itu tanda sudah tersimpan.

**Bulan berikutnya.** Tab Pengaturan Periode → tombol **Duplikat** pada periode berjalan. Pola hari kerja, DP %, dan strategi tersalin, realisasi dikosongkan. Sesuaikan target dan kalender liburnya.

**Cadangan.** Tekan **Cadangan** sebulan sekali untuk menyimpan berkas JSON di komputer. jsonbin gratis tidak menjamin apa pun soal keawetan data.

**Memperbarui aplikasi.** Bila nanti ada versi baru `index.html`, buka repositori GitHub → `public` → `index.html` → ikon pensil → hapus isinya → tempel isi berkas baru → Commit. Vercel otomatis deploy ulang dalam satu menit. Data di jsonbin tidak tersentuh.

---

## Bagian 6 — Kunci akses

Tanpa kunci, siapa pun yang tahu alamatnya bisa membaca dan mengubah data. Alamat `.vercel.app` memang tidak terdaftar di mesin pencari, tapi itu bukan pengamanan.

**6.1** Buat kata sandi acak, misalnya `regar-2026-x7k9m2`.

**6.2** Vercel → Settings → Environment Variables → tambah `APP_TOKEN` berisi kata sandi tadi.

**6.3** Deployments → titik tiga pada deployment teratas → **Redeploy**.

**6.4** Buka aplikasi. Chip akan berbunyi Mode lokal karena kuncinya belum diisi. Masuk tab **Pengaturan Periode → Koneksi Data**, isi kolom kunci akses, tekan **Simpan kunci & uji**. Chip berubah hijau.

**6.5** Untuk anggota tim, cukup kirim tautan berisi kuncinya sekali:

```
https://monev-revenue.vercel.app/?token=regar-2026-x7k9m2
```

Kunci tersimpan di browser masing-masing, jadi kunjungan berikutnya tinggal buka alamat biasa.

Bila hanya untuk kalangan sangat terbatas, ada cara yang lebih ketat: Vercel → Settings → **Deployment Protection** → aktifkan **Vercel Authentication**. Hanya orang yang Anda undang ke tim Vercel yang bisa membuka.

---

## Hal yang perlu diperhatikan

**Kuota jsonbin.** Paket gratis memberi **10.000 panggilan sekali pakai**, bukan per bulan, dan tidak diisi ulang. Aplikasi sudah dihemat: pengiriman hanya terjadi bila isi benar-benar berubah, sekitar 2,5 detik setelah berhenti mengetik, dan satu kali pembacaan tiap halaman dibuka. Pemakaian normal satu bulan monev kira-kira 300–600 panggilan, jadi kuota itu cukup untuk sekitar satu setengah tahun. Sisa kuota terlihat di halaman akun jsonbin. Bila mendekati habis, beli tambahan di jsonbin atau pindahkan penyimpanan ke Vercel KV.

**Menyunting bersamaan.** Penyimpanan memakai aturan tulisan terakhir menang. Bila dua orang mengubah periode yang sama pada saat berdekatan, pekerjaan yang lebih dulu bisa tertimpa. Untuk saat ini sepakati satu orang penanggung jawab input harian; bila nanti perlu banyak pengisi, beri tahu saya untuk menambahkan penguncian per periode.

**Kalau jaringan putus.** Aplikasi tetap jalan penuh memakai cadangan di browser dan chip berubah oranye. Begitu jaringan pulih dan halaman dibuka lagi, perubahan lokal yang lebih baru otomatis disusulkan ke jsonbin.

**Biaya.** Vercel paket Hobby gratis dan jauh dari batas untuk pemakaian internal seperti ini. Perlu dicatat, paket Hobby ditujukan untuk penggunaan non-komersial; untuk aplikasi operasional perusahaan, paket Pro adalah pilihan yang sesuai dengan ketentuan mereka.
