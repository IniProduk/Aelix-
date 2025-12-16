/* ====================== SCRIPT (Fungsionalitas SPA dan Cart) ====================== */

/* === CONFIG & HELPERS === */
const WA_PHONE = "6288983587344"; // Ganti dengan nomor WA admin Anda
const LS_KEY = 'aelix_cart_v1';
const LS_ORDER_KEY = 'aelix_last_order_id';

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
    { id: 'original', name: 'Original Choux', price: 10000, image: 'original choux.jpg', isPopular: false, description: 'Choux lembut dengan cream vanilla premium.' },
    { id: 'Tiramisu regal', name: 'Tiramisu regal choux', price: 14000, image: 'tiramisu regal.jpg', isPopular: true, description: 'Dengan isian tiramisu dan toping regal yang lembut dan renyah.' },
    { id: 'Crunchy Oreo', name: 'Oreo Choux', price: 13000, image: 'oreo.jpg', isPopular: true, description: 'Taburan oreo renyah di atas cream.' },
    { id: 'Rv', name: 'Red Velvet Choux', price: 13000, image: 'redvelvet.jpg', isPopular: true, description: 'Isian cream red velvet dengan toping oreo red velvet yang lembut dan mewah.' },
];

/* === CART LOGIC (Menggunakan LocalStorage) === */

function getCart() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
}
function saveCart(c) {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
    renderCart();
    updateCartButtons();
}

function addToCart(productId, qty = 1) {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += qty;
    } else {
        cart.push({ id: p.id, name: p.name, price: p.price, qty: qty, image: p.image });
    }
    saveCart(cart.filter(i => i.qty > 0));
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
    if (isPopular) {
        // Card Kecil untuk Popular (Home)
        return `
            <div class="popular-card">
                <img src="${p.image}" alt="${p.name}">
                <p>${p.name}</p>
                <span>${formatRp(p.price)}</span>
                <button class="add-to-cart-btn-full" data-op="add" data-id="${p.id}">+</button>
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
                <button class="add-to-cart-btn" data-op="add" data-id="${p.id}">+</button>
            </div>
        `;
    }
}

function renderProducts() {
    const popularWrap = el('#popular-container');
    const homeListWrap = el('#product-list-container-home');
    const allListWrap = el('#product-list-container-all');

    if (popularWrap) {
        popularWrap.innerHTML = PRODUCTS.filter(p => p.isPopular).map(p => renderProductCard(p, true)).join('');
    }

    if (homeListWrap) {
        const otherProducts = PRODUCTS.filter(p => !p.isPopular).slice(0, 2);
        homeListWrap.innerHTML = otherProducts.map(p => renderProductCard(p, false)).join('');
    }

    if (allListWrap) {
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
    if (location.hash === '#checkout') populateCheckoutForm();
}

// --- CHECKOUT LOGIC ---

function populateCheckoutForm() {
    const cart = getCart();
    const summaryEl = el('#checkout-summary-review');
    const finalTotalEl = el('#finalTotal');
    const checkoutFormEl = el('#checkoutForm');

    if (!summaryEl || !checkoutFormEl) return;

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

if (el('#checkoutForm')) {
    el('#checkoutForm').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const name = el('#buyerName').value.trim();
        const wa = el('#buyerWa').value.trim();
        const addr = el('#buyerAddress').value.trim();
        const note = el('#buyerNote').value.trim();
        const cart = getCart();
        const total = calculateTotal();

        if (cart.length === 0) { showToast('Keranjang kosong'); return; }
        if (!name || !wa || !addr) { showToast('Harap lengkapi Nama, No. WA, dan Alamat!'); return; }


        // *** MODIFIKASI UNTUK ORDER TRACKING ***

        let orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
        let orderRef = null;

        if (rdb) {
            orderRef = rdb.ref('orders').push();
            orderId = orderRef.key.substring(0, 8).toUpperCase();
        }


        // 2. Prepare Data Order & Status Awal
        const status = 'Menunggu Konfirmasi';

        const orderToSave = {
            orderId: orderId,
            name, wa, addr, note,
            items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
            total: total,
            status: status,
            createdAt: Date.now()
        };

        // 3. Save to Firebase (Optional)
        if (rdb && orderRef) {
            try { await orderRef.set(orderToSave); } catch (e) { console.warn('Firebase save failed', e); }
        }

        // 4. Simpan ID ke Local Storage untuk Tracking
        localStorage.setItem(LS_ORDER_KEY, orderId);


        // Ganti seluruh bagian '5. Prepare WhatsApp message' (sekitar baris 263 hingga 295 di script.js)

        // 5. Prepare WhatsApp message

        // 5a. Rincian Pesanan (Menggunakan \n untuk Newline)
        // Ini adalah ARRAY of strings.
        const itemDetails = orderToSave.items.map(it =>
            `- ${it.name} (${it.qty} pcs)`
        ).join('\n'); // <-- Kunci: Gunakan \n (Newline)

        // 5b. Menyusun Pesan Utama (Semua menggunakan \n)

        let msg = 'PESANAN BARU AELIX CHOUX\n'; // \n

        msg += '\n'; // Baris kosong
        msg += '--- Rincian Pesanan ---\n';
        msg += itemDetails; // itemDetails sudah dipisahkan dengan \n

        msg += '\n'; // Baris kosong
        msg += 'Total Pembayaran: ' + formatRp(total) + '\n';

        msg += '\n'; // Baris kosong
        msg += '--- Data Pengiriman ---\n';
        msg += 'Atas Nama: ' + name + '\n';
        msg += 'Nomor WA: ' + wa + '\n';
        msg += 'Alamat: ' + addr + '\n';
        msg += 'Catatan Tambahan: ' + (note || 'Tidak Ada Catatan');

        // 5c. Encoding: Biarkan browser hanya meng-encode \n menjadi %0A satu kali.
        const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;

        el('#checkoutResult').innerHTML = `Pesanan dibuat. ID: <strong>${orderId}</strong>. Harap konfirmasi di WhatsApp.`;

        // 6. Clear cart and open WA, lalu alihkan ke halaman status
        localStorage.removeItem(LS_KEY);
        updateCartButtons();
        window.open(waUrl, '_blank');

        location.hash = '#status';
        renderStatusPage();
    });
}


