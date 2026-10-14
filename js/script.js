// Nomor WhatsApp admin (format internasional tanpa +)
const WA_NUMBER = "6283147145837";
// Tempel URL Web App Google Apps Script (berakhiran /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbxXE6e0sP7ggasvpdcan5Jnd1I8aZDHF2hLj-HCeliYY9erOx8HiqzyDgXJ5kZTSOyhag/exec";

const waLink = (teks) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(teks)}`;
const kirimWA = (teks) => window.open(waLink(teks), "_blank");
const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");

// Menu mobile & penanda halaman aktif
const btn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
btn.addEventListener("click", () => btn.setAttribute("aria-expanded", nav.classList.toggle("open")));
document.querySelector(`nav a[data-p="${document.body.dataset.page}"]`)?.classList.add("active");

// Form booking
const bf = document.getElementById("bookingForm");
if (bf) {
  let BOOKED_DATES = [];

  const hitung = () => {
    const opsi = bf.lapangan.selectedOptions[0];
    const total = +(opsi?.dataset.harga) || 0;
    document.getElementById("estimasi").textContent = rupiah(total);
    return total;
  };

  const dipilih = new URLSearchParams(location.search).get("lapangan");
  if (dipilih && [...bf.lapangan.options].some((o) => o.value === dipilih)) {
    bf.lapangan.value = dipilih;
  }

  bf.tanggal.min = new Date().toISOString().split("T")[0];

  // Peringatan
  const peringatan = document.getElementById("peringatan");
  const tampilPeringatan = (teks) => {
    peringatan.textContent = teks;
    peringatan.hidden = !teks;
  };
  const cekTanggal = () => {
    const terpakai = BOOKED_DATES.includes(bf.tanggal.value);
    if (terpakai) {
      const [y, m, d] = bf.tanggal.value.split("-");
      tampilPeringatan(`Tanggal ${d}/${m}/${y} sudah dibooking. Silakan pilih tanggal lain.`);
    } else {
      tampilPeringatan("");
    }
    bf.tanggal.setCustomValidity(terpakai ? "Tanggal ini sudah dibooking" : "");
    return !terpakai;
  };
  bf.tanggal.addEventListener("change", cekTanggal);

  // Ambil tanggal yang sudah dibooking dari Google Sheets
  if (API_URL) {
    fetch(API_URL)
      .then((r) => r.json())
      .then((res) => { if (res.ok) { BOOKED_DATES = res.dates; cekTanggal(); } })
      .catch(() => console.warn("Gagal memuat tanggal booking"));
  }

  bf.addEventListener("input", hitung);
  hitung();

  // Kirim booking
  const tombol = bf.querySelector("button[type=submit]");
  bf.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cekTanggal()) return;

    const lapangan = bf.lapangan.selectedOptions[0].text;
    const pesan = `Halo admin Garuda Jaya Stadium, saya ingin booking:\nNama: ${bf.nama.value}\nNo. HP: ${bf.hp.value}\nLapangan: ${lapangan}\nTanggal: ${bf.tanggal.value}\nJam: ${bf.jam.value}\nPerkiraan biaya: ${rupiah(hitung())}`;

    const jendela = window.open("", "_blank"); // dibuka lebih dulu agar tidak diblokir browser
    tombol.disabled = true;
    tombol.textContent = "Memproses...";
    try {
      if (API_URL) {
        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            nama: bf.nama.value, hp: bf.hp.value, lapangan,
            tanggal: bf.tanggal.value, jam: bf.jam.value,
          }),
        }).then((r) => r.json());

        if (!res.ok) {
          jendela?.close();
          if (res.error === "booked") { BOOKED_DATES.push(bf.tanggal.value); cekTanggal(); }
          else tampilPeringatan("Booking gagal diproses. Silakan coba lagi.");
          return;
        }
        BOOKED_DATES.push(bf.tanggal.value);
      }
      const url = waLink(pesan);
      if (jendela) jendela.location.href = url; else location.href = url;
      bf.reset(); hitung(); cekTanggal();
    } catch {
      jendela?.close();
      tampilPeringatan("Tidak dapat terhubung ke server. Periksa internet Anda lalu coba lagi.");
    } finally {
      tombol.disabled = false;
      tombol.textContent = "Kirim via WhatsApp";
    }
  });
}

// Form kontak / pengaduan
const cf = document.getElementById("contactForm");
cf?.addEventListener("submit", (e) => {
  e.preventDefault();
  const nama = cf.querySelector("input").value;
  const detail = cf.querySelector("textarea").value;
  kirimWA(`Halo admin Garuda Jaya Stadium, saya ingin menyampaikan pengaduan.\nNama: ${nama}\nDetail pengaduan: ${detail}`);
});