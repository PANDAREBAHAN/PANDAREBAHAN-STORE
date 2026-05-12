const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const nodemailer = require('nodemailer');

const app = express();

// Buka semua pintu buat frontend
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST']
}));
app.use(express.json());

// ==========================================
// 1. KONFIGURASI MIDTRANS
// ==========================================
let snap = new midtransClient.Snap({
    isProduction: false, 
    serverKey: 'Mid-server-TtLa2g1X0tUW437u2NNIawF8',
    clientKey: 'Mid-client-FCtODPFpS64NOZtP'
});

app.post('/buat-transaksi', (req, res) => {
    let parameter = {
        "transaction_details": {
            "order_id": req.body.orderId,
            "gross_amount": req.body.totalHarga
        },
        "customer_details": {
            "first_name": "Pelanggan PandaRebahan",
            "email": req.body.email
        }
    };

    snap.createTransaction(parameter)
        .then((transaction) => { res.json({ token: transaction.token }); })
        .catch((error) => { res.status(500).json({ error: error.message }); });
});

// ==========================================
// 2. ENDPOINT ONGKIR (JALUR BYPASS)
// ==========================================
app.post('/cek-ongkir', (req, res) => {
    const { destinationCityId, courier } = req.body;

    if (!destinationCityId || !courier) {
        return res.status(400).json({ success: false, error: "Data tidak lengkap A!" });
    }

    let hargaOngkir = 15000;
    let hari = "2-3 Hari";

    if (destinationCityId === "114") { hargaOngkir = 10000; hari = "1 Hari"; }
    else if (destinationCityId === "151" || destinationCityId === "153") { hargaOngkir = 12000; hari = "1-2 Hari"; }
    else if (destinationCityId === "23") { hargaOngkir = 20000; hari = "2-3 Hari"; }
    else if (destinationCityId === "444") { hargaOngkir = 35000; hari = "3-5 Hari"; }
    else if (destinationCityId === "501") { hargaOngkir = 25000; hari = "3-4 Hari"; }

    res.json({
        success: true,
        ongkir: hargaOngkir,
        estimasi: hari
    });
});

// ==========================================
// 3. ENDPOINT BITESHIP (JALUR BYPASS / RESI INSTAN)
// ==========================================
app.post('/buat-resi', (req, res) => {
    try {
        const { orderId, kurirDipilih } = req.body;

        if (!orderId || !kurirDipilih) {
            return res.status(400).json({ success: false, error: "Data kurang A!" });
        }

        // Bikin nomor resi pura-pura tapi keren
        const randomAngka = Math.floor(Math.random() * 1000000);
        const resiBuatan = `PNDA-${kurirDipilih.toUpperCase()}-${randomAngka}`;

        // Kasih efek loading dikit biar kerasa nembak API
        setTimeout(() => {
            res.json({
                success: true,
                resi_asli: resiBuatan,
                message: "Order Berhasil Dibuat (Mode Bypass)!"
            });
        }, 1500);

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ success: false, error: "Gagal buat resi: " + error.message });
    }
});

// ==========================================
// 4. ENDPOINT KIRIM INVOICE VIA EMAIL
// ==========================================
app.post('/kirim-invoice', async (req, res) => {
    const { email, invoiceId, totalHarga } = req.body;

    // Setting akun Gmail pengirim
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'rebahanpanda@gmail.com', // Ganti sama email toko Aa
            pass: 'cfdleziqpbjwxvhn' // BUKAN PASSWORD EMAIL BIASA (Lihat petunjuk di bawah)
        }
    });

    // Desain isi emailnya
    const mailOptions = {
        from: '"PandaRebahan Store" <rebahanpanda@gmail.com>',
        to: email,
        subject: `Invoice Pesanan Selesai - ${invoiceId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #dfe6e9; border-radius: 15px;">
                <h2 style="color: #00b894;">Yeay! Pesanan Selesai 🐼</h2>
                <p>Halo, terima kasih sudah mengkonfirmasi pesanan Anda.</p>
                <div style="background: #f4f7f6; padding: 15px; border-radius: 10px; margin-top: 20px;">
                    <p style="margin: 0; color: #7f8c8d;">Nomor Invoice:</p>
                    <h3 style="margin: 5px 0 15px 0;">${invoiceId}</h3>
                    <p style="margin: 0; color: #7f8c8d;">Total Pembayaran:</p>
                    <h3 style="margin: 5px 0 0 0; color: #1e272e;">Rp${totalHarga.toLocaleString('id-ID')}</h3>
                </div>
                <p style="margin-top: 30px; font-size: 13px; color: #7f8c8d;">Jangan lupa rebahan hari ini, karena rebahan adalah jalan ninjaku!<br>- Tim PandaRebahan</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Email invoice berhasil dikirim!" });
    } catch (error) {
        console.error("Gagal kirim email:", error);
        res.status(500).json({ success: false, error: "Gagal kirim email euy" });
    }
});

// ==========================================
// KONFIGURASI LOKAL
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend PandaRebahan JALAN di http://localhost:${PORT}`);
    // Export untuk Vercel Serverless
    module.exports = app;
});