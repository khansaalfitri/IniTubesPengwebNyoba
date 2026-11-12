"use strict";

/* DATA DEMO */
const USERS = [
  {
    username: "owner01",
    password: "owner123",
    role: "pemilik",
    name: "Pemilik Toko",
  },
  { username: "kasir01", password: "kasir123", role: "kasir", name: "Kasir" },
  {
    username: "gudang01",
    password: "gudang123",
    role: "admin_gudang",
    name: "Admin Gudang",
  },
];

const KEYS = {
  products: "kastok_products",
  transactions: "kastok_transactions",
  logs: "kastok_logs",
  requests: "kastok_requests",
};

const INITIAL = [
  {
    kode: "BR001",
    nama: "Indomie Goreng",
    kategori: "Makanan",
    harga: 3500,
    stok: 120,
  },
  {
    kode: "BR002",
    nama: "Aqua 600 ml",
    kategori: "Minuman",
    harga: 4000,
    stok: 8,
  },
  {
    kode: "BR003",
    nama: "Susu UHT",
    kategori: "Minuman",
    harga: 7000,
    stok: 5,
  },
  {
    kode: "BR004",
    nama: "Minyak Goreng",
    kategori: "Sembako",
    harga: 18000,
    stok: 7,
  },
  {
    kode: "BR005",
    nama: "Beras 5 Kg",
    kategori: "Sembako",
    harga: 75000,
    stok: 30,
  },
  {
    kode: "BR006",
    nama: "Gula Pasir 1 Kg",
    kategori: "Sembako",
    harga: 17000,
    stok: 25,
  },
];

const read = (key, def) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? structuredClone(def);
  } catch {
    return structuredClone(def);
  }
};

let products = read(KEYS.products, INITIAL);
let transactions = read(KEYS.transactions, []);
let logs = read(KEYS.logs, []);
let requests = read(KEYS.requests, []);

let user = null;
let cart = [];

const $ = (id) => document.getElementById(id);

const money = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const dt = (s) =>
  new Date(s).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const save = () => {
  localStorage.setItem(KEYS.products, JSON.stringify(products));
  localStorage.setItem(KEYS.transactions, JSON.stringify(transactions));
  localStorage.setItem(KEYS.logs, JSON.stringify(logs));
  localStorage.setItem(KEYS.requests, JSON.stringify(requests));
};

const page = location.pathname.split("/").pop() || "index.html";
const target = $("pageContent");

const roleLabel = (r) =>
  ({
    pemilik: "Pemilik Toko",
    kasir: "Kasir",
    admin_gudang: "Admin Gudang",
  })[r] || r;

const access = {
  pemilik: [
    "dashboard",
    "barang",
    "stok",
    "transaksi",
    "bukti",
    "riwayat",
    "laporan",
    "pengajuan",
  ],
  kasir: ["dashboard", "barang", "transaksi", "bukti", "riwayat"],
  admin_gudang: ["dashboard", "barang", "stok", "pengajuan"],
};

/* LOGIN DAN HAK AKSES */
function requireLogin() {
  try {
    user = JSON.parse(sessionStorage.getItem("kastokUser") || "null");
  } catch {
    user = null;
  }

  if (
    !user ||
    !USERS.some((u) => u.username === user.username && u.role === user.role)
  ) {
    location.href = "index.html";
    return false;
  }

  const key = page.replace(".html", "");

  if (!access[user.role].includes(key)) {
    alert("Role kamu tidak memiliki akses ke halaman ini.");
    location.href = "dashboard.html";
    return false;
  }

  return true;
}

function logout() {
  if (confirm("Yakin ingin logout?")) {
    sessionStorage.removeItem("kastokUser");
    location.href = "index.html";
  }
}

