(function () {
'use strict';
// Ruang 8 m (x) x 6 m (z) = 48 m2. Utara (atas sketsa) = z -3, selatan (bawah/pintu) = z +3.
const W = 8, D = 6, WH = 2.8;
const el = document.getElementById('view');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeceff1);
const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const R = new THREE.WebGLRenderer({ antialias: true });
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
el.appendChild(R.domElement);
const ctl = new THREE.OrbitControls(cam, R.domElement);
ctl.enableDamping = true; ctl.maxPolarAngle = 1.45; ctl.minDistance = 6; ctl.maxDistance = 30;

scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bec4, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(-4, 10, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
scene.add(sun);

// ---------- helpers ----------
const WOOD = 0xd9bf99, WHITE = 0xf4f3ef, STEEL = 0xc5ccd1, DARK = 0x4b5258, GLC = 0xcfe6ee;
const GL = { transparent: true, opacity: 0.35, roughness: 0.1 };
const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.65, metalness: 0.05 }, o || {}));
function add(p, geo, c, x, y, z, o) {
  const m = new THREE.Mesh(geo, M(c, o)); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true; p.add(m); return m;
}
const B = (p, w, h, d, c, x, y, z, o) => add(p, new THREE.BoxGeometry(w, h, d), c, x, y, z, o);
const C = (p, rt, rb, h, c, x, y, z, o) => add(p, new THREE.CylinderGeometry(rt, rb, h, 20), c, x, y, z, o);
const pick = [];
function G(name, info, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0;
  g.userData = { name, info }; scene.add(g); pick.push(g); return g;
}
function tex(w, h, f) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  f(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
// bidang bertekstur; dir 1 = menghadap +z lokal, -1 = menghadap -z lokal
function decal(p, w, h, t, x, y, z, dir) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
  m.position.set(x, y, z); if (dir < 0) m.rotation.y = Math.PI; p.add(m);
}
function posterTex(title, lines, col) {
  return tex(300, 400, (x, w, h) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    x.fillStyle = col; x.fillRect(0, 0, w, 70);
    x.fillStyle = '#fff'; x.font = 'bold 26px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(title, w / 2, 36);
    x.fillStyle = '#333'; x.font = '20px Arial'; x.textAlign = 'left';
    lines.forEach((s, i) => x.fillText('• ' + s, 20, 112 + i * 52));
  });
}
// ---------- labels (HTML overlay) ----------
const L = [];
function lab(text, x, y, z, cls) {
  const e = document.createElement('div'); e.className = 'lbl' + (cls ? ' ' + cls : ''); e.textContent = text;
  el.appendChild(e); L.push({ e, x, y, z });
}
const v3 = new THREE.Vector3();
function updLabels() {
  const w = el.clientWidth, h = el.clientHeight;
  L.forEach(l => {
    v3.set(l.x, l.y, l.z).project(cam);
    const ok = v3.z < 1 && Math.abs(v3.x) < 1 && Math.abs(v3.y) < 1;
    l.e.style.display = ok ? '' : 'none';
    l.e.style.left = (v3.x * 0.5 + 0.5) * w + 'px';
    l.e.style.top = (-v3.y * 0.5 + 0.5) * h + 'px';
  });
}

