/* --- CONFIG & STATE --- */
let calculationMode = 'hari'; // 'hari' atau 'tanggal'
let currentTheme = 0;

/* --- 1. LOGIKA MODE & TOGGLE --- */
function setMode(mode) {
  calculationMode = mode;
  
  const btnHari = document.getElementById('btnModeHari');
  const btnTanggal = document.getElementById('btnModeTanggal');
  const wrapperHari = document.getElementById('wrapperInputHari');
  const wrapperAkhir = document.getElementById('wrapperInputAkhir');

  // Reset Styles
  btnHari.className = "flex-1 py-1.5 rounded-md text-center transition-all text-gray-500 hover:bg-gray-200";
  btnTanggal.className = "flex-1 py-1.5 rounded-md text-center transition-all text-gray-500 hover:bg-gray-200";
  
  // Set Active Style
  if (mode === 'hari') {
    btnHari.className = "flex-1 py-1.5 rounded-md text-center transition-all shadow-sm bg-white text-indigo-600 font-bold";
    wrapperHari.classList.remove('hidden');
    wrapperAkhir.classList.add('hidden');
  } else {
    btnTanggal.className = "flex-1 py-1.5 rounded-md text-center transition-all shadow-sm bg-white text-indigo-600 font-bold";
    wrapperHari.classList.add('hidden');
    wrapperAkhir.classList.remove('hidden');
  }
}