function nav() {
  const items = [
    ["dashboard", "Dashboard"],
    ["barang", "Data Barang"],
    ["stok", "Manajemen Stok"],
    ["transaksi", "Transaksi Penjualan"],
    ["bukti", "Bukti Transaksi"],
    ["riwayat", "Riwayat Transaksi"],
    ["laporan", "Laporan Penjualan"],
    ["pengajuan", "Pengajuan Perubahan"],
  ];

  $("navigation").innerHTML = items
    .filter(([k]) => access[user.role].includes(k))
    .map(
      ([k, n]) =>
        `<a class="${page === k + ".html" ? "active" : ""}" href="${k}.html">${n}</a>`,
    )
    .join("");

  $("sideName").textContent = user.name;
  $("sideRole").textContent = roleLabel(user.role);
  $("topName").textContent = user.username;
  $("topRole").textContent = roleLabel(user.role);

  $("logoutBtn").addEventListener("click", logout);
}

function head(title, desc, action = "") {
  return `
    <div class="page-head">
      <div>
        <h1>${title}</h1>
        <p>${desc}</p>
      </div>
      ${action}
    </div>
  `;
}

function tableEmpty(cols, msg = "Belum ada data.") {
  return `<tr><td class="empty" colspan="${cols}">${msg}</td></tr>`;
}

/* LOGIN PAGE */
if (page === "index.html") {
  const form = $("loginForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const found = USERS.find(
      (u) =>
        u.username === $("username").value.trim() &&
        u.password === $("password").value,
    );

    if (!found) {
      $("loginError").textContent = "Username atau password salah.";
      return;
    }

    sessionStorage.setItem(
      "kastokUser",
      JSON.stringify({
        username: found.username,
        role: found.role,
        name: found.name,
      }),
    );

    location.href = "dashboard.html";
  });
} else if (requireLogin()) {
  nav();

  const current = page.replace(".html", "");

  if (current === "dashboard") dashboard();
  if (current === "barang") barang();
  if (current === "stok") stok();
  if (current === "transaksi") transaksi();
  if (current === "bukti") bukti();
  if (current === "riwayat") riwayat();
  if (current === "laporan") laporan();
  if (current === "pengajuan") pengajuan();
}

/* DASHBOARD */
function dashboard() {
  const own = user.role === "pemilik";
  const cash = user.role === "kasir";

  const tx =
    user.role === "kasir"
      ? transactions.filter((t) => t.kasir === user.username)
      : transactions;

  const day = new Date().toISOString().slice(0, 10);
  const todayTx = tx.filter((t) => t.tanggal.slice(0, 10) === day);

  const stats = own
    ? [
        ["Total Barang", products.length],
        [
          "Stok Menipis",
          products.filter((p) => p.stok > 0 && p.stok <= 10).length,
        ],
        ["Transaksi Hari Ini", todayTx.length],
        ["Penjualan Hari Ini", money(todayTx.reduce((s, t) => s + t.total, 0))],
      ]
    : cash
      ? [
          ["Transaksi Hari Ini", todayTx.length],
          [
            "Penjualan Hari Ini",
            money(todayTx.reduce((s, t) => s + t.total, 0)),
          ],
          ["Total Riwayat", tx.length],
          ["Produk Tersedia", products.filter((p) => p.stok > 0).length],
        ]
      : [
          ["Total Barang", products.length],
          [
            "Stok Menipis",
            products.filter((p) => p.stok > 0 && p.stok <= 10).length,
          ],
          ["Stok Habis", products.filter((p) => p.stok === 0).length],
          [
            "Pengajuan Menunggu",
            requests.filter((r) => r.status === "Menunggu").length,
          ],
        ];

  target.innerHTML =
    head(
      `Selamat datang, ${esc(user.name)}!`,
      "Ringkasan aktivitas aplikasi Kastok.",
    ) +
    `
    <div class="stats">
      ${stats
        .map(
          (s) => `
        <div class="stat">
          <span>${s[0]}</span>
          <h2>${s[1]}</h2>
        </div>
      `,
        )
        .join("")}
    </div>

    <div class="grid2">
      <section class="panel">
        <h3>Informasi Stok Menipis</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Barang</th><th>Stok</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${
                products
                  .filter((p) => p.stok <= 10)
                  .map(
                    (p) => `
                <tr>
                  <td>${esc(p.nama)}</td>
                  <td>${p.stok}</td>
                  <td>
                    <span class="badge ${p.stok === 0 ? "red" : "orange"}">
                      ${p.stok === 0 ? "Habis" : "Menipis"}
                    </span>
                  </td>
                </tr>
              `,
                  )
                  .join("") || tableEmpty(3, "Tidak ada stok menipis.")
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h3>Transaksi Terbaru</h3>
        ${
          tx
            .slice()
            .reverse()
            .slice(0, 5)
            .map(
              (t) => `
          <div class="line">
            <span>${esc(t.id)}<br><small>${dt(t.tanggal)}</small></span>
            <b>${money(t.total)}</b>
          </div>
        `,
            )
            .join("") || "<p class='muted'>Belum ada transaksi.</p>"
        }
      </section>
    </div>
  `;
}

