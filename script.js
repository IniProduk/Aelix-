/* ====================== script.js (compat v8) ====================== */

/* === CONFIG: ganti dengan config lengkap jika kamu punya === */
const firebaseConfig = {
    apiKey: "AIzaSyB7PkK...(dll)", // ganti jika ada versi lengkap
    authDomain: "choux-raka.firebaseapp.com",
    databaseURL: "https://choux-raka-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "choux-raka",
    storageBucket: "choux-raka.appspot.com",
    messagingSenderId: "441681098770",
    appId: "1:441681098770:web:eb3a97513a13cd3fcc80cb"
};

/* Initialize Firebase (compat v8) */
firebase.initializeApp(firebaseConfig);
const rdb = firebase.database();

/* WA admin nomor (format internasional tanpa +) */
const WA_PHONE = "6288983587344";

/* Helpers */
function formatRp(n) { if (!n && n !== 0) return ""; return new Intl.NumberFormat('id-ID').format(n); }
function escapeHtml(s) { return (s + '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]); }

/* Attach buy button listeners (static HTML .btn-buy) */
function attachBuyListeners() {
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.removeEventListener('click', buyHandler);
        btn.addEventListener('click', buyHandler);
    });
}
function buyHandler(e) {
    const btn = e.currentTarget;
    const name = btn.dataset.name;
    const price = parseInt(btn.dataset.price) || 0;
    openCheckout(name, price);
}

/* Modal elements */
const checkoutModal = document.getElementById('checkoutModal');
const checkoutForm = document.getElementById('checkoutForm');
const coProduct = document.getElementById('coProduct');
const coQty = document.getElementById('coQty');
const coName = document.getElementById('coName');
const coAddress = document.getElementById('coAddress');
const checkoutResult = document.getElementById('checkoutResult');
const closeCheckout = document.getElementById('closeCheckout');
const waHeaderBtn = document.getElementById('waHeaderBtn');
const waContactEl = document.getElementById('waContact');
if (waContactEl) waContactEl.href = `https://wa.me/${WA_PHONE}`;

/* open / close modal */
function openCheckout(name, price) {
    if (!checkoutModal) return;
    coProduct.value = `${name} | Rp ${formatRp(price)}`;
    coQty.value = 1;
    coName.value = '';
    coAddress.value = '';
    if (checkoutResult) checkoutResult.innerHTML = '';
    checkoutModal.style.display = 'flex';
}
if (closeCheckout) closeCheckout.addEventListener('click', () => { checkoutModal.style.display = 'none'; if (checkoutResult) checkoutResult.innerHTML = ''; });
window.addEventListener('click', (e) => { if (e.target === checkoutModal) { checkoutModal.style.display = 'none'; if (checkoutResult) checkoutResult.innerHTML = ''; } });

/* submit order: save to RTDB and open WA chat */
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const prodRaw = (coProduct && coProduct.value) ? coProduct.value.split('|')[0].trim() : 'Produk';
        const name = (coName && coName.value.trim()) ? coName.value.trim() : 'Pembeli';
        const qty = (coQty && parseInt(coQty.value)) ? parseInt(coQty.value) : 1;
        const address = (coAddress && coAddress.value.trim()) ? coAddress.value.trim() : 'Alamat';
        const orderId = 'order-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

        const orderData = {
            id: orderId,
            productName: prodRaw,
            name,
            qty,
            address,
            status: 'Menunggu konfirmasi',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        try {
            await rdb.ref('orders/' + orderId).set(orderData);
            if (checkoutResult) checkoutResult.innerHTML = `Pesanan dibuat: <strong>${orderId}</strong>. <br>Link WhatsApp akan terbuka.`;
            const waMsg = `Halo Aelix Choux, saya ${encodeURIComponent(name)} ingin memesan ${qty} x ${encodeURIComponent(prodRaw)}. ID: ${orderId}. Alamat: ${encodeURIComponent(address)}`;
            const waUrl = `https://wa.me/${WA_PHONE}?text=${waMsg}`;
            if (waHeaderBtn) waHeaderBtn.href = waUrl;
            if (waContactEl) waContactEl.href = waUrl;
            window.open(waUrl, '_blank');
            checkoutForm.reset();
        } catch (err) {
            console.error('order error', err);
            if (checkoutResult) checkoutResult.innerText = 'Gagal membuat pesanan.';
        }
    });
}

/* init */
attachBuyListeners();
