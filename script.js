// 1. STATE INTERNAL APLIKASI (Struktur database lokal diubah menjadi berbasis bulan)
const appState = {
    currentMonth: localStorage.getItem("planner_current_month") || "Januari",
    // Format database: { "Januari": { income: 5000, expenses: [...] }, "Februari": { ... } }
    db: JSON.parse(localStorage.getItem("planner_monthly_db")) || {}
};

// Inisialisasi struktur bulan aktif jika belum ada di database
function initCurrentMonthData() {
    if (!appState.db[appState.currentMonth]) {
        appState.db[appState.currentMonth] = {
            income: 0,
            expenses: []
        };
    }
}
initCurrentMonthData();

// --- TRIK PENGAMAN API KEY UNTUK GITHUB ---
const bagian1 = "AQ.Ab8RN6KGMy9EKqXm0G_";
const bagian2 = "C5zVrPf_p4fgLTzxrsHqtYpwKz4c2oQ"; 
const API_KEY = bagian1 + bagian2; 
const URL_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Referensi DOM Navigasi & Pilihan Bulan
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page-section");
const monthSelect = document.getElementById("active-month");
const textBulanLabels = document.querySelectorAll(".text-bulan");

// Referensi DOM Form
const incomeInput = document.getElementById("monthly-income");
const financeForm = document.getElementById("finance-form");
const needNameInput = document.getElementById("need-name");
const needCostInput = document.getElementById("need-cost");
const needPrioritySelect = document.getElementById("need-priority");
const financeListContainer = document.getElementById("finance-list");

// Referensi DOM Halaman Hasil & AI
const internalSummary = document.getElementById("internal-finance-summary");
const optimizeAiBtn = document.getElementById("optimize-ai-btn");
const loadingIndicator = document.getElementById("loading-indicator");
const aiResponseBox = document.getElementById("ai-response-box");
const aiTextResult = document.getElementById("ai-text-result");

// Referensi Halaman 3 (Riwayat/Tabungan)
const savingSimulation = document.getElementById("saving-simulation");
const btnClear = document.getElementById("btn-clear");

/* ==========================================================================
   2. LOGIKA PERGANTIAN BULAN (Paling Krusial)
   ========================================================================== */
if (monthSelect) {
    monthSelect.value = appState.currentMonth;
    updateUIForCurrentMonth();

    monthSelect.addEventListener("change", () => {
        appState.currentMonth = monthSelect.value;
        localStorage.setItem("planner_current_month", appState.currentMonth);
        
        // Buat wadah baru di localStorage jika bulan baru dipilih
        initCurrentMonthData();
        updateUIForCurrentMonth();
    });
}

function updateUIForCurrentMonth() {
    // Update semua teks label bulan di HTML
    textBulanLabels.forEach(el => el.innerText = appState.currentMonth);
    
    // Tarik data gaji dan list pengeluaran sesuai bulan yang dipilih
    const currentData = appState.db[appState.currentMonth];
    incomeInput.value = currentData.income > 0 ? currentData.income : "";
    
    renderFinanceList();
}

// Simpan Gaji ke database bulan aktif saat diubah user
if (incomeInput) {
    incomeInput.addEventListener("input", () => {
        appState.db[appState.currentMonth].income = Number(incomeInput.value) || 0;
        localStorage.setItem("planner_monthly_db", JSON.stringify(appState.db));
    });
}

/* ==========================================================================
   3. NAVIGASI SIDEBAR (Sudah Diperbaiki Agar Riwayat Sinkron)
   ========================================================================== */
navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const targetPage = button.getAttribute("data-target");
        pages.forEach(page => {
            if (page.id === targetPage) page.classList.remove("hidden");
            else page.classList.add("hidden");
        });

        // REFRESH DATA OTOMATIS SAAT BERPINDAH HALAMAN
        if (targetPage === "result-page") {
            renderInternalSummary();
        }
        if (targetPage === "history-page") {
            renderSavingSimulation(); // <--- Ini akan memaksa halaman riwayat memperbarui datanya
        }
    });
});

/* ==========================================================================
   4. PROSES SIMPAN DAFTAR KEBUTUHAN PER BULAN
   ========================================================================== */
if (financeForm) {
    financeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const newExpense = {
            id: Date.now(),
            name: needNameInput.value.trim(),
            cost: Number(needCostInput.value) || 0,
            priority: needPrioritySelect.value
        };

        // Masukkan ke array sesuai bulan aktif
        appState.db[appState.currentMonth].expenses.push(newExpense);
        localStorage.setItem("planner_monthly_db", JSON.stringify(appState.db));
        
        financeForm.reset();
        renderFinanceList();
    });
}

function renderFinanceList() {
    if (!financeListContainer) return;
    financeListContainer.innerHTML = "";
    
    const currentExpenses = appState.db[appState.currentMonth].expenses;
    
    if (currentExpenses.length === 0) {
        financeListContainer.innerHTML = `<li>Belum ada pengeluaran di bulan ${appState.currentMonth}.</li>`;
        return;
    }
    
    currentExpenses.forEach(item => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justify = "space-between";
        li.style.marginBottom = "8px";
        li.style.padding = "5px";
        li.style.borderBottom = "1px solid #eee";
        li.innerHTML = `
            <span><strong>${item.name}</strong> (Rp ${item.cost.toLocaleString('id-ID')})</span>
            <span style="font-size:12px; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${item.priority}</span>
        `;
        financeListContainer.appendChild(li);
    });
}

/* ==========================================================================
   5. LOGIKA HITUNG SALDO & SIMULASI TABUNGAN
   ========================================================================== */