/* --- 2. LOGIKA PERHITUNGAN UTAMA --- */
function hitungSaldo(skipLoading = false) {
  // Ambil Data Input Dasar
  const tglMulaiStr = document.getElementById('tanggalMulai').value;
  const inputNama = document.getElementById('inputNama').value || "Tanpa Nama";
  const hasilElem = document.getElementById('hasil');
  const loadingElem = document.getElementById('loading');

  // Validasi Tanggal Mulai
  if (!tglMulaiStr) {
    if(!skipLoading) alert("Mohon isi Tanggal Isi Saldo terlebih dahulu.");
    return;
  }

  const tglMulai = new Date(tglMulaiStr);
  let totalHari = 0;
  let tglAkhir = new Date();

  // --- LOGIKA CABANG BERDASARKAN MODE ---
  if (calculationMode === 'hari') {
    // MODE A: Input Hari -> Cari Tanggal Akhir
    const inputHariVal = document.getElementById('jumlahHari').value;
    if (!inputHariVal) return;
    
    totalHari = parseInt(inputHariVal);
    
    // Rumus: TglMulai + Hari - 1 (Inklusif)
    tglAkhir = new Date(tglMulai);
    tglAkhir.setDate(tglMulai.getDate() + totalHari - 1);
  
  } else {
    // MODE B: Input Tanggal Akhir -> Cari Jumlah Hari
    const inputAkhirVal = document.getElementById('tanggalAkhir').value;
    if (!inputAkhirVal) {
        if(!skipLoading) alert("Mohon isi Tanggal Berakhir.");
        return;
    }

    tglAkhir = new Date(inputAkhirVal);
    
    // Validasi Backdate
    if (tglAkhir < tglMulai) {
        alert("Tanggal berakhir tidak boleh lebih kecil dari tanggal mulai!");
        return;
    }

    // Hitung selisih hari
    const diffTime = Math.abs(tglAkhir - tglMulai);
    totalHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 agar inklusif
  }

  // --- LOGIKA BIAYA DASAR ---
  const jumlahPaketBulanan = Math.floor(totalHari / 30);
  const sisaHari = totalHari % 30;
  const totalBiayaAsli = (jumlahPaketBulanan * 350000) + (sisaHari * 11700);

  // --- LOGIKA PEMBULATAN KHUSUS (Requested Logic) ---
  let totalBiayaFinal = totalBiayaAsli;
  const sisaRatusan = totalBiayaAsli % 1000; // Ambil 3 digit terakhir

  if (sisaRatusan > 0) {
      if (sisaRatusan <= 500) {
          // Jika 100-500 perak -> Bulatkan ke 500
          totalBiayaFinal = (totalBiayaAsli - sisaRatusan) + 500;
      } else {
          // Jika 600-900 perak -> Bulatkan ke 1000 (ribuan berikutnya)
          totalBiayaFinal = (totalBiayaAsli - sisaRatusan) + 1000;
      }
  }

  // Format Strings
  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
  const biayaAsliStr = formatter.format(totalBiayaAsli);
  const biayaFinalStr = formatter.format(totalBiayaFinal);
  const akhirStr = tglAkhir.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  // --- RENDER FUNCTION ---
  // --- RENDER FUNCTION (UPDATED) ---
  const renderResult = () => {
    let boxClass, textColor, labelColor, dividerColor;

    // Tema Styling
    if (currentTheme === 0) {
        boxClass = 'bg-indigo-50 border-indigo-200'; 
        textColor = 'text-indigo-900';
        labelColor = 'text-indigo-600';
        dividerColor = 'border-indigo-200';
    } else {
        boxClass = 'bg-white/10 border-white/20'; 
        textColor = 'text-white';
        labelColor = 'text-indigo-200';
        dividerColor = 'border-white/20';
    }

    // Dynamic Header Content
    let headerLabel = "";
    let headerValue = "";

    if (calculationMode === 'hari') {
        headerLabel = "Saldo Berakhir Sampai";
        headerValue = akhirStr;
    } else {
        headerLabel = "Total Masa Berlaku";
        headerValue = `${totalHari} Hari`;
    }

    // Format Tanggal untuk URL (YYYY-MM-DD) tanpa pergeseran timezone
    const year = tglAkhir.getFullYear();
    const month = String(tglAkhir.getMonth() + 1).padStart(2, '0');
    const day = String(tglAkhir.getDate()).padStart(2, '0');
    const dateForUrl = `${year}-${month}-${day}`;
    
    // Ambil NFC ID
    const nfcIdForUrl = document.getElementById('inputNFC').value;

    // Cek apakah ada pembulatan
    const isRounded = totalBiayaAsli !== totalBiayaFinal;
    const originalPriceDisplay = isRounded 
        ? `<p class="text-[10px] ${labelColor} opacity-60 line-through decoration-red-400/50 mb-[-2px]">${biayaAsliStr}</p>` 
        : '';

    hasilElem.innerHTML = `
      <div class="${boxClass} border rounded-xl p-5 shadow-lg fade-in backdrop-blur-sm relative overflow-hidden">
        <div class="absolute -right-4 -top-4 opacity-10">
            <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05.69 1.64 1.83 1.64.93 0 1.57-.52 1.57-1.32 0-.96-.74-1.45-2.27-1.84-1.96-.51-2.9-1.56-2.9-2.92 0-1.84 1.34-2.87 2.95-3.16V5h2.67v1.92c1.61.35 2.85 1.54 2.96 3.16h-1.92c-.08-.92-.5-1.43-1.46-1.43-.88 0-1.46.49-1.46 1.25 0 .84.7 1.28 2.21 1.65 2.11.53 3.01 1.62 3.01 3.06 0 1.87-1.4 2.98-3.16 3.3z"/></svg>
        </div>

        <div class="mb-4 relative z-10">
            <p class="${labelColor} text-[10px] uppercase tracking-wider font-bold mb-1">${headerLabel}</p>
            <p class="text-2xl font-bold ${textColor}">${headerValue}</p>
            <p class="text-xs ${labelColor} opacity-75 mt-1">An. ${inputNama}</p>
        </div>

        <hr class="${dividerColor} border-t mb-3">

        <div class="relative z-10">
            <p class="${labelColor} text-[10px] uppercase tracking-wider font-bold mb-1">Total Yang Harus Dibayar</p>
            <div class="flex justify-between items-end mb-4">
                <div class="flex flex-col justify-end">
                    ${originalPriceDisplay}
                    <p class="text-xl font-bold ${textColor}">${biayaFinalStr}</p>
                </div>
                <p class="text-[10px] ${labelColor} opacity-80 text-right pb-1">
                    ${calculationMode === 'hari' ? `(${totalHari} Hari)` : `(Sampai ${akhirStr})`}
                </p>
            </div>
            
            <button onclick="window.open('https://db-replicate.vercel.app?auto=true&nfc=${encodeURIComponent(nfcIdForUrl)}&date=${dateForUrl}', '_blank')" 
                class="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                <span>🚀 Eksekusi Transaksi</span>
            </button>
        </div>
      </div>
    `;
  };

  // --- EKSEKUSI ---
  if (skipLoading) {
    renderResult();
  } else {
    hasilElem.innerHTML = '';
    loadingElem.classList.remove('hidden');
    setTimeout(() => {
      loadingElem.classList.add('hidden');
      renderResult();
    }, 600);
  }
}