/* DATA BARANG */
function barang() {
  const owner = user.role === "pemilik";

  target.innerHTML =
    head(
      "Data Barang",
      "Lihat data barang. Pemilik dapat menambah, mengubah, dan menghapus data.",
      owner
        ? '<button class="btn" id="addProduct">+ Tambah Barang</button>'
        : "",
    ) +
    `
    <section class="panel">
      <div class="toolbar">
        <input id="searchProduct" placeholder="Cari nama atau kode barang">
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kode</th><th>Nama</th><th>Kategori</th>
              <th>Harga</th><th>Stok</th><th>Status</th>
              ${owner ? "<th>Aksi</th>" : ""}
            </tr>
          </thead>
          <tbody id="productRows"></tbody>
        </table>
      </div>
    </section>
  `;

  function draw() {
    const q = $("searchProduct").value.toLowerCase();

    const rows = products.filter((p) =>
      (p.kode + p.nama + p.kategori).toLowerCase().includes(q),
    );

    $("productRows").innerHTML =
      rows
        .map(
          (p) => `
      <tr>
        <td>${esc(p.kode)}</td>
        <td>${esc(p.nama)}</td>
        <td>${esc(p.kategori)}</td>
        <td>${money(p.harga)}</td>
        <td>${p.stok}</td>
        <td>
          <span class="badge ${p.stok === 0 ? "red" : p.stok <= 10 ? "orange" : "green"}">
            ${p.stok === 0 ? "Habis" : p.stok <= 10 ? "Menipis" : "Aman"}
          </span>
        </td>
        ${
          owner
            ? `
          <td class="actions">
            <button class="btn btn-sm" data-edit="${esc(p.kode)}">Ubah</button>
            <button class="btn btn-danger btn-sm" data-del="${esc(p.kode)}">Hapus</button>
          </td>
        `
            : ""
        }
      </tr>
    `,
        )
        .join("") || tableEmpty(owner ? 7 : 6, "Barang tidak ditemukan.");

    if (owner) {
      document.querySelectorAll("[data-edit]").forEach((b) => {
        b.onclick = () => productModal(b.dataset.edit);
      });

      document.querySelectorAll("[data-del]").forEach((b) => {
        b.onclick = () => {
          const p = products.find((x) => x.kode === b.dataset.del);

          if (p.stok) {
            alert("Stok masih tersedia. Kosongkan stok terlebih dahulu.");
            return;
          }

          if (confirm("Hapus barang ini?")) {
            products = products.filter((x) => x.kode !== p.kode);
            save();
            draw();
          }
        };
      });
    }
  }

  $("searchProduct").oninput = draw;
  draw();

  if (owner) {
    $("addProduct").onclick = () => productModal();
  }
}

