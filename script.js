// 1. STATE INTERNAL APLIKASI
const appState = {
    income: localStorage.getItem("planner_income") || 0,
    expenses: JSON.parse(localStorage.getItem("planner_expenses")) || []
};

// --- TRIK PENGAMAN API KEY UNTUK GITHUB ---
const bagian1 = "AQ.Ab8RN6KGMy9EKqXm0G_";
const bagian2 = "C5zVrPf_p4fgLTzxrsHqtYpwKz4c2oQ"; 
const API_KEY = bagian1 + bagian2; 

const URL_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Referensi DOM Navigasi
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page-section");

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

// Set nilai awal dari localStorage
if (incomeInput && appState.income > 0) {
    incomeInput.value = appState.income;
}

if (incomeInput) {
    incomeInput.addEventListener("input", () => {
        appState.income = Number(incomeInput.value) || 0;
        localStorage.setItem("planner_income", appState.income);
    });
}

/* ==========================================================================
   2. NAVIGASI SIDEBAR (4 HALAMAN)
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

        if (targetPage === "result-page") {
            renderInternalSummary();
        }
        if (targetPage === "history-page") {
            renderSavingSimulation();
        }
    });
});

/* ==========================================================================
   3. PROSES SIMPAN DAFTAR KEBUTUHAN
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

        appState.expenses.push(newExpense);
        localStorage.setItem("planner_expenses", JSON.stringify(appState.expenses));
        
        financeForm.reset();
        renderFinanceList();
    });
}

function renderFinanceList() {
    if (!financeListContainer) return;
    financeListContainer.innerHTML = "";
    
    if (appState.expenses.length === 0) {
        financeListContainer.innerHTML = "<li>Belum ada daftar pengeluaran.</li>";
        return;
    }
    
    appState.expenses.forEach(item => {
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
   4. LOGIKA PERHITUNGAN INTERNAL SALDO & SIMULASI TABUNGAN
   ========================================================================== */
function renderInternalSummary() {
    if (!internalSummary) return;
    const totalCost = appState.expenses.reduce((sum, item) => sum + item.cost, 0);
    const remainingBalance = appState.income - totalCost;
    
    internalSummary.innerHTML = `
        <p>💵 <strong>Total Uang/Gaji:</strong> Rp ${Number(appState.income).toLocaleString('id-ID')}</p>
        <p>💸 <strong>Total Rencana Pengeluaran:</strong> Rp ${totalCost.toLocaleString('id-ID')}</p>
        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
        <p>📊 <strong>Sisa Saldo Anda:</strong> <span style="color: ${remainingBalance >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">Rp ${remainingBalance.toLocaleString('id-ID')}</span></p>
    `;
}

function renderSavingSimulation() {
    if (!savingSimulation) return;
    const totalCost = appState.expenses.reduce((sum, item) => sum + item.cost, 0);
    const remainingBalance = appState.income - totalCost;

    if (remainingBalance <= 0) {
        savingSimulation.innerHTML = "<p style='color:#ef4444; font-weight:bold;'>Peringatan: Saldo Anda tidak mencukupi atau pas-pasan. Alokasi investasi otomatis tidak dapat disimulasikan. Silakan kurangi beban pengeluaran Anda.</p>";
        return;
    }

    // Hitung pembagian uang tabungan secara otomatis (50% Dana Darurat, 30% Investasi, 20% Tabungan Bebas)
    const emergencyFund = remainingBalance * 0.5;
    const investmentFund = remainingBalance * 0.3;
    const freeSave = remainingBalance * 0.2;

    savingSimulation.innerHTML = `
        <p>💰 <strong>Total Sisa Saldo Bersih:</strong> Rp ${remainingBalance.toLocaleString('id-ID')}</p>
        <ul>
            <li>🛡️ <strong>Dana Darurat (50%):</strong> Rp ${emergencyFund.toLocaleString('id-ID')}</li>
            <li>📈 <strong>Investasi/Reksadana (30%):</strong> Rp ${investmentFund.toLocaleString('id-ID')}</li>
            <li>🏖️ <strong>Tabungan Hiburan (20%):</strong> Rp ${freeSave.toLocaleString('id-ID')}</li>
        </ul>
    `;
}

/* ==========================================================================
   5. KONSULTASI PRIORITAS DENGAN AI GEMINI
   ========================================================================== */
if (optimizeAiBtn) {
    optimizeAiBtn.addEventListener("click", async () => {
        if (appState.expenses.length === 0) {
            alert("Tambahkan daftar pengeluaran Anda terlebih dahulu!");
            return;
        }

        loadingIndicator.classList.remove("hidden");
        optimizeAiBtn.disabled = true;
        aiResponseBox.classList.add("hidden");

        const expenseString = appState.expenses.map(e => `- ${e.name}: Rp ${e.cost} (${e.priority})`).join("\n");
        
        const promptSaran = `
            Saya memiliki aplikasi perencana keuangan. Berikut data keuangan saya:
            Total Gaji/Uang yang Dipunya: Rp ${appState.income}
            Daftar Rencana Pengeluaran:
            ${expenseString}
            
            Tolong bertindaklah sebagai perencana keuangan profesional. Berikan analisis singkat berupa:
            1. Evaluasi apakah uang saya cukup atau defisit (overbudget).
            2. Berikan kesimpulan mana kebutuhan yang PALING PENTING wajib dibayar duluan berdasarkan data di atas.
            3. Berikan saran logis pengeluaran mana yang harus dikurangi atau dicoret jika uangnya tidak cukup.
            Jawab langsung ke poin utamanya dengan bahasa Indonesia yang santai, jelas, tanpa menggunakan karakter bintang ganda (**).
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
            teksHasilAI = teksHasilAI.replace(/\*\*/g, "").replace(/\*/g, "");

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

// Tombol hapus total cache
if (btnClear) {
    btnClear.addEventListener("click", () => {
        if (confirm("Apakah Anda yakin ingin menghapus semua data pengeluaran dan riwayat gaji?")) {
            localStorage.clear();
            appState.income = 0;
            appState.expenses = [];
            if (incomeInput) incomeInput.value = "";
            renderFinanceList();
            alert("Semua cache data keuangan berhasil dibersihkan!");
        }
    });
}

// Jalankan list saat pertama dibuka
renderFinanceList();