// ---------- ruangan ----------
const ft = tex(128, 128, (x, w, h) => { x.fillStyle = '#e8eaeb'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d2d7da'; x.lineWidth = 3; x.strokeRect(0, 0, w, h); });
ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(16, 12);
B(scene, W, 0.1, D, 0xffffff, 0, -0.05, 0, { map: ft });
const WALL = 0xf4f2ee;
B(scene, W + 0.3, WH, 0.12, WALL, 0, WH / 2, -3.06);                      // utara
B(scene, 0.12, WH, D, WALL, -4.06, WH / 2, 0);                            // barat
B(scene, 0.12, 0.9, D, WALL, 4.06, 0.45, 0);                              // timur (cutaway rendah)
B(scene, W + 0.3, WH, 0.12, WALL, 0, WH / 2, 3.06, { transparent: true, opacity: 0.13, depthWrite: false }); // selatan transparan

// jendela
const jg = G('Jendela', 'Pencahayaan dan sirkulasi udara alami ruang praktikum.', 0, 0);
[-1.7, 0, 1.7].forEach(x => {
  B(jg, 1.5, 1.1, 0.03, WHITE, x, 1.75, -2.955);
  B(jg, 1.4, 1.0, 0.02, 0xbcd6e4, x, 1.75, -2.93, { roughness: 0.2 });
  B(jg, 0.03, 1.0, 0.03, WHITE, x, 1.75, -2.91);
  B(jg, 1.6, 0.04, 0.12, WHITE, x, 1.2, -2.9);
});
lab('JENDELA', 0, 2.5, -2.94);

// ---------- rak ----------
function shelf(g, len, h, dep, n, door) {
  const t = 0.03, ys = [];
  B(g, len, h, 0.02, WOOD, 0, h / 2, -dep / 2 + 0.01);
  B(g, t, h, dep, WOOD, -len / 2 + t / 2, h / 2, 0); B(g, t, h, dep, WOOD, len / 2 - t / 2, h / 2, 0);
  B(g, len - 0.06, 0.08, 0.02, 0x6b7378, 0, 0.04, dep / 2 - 0.01);
  for (let i = 0; i < n; i++) { const y = 0.08 + i * (h - 0.08) / n; B(g, len - 0.06, t, dep - 0.02, WOOD, 0, y + t / 2, 0); ys.push(y + t); }
  B(g, len - 0.06, t, 0.03, WOOD, 0, h - t / 2, dep / 2 - 0.015);
  if (door) {
    B(g, len - 0.06, h - 0.14, 0.012, 0xdfeaf0, 0, h / 2 + 0.04, dep / 2, GL);
    B(g, 0.012, h - 0.14, 0.016, 0x6b7378, 0, h / 2 + 0.04, dep / 2);
    [-0.05, 0.05].forEach(s => B(g, 0.012, 0.15, 0.02, 0x444444, s, h / 2, dep / 2 + 0.01));
  }
  return ys;
}
function fill(g, ys, len, per, fn) {
  ys.forEach((y, j) => { for (let i = 0; i < per; i++) fn(g, (i - (per - 1) / 2) * (len - 0.2) / per, y, 0, i, j); });
}
const beaker = (p, x, y, z) => C(p, 0.032, 0.03, 0.08, GLC, x, y + 0.04, z, GL);
function flask(p, x, y, z) { C(p, 0.012, 0.045, 0.1, GLC, x, y + 0.05, z, GL); C(p, 0.014, 0.014, 0.05, GLC, x, y + 0.125, z, GL); }
function tubes(p, x, y, z) { B(p, 0.2, 0.05, 0.07, WOOD, x, y + 0.025, z); for (let i = 0; i < 4; i++) C(p, 0.008, 0.008, 0.1, GLC, x - 0.075 + i * 0.05, y + 0.1, z, GL); }
function bottle(p, x, y, z, s, c) {
  C(p, 0.03 * s, 0.03 * s, 0.1 * s, c, x, y + 0.05 * s, z); C(p, 0.012 * s, 0.016 * s, 0.03 * s, c, x, y + 0.115 * s, z);
  C(p, 0.014 * s, 0.014 * s, 0.02 * s, 0xeeeeee, x, y + 0.14 * s, z); B(p, 0.035 * s, 0.04 * s, 0.002, 0xffffff, x, y + 0.05 * s, z + 0.031 * s);
}
function micro(p, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  B(g, 0.1, 0.015, 0.14, 0x3a3f44, 0, 0.008, 0); B(g, 0.03, 0.2, 0.03, 0x3a3f44, 0, 0.11, -0.045);
  B(g, 0.07, 0.01, 0.07, 0x777777, 0, 0.1, 0.02);
  const t = C(g, 0.017, 0.017, 0.15, 0xdfe3e6, 0, 0.2, -0.01); t.rotation.x = -0.5;
  C(g, 0.01, 0.01, 0.04, 0x222222, 0, 0.27, -0.045);
}
function coil(p, x, y, z) { const m = add(p, new THREE.TorusGeometry(0.05, 0.018, 8, 18), 0xb87333, x, y + 0.018, z); m.rotation.x = Math.PI / 2; }
function ruler(p, x, y, z) { B(p, 0.14, 0.006, 0.03, 0xe6d28a, x, y + 0.003, z); B(p, 0.1, 0.008, 0.03, 0xe6d28a, x, y + 0.012, z + 0.04); }
function lens(p, x, y, z) { B(p, 0.03, 0.02, 0.05, DARK, x, y + 0.01, z); const m = C(p, 0.04, 0.04, 0.01, GLC, x, y + 0.055, z, GL); m.rotation.x = Math.PI / 2; }
function balance(p, x, y, z) { B(p, 0.14, 0.02, 0.1, 0x555555, x, y + 0.01, z); C(p, 0.045, 0.045, 0.008, STEEL, x, y + 0.03, z); }
function meter(p, x, y, z) { B(p, 0.11, 0.08, 0.07, 0x4a5a66, x, y + 0.04, z); B(p, 0.07, 0.04, 0.003, 0xf2f2f2, x, y + 0.05, z + 0.036); }

// east wall: front menghadap -x (rotY = -PI/2), panjang rak = sumbu z dunia
const EAST = [
  ['Rak Mikroskop', 'Penyimpanan mikroskop agar terlindungi, tertata, dan mudah diinventarisasi.', -0.9, 1.0, 1],
  ['Rak Alat Biologi', 'Penyimpanan tabung reaksi, gelas ukur, gelas beker, dan erlenmeyer.', 0.05, 1.1, 2],
  ['Rak Reagen', 'Lemari reagen berpintu: bahan kimia disimpan aman, berlabel, dan terpisah dari area meja.', 1.45, 0.85, 3],
  ['Rak Alat Fisika', 'Penyimpanan neraca, kabel, meteran, alat optik, dan alat ukur untuk praktikum fisika.', 2.3, 0.65, 4]
];
EAST.forEach(([name, info, z, len, k]) => {
  const g = G(name, info, 3.73, z, -Math.PI / 2);
  const ys = shelf(g, len, 1.2, 0.5, 2, k === 1 || k === 3);
  if (k === 1) fill(g, ys, len, 3, (p, x, y, zz) => micro(p, x, y, zz));
  if (k === 2) fill(g, ys, len, 4, (p, x, y, zz, i, j) => [beaker, flask, tubes][(i + j) % 3](p, x, y, zz));
  if (k === 3) { fill(g, ys, len, 5, (p, x, y, zz, i, j) => bottle(p, x, y, zz, 1 + 0.25 * ((i + j) % 3), [0x9c6b30, 0xf0f0ec, 0x8a9aa2][(i + 2 * j) % 3])); B(g, 0.07, 0.07, 0.006, 0xe0b030, 0.25, 0.95, 0.256); }
  if (k === 4) fill(g, ys, len, 3, (p, x, y, zz, i, j) => [coil, ruler, lens, balance, meter][(i + 2 * j) % 5](p, x, y, zz));
  lab(name.toUpperCase(), 3.73, 1.75, z);
});

// rak pengering (pojok kiri atas), menghadap +x
const dg = G('Rak Pengering', 'Mengeringkan alat gelas yang sudah dicuci (tabung, beker, erlenmeyer) dengan posisi terbalik.', -3.73, -2.2, Math.PI / 2);
const dy = shelf(dg, 1.4, 1.4, 0.45, 3, false);
fill(dg, dy, 1.4, 4, (p, x, y, zz, i, j) => { const m = (i + j) % 2 ? beaker : flask; m(p, x, y, zz); });
lab('RAK PENGERING', -3.73, 1.85, -2.2);

// ---------- wastafel ----------
const sg = G('Wastafel', 'Mencuci tangan dan alat praktikum. Dilengkapi 4 bak, keran, dan saluran pembuangan.', -0.1, -2.65);
B(sg, 4.4, 0.86, 0.56, WHITE, 0, 0.43, 0);
B(sg, 4.44, 0.04, 0.62, 0xe3e1da, 0, 0.88, 0);
B(sg, 4.4, 0.16, 0.03, 0xe3e1da, 0, 0.98, -0.3);
for (let i = 0; i < 8; i++) { B(sg, 0.012, 0.74, 0.01, 0xaab3b8, -1.925 + i * 0.55, 0.42, 0.283); B(sg, 0.1, 0.012, 0.015, DARK, -1.925 + i * 0.55 + 0.18, 0.75, 0.292); }
for (let i = 0; i < 4; i++) {
  const x = (i - 1.5) * 1.05;
  B(sg, 0.58, 0.03, 0.42, STEEL, x, 0.9, 0.03);
  B(sg, 0.48, 0.032, 0.34, 0x8e999f, x, 0.9, 0.03);
  C(sg, 0.025, 0.025, 0.036, DARK, x, 0.9, 0.03);
  C(sg, 0.012, 0.012, 0.2, STEEL, x, 1.0, -0.22);
  const sp = C(sg, 0.01, 0.01, 0.14, STEEL, x, 1.1, -0.15); sp.rotation.x = Math.PI / 2;
}
lab('WASTAFEL', -0.1, 1.35, -2.5);

// ---------- tempat sampah ----------
[['Organik', 0x6f9a62, -2.65, 1.95], ['Anorganik', 0xd6b94a, -2.2, 1.5], ['Limbah Praktikum', 0xc0504d, -1.75, 1.05]].forEach(([n, c, z, ly]) => {
  const g = G('Tempat Sampah ' + n, n === 'Limbah Praktikum' ? 'Limbah bekas praktikum dibuang terpisah dari sampah umum.' : 'Pemisahan sampah ' + n.toLowerCase() + ' agar mudah dikelola.', 3.73, z);
  C(g, 0.2, 0.17, 0.55, c, 0, 0.275, 0); C(g, 0.215, 0.215, 0.035, c, 0, 0.57, 0); C(g, 0.04, 0.04, 0.04, DARK, 0, 0.61, 0);
  C(g, 0.205, 0.205, 0.03, WHITE, 0, 0.36, 0);
  lab(n.toUpperCase(), 3.73, ly, z);
});

// ---------- meja & kursi ----------
function chair(x, z, ry) {
  const g = G(
    'Kursi Siswa',
    'Kursi bundar berbahan busa dengan kaki penyangga sederhana.',
    x, z, ry
  );

  // ===== DUDUKAN BUSa BUNDAR =====
  C(g, 0.17, 0.17, 0.10, 0x8f979c, 0, 0.52, 0);
  C(g, 0.15, 0.15, 0.035, 0xaeb5b9, 0, 0.585, 0);

  // ===== TIANG TENGAH =====
  C(g, 0.035, 0.045, 0.38, DARK, 0, 0.30, 0);

  // ===== KAKI PENYANGGA =====
  C(g, 0.11, 0.13, 0.035, DARK, 0, 0.11, 0);
}
[-1.6, 0.3, 2.0].forEach(cx => [-0.8, 1.3].forEach(cz => {
  const g = G('Meja Praktikum', 'Meja kerja kelompok: satu meja untuk 5 siswa dengan kursi individual.', cx, cz);
  B(g, 0.8, 0.05, 1.5, 0xe9e9e4, 0, 0.735, 0); B(g, 0.82, 0.015, 1.52, WOOD, 0, 0.7, 0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B(g, 0.05, 0.71, 0.05, DARK, a * 0.35, 0.355, b * 0.67));
  [-1, 1].forEach(a => { B(g, 0.03, 0.04, 1.3, DARK, a * 0.35, 0.6, 0); B(g, 0.7, 0.03, 0.03, DARK, 0, 0.6, a * 0.67); });
 [-0.45, 0.45].forEach(dz => chair(cx - 0.30, cz + dz, Math.PI / 2));
 [-0.45, 0, 0.45].forEach(dz => chair(cx + 0.30, cz + dz, -Math.PI / 2));
}));
lab('MEJA + KURSI SISWA', 0.3, 1.0, 0.25);

// ---------- papan tulis (dinding kiri), menghadap +x ----------
const pg = G('Papan Tulis', 'Papan tulis untuk kegiatan pembelajaran dan penjelasan materi praktikum.', -4.0, 0.35, Math.PI / 2);
B(pg, 2.6, 1.0, 0.04, 0x8a6a45, 0, 1.5, 0.02);
const ct = tex(520, 200, (x, w, h) => {
  x.fillStyle = '#2f4f46'; 
  x.fillRect(0, 0, w, h);
});
decal(pg, 2.5, 0.9, ct, 0, 1.5, 0.045, 1);
lab('PAPAN TULIS', -3.94, 2.2, 0.35);

// ---------- dinding selatan: pintu, P3K, APAR, poster ----------
const dr = G('Pintu', 'Pintu masuk/keluar utama. Daun pintu membuka ke dalam; area ayunan dijaga bebas dari furnitur.', 0, 0);
B(dr, 0.07, 2.1, 0.12, 0x8a6a45, -3.08, 1.05, 2.94); B(dr, 0.07, 2.1, 0.12, 0x8a6a45, -2.12, 1.05, 2.94); B(dr, 1.03, 0.08, 0.12, 0x8a6a45, -2.6, 2.1, 2.94);
const leaf = new THREE.Group(); leaf.position.set(-3.05, 0, 2.9); leaf.rotation.y = 1.05; dr.add(leaf);
B(leaf, 0.9, 2.0, 0.04, 0xb98f5a, 0.45, 1.0, 0); B(leaf, 0.6, 0.9, 0.045, 0xa07c4c, 0.45, 1.3, 0);
const hd = C(leaf, 0.015, 0.015, 0.1, STEEL, 0.8, 1.0, 0); hd.rotation.x = Math.PI / 2; B(leaf, 0.1, 0.02, 0.1, STEEL, 0.78, 1.0, 0.03);
lab('PINTU', -2.6, 2.55, 3.0);

const ex = G('Tanda EXIT', 'Penunjuk pintu keluar darurat.', -2.6, 3.0, Math.PI);
B(ex, 0.5, 0.2, 0.05, 0x2e8b57, 0, 2.3, 0.025);
const et = tex(200, 80, (x, w, h) => { x.fillStyle = '#2e8b57'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('EXIT', w / 2, h / 2 + 2); });
decal(ex, 0.46, 0.17, et, 0, 2.3, 0.052, 1); decal(ex, 0.46, 0.17, et, 0, 2.3, -0.003, -1);

const p3 = G('Kotak P3K', 'Pertolongan pertama pada kecelakaan: plester, kasa, antiseptik, dan perban.', -1.0, 3.0, Math.PI);
B(p3, 0.42, 0.32, 0.12, 0xffffff, 0, 1.4, 0.06);
const ct3 = tex(128, 100, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#2e8b57'; x.fillRect(49, 15, 30, 70); x.fillRect(29, 35, 70, 30); });
decal(p3, 0.38, 0.28, ct3, 0, 1.4, 0.122, 1);
lab('P3K', -1.0, 1.95, 2.95, 'g');

const ap = G('APAR', 'Alat pemadam api ringan, dipasang di dinding setinggi jangkauan, tidak terhalang furnitur.', 0.1, 3.0, Math.PI);
B(ap, 0.12, 0.5, 0.015, DARK, 0, 1.15, 0.008);
C(ap, 0.09, 0.09, 0.45, 0xc9453a, 0, 1.15, 0.12);
[1.0, 1.3].forEach(y => B(ap, 0.2, 0.03, 0.04, DARK, 0, y, 0.1));
C(ap, 0.03, 0.03, 0.08, 0x333333, 0, 1.42, 0.12); B(ap, 0.07, 0.04, 0.06, 0x333333, 0, 1.47, 0.12);
B(ap, 0.14, 0.015, 0.03, 0x222222, 0.02, 1.51, 0.12);
add(ap, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.03, 1.44, 0.14), new THREE.Vector3(0.12, 1.3, 0.2), new THREE.Vector3(0.11, 1.1, 0.2), new THREE.Vector3(0.07, 0.95, 0.16)]), 20, 0.012, 6), 0x222222, 0, 0, 0);
lab('APAR', 0.1, 1.95, 2.95, 'g');