function productModal(kode = "") {
  const p = products.find((x) => x.kode === kode);

  $("modalRoot").innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <h2>${p ? "Ubah" : "Tambah"} Barang</h2>

        <form id="productForm" class="form-grid">
          <label class="field">
            Kode
            <input name="kode" required value="${esc(p?.kode || "")}" ${p ? "readonly" : ""}>
          </label>

          <label class="field">
            Nama
            <input name="nama" required value="${esc(p?.nama || "")}">
          </label>

          <label class="field">
            Kategori
            <input name="kategori" required value="${esc(p?.kategori || "")}">
          </label>

          <label class="field">
            Harga
            <input name="harga" type="number" min="1" required value="${p?.harga || ""}">
          </label>

          <div class="modal-actions full-col">
            <button type="button" class="btn btn-light" id="cancel">Batal</button>
            <button class="btn">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  `;

  $("cancel").onclick = () => ($("modalRoot").innerHTML = "");

  $("productForm").onsubmit = (e) => {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));

    if (!p && products.some((x) => x.kode === d.kode)) {
      alert("Kode barang sudah digunakan.");
      return;
    }

    if (p) {
      Object.assign(p, {
        nama: d.nama,
        kategori: d.kategori,
        harga: +d.harga,
      });
    } else {
      products.push({
        kode: d.kode,
        nama: d.nama,
        kategori: d.kategori,
        harga: +d.harga,
        stok: 0,
      });
    }

    save();
    $("modalRoot").innerHTML = "";
    barang();
  };
}

/* MANAJEMEN STOK */
function stok() {
  target.innerHTML =
    head(
      "Manajemen Stok",
      "Catat barang masuk, rusak, dan hilang. Penjualan mengurangi stok otomatis.",
    ) +
    `
    <section class="panel">
      <h3>Catat Perubahan Stok</h3>

      <form id="stockForm" class="inline-form">
        <label class="field">
          Barang
          <select name="kode">
            ${products
              .map(
                (p) => `
              <option value="${esc(p.kode)}">
                ${esc(p.nama)} (stok ${p.stok})
              </option>
            `,
              )
              .join("")}
          </select>
        </label>

        <label class="field">
          Jenis
          <select name="jenis">
            <option>Masuk</option>
            <option>Rusak</option>
            <option>Hilang</option>
          </select>
        </label>

        <label class="field">
          Jumlah
          <input name="jumlah" type="number" min="1" required>
        </label>

        <button class="btn">Simpan</button>
      </form>
    </section>

    <section class="panel">
      <h3>Daftar Stok</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Kode</th><th>Nama Barang</th><th>Stok</th></tr></thead>
          <tbody>
            ${products
              .map(
                (p) => `
              <tr>
                <td>${esc(p.kode)}</td>
                <td>${esc(p.nama)}</td>
                <td>${p.stok}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <h3>Riwayat Stok</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th><th>Barang</th><th>Jenis</th>
              <th>Jumlah</th><th>Petugas</th>
            </tr>
          </thead>
          <tbody>
            ${
              logs
                .slice()
                .reverse()
                .map(
                  (l) => `
              <tr>
                <td>${dt(l.tanggal)}</td>
                <td>${esc(l.nama)}</td>
                <td>${esc(l.jenis)}</td>
                <td>${l.jumlah}</td>
                <td>${esc(l.petugas)}</td>
              </tr>
            `,
                )
                .join("") || tableEmpty(5)
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  $("stockForm").onsubmit = (e) => {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));
    const p = products.find((x) => x.kode === d.kode);
    const n = Number(d.jumlah);

    if (!Number.isInteger(n) || n < 1) {
      alert("Jumlah tidak valid.");
      return;
    }

    if (d.jenis !== "Masuk" && n > p.stok) {
      alert("Jumlah melebihi stok.");
      return;
    }

    p.stok += d.jenis === "Masuk" ? n : -n;

    logs.push({
      tanggal: new Date().toISOString(),
      kode: p.kode,
      nama: p.nama,
      jenis: d.jenis,
      jumlah: n,
      petugas: user.username,
    });

    save();
    stok();
  };
}

/* PENGAJUAN PERUBAHAN */
function pengajuan() {
  const owner = user.role === "pemilik";

  const list = owner
    ? requests
    : requests.filter((r) => r.pengaju === user.username);

  target.innerHTML =
    head(
      "Pengajuan Perubahan",
      "Admin gudang dapat mengajukan perubahan informasi barang.",
    ) +
    (!owner
      ? `
    <section class="panel">
      <h3>Buat Pengajuan</h3>

      <form id="requestForm" class="form-grid">
        <label class="field">
          Barang
          <select name="kode">
            ${products
              .map(
                (p) => `
              <option value="${esc(p.kode)}">${esc(p.nama)}</option>
            `,
              )
              .join("")}
          </select>
        </label>

        <label class="field">
          Data yang diubah
          <select name="field">
            <option value="nama">Nama</option>
            <option value="kategori">Kategori</option>
            <option value="harga">Harga</option>
          </select>
        </label>

        <label class="field">
          Nilai baru
          <input name="nilai" required>
        </label>

        <label class="field full-col">
          Alasan
          <textarea name="alasan" required></textarea>
        </label>

        <button class="btn">Kirim Pengajuan</button>
      </form>
    </section>
  `
      : "") +
    `
    <section class="panel">
      <h3>Daftar Pengajuan</h3>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Barang</th><th>Perubahan</th><th>Alasan</th>
              <th>Pengaju</th><th>Status</th>
              ${owner ? "<th>Aksi</th>" : ""}
            </tr>
          </thead>

          <tbody>
            ${
              list
                .map(
                  (r) => `
              <tr>
                <td>${esc(r.nama)}</td>
                <td>${esc(r.field)}: ${esc(r.nilai)}</td>
                <td>${esc(r.alasan)}</td>
                <td>${esc(r.pengaju)}</td>
                <td>${r.status}</td>

                ${
                  owner && r.status === "Menunggu"
                    ? `
                  <td class="actions">
                    <button class="btn btn-success btn-sm" data-yes="${r.id}">Setujui</button>
                    <button class="btn btn-danger btn-sm" data-no="${r.id}">Tolak</button>
                  </td>
                `
                    : owner
                      ? "<td>-</td>"
                      : ""
                }
              </tr>
            `,
                )
                .join("") || tableEmpty(owner ? 6 : 5)
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  if (!owner) {
    $("requestForm").onsubmit = (e) => {
      e.preventDefault();

      const d = Object.fromEntries(new FormData(e.target));
      const p = products.find((x) => x.kode === d.kode);

      if (
        d.field === "harga" &&
        (+d.nilai <= 0 || !Number.isFinite(+d.nilai))
      ) {
        alert("Harga tidak valid.");
        return;
      }

      requests.push({
        id: "REQ" + Date.now(),
        kode: p.kode,
        nama: p.nama,
        field: d.field,
        nilai: d.nilai,
        alasan: d.alasan,
        pengaju: user.username,
        status: "Menunggu",
      });

      save();
      pengajuan();
      alert("Pengajuan terkirim.");
    };
  }

  if (owner) {
    document.querySelectorAll("[data-yes]").forEach((b) => {
      b.onclick = () => decision(b.dataset.yes, true);
    });

    document.querySelectorAll("[data-no]").forEach((b) => {
      b.onclick = () => decision(b.dataset.no, false);
    });
  }
}

function decision(id, yes) {
  const r = requests.find((x) => x.id === id && x.status === "Menunggu");

  if (!r) return;

  if (yes) {
    const p = products.find((x) => x.kode === r.kode);
    p[r.field] = r.field === "harga" ? +r.nilai : r.nilai;
    r.status = "Disetujui";
  } else {
    r.status = "Ditolak";
  }

  save();
  pengajuan();
}

/* TRANSAKSI KASIR */
function transaksi() {
  target.innerHTML =
    head(
      "Transaksi Penjualan",
      "Pilih produk, masukkan jumlah, lalu lakukan pembayaran.",
    ) +
    `
    <div class="cart-grid">
      <section class="panel">
        <h3>Daftar Produk</h3>

        <div class="toolbar">
          <input id="saleSearch" placeholder="Cari barang">
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Barang</th><th>Harga</th><th>Stok</th><th></th></tr>
            </thead>
            <tbody id="saleRows"></tbody>
          </table>
        </div>
      </section>

      <section>
        <div class="panel">
          <h3>Keranjang</h3>
          <div id="cartRows"></div>
          <div class="line total">
            <span>Total</span>
            <b id="cartTotal">Rp0</b>
          </div>
        </div>

        <div class="panel">
          <h3>Pembayaran</h3>

          <label class="field">
            Uang tunai
            <input id="cash" type="number" min="0">
          </label>

          <div class="line">
            <span>Kembalian</span>
            <b id="change">Rp0</b>
          </div>

          <button class="btn full" id="pay" disabled>
            Simpan Transaksi
          </button>
        </div>
      </section>
    </div>
  `;

  const drawProducts = () => {
    $("saleRows").innerHTML =
      products
        .filter((p) =>
          (p.nama + p.kode)
            .toLowerCase()
            .includes($("saleSearch").value.toLowerCase()),
        )
        .map(
          (p) => `
        <tr>
          <td>${esc(p.nama)}</td>
          <td>${money(p.harga)}</td>
          <td>${p.stok}</td>
          <td>
            <button class="btn btn-sm" data-add="${p.kode}" ${p.stok === 0 ? "disabled" : ""}>
              Tambah
            </button>
          </td>
        </tr>
      `,
        )
        .join("") || tableEmpty(4);

    document.querySelectorAll("[data-add]").forEach((b) => {
      b.onclick = () => {
        const p = products.find((x) => x.kode === b.dataset.add);
        const i = cart.find((x) => x.kode === p.kode);

        if (i) {
          if (i.qty >= p.stok) {
            alert("Stok tidak cukup.");
            return;
          }
          i.qty++;
        } else {
          cart.push({
            kode: p.kode,
            nama: p.nama,
            harga: p.harga,
            qty: 1,
          });
        }

        drawCart();
      };
    });
  };

  const total = () => cart.reduce((s, i) => s + i.harga * i.qty, 0);

  const update = () => {
    const cash = +$("cash").value || 0;

    $("change").textContent = money(Math.max(0, cash - total()));

    $("pay").disabled = !cart.length || cash < total() || total() === 0;
  };

  const drawCart = () => {
    $("cartRows").innerHTML =
      cart
        .map(
          (i) => `
      <div class="line">
        <span>
          ${esc(i.nama)}<br>
          ${i.qty} × ${money(i.harga)}<br>

          <button class="btn btn-light btn-sm" data-minus="${i.kode}">-</button>
          <button class="btn btn-light btn-sm" data-plus="${i.kode}">+</button>
          <button class="btn btn-danger btn-sm" data-remove="${i.kode}">Hapus</button>
        </span>

        <b>${money(i.qty * i.harga)}</b>
      </div>
    `,
        )
        .join("") || "<p class='empty'>Keranjang kosong.</p>";

    $("cartTotal").textContent = money(total());

    document.querySelectorAll("[data-minus]").forEach((b) => {
      b.onclick = () => {
        const i = cart.find((x) => x.kode === b.dataset.minus);

        i.qty--;

        if (i.qty <= 0) {
          cart = cart.filter((x) => x !== i);
        }

        drawCart();
      };
    });

    document.querySelectorAll("[data-plus]").forEach((b) => {
      b.onclick = () => {
        const i = cart.find((x) => x.kode === b.dataset.plus);
        const p = products.find((x) => x.kode === i.kode);

        if (i.qty < p.stok) {
          i.qty++;
        } else {
          alert("Stok tidak cukup.");
        }

        drawCart();
      };
    });

    document.querySelectorAll("[data-remove]").forEach((b) => {
      b.onclick = () => {
        cart = cart.filter((x) => x.kode !== b.dataset.remove);
        drawCart();
      };
    });

    update();
  };

  $("saleSearch").oninput = drawProducts;
  $("cash").oninput = update;

  $("pay").onclick = () => {
    const sum = total();
    const cash = +$("cash").value;

    if (cash < sum) return;

    for (const i of cart) {
      const p = products.find((x) => x.kode === i.kode);

      if (i.qty > p.stok) {
        alert("Stok berubah, periksa kembali.");
        return;
      }
    }

    const t = {
      id: "TRX" + Date.now(),
      tanggal: new Date().toISOString(),
      kasir: user.username,
      items: cart.map((i) => ({ ...i })),
      total: sum,
      pembayaran: cash,
      kembalian: cash - sum,
    };

    cart.forEach((i) => {
      const p = products.find((x) => x.kode === i.kode);
      p.stok -= i.qty;

      logs.push({
        tanggal: t.tanggal,
        kode: p.kode,
        nama: p.nama,
        jenis: "Penjualan",
        jumlah: i.qty,
        petugas: user.username,
      });
    });

    transactions.push(t);
    save();
    cart = [];

    alert("Transaksi berhasil disimpan.");
    receiptModal(t);
  };

  drawProducts();
  drawCart();
}

/* BUKTI TRANSAKSI DAN RIWAYAT */
function visibleTx() {
  return user.role === "kasir"
    ? transactions.filter((t) => t.kasir === user.username)
    : transactions;
}

function receiptHtml(t) {
  return `
    <div class="receipt">
      <h2>KASTOK</h2>
      <p>Bukti Transaksi Penjualan</p>
      <hr>

      <div class="receipt-row">
        <span>ID</span><b>${esc(t.id)}</b>
      </div>

      <div class="receipt-row">
        <span>Tanggal</span><span>${dt(t.tanggal)}</span>
      </div>

      <div class="receipt-row">
        <span>Kasir</span><span>${esc(t.kasir)}</span>
      </div>

      <hr>

      ${t.items
        .map(
          (i) => `
        <div class="receipt-row">
          <span>${esc(i.nama)}<br>${i.qty} × ${money(i.harga)}</span>
          <b>${money(i.qty * i.harga)}</b>
        </div>
      `,
        )
        .join("")}

      <hr>

      <div class="receipt-row">
        <b>Total</b><b>${money(t.total)}</b>
      </div>

      <div class="receipt-row">
        <span>Bayar</span><span>${money(t.pembayaran)}</span>
      </div>

      <div class="receipt-row">
        <b>Kembalian</b><b>${money(t.kembalian)}</b>
      </div>

      <hr>
      <p>Terima kasih telah berbelanja.</p>
    </div>
  `;
}

function receiptModal(t) {
  $("modalRoot").innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <h2>Bukti Transaksi</h2>
        ${receiptHtml(t)}

        <div class="modal-actions">
          <button class="btn btn-light" id="close">Tutup</button>
          <button class="btn" id="print">Cetak</button>
        </div>
      </div>
    </div>
  `;

  $("close").onclick = () => ($("modalRoot").innerHTML = "");
  $("print").onclick = () => printReceipt(t);
}

function printReceipt(t) {
  $("printArea").innerHTML = receiptHtml(t);
  window.print();
}

function bukti() {
  const tx = visibleTx().slice().reverse();

  target.innerHTML =
    head("Bukti Transaksi", "Lihat dan cetak bukti transaksi.") +
    `
    <section class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Tanggal</th><th>Kasir</th><th>Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${
              tx
                .map(
                  (t) => `
              <tr>
                <td>${t.id}</td>
                <td>${dt(t.tanggal)}</td>
                <td>${esc(t.kasir)}</td>
                <td>${money(t.total)}</td>
                <td>
                  <button class="btn btn-sm" data-receipt="${t.id}">Lihat</button>
                </td>
              </tr>
            `,
                )
                .join("") || tableEmpty(5)
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  document.querySelectorAll("[data-receipt]").forEach((b) => {
    b.onclick = () => receiptModal(tx.find((t) => t.id === b.dataset.receipt));
  });
}

function riwayat() {
  const tx = visibleTx().slice().reverse();

  target.innerHTML =
    head(
      "Riwayat Transaksi",
      "Daftar transaksi yang dapat diakses oleh akun ini.",
    ) +
    `
    <section class="panel">
      <div class="toolbar">
        <input id="historySearch" placeholder="Cari ID atau kasir">
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Tanggal</th><th>Kasir</th>
              <th>Jumlah item</th><th>Total</th><th></th>
            </tr>
          </thead>
          <tbody id="historyRows"></tbody>
        </table>
      </div>
    </section>
  `;

  const draw = () => {
    const q = $("historySearch").value.toLowerCase();

    const rows = tx.filter((t) => (t.id + t.kasir).toLowerCase().includes(q));

    $("historyRows").innerHTML =
      rows
        .map(
          (t) => `
      <tr>
        <td>${t.id}</td>
        <td>${dt(t.tanggal)}</td>
        <td>${esc(t.kasir)}</td>
        <td>${t.items.reduce((s, i) => s + i.qty, 0)}</td>
        <td>${money(t.total)}</td>
        <td>
          <button class="btn btn-sm" data-r="${t.id}">Detail</button>
        </td>
      </tr>
    `,
        )
        .join("") || tableEmpty(6);

    document.querySelectorAll("[data-r]").forEach((b) => {
      b.onclick = () => receiptModal(rows.find((t) => t.id === b.dataset.r));
    });
  };

  $("historySearch").oninput = draw;
  draw();
}

/* LAPORAN PEMILIK */
function laporan() {
  let filtered = transactions.slice();

  target.innerHTML =
    head(
      "Laporan Penjualan",
      "Rekap penjualan berdasarkan rentang tanggal.",
      '<button class="btn" id="csv">Export CSV</button>',
    ) +
    `
    <section class="panel">
      <div class="toolbar">
        <label>Dari <input id="start" type="date"></label>
        <label>Sampai <input id="end" type="date"></label>
        <button class="btn" id="apply">Terapkan</button>
        <button class="btn btn-light" id="reset">Reset</button>
      </div>
      <p id="info" class="muted"></p>
    </section>

    <div class="stats" id="reportStats"></div>

    <section class="panel">
      <h3>Daftar Penjualan</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Tanggal</th><th>Kasir</th><th>Total</th></tr>
          </thead>
          <tbody id="reportRows"></tbody>
        </table>
      </div>
    </section>
  `;

  const draw = () => {
    $("info").textContent = filtered.length + " transaksi";

    const sum = filtered.reduce((s, t) => s + t.total, 0);

    $("reportStats").innerHTML = [
      ["Total Penjualan", money(sum)],
      ["Jumlah Transaksi", filtered.length],
      [
        "Produk Terjual",
        filtered.reduce(
          (s, t) => s + t.items.reduce((a, i) => a + i.qty, 0),
          0,
        ),
      ],
      ["Rata-rata", money(filtered.length ? sum / filtered.length : 0)],
    ]
      .map(
        (x) => `
      <div class="stat">
        <span>${x[0]}</span>
        <h2>${x[1]}</h2>
      </div>
    `,
      )
      .join("");

    $("reportRows").innerHTML =
      filtered
        .map(
          (t) => `
      <tr>
        <td>${t.id}</td>
        <td>${dt(t.tanggal)}</td>
        <td>${esc(t.kasir)}</td>
        <td>${money(t.total)}</td>
      </tr>
    `,
        )
        .join("") || tableEmpty(4);
  };

  $("apply").onclick = () => {
    const a = $("start").value;
    const b = $("end").value;

    if (a && b && a > b) {
      alert("Tanggal awal lebih besar dari tanggal akhir.");
      return;
    }

    filtered = transactions.filter(
      (t) =>
        (!a || t.tanggal.slice(0, 10) >= a) &&
        (!b || t.tanggal.slice(0, 10) <= b),
    );

    draw();
  };

  $("reset").onclick = () => {
    filtered = transactions.slice();
    $("start").value = "";
    $("end").value = "";
    draw();
  };

  $("csv").onclick = () => {
    if (!filtered.length) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const rows = [
      ["ID", "Tanggal", "Kasir", "Total"],
      ...filtered.map((t) => [t.id, dt(t.tanggal), t.kasir, t.total]),
    ];

    const csv = rows
      .map((r) =>
        r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","),
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "laporan-kastok.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  draw();
}
