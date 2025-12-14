/* ====================== SCRIPT (Fungsionalitas SPA dan Cart) ====================== */

/* === CONFIG & HELPERS === */
const WA_PHONE = "6288983587344"; // Ganti dengan nomor WA admin Anda
const LS_KEY = 'aelix_cart_v1';
const LS_ORDER_KEY = 'aelix_last_order_id'; // Kunci baru untuk menyimpan ID order terakhir

// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyB7PkK...(dll)",
    authDomain: "choux-raka.firebaseapp.com",
    databaseURL: "https://choux-raka-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "choux-raka",
    storageBucket: "choux-raka.appspot.com",
    messagingSenderId: "441681098770",
    appId: "1:441681098770:web:eb3a97513a13cd3fcc80cb"
};

let rdb = null;
try {
    firebase.initializeApp(firebaseConfig);
    rdb = firebase.database();
    console.log('Firebase initialized.');
} catch (e) {
    console.warn('Firebase initialization failed (optional).', e);
}

function formatRp(n) {
    if (!n && n !== 0) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
const el = (q) => document.querySelector(q);
const els = (q) => document.querySelectorAll(q);

/* === PRODUCT DATA (Hanya untuk Demo Render) === */
const PRODUCTS = [
    { id: 'classic', name: 'Classic Choux', price: 18000, image: 'original.jpg', isPopular: true, description: 'Choux lembut dengan cream vanilla premium.' },
    { id: 'choco', name: 'Choco Choux', price: 20000, image: 'choco.jpg', isPopular: true, description: 'Topping cokelat lumer yang menggoda.' },
    { id: 'oreo', name: 'Oreo Choux', price: 22000, image: 'oreo.jpg', isPopular: true, description: 'Taburan oreo renyah di atas cream.' },
    { id: 'rv', name: 'Red Velvet Choux', price: 25000, image: 'redvelvet.jpg', isPopular: false, description: 'Isian cream red velvet lembut dan mewah.' },
    { id: 'matcha', name: 'Matcha Choux', price: 23000, image: 'matcha.jpg', isPopular: false, description: 'Aroma teh hijau Jepang yang khas.' },
    { id: 'cheese', name: 'Cheese Choux', price: 21000, image: 'cheese.jpg', isPopular: false, description: 'Gurih manis dengan cream keju melimpah.' },
];

/* === CART LOGIC (Menggunakan LocalStorage) === */

function getCart() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
}
function saveCart(c) {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
    renderCart(); // Render ulang keranjang setiap kali ada perubahan
    updateCartButtons(); // Update tombol keranjang
}

function addToCart(productId, qty = 1) {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += qty;
    } else {
        // Pastikan image dimasukkan ke item keranjang
        cart.push({ id: p.id, name: p.name, price: p.price, qty: qty, image: p.image });
    }
    saveCart(cart.filter(i => i.qty > 0)); // Filter item dengan qty 0
    showToast(`${p.name} ditambahkan!`);
}

function setQty(productId, newQty) {
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === productId);
    if (idx >= 0) {
        if (newQty <= 0) {
            cart.splice(idx, 1);
        } else {
            cart[idx].qty = newQty;
        }
        saveCart(cart);
    }
}