// --- NAVIGATION & INIT ---

function switchPage(hash) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page-active'));

    const id = (hash || '#home').replace('#', '');
    const elPage = document.getElementById(id);

    if (elPage) {
        elPage.classList.add('page-active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('.bottom-nav a').forEach(nav => {
        nav.classList.toggle('active', nav.getAttribute('href') === hash);
    });

    if (id === 'keranjang') renderCart();
    if (id === 'checkout') populateCheckoutForm();
    if (id === 'status') renderStatusPage();
    if (id === 'testimoni') renderReviews();
}

function updateCartButtons() {
    renderCart();
}

// Delegation untuk Tombol Add/Inc/Dec (termasuk di Home, Menu, Keranjang)
document.addEventListener('click', (e) => {
    const t = e.target;
    // Tombol Add di Home/Menu
    if (t.matches('.add-to-cart-btn') || t.matches('.add-to-cart-btn-full')) {
        if (t.dataset.op === 'add') {
            addToCart(t.dataset.id, 1);
        }
    }

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
    renderProducts();
    switchPage(location.hash || '#home');
    updateCartButtons();
}

initApp();

// =======================================================
// FUNGSI BARU UNTUK ORDER TRACKING & ULASAN
// =======================================================

function renderStatusPage() {
    if (!rdb) return;
    const statusEl = el('#status-display');
    const lastOrderId = localStorage.getItem(LS_ORDER_KEY);

    if (!statusEl) return;

    if (!lastOrderId) {
        statusEl.innerHTML = `
            <p style="text-align: center; color: #666; padding: 20px;">Anda belum melakukan pemesanan terakhir. Silakan pesan melalui menu 'Home' atau 'Menu'.</p>
            <a href="#home" class="btn primary full-width" style="margin-top: 20px; text-decoration: none;">Mulai Pesan</a>
        `;
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

    rdb.ref('orders').orderByChild('orderId').equalTo(lastOrderId).on('value', (snapshot) => {
        const orderData = snapshot.val();

        if (orderData) {
            const orderKey = Object.keys(orderData)[0];
            const order = orderData[orderKey];
            const currentStatus = order.status || 'Status Tidak Diketahui';

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
function renderStarRating(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    let stars = '';

    for (let i = 1; i <= 5; i++) {
        stars += (i <= rating) ? fullStar : emptyStar;
    }
    return `<div class="rating-stars">${stars}</div>`;
}

function renderReviews() {
    if (!rdb) return;
    const listEl = el('#testimoni-list');
    if (!listEl) return;

    listEl.innerHTML = '<p style="text-align: center; color: #888;">Memuat ulasan...</p>';

    rdb.ref('reviews').orderByChild('createdDate').on('value', (snapshot) => {
        const reviewsData = snapshot.val();
        listEl.innerHTML = '';
        const reviewsArray = [];

        if (reviewsData) {
            for (const key in reviewsData) {
                reviewsArray.push(reviewsData[key]);
            }
            reviewsArray.sort((a, b) => b.createdDate - a.createdDate);

            reviewsArray.forEach(review => {
                const initial = review.name ? review.name[0].toUpperCase() : '?';

                listEl.innerHTML += `
                    <div class="testi-card">
                        <div class="testi-header">
                            <div class="testi-profile">${initial}</div>
                            <div>
                                <div style="font-weight: 700;">${review.name || 'Anonim'}</div>
                                ${renderStarRating(review.rating)}
                            </div>
                        </div>
                        <p style="font-size: 14px;">"${review.text}"</p>
                    </div>
                `;
            });
        }

        if (reviewsArray.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Belum ada ulasan. Jadilah yang pertama!</p>';
        }
    });
}

const feedbackForm = el('#feedbackForm');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = el('#reviewerName').value.trim();
        const rating = parseInt(el('#reviewRating').value);
        const text = el('#reviewText').value.trim();
        const resultEl = el('#feedbackResult');

        if (!name || isNaN(rating) || rating < 1 || rating > 5 || !text) {
            resultEl.innerHTML = '<span style="color: var(--red);">Mohon lengkapi semua kolom dengan benar.</span>';
            return;
        }

        if (!rdb) {
            resultEl.innerHTML = '<span style="color: var(--red);">Koneksi database bermasalah.</span>';
            return;
        }

        const newReview = {
            name: name,
            rating: rating,
            text: text,
            createdDate: Date.now()
        };

        rdb.ref('reviews').push(newReview)
            .then(() => {
                resultEl.innerHTML = '<span style="color: green;">Terima kasih! Ulasan Anda berhasil dikirim.</span>';
                feedbackForm.reset();
            })
            .catch(error => {
                resultEl.innerHTML = `<span style="color: var(--red);">Gagal kirim: ${error.message}</span>`;
            });
    });
}