/* --- 3. SISTEM TEMA & STARTUP --- */
const themeToggle = document.getElementById('themeToggle');
const mainCard = document.getElementById('mainCard');
const videoElement = document.getElementById('bgVideo');
const layers = {
  default: document.getElementById('gradDefault'),
  dark: document.getElementById('gradDark'),
  particles: document.getElementById('tsparticles'),
  video: document.getElementById('videoWrapper')
};
let particlesLoaded = false;
let videoLoaded = false;

window.addEventListener('DOMContentLoaded', () => {
    // Set Default Date hari ini
    document.getElementById('tanggalMulai').valueAsDate = new Date();
    
    const savedTheme = localStorage.getItem('saldoAppTheme');
    if (savedTheme !== null) currentTheme = parseInt(savedTheme);
    applyTheme();
    setTimeout(() => document.body.classList.add('loaded'), 100);
});

themeToggle.addEventListener('click', () => {
  currentTheme = (currentTheme + 1) % 3;
  localStorage.setItem('saldoAppTheme', currentTheme);
  applyTheme();
});

function applyTheme() {
  mainCard.classList.remove('card-dark', 'card-video');
  const inputs = document.querySelectorAll('.input-field');
  const toggleContainer = document.getElementById('toggleContainer');
  
  Object.values(layers).forEach(el => el.classList.remove('active'));

  if (currentTheme === 0) { // DEFAULT
    themeToggle.textContent = '🌙';
    layers.default.classList.add('active');
    layers.particles.classList.add('active');
    loadParticles();
    toggleContainer.className = "bg-gray-100 p-1 rounded-lg flex text-xs font-bold relative";
  } 
  else if (currentTheme === 1) { // DARK
    themeToggle.textContent = '🎥';
    layers.dark.classList.add('active');
    layers.particles.classList.add('active');
    mainCard.classList.add('card-dark');
    loadParticles();
    toggleContainer.className = "bg-slate-700 p-1 rounded-lg flex text-xs font-bold relative";
  } 
  else if (currentTheme === 2) { // VIDEO
    themeToggle.textContent = '🎨';
    layers.video.classList.add('active');
    mainCard.classList.add('card-video');
    toggleContainer.className = "bg-white/20 p-1 rounded-lg flex text-xs font-bold relative";
    
    if (!videoLoaded) {
      const source = document.createElement('source');
      source.src = 'livewall.mp4'; 
      source.type = 'video/mp4';
      videoElement.appendChild(source);
      videoElement.load();
      videoLoaded = true;
    }
    videoElement.play();
  }
  
  // Re-render hasil jika sudah ada
  const hasilDiv = document.getElementById('hasil');
  if (hasilDiv.innerHTML.trim() !== "") {
      hitungSaldo(true);
  }
}

function loadParticles() {
  if (particlesLoaded) return;
  tsParticles.load("tsparticles", {
    fpsLimit: 60,
    particles: {
      number: { value: 30, density: { enable: true, area: 800 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: true },
      size: { value: 3, random: true },
      move: { enable: true, speed: 1, direction: "none", outModes: "out" }
    },
    detectRetina: true
  });
  particlesLoaded = true;
}