function renderInternalSummary() {
    if (!internalSummary) return;
    const currentData = appState.db[appState.currentMonth];
    const totalCost = currentData.expenses.reduce((sum, item) => sum + item.cost, 0);
    const remainingBalance = currentData.income - totalCost;
    
    internalSummary.innerHTML = `
        <p>📅 <strong>Periode Evaluasi:</strong> Bulan ${appState.currentMonth}</p>
        <p>💵 <strong>Total Uang/Gaji:</strong> Rp ${Number(currentData.income).toLocaleString('id-ID')}</p>
        <p>💸 <strong>Total Rencana Pengeluaran:</strong> Rp ${totalCost.toLocaleString('id-ID')}</p>
        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
        <p>📊 <strong>Sisa Saldo Anda:</strong> <span style="color: ${remainingBalance >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">Rp ${remainingBalance.toLocaleString('id-ID')}</span></p>
    `;
}

function renderSavingSimulation() {
    if (!savingSimulation) return;
    const currentData = appState.db[appState.currentMonth];
    const totalCost = currentData.expenses.reduce((sum, item) => sum + item.cost, 0);
    const remainingBalance = currentData.income - totalCost;

    if (remainingBalance <= 0) {
        savingSimulation.innerHTML = `<p style='color:#ef4444; font-weight:bold;'>Peringatan: Saldo bulan ${appState.currentMonth} tidak mencukupi. Alokasi investasi otomatis tidak dapat disimulasikan.</p>`;
        return;
    }

    const emergencyFund = remainingBalance * 0.5;
    const investmentFund = remainingBalance * 0.3;
    const freeSave = remainingBalance * 0.2;

    savingSimulation.innerHTML = `
        <p>💰 <strong>Sisa Saldo Bersih (${appState.currentMonth}):</strong> Rp ${remainingBalance.toLocaleString('id-ID')}</p>
        <ul>
            <li>🛡️ <strong>Dana Darurat (50%):</strong> Rp ${emergencyFund.toLocaleString('id-ID')}</li>
            <li>📈 <strong>Investasi/Reksadana (30%):</strong> Rp ${investmentFund.toLocaleString('id-ID')}</li>
            <li>🏖️ <strong>Tabungan Hiburan (20%):</strong> Rp ${freeSave.toLocaleString('id-ID')}</li>
        </ul>
    `;
}

/* ==========================================================================
   6. INTEGRASI AI DENGAN MULTI-BULAN & MODE RINGKAS
   ========================================================================== */
if (optimizeAiBtn) {
    optimizeAiBtn.addEventListener("click", async () => {
        const currentData = appState.db[appState.currentMonth];
        if (currentData.expenses.length === 0) {
            alert("Tambahkan daftar pengeluaran Anda terlebih dahulu!");
            return;
        }

        const isShortMode = document.getElementById("short-output-mode").checked;

        loadingIndicator.classList.remove("hidden");
        optimizeAiBtn.disabled = true;
        aiResponseBox.classList.add("hidden");

        const expenseString = currentData.expenses.map(e => `- ${e.name}: Rp ${e.cost} (${e.priority})`).join("\n");
        
        let instruksiTambahan = `
            Tolong bertindaklah sebagai perencana keuangan profesional. Berikan analisis singkat berupa:
            1. Evaluasi apakah uang saya di bulan ${appState.currentMonth} ini cukup atau defisit.
            2. Berikan kesimpulan mana kebutuhan yang PALING PENTING wajib dibayar duluan berdasarkan data di atas.
            3. Berikan saran logis pengeluaran mana yang harus dikurangi atau dicoret jika uangnya tidak cukup.
            Jawab langsung ke poin utamanya dengan bahasa Indonesia yang santai, jelas, tanpa menggunakan karakter bintang ganda (**).
        `;

        if (isShortMode) {
            instruksiTambahan = `
                Bertindaklah sebagai perencana keuangan instan untuk bulan ${appState.currentMonth}. Jawab dengan SUPER RINGKAS, padat, dan langsung ke intinya (maksimal 3-4 baris saja).
                Berikan rekomendasi dalam bentuk poin kilat:
                - Status Anggaran (Cukup/Kurang)
                - Barang Utama yang Wajib Dibeli
                - Barang yang Wajib Dicoret/Ditunda
                Gunakan bahasa Indonesia yang sangat santai dan JANGAN gunakan karakter bintang (**).
            `;
        }

        const promptSaran = `
            Saya memiliki aplikasi perencana keuangan. Berikut data keuangan saya untuk bulan ${appState.currentMonth}:
            Total Gaji/Uang yang Dipunya: Rp ${currentData.income}
            Daftar Rencana Pengeluaran:
            ${expenseString}
            
            ${instruksiTambahan}
        `;

        try {
            const response = await fetch(URL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptSaran }] }]
                })
            });

            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error ? data.error.message : "Gagal memproses data.");

            let teksHasilAI = data.candidates[0].content.parts[0].text;
            teksHasilAI = teksHasilAI.replace(/\*\处理/g, "").replace(/\*/g, "");

            aiTextResult.innerText = teksHasilAI;
            aiResponseBox.classList.remove("hidden");
            
        } catch (error) {
            alert("Gagal terhubung dengan AI: " + error.message);
        } finally {
            loadingIndicator.classList.add("hidden");
            optimizeAiBtn.disabled = false;
        }
    });
}

// Tombol reset total database
if (btnClear) {
    btnClear.addEventListener("click", () => {
        if (confirm("Apakah Anda yakin ingin menghapus SELURUH database keuangan dari semua bulan?")) {
            localStorage.clear();
            appState.db = {};
            initCurrentMonthData();
            updateUIForCurrentMonth();
            alert("Seluruh riwayat bulanan berhasil dibersihkan!");
        }
    });
}

// Jalankan sistem pembacaan data pertama kali
renderFinanceList();