[['Poster K3', 1.4, 'K3 LAB', ['Gunakan jas lab', 'Pakai sarung tangan', 'Jangan makan/minum', 'Kenali jalur evakuasi', 'Cuci tangan'], '#2e8b57', 2.45],
 ['Poster Tata Tertib', 2.7, 'TATA TERTIB', ['Datang tepat waktu', 'Pakai jas lab', 'Jaga kebersihan', 'Patuhi arahan guru', 'Laporkan kerusakan'], '#5c7a99', 2.8]].forEach(([n, x, t, ls, col, ly]) => {
  const g = G(n, n === 'Poster K3' ? 'Pengingat keselamatan dan kesehatan kerja di laboratorium.' : 'Aturan yang wajib dipatuhi seluruh siswa selama praktikum.', x, 3.0, Math.PI);
  B(g, 0.9, 1.2, 0.04, 0x8a6a45, 0, 1.55, 0.02);
  const tx = posterTex(t, ls, col);
  decal(g, 0.8, 1.1, tx, 0, 1.55, 0.043, 1); decal(g, 0.8, 1.1, tx, 0, 1.55, -0.003, -1);
  lab(n.toUpperCase(), x, ly - 0.0, 2.95);
});

// ---------- jalur evakuasi ----------
const ev = G('Jalur Evakuasi', 'Jalur evakuasi menuju pintu. Jaga tetap bebas dari kursi, tas, dan peralatan.', 0, 0);
for (let z = -1.2; z <= 1.8; z += 0.5) { const m = add(ev, new THREE.ConeGeometry(0.09, 0.24, 3), 0x2e8b57, -2.8, 0.03, z); m.rotation.x = Math.PI / 2; }
lab('JALUR EVAKUASI', -2.8, 0.6, 0.0, 'g');