function calculateTotal() {
    return getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/* === RENDER LOGIC === */

function renderProductCard(p, isPopular = false) {
    // Dipastikan path image menggunakan p.image dari array PRODUCTS
    if (isPopular) {
        // Card Kecil untuk Popular (Home)
        return `
            <div class="popular-card">
                <img src="${p.image}" alt="${p.name}">
                <p>${p.name}</p>
                <span>${formatRp(p.price)}</span>
                <button class="qty-btn" style="width: 100%; border-radius: 8px; margin-top: 8px;" data-op="add" data-id="${p.id}">+</button>
            </div>
        `;
    } else {
        // List Item Detail (Home/Menu)
        return `
             <div class="product-item">
                <img src="${p.image}" alt="${p.name}">
                <div class="info">
                    <h4>${p.name}</h4>
                    <p>${p.description}</p>
                    <strong>${formatRp(p.price)}</strong>
                </div>
                <button class="qty-btn" data-op="add" data-id="${p.id}">+</button>
            </div>
        `;
    }
}

function renderProducts() {
    // Periksa apakah elemen ada sebelum diakses (untuk mencegah error rendering)
    const popularWrap = el('#popular-container');
    const homeListWrap = el('#product-list-container-home');
    const allListWrap = el('#product-list-container-all');

    if (popularWrap) {
        popularWrap.innerHTML = PRODUCTS.filter(p => p.isPopular).map(p => renderProductCard(p, true)).join('');
    }

    if (homeListWrap) {
        // Di Home hanya tampilkan 2 item list selain popular
        const otherProducts = PRODUCTS.filter(p => !p.isPopular).slice(0, 2);
        homeListWrap.innerHTML = otherProducts.map(p => renderProductCard(p, false)).join('');
    }

    if (allListWrap) {
        // Di Menu tampilkan semua produk (list style)
        allListWrap.innerHTML = PRODUCTS.map(p => renderProductCard(p, false)).join('');
    }
}

function renderCart() {
    const cart = getCart();
    const cartListEl = el('#cart-list');
    const totalEl = el('#cartTotal');
    const cartFooterEl = el('#cart-footer');
    const emptyMsgEl = el('#cart-empty-message');

    if (cart.length === 0) {
        cartListEl.innerHTML = '';
        if (emptyMsgEl) emptyMsgEl.style.display = 'block';
        if (cartFooterEl) cartFooterEl.style.display = 'none';
    } else {
        if (emptyMsgEl) emptyMsgEl.style.display = 'none';
        if (cartFooterEl) cartFooterEl.style.display = 'flex';

        cartListEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div style="flex: 1;">
                    <h4 style="margin: 0; font-size: 14px; color: var(--red);">${item.name}</h4>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">${formatRp(item.price)}</div>
                </div>
                <div class="qty-control">
                    <button class="qty-btn" data-op="dec" data-id="${item.id}">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" data-op="inc" data-id="${item.id}">+</button>
                </div>
                <div style="width: 80px; text-align: right; font-weight: 700;">${formatRp(item.price * item.qty)}</div>
            </div>
        `).join('');
    }
    if (totalEl) totalEl.innerText = formatRp(calculateTotal());
    // Update checkout page summary jika sedang aktif
    if (location.hash === '#checkout') populateCheckoutForm();
}

// --- CHECKOUT LOGIC ---

function populateCheckoutForm() {
    const cart = getCart();
    const summaryEl = el('#checkout-summary-review');
    const finalTotalEl = el('#finalTotal');
    const checkoutFormEl = el('#checkoutForm');

    if (!summaryEl || !checkoutFormEl) return; // Prevent error if not on checkout page

    if (cart.length === 0) {
        summaryEl.innerHTML = '<p style="color: var(--red); font-weight: 600;">Keranjang kosong. Tidak dapat melanjutkan checkout.</p>';
        checkoutFormEl.style.display = 'none';
        return;
    }

    checkoutFormEl.style.display = 'block';
    let summaryHtml = '<div style="background: #fff; padding: 15px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.05);">';
    summaryHtml += '<h4 style="margin-top: 0; font-size: 16px; color: var(--blue);">Ringkasan Pesanan</h4>';

    cart.forEach(item => {
        summaryHtml += `<div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
            <span>${item.name} x ${item.qty}</span>
            <span>${formatRp(item.price * item.qty)}</span>
        </div>`;
    });

    summaryHtml += `<div style="border-top: 1px dashed #ddd; margin: 10px 0;"></div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
                        <span>Subtotal</span>
                        <span>${formatRp(calculateTotal())}</span>
                    </div>
                </div>`;

    summaryEl.innerHTML = summaryHtml;
    if (finalTotalEl) finalTotalEl.innerText = formatRp(calculateTotal());
}

el('#checkoutForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = el('#buyerName').value.trim();
    const wa = el('#buyerWa').value.trim();
    const addr = el('#buyerAddress').value.trim();
    const note = el('#buyerNote').value.trim();
    const cart = getCart();
    const total = calculateTotal();

    // Validasi Dasar
    if (cart.length === 0) { showToast('Keranjang kosong'); return; }
    if (!name || !wa || !addr) { showToast('Harap lengkapi Nama, No. WA, dan Alamat!'); return; }


    // *** MODIFIKASI UNTUK ORDER TRACKING ***

    // 1. Generate Key Firebase unik (key ini akan jadi ID pesanan)
    let orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    let orderRef = null;

    if (rdb) {
        orderRef = rdb.ref('orders').push();
        orderId = orderRef.key.substring(0, 8).toUpperCase(); // ID pendek untuk tampilan
    }


    // 2. Prepare Data Order & Status Awal
    const status = 'Menunggu Konfirmasi';

    const orderToSave = {
        orderId: orderId, // Menggunakan ID yang lebih pendek jika Firebase berhasil
        name, wa, addr, note,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
        total: total,
        status: status, // PENTING: Tambahkan status!
        createdAt: Date.now()
    };

    // 3. Save to Firebase (Optional)
    if (rdb && orderRef) {
        try { await orderRef.set(orderToSave); } catch (e) { console.warn('Firebase save failed', e); }
    }

    // 4. Simpan ID ke Local Storage untuk Tracking
    localStorage.setItem(LS_ORDER_KEY, orderId);


    // 5. Prepare WhatsApp message
    let msg = `*PESANAN AELIX CHOUX*%0AID: ${orderId}%0A%0A`;
    msg += `*Detail Pesanan:*%0A`;
    orderToSave.items.forEach(it => msg += `- ${it.name} x ${it.qty} (${formatRp(it.subtotal)})%0A`);
    msg += `%0A*Total Pembayaran:* ${formatRp(total)}%0A%0A`;
    msg += `*Data Pengiriman:*%0ANama: ${name}%0ANo. WA: ${wa}%0AAlamat: ${addr}%0ACatatan: ${note || '-'}`;

    const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;

    el('#checkoutResult').innerHTML = `Pesanan dibuat. ID: <strong>${orderId}</strong>. Harap konfirmasi di WhatsApp.`;

    // 6. Clear cart and open WA, lalu alihkan ke halaman status
    localStorage.removeItem(LS_KEY);
    updateCartButtons();
    window.open(waUrl, '_blank');

    // Alihkan ke halaman status dan render status terbaru
    location.hash = '#status';
    renderStatusPage();
});

// --- NAVIGATION & INIT ---

function switchPage(hash) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page-active'));

    const id = (hash || '#home').replace('#', '');
    const elPage = document.getElementById(id);

    if (elPage) {
        elPage.classList.add('page-active');
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas setiap pindah halaman
    }

    // Update Navigasi Bawah
    document.querySelectorAll('.bottom-nav a').forEach(nav => {
        nav.classList.toggle('active', nav.getAttribute('href') === hash);
    });

    // Panggil fungsi render spesifik
    if (id === 'keranjang') renderCart();
    if (id === 'checkout') populateCheckoutForm();
    if (id === 'status') renderStatusPage(); // Panggil fungsi render status
}

function updateCartButtons() {
    renderCart();
}

// Delegation untuk Tombol Add/Inc/Dec (termasuk di Home, Menu, Keranjang)
document.addEventListener('click', (e) => {
    const t = e.target;
    // Tombol Add di Home/Menu
    if (t.matches('[data-op="add"]')) { addToCart(t.dataset.id, 1); }
    // Tombol Increment/Decrement di Keranjang
    if (t.matches('.qty-btn') && t.dataset.op) {
        const op = t.dataset.op, id = t.dataset.id;
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;
        if (op === 'inc') { setQty(id, item.qty + 1); }
        if (op === 'dec') { setQty(id, item.qty - 1); }
    }
    // Tombol Cepat (Home Hero)
    if (t.id === 'btnQuickAdd') { addToCart(PRODUCTS[0].id, 1); location.hash = '#keranjang'; }
    // Tombol Go To Checkout (Keranjang)
    if (t.id === 'btnGoToCheckout') { location.hash = '#checkout'; }
});

// WA Header and Contact Link
if (el('#waHeaderBtn')) el('#waHeaderBtn').href = `https://wa.me/${WA_PHONE}`;
if (el('#waContact')) el('#waContact').href = `https://wa.me/${WA_PHONE}`;

// Handle hash navigation
window.addEventListener('hashchange', () => switchPage(location.hash));

// Simple Toast
function showToast(msg) {
    const s = document.createElement('div');
    s.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:80px;background:rgba(0,0,0,0.8);padding:10px 14px;border-radius:10px;color:#fff;z-index:9999;font-size:14px;';
    s.innerText = msg;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1800);
}

// Initial App Load
function initApp() {
    renderProducts(); // Render semua list produk awal (HARUS DIPANGGIL PERTAMA)
    switchPage(location.hash || '#home'); // Atur halaman awal
    updateCartButtons(); // Load cart data
}

initApp();

// =======================================================
// FUNGSI BARU UNTUK ORDER TRACKING (DITAMBAHKAN DI SINI)
// =======================================================

// GANTI SELURUH KODE FUNGSI INI DI script.js ANDA

function renderStatusPage() {
    if (!rdb) return;
    const statusEl = el('#status-display');
    const lastOrderId = localStorage.getItem(LS_ORDER_KEY); // LS_ORDER_KEY = ID pendek (ORD-XXX)

    if (!statusEl) return;

    if (!lastOrderId) {
        // ... (tampilan jika tidak ada ID) ...
        return;
    }

    statusEl.innerHTML = `
        <h4 style="color: var(--blue);">Status Pesanan: ${lastOrderId}</h4>
        <div id="currentStatusCard" class="status-card">
            <p>Memuat status dari server...</p>
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 15px;">
            Status diperbarui secara real-time. Hubungi Admin jika ada kendala.
        </p>
    `;

    // Mencari pesanan di Firebase berdasarkan orderId pendek (lastOrderId)
    // Menggunakan on('value') agar update otomatis (real-time)
    rdb.ref('orders').orderByChild('orderId').equalTo(lastOrderId).on('value', (snapshot) => {
        const orderData = snapshot.val();

        if (orderData) {
            // Kita yakin hanya ada satu hasil yang cocok dengan orderId ini
            const orderKey = Object.keys(orderData)[0];
            const order = orderData[orderKey];
            const currentStatus = order.status || 'Status Tidak Diketahui';

            // Tampilkan status di halaman
            el('#currentStatusCard').innerHTML = `
                <div class="status-badge status-${currentStatus.toLowerCase().replace(/[^a-z0-9]/g, '')}">
                    ${currentStatus}
                </div>
                <p style="margin-top: 10px;">
                    ${getStatusMessage(currentStatus)}
                </p>
            `;
        } else {
            el('#currentStatusCard').innerHTML = '<p style="color: var(--red);">Status pesanan tidak ditemukan di database (ID tidak valid).</p>';
        }
    });
}

function getStatusMessage(status) {
    switch (status) {
        case 'Menunggu Konfirmasi':
            return 'Pesanan Anda telah kami terima dan sedang menunggu konfirmasi pembayaran dari Admin. Mohon segera konfirmasi via WA.';
        case 'Sedang Dibuat':
            return 'Pesanan Anda sedang dalam proses pembuatan. Kami menjamin kesegaran dan kualitas terbaik.';
        case 'Siap Dikirim':
            return 'Pesanan sudah selesai dibuat dan siap untuk dikirim. Driver sedang dalam perjalanan menuju Anda!';
        case 'Selesai':
            return 'Pesanan telah diterima dan diselesaikan. Terima kasih telah berbelanja! Kami tunggu ulasan Anda.';
        default:
            return 'Status pesanan saat ini tidak dapat diidentifikasi.';
    }
}   