// ---------- interaksi ----------
const panel = document.getElementById('panel');
document.getElementById('close').onclick = () => { panel.hidden = true; };
const ray = new THREE.Raycaster(), mp = new THREE.Vector2(); let dn = null;
R.domElement.addEventListener('pointerdown', e => { dn = [e.clientX, e.clientY]; });
R.domElement.addEventListener('pointerup', e => {
  if (!dn || Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) > 5) return;
  const r = R.domElement.getBoundingClientRect();
  mp.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mp, cam);
  const h = ray.intersectObjects(pick, true)[0];
  if (!h) return;
  let o = h.object; while (o && !pick.includes(o)) o = o.parent;
  if (!o) return;
  panel.querySelector('h3').textContent = o.userData.name.toUpperCase();
  panel.querySelector('p').textContent = o.userData.info;
  panel.hidden = false;
});
function home() {
  const k = Math.max(1, 1.7 / cam.aspect);
  cam.position.set(0.8 * k, 10.5 * k, 10.5 * k); ctl.target.set(0, 0.3, 0.2); ctl.update();
}
document.getElementById('reset').onclick = home;
function rs() {
  const w = el.clientWidth, h = el.clientHeight;
  R.setSize(w, h); R.setPixelRatio(Math.min(devicePixelRatio, 2)); cam.aspect = w / h; cam.updateProjectionMatrix();
}
window.addEventListener('resize', rs);
rs(); home();
(function loop() { requestAnimationFrame(loop); ctl.update(); R.render(scene, cam); updLabels(); })();
})();
