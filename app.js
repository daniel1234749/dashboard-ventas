/* ═══════════════════════════════════════════════════════════════
   app.js — Dashboard Ventas · Sucursal Tucumán
   Vistas: Familias | Departamentos | Comparativa Sucursales
═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────
const DIAS_MES = 31;

const FAMILIA_COLORS = {
  '01':'#6d28d9','02':'#0369a1','03':'#be185d','04':'#065f46',
  '05':'#b45309','06':'#7c3aed','07':'#0e7490','09':'#374151',
  '10':'#dc2626','12':'#1f2937','15':'#b45309','16':'#4f46e5',
  '17':'#15803d','18':'#9333ea','19':'#d97706','20':'#0891b2',
  '25':'#c2410c','27':'#4b5563','51':'#1d4ed8','87':'#0f766e',
  '90':'#7e22ce','99':'#6b7280',
};

const FAMILIA_NOMBRES = {
  '01':'COMESTIBLES','02':'BEBIDAS S/ALCOHOL','03':'GOLOSINAS',
  '04':'ART. LIMPIEZA','05':'KIOSKO / OFICINA','06':'GALLETITAS',
  '07':'PERFUMERIA','09':'BAZAR','10':'PROD. NAVIDEÑOS','12':'TABACO',
  '15':'BEB. CON ALCOHOL','16':'LIBRERIA','17':'MASCOTAS','18':'ENVASES',
  '19':'COTILLON','20':'JUGUETES','25':'LACTEOS Y FIAMBRES',
  '27':'FERRETERIA','51':'ELECTRO','87':'HELADOS','90':'TEXTIL','99':'SIN FAMILIA',
};

// Paleta de colores para sucursales (se asignan dinámicamente)
const SUC_PALETTE = [
  { color:'#16a34a', cls:'s0', bgWin:'#dcfce7', txtWin:'#15803d', bdWin:'#86efac', bgNorm:'#f0fdf4', txtNorm:'#4ade80', bdNorm:'#bbf7d0', seg:'seg-s0' },
  { color:'#2563eb', cls:'s1', bgWin:'#dbeafe', txtWin:'#1d4ed8', bdWin:'#93c5fd', bgNorm:'#eff6ff', txtNorm:'#93c5fd', bdNorm:'#bfdbfe', seg:'seg-s1' },
  { color:'#d97706', cls:'s2', bgWin:'#fef3c7', txtWin:'#b45309', bdWin:'#fcd34d', bgNorm:'#fffbeb', txtNorm:'#fbbf24', bdNorm:'#fde68a', seg:'seg-s2' },
  { color:'#7c3aed', cls:'s3', bgWin:'#ede9fe', txtWin:'#6d28d9', bdWin:'#c4b5fd', bgNorm:'#faf5ff', txtNorm:'#a78bfa', bdNorm:'#ddd6fe', seg:'seg-s3' },
  { color:'#0e7490', cls:'s4', bgWin:'#cffafe', txtWin:'#0e7490', bdWin:'#67e8f9', bgNorm:'#ecfeff', txtNorm:'#22d3ee', bdNorm:'#a5f3fc', seg:'seg-s4' },
  { color:'#be185d', cls:'s5', bgWin:'#fce7f3', txtWin:'#9d174d', bdWin:'#f9a8d4', bgNorm:'#fdf2f8', txtNorm:'#f472b6', bdNorm:'#fbcfe8', seg:'seg-s5' },
];

// ─────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────
let vistaActual     = '';
let otraVista       = '';
let DATA_DEPTO      = [];
let DATA_FAMILIA    = [];
let DATA_SUCURSALES = [];
let SUCURSALES      = [];   // columnas detectadas dinámicamente
let diasElapsed     = 15;
let currentEstado   = 'all';
let currentFam      = 'all';
let sortDepto       = { col: 'proy', dir: -1 };
let sortFam         = { col: 'proy', dir: -1 };
let sortSuc         = { col: 'total', dir: -1 };
let searchTerm      = '';
let sucSearchTerm   = '';
let SUC_ELIMINADAS  = new Set();  // familia_cod de filas ocultadas en sucursales
let modoAgrupado    = false;   // vista agrupada por familia en departamentos

const COL_ORDER_DEPTO = ['departamento','Enero','Febrero','Marzo','Abril','Mayo','proy','hist','pct','estado'];
const COL_ORDER_FAM   = ['familia','Enero','Febrero','Marzo','Abril','Mayo','proy','hist','pct','estado'];

// ─────────────────────────────────────────
// PANTALLA INICIO
// ─────────────────────────────────────────
function elegirVista(vista) {
  vistaActual = vista;
  otraVista   = vista === 'familias' ? 'departamentos' : 'familias';

  const infoEl = document.getElementById('upload-info');
  if (vista === 'familias') {
    document.getElementById('upload-icon').textContent      = '🏷️';
    document.getElementById('upload-titulo').textContent    = 'Análisis de Familias';
    document.getElementById('upload-subtitulo').textContent = 'Sucursal Tucumán · Proyección Mayo 2026';
    infoEl.innerHTML = `
      <p>📋 Columnas esperadas:</p>
      <ul>
        <li><strong>familia_cod</strong> — código de familia (ej: 1, 4, 6)</li>
        <li><strong>familia</strong> — nombre de la familia</li>
        <li><strong>Enero, Febrero, Marzo, Abril, Mayo</strong> — ventas por mes</li>
      </ul>`;
  } else {
    document.getElementById('upload-icon').textContent      = '📦';
    document.getElementById('upload-titulo').textContent    = 'Análisis de Departamentos';
    document.getElementById('upload-subtitulo').textContent = 'Sucursal Tucumán · Proyección Mayo 2026';
    infoEl.innerHTML = `
      <p>📋 Columnas esperadas:</p>
      <ul>
        <li><strong>depto_cod</strong> — código (ej: 01-01, 06-13)</li>
        <li><strong>departamento</strong> — nombre del departamento</li>
        <li><strong>Enero, Febrero, Marzo, Abril, Mayo</strong> — ventas por mes</li>
        <li><strong>Total_Ventas</strong> — total acumulado</li>
      </ul>`;
  }
  switchScreen('upload');
}

function volverInicio() {
  document.getElementById('file-input').value = '';
  document.getElementById('upload-error').style.display = 'none';
  switchScreen('inicio');
}

// ─────────────────────────────────────────
// SUCURSALES — pantalla de carga propia
// ─────────────────────────────────────────
function mostrarSucursales() {
  switchScreen('upload-sucursales');
}

function volverInicioSucursales() {
  document.getElementById('suc-file-input').value = '';
  document.getElementById('suc-upload-error').style.display = 'none';
  switchScreen('inicio');
}

function irASucursales() {
  // Desde el dashboard de deptos/familias → si ya hay datos, ir directo; si no, pedir archivo
  if (DATA_SUCURSALES.length) {
    switchScreen('sucursales');
  } else {
    switchScreen('upload-sucursales');
  }
}

function irASucursalesDesdeNav() {
  if (DATA_DEPTO.length || DATA_FAMILIA.length) {
    switchScreen('dashboard');
  } else {
    switchScreen('inicio');
  }
}

// ─────────────────────────────────────────
// CARGA ARCHIVO SUCURSALES
// ─────────────────────────────────────────
const sucFileInput = document.getElementById('suc-file-input');
const sucDropZone  = document.getElementById('suc-drop-zone');
const sucErrEl     = document.getElementById('suc-upload-error');

sucDropZone.addEventListener('dragover', e => { e.preventDefault(); sucDropZone.classList.add('drag-over'); });
sucDropZone.addEventListener('dragleave', () => sucDropZone.classList.remove('drag-over'));
sucDropZone.addEventListener('drop', e => {
  e.preventDefault(); sucDropZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) processSucFile(e.dataTransfer.files[0]);
});
sucFileInput.addEventListener('change', e => { if (e.target.files[0]) processSucFile(e.target.files[0]); });

function processSucFile(file) {
  sucErrEl.style.display = 'none';
  const ext    = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let rows = [];
      if (ext === 'csv') {
        rows = parseCSV(e.target.result);
      } else {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: 0 });
      }
      buildDataSucursales(rows, file.name);
    } catch (err) {
      showSucError('No se pudo leer el archivo: ' + err.message);
    }
  };
  reader.onerror = () => showSucError('Error al leer el archivo.');
  ext === 'csv' ? reader.readAsText(file, 'UTF-8') : reader.readAsArrayBuffer(file);
}

function showSucError(msg) {
  sucErrEl.textContent   = '⚠️ ' + msg;
  sucErrEl.style.display = 'block';
}

// ─────────────────────────────────────────
// BUILD DATA SUCURSALES (dinámico)
// ─────────────────────────────────────────
function buildDataSucursales(rows, fileName) {
  if (!rows.length) { showSucError('El archivo está vacío.'); return; }

  // Detectar columnas de sucursales: todo lo que NO sea familia_cod, familia
  const COLS_FIJAS = ['familia_cod', 'familia'];
  const allKeys    = Object.keys(rows[0]);
  const detected   = allKeys.filter(k => !COLS_FIJAS.includes(k));

  if (!detected.length) {
    showSucError('No se encontraron columnas de sucursales. El archivo debe tener columnas como "Fair", "Burzaco", etc.');
    return;
  }

  SUCURSALES = detected;
  SUC_ELIMINADAS = new Set();   // limpiar al cargar nuevo archivo

  // Construir CSS dinámico para los segmentos de barra
  injectSucStyles();

  // Actualizar encabezados de tabla dinámicamente
  buildSucTableHeader();

  DATA_SUCURSALES = rows
    .filter(r => {
      const nom   = String(r.familia || '').trim();
      const total = SUCURSALES.reduce((s, suc) => s + (Number(r[suc]) || 0), 0);
      return nom !== '' && total > 0;
    })
    .map(r => {
      const total = SUCURSALES.reduce((s, suc) => s + (Number(r[suc]) || 0), 0);
      const pcts  = {};
      let   winner = null, winVal = -1;
      SUCURSALES.forEach((suc, i) => {
        const v    = Number(r[suc]) || 0;
        pcts[suc]  = total > 0 ? (v / total * 100) : 0;
        if (v > winVal) { winVal = v; winner = suc; }
      });
      return {
        familia_cod: String(r.familia_cod || '').trim(),
        familia:     String(r.familia     || '').trim(),
        total, pcts, winner,
        ...Object.fromEntries(SUCURSALES.map(suc => [suc, Number(r[suc]) || 0])),
      };
    });

  if (!DATA_SUCURSALES.length) { showSucError('No se encontraron filas válidas.'); return; }

  // Actualizar nombre del archivo en el header
  document.getElementById('suc-file-label').textContent = fileName;

  renderSucursales();
  buildSucHeaderKpis();
  switchScreen('sucursales');
}

// Inyectar CSS dinámico para colores de barras según cantidad de sucursales
function injectSucStyles() {
  let existing = document.getElementById('suc-dynamic-styles');
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = 'suc-dynamic-styles';
  let css = '';
  SUCURSALES.forEach((suc, i) => {
    const p = SUC_PALETTE[i % SUC_PALETTE.length];
    css += `.seg-${p.cls} { background: ${p.color}; }\n`;
  });
  style.textContent = css;
  document.head.appendChild(style);
}

// Reconstruir el <thead> de la tabla de sucursales dinámicamente
function buildSucTableHeader() {
  const thead = document.querySelector('#tabla-sucursales thead tr');
  // Mantener columna Familia, reconstruir sucursales, Total, Distribución
  const sucHeaders = SUCURSALES.map((suc, i) => {
    const p = SUC_PALETTE[i % SUC_PALETTE.length];
    return `<th style="background:linear-gradient(135deg,${p.color}cc,${p.color});cursor:pointer"
              onclick="setSucSort('${suc}')">${escHtml(suc)} <span class="sa">↕</span></th>`;
  }).join('');
  thead.innerHTML = `
    <th onclick="setSucSort('familia')" style="min-width:180px">Familia <span class="sa">↕</span></th>
    ${sucHeaders}
    <th class="num" onclick="setSucSort('total')" style="background:linear-gradient(135deg,#1a1a2e,#2d1f5e);cursor:pointer">Total <span class="sa">↕</span></th>
    <th style="min-width:220px;background:linear-gradient(135deg,#1a1a2e,#2d1f5e)">Distribución visual</th>
  `;

  // Reconstruir botones de ordenamiento en controles
  const sortBtns = document.getElementById('suc-sort-btns-dynamic');
  if (sortBtns) {
    sortBtns.innerHTML = SUCURSALES.map((suc, i) => {
      const p = SUC_PALETTE[i % SUC_PALETTE.length];
      return `<button class="sbtn" id="suc-sort-${i}" onclick="setSucSort('${escHtml(suc)}')"
                style="border-color:${p.color};color:${p.color}">${escHtml(suc)}</button>`;
    }).join('');
  }

  // Actualizar leyenda
  const legendItems = document.getElementById('suc-legend-items');
  if (legendItems) {
    legendItems.innerHTML = SUCURSALES.map((suc, i) => {
      const p = SUC_PALETTE[i % SUC_PALETTE.length];
      return `<span class="suc-legend-dot" style="background:${p.color}"></span>
              <span class="suc-legend-label">${escHtml(suc)}</span>
              <span class="suc-legend-sep">·</span>`;
    }).join('');
  }
}

// ─────────────────────────────────────────
// KPIs DEL HEADER SUCURSALES
// ─────────────────────────────────────────
function buildSucHeaderKpis() {
  const totales    = {};
  let   grandTotal = 0;
  SUCURSALES.forEach(suc => {
    totales[suc]  = DATA_SUCURSALES.reduce((s, r) => s + (r[suc] || 0), 0);
    grandTotal   += totales[suc];
  });

  const container = document.getElementById('suc-header-kpis');
  container.innerHTML = SUCURSALES.map((suc, i) => {
    const p   = SUC_PALETTE[i % SUC_PALETTE.length];
    const pct = grandTotal > 0 ? (totales[suc] / grandTotal * 100).toFixed(1) : '0.0';
    return `<div class="suc-kpi-card">
      <div class="kpi-val" style="color:${p.color}">${fmtNum(totales[suc])}</div>
      <div class="kpi-lbl">${escHtml(suc)}</div>
      <div class="kpi-pct" style="color:${p.color}">${pct}% del total</div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────
// SORT SUCURSALES
// ─────────────────────────────────────────
function setSucSort(col) {
  if (sortSuc.col === col) sortSuc.dir *= -1;
  else { sortSuc.col = col; sortSuc.dir = col === 'familia' ? 1 : -1; }
  renderSucursales();
}

// ─────────────────────────────────────────
// SEARCH SUCURSALES
// ─────────────────────────────────────────
document.getElementById('suc-search').addEventListener('input', e => {
  sucSearchTerm = e.target.value.toLowerCase().trim();
  renderSucursales();
});

// ─────────────────────────────────────────
// RENDER SUCURSALES
// ─────────────────────────────────────────
function eliminarFamSuc(cod) {
  SUC_ELIMINADAS.add(cod);
  actualizarBtnRestaurar();
  renderSucursales();
}

function restaurarFamilias() {
  SUC_ELIMINADAS.clear();
  actualizarBtnRestaurar();
  renderSucursales();
}

function actualizarBtnRestaurar() {
  const btn = document.getElementById('btn-restaurar-suc');
  if (!btn) return;
  if (SUC_ELIMINADAS.size > 0) {
    btn.style.display = '';
    btn.textContent   = `↩ Restaurar (${SUC_ELIMINADAS.size})`;
  } else {
    btn.style.display = 'none';
  }
}

function renderSucursales() {
  let rows = DATA_SUCURSALES.filter(r => {
    if (SUC_ELIMINADAS.has(r.familia_cod)) return false;
    return !sucSearchTerm || r.familia.toLowerCase().includes(sucSearchTerm);
  });

  const col = sortSuc.col, dir = sortSuc.dir;
  rows.sort((a, b) => {
    const va = col === 'familia' ? a.familia : col === 'total' ? a.total : (a[col] || 0);
    const vb = col === 'familia' ? b.familia : col === 'total' ? b.total : (b[col] || 0);
    return va < vb ? -dir : va > vb ? dir : 0;
  });

  document.getElementById('suc-result-count').textContent =
    rows.length !== DATA_SUCURSALES.length
      ? `Mostrando ${rows.length} de ${DATA_SUCURSALES.length} familias`
      : `${rows.length} familias`;

  const tbody   = document.getElementById('tbody-sucursales');
  const emptyEl = document.getElementById('empty-sucursales');

  if (!rows.length) { tbody.innerHTML = ''; emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';

  // Familias eliminadas temporalmente (por familia_cod)
  const eliminadas = new Set(SUC_ELIMINADAS);

  tbody.innerHTML = rows.map(r => {
    const sucCells = SUCURSALES.map((suc, i) => {
      const p        = SUC_PALETTE[i % SUC_PALETTE.length];
      const val      = r[suc] || 0;
      const pct      = r.pcts[suc];
      const isWinner = r.winner === suc;
      const bg       = isWinner ? p.bgWin  : 'transparent';
      const txtColor = isWinner ? p.txtWin : '#555';
      const bdColor  = isWinner ? p.bdWin  : p.bdNorm;
      const pctBg    = isWinner ? p.bgWin  : p.bgNorm;
      const pctTxt   = isWinner ? p.txtWin : p.txtNorm;
      const valStr   = val > 0 ? fmtNum(val) : '<span style="color:#ddd">—</span>';
      const pctStr   = pct > 0 ? pct.toFixed(1) + '%' : '—';
      return `<td style="background:${bg}">
        <div class="suc-cell">
          <span class="suc-val" style="color:${txtColor}">${valStr}</span>
          <span class="suc-pct" style="background:${pctBg};color:${pctTxt};border:1px solid ${bdColor}">${pctStr}</span>
        </div>
      </td>`;
    }).join('');

    // Barra de distribución
    const barSegs = SUCURSALES.map((suc, i) => {
      const pct = r.pcts[suc];
      if (pct < 0.5) return '';
      const p     = SUC_PALETTE[i % SUC_PALETTE.length];
      const label = pct >= 8 ? pct.toFixed(0) + '%' : '';
      return `<div class="suc-bar-seg seg-${p.cls}" style="flex:${pct};background:${p.color}" title="${escHtml(suc)}: ${pct.toFixed(1)}%">${label}</div>`;
    }).join('');

    const famCod = r.familia_cod.toString().padStart(2, '0');
    const fc     = FAMILIA_COLORS[famCod] || '#888';
    const codEsc = escHtml(r.familia_cod);

    return `<tr class="suc-row" id="suc-row-${codEsc}">
      <td>
        <div class="suc-fam-name">
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${fc};margin-right:6px;vertical-align:middle"></span>
          ${escHtml(r.familia)}
          <button class="suc-btn-del" onclick="eliminarFamSuc('${codEsc}')" title="Ocultar fila del informe">✕</button>
        </div>
        <div class="suc-fam-cod">Cód. ${escHtml(r.familia_cod)}</div>
      </td>
      ${sucCells}
      <td class="num"><span class="suc-total-val">${fmtNum(r.total)}</span></td>
      <td><div class="suc-distrib-bar">${barSegs}</div></td>
    </tr>`;
  }).join('');

  buildSucTotals(rows);
}

function buildSucTotals(rows) {
  const tfoot    = document.getElementById('tfoot-sucursales');
  const totales  = {};
  let grandTotal = 0;
  SUCURSALES.forEach(suc => {
    totales[suc]  = rows.reduce((s, r) => s + (r[suc] || 0), 0);
    grandTotal   += totales[suc];
  });

  const sucCells = SUCURSALES.map((suc, i) => {
    const p   = SUC_PALETTE[i % SUC_PALETTE.length];
    const val = totales[suc];
    const pct = grandTotal > 0 ? (val / grandTotal * 100) : 0;
    return `<td>
      <div class="suc-cell">
        <span class="suc-val" style="font-size:14px;font-weight:800">${fmtNum(val)}</span>
        <span class="suc-pct" style="background:${p.bgWin};color:${p.txtWin};border:1px solid ${p.bdWin}">${pct.toFixed(1)}%</span>
      </div>
    </td>`;
  }).join('');

  const barSegs = SUCURSALES.map((suc, i) => {
    const pct = grandTotal > 0 ? (totales[suc] / grandTotal * 100) : 0;
    if (pct < 0.5) return '';
    const p     = SUC_PALETTE[i % SUC_PALETTE.length];
    const label = pct >= 6 ? pct.toFixed(0) + '%' : '';
    return `<div class="suc-bar-seg" style="flex:${pct};background:${p.color}">${label}</div>`;
  }).join('');

  tfoot.innerHTML = `<tr>
    <td style="font-size:13px;font-weight:800;color:#1a1a2e">TOTAL GENERAL</td>
    ${sucCells}
    <td class="num"><span class="suc-total-val" style="font-size:15px">${fmtNum(grandTotal)}</span></td>
    <td><div class="suc-distrib-bar">${barSegs}</div></td>
  </tr>`;
}

// ─────────────────────────────────────────
// ─────────────────────────────────────────
// RANGO DE FECHAS
// ─────────────────────────────────────────
(function initFechas() {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const iso = ayer.toISOString().split('T')[0];
  document.getElementById('fecha-hasta').value = iso;
  actualizarPreview();
})();

document.getElementById('fecha-desde').addEventListener('change', actualizarPreview);
document.getElementById('fecha-hasta').addEventListener('change', actualizarPreview);

function actualizarPreview() {
  const desde   = document.getElementById('fecha-desde').value;
  const hasta   = document.getElementById('fecha-hasta').value;
  const preview = document.getElementById('rango-preview');
  if (!desde || !hasta) {
    preview.className = 'rango-preview';
    preview.textContent = 'Seleccioná las fechas para ver la proyección';
    return;
  }
  const d1   = new Date(desde + 'T00:00:00');
  const d2   = new Date(hasta + 'T00:00:00');
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  if (diff <= 0) {
    preview.className = 'rango-preview error';
    preview.textContent = '⚠️ La fecha "hasta" debe ser posterior a "desde"';
    return;
  }
  if (diff > 31) {
    preview.className = 'rango-preview error';
    preview.textContent = '⚠️ El rango supera los 31 días del mes';
    return;
  }
  const factor   = DIAS_MES / diff;
  const mesDesde = d1.toLocaleString('es-AR', { month: 'long' });
  preview.className = 'rango-preview valido';
  preview.innerHTML =
    `✓ ${diff} día${diff > 1 ? 's' : ''} de datos de ${mesDesde} · ` +
    `Factor de proyección: ×${factor.toFixed(2)} → estimado al día 31`;
}

function getDiasElapsed() {
  const desde = document.getElementById('fecha-desde').value;
  const hasta = document.getElementById('fecha-hasta').value;
  if (!desde || !hasta) return 1;
  const d1   = new Date(desde + 'T00:00:00');
  const d2   = new Date(hasta + 'T00:00:00');
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

function getRangoLabel() {
  const desde = document.getElementById('fecha-desde').value;
  const hasta = document.getElementById('fecha-hasta').value;
  if (!desde || !hasta) return 'Mayo';
  const fmt = v => new Date(v + 'T00:00:00').toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' });
  return `${fmt(desde)} al ${fmt(hasta)}`;
}

const fileInput = document.getElementById('file-input');
const dropZone  = document.getElementById('drop-zone');
const errEl     = document.getElementById('upload-error');

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => { if (e.target.files[0]) processFile(e.target.files[0]); });

// ─────────────────────────────────────────
// CARGA DE ARCHIVO (depto/familia)
// ─────────────────────────────────────────
function processFile(file) {
  errEl.style.display = 'none';
  diasElapsed = getDiasElapsed();
  const ext    = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let rows = [];
      if (ext === 'csv') {
        rows = parseCSV(e.target.result);
      } else {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: 0 });
      }
      if (vistaActual === 'familias') buildDataFamilia(rows);
      else                             buildDataDepto(rows);
    } catch (err) {
      showError('No se pudo leer el archivo: ' + err.message);
    }
  };
  reader.onerror = () => showError('Error al leer el archivo.');
  ext === 'csv' ? reader.readAsText(file, 'UTF-8') : reader.readAsArrayBuffer(file);
}

function parseCSV(text) {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj  = {};
    headers.forEach((h, i) => {
      const v = (vals[i] || '').trim().replace(/^"|"$/g, '');
      const n = parseFloat(v);
      obj[h]  = isNaN(n) ? v : n;
    });
    return obj;
  });
}

function showError(msg) {
  errEl.textContent  = '⚠️ ' + msg;
  errEl.style.display = 'block';
}

// ─────────────────────────────────────────
// BUILD DATA — DEPARTAMENTOS
// ─────────────────────────────────────────
function buildDataDepto(rows) {
  const factor = DIAS_MES / diasElapsed;
  DATA_DEPTO = rows
    .filter(r => !String(r.departamento || '').includes('*') && (Number(r.Total_Ventas || 0) > 0 || Number(r.Mayo || 0) > 0))
    .map(r => {
      const cod  = String(r.depto_cod || '').trim();
      const fam  = (cod.split('-')[0] || '99').padStart(2, '0');  // normalizar a 2 dígitos: "1" → "01"
      const ene  = Number(r.Enero   || 0);
      const feb  = Number(r.Febrero || 0);
      const mar  = Number(r.Marzo   || 0);
      const abr  = Number(r.Abril   || 0);
      const may  = Number(r.Mayo    || 0);
      const hist = (ene + feb + mar + abr) / 4;
      const proy = may * factor;
      let   pct  = hist > 0 ? (proy - hist) / hist * 100 : (proy > 0 ? 999 : 0);
      if (!isFinite(pct) || isNaN(pct)) pct = 0;
      return {
        depto_cod: cod, familia_cod: fam,
        familia_nom: FAMILIA_NOMBRES[fam] || `FAM ${fam}`,
        departamento: String(r.departamento || '').trim(),
        Enero: ene, Febrero: feb, Marzo: mar, Abril: abr, Mayo: may,
        proy: Math.round(proy * 100) / 100,
        hist: Math.round(hist * 100) / 100,
        pct:  Math.round(pct  * 10)  / 10,
        estado: pct >= -5 ? 0 : pct >= -20 ? 1 : 2,
      };
    })
    .sort((a, b) => b.proy - a.proy);

  if (!DATA_DEPTO.length) { showError('No se encontraron filas válidas.'); return; }
  activarDashboard('departamentos');
}

// ─────────────────────────────────────────
// BUILD DATA — FAMILIAS
// ─────────────────────────────────────────
function buildDataFamilia(rows) {
  const factor = DIAS_MES / diasElapsed;
  DATA_FAMILIA = rows
    .filter(r => {
      const nom = String(r.familia || '').trim();
      const cod = Number(r.familia_cod ?? -1);
      if (nom.includes('*') || nom === '' || cod === 0) return false;
      const total = Number(r.Enero || 0) + Number(r.Febrero || 0) + Number(r.Marzo || 0)
                  + Number(r.Abril || 0) + Number(r.Mayo || 0);
      return total > 0;
    })
    .map(r => {
      const codRaw = String(r.familia_cod || '').trim();
      const cod    = codRaw.padStart(2, '0');
      const ene    = Number(r.Enero   || 0);
      const feb    = Number(r.Febrero || 0);
      const mar    = Number(r.Marzo   || 0);
      const abr    = Number(r.Abril   || 0);
      const may    = Number(r.Mayo    || 0);
      const hist   = (ene + feb + mar + abr) / 4;
      const proy   = may * factor;
      let   pct    = hist > 0 ? (proy - hist) / hist * 100 : (proy > 0 ? 999 : 0);
      if (!isFinite(pct) || isNaN(pct)) pct = 0;
      return {
        familia_cod: cod,
        familia: String(r.familia || '').trim(),
        Enero: ene, Febrero: feb, Marzo: mar, Abril: abr, Mayo: may,
        proy: Math.round(proy * 100) / 100,
        hist: Math.round(hist * 100) / 100,
        pct:  Math.round(pct  * 10)  / 10,
        estado: pct >= -5 ? 0 : pct >= -20 ? 1 : 2,
      };
    })
    .sort((a, b) => b.proy - a.proy);

  if (!DATA_FAMILIA.length) { showError('No se encontraron filas válidas.'); return; }
  activarDashboard('familias');
}

// ─────────────────────────────────────────
// ACTIVAR DASHBOARD (depto/familia)
// ─────────────────────────────────────────
function activarDashboard(vista) {
  vistaActual = vista;
  currentEstado = 'all';
  currentFam    = 'all';
  searchTerm    = '';
  document.getElementById('search').value = '';

  const esFam = vista === 'familias';
  document.getElementById('header-titulo').textContent =
    esFam ? 'Familias — Sucursal Tucumán' : 'Departamentos — Sucursal Tucumán';
  document.getElementById('header-subtitle').textContent =
    `Enero–Mayo 2026 · Datos de Mayo: ${getRangoLabel()} (${diasElapsed} días) · Proyección al 31/05`;
  document.getElementById('card-lbl-all').textContent = esFam ? 'Familias' : 'Departamentos';
  document.getElementById('tab-icon').textContent  = esFam ? '🏷️' : '📦';
  document.getElementById('tab-nombre').textContent = esFam ? 'Familias' : 'Departamentos';
  document.getElementById('btn-otra-vista').innerHTML =
    `<span>${esFam ? '📦' : '🏷️'}</span> Ver ${esFam ? 'Departamentos' : 'Familias'}`;
  document.getElementById('tabla-depto-wrap').style.display  = esFam ? 'none' : '';
  document.getElementById('tabla-familia-wrap').style.display = esFam ? '' : 'none';
  document.getElementById('fam-section').style.display        = esFam ? 'none' : '';

  // Botón agrupar solo visible en departamentos
  const btnAgrupar = document.getElementById('btn-agrupar');
  if (btnAgrupar) {
    btnAgrupar.style.display = esFam ? 'none' : '';
    // Resetear estado agrupado al cambiar de vista
    modoAgrupado = false;
    btnAgrupar.textContent = '🗂️ Agrupar por familia';
    btnAgrupar.classList.remove('btn-agrupar-on');
  }

  if (!esFam) buildFamPills();
  setEstado('all');
  switchScreen('dashboard');
}

// ─────────────────────────────────────────
// NAVEGAR A LA OTRA VISTA
// ─────────────────────────────────────────
function irOtraVista() {
  const destino = vistaActual === 'familias' ? 'departamentos' : 'familias';
  if (destino === 'departamentos' && DATA_DEPTO.length > 0) {
    activarDashboard('departamentos');
  } else if (destino === 'familias' && DATA_FAMILIA.length > 0) {
    activarDashboard('familias');
  } else {
    vistaActual = destino;
    elegirVista(destino);
    switchScreen('upload');
  }
}

// ─────────────────────────────────────────
// FAMILIA PILLS
// ─────────────────────────────────────────
function buildFamPills() {
  const pillsEl = document.getElementById('fam-pills');
  pillsEl.innerHTML = '';
  const famMap = {};
  DATA_DEPTO.forEach(r => {
    if (!famMap[r.familia_cod]) famMap[r.familia_cod] = { nom: r.familia_nom, cnt: 0, vol: 0 };
    famMap[r.familia_cod].cnt++;
    famMap[r.familia_cod].vol += r.proy || 0;
  });
  const sorted = Object.entries(famMap).sort((a, b) => b[1].vol - a[1].vol);
  pillsEl.appendChild(createPill('all', 'Todas las familias', DATA_DEPTO.length, true));
  sorted.forEach(([cod, info]) => {
    const pill = createPill(cod, `${cod} · ${info.nom}`, info.cnt, false);
    pill.style.borderColor = FAMILIA_COLORS[cod] || '#ddd';
    pillsEl.appendChild(pill);
  });
}

function createPill(fam, label, cnt, active) {
  const pill = document.createElement('span');
  pill.className   = 'pill' + (active ? ' active' : '');
  pill.dataset.fam = fam;
  pill.innerHTML   = `${label} <span class="pill-cnt">(${cnt})</span>`;
  pill.addEventListener('click', () => setFam(fam));
  return pill;
}

function setFam(fam) {
  currentFam = fam;
  document.querySelectorAll('.pill').forEach(p => {
    const on = p.dataset.fam === fam;
    p.classList.toggle('active', on);
    if (on && fam !== 'all') {
      const c = FAMILIA_COLORS[fam] || '#533AB7';
      p.style.background = c; p.style.color = '#fff'; p.style.borderColor = c;
    } else { p.style.background = ''; p.style.color = ''; }
  });
  render();
}

// ─────────────────────────────────────────
// FILTRO ESTADO
// ─────────────────────────────────────────
function setEstado(s) {
  currentEstado = s;
  document.querySelectorAll('.sbtn').forEach(b => b.classList.toggle('on', b.dataset.s === s));
  const cardMap = { all:0, ok:1, warn:2, bad:3 };
  document.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('active', i === cardMap[s]));
  render();
}

document.getElementById('search').addEventListener('input', e => {
  searchTerm = e.target.value.toLowerCase().trim();
  render();
});

// ─────────────────────────────────────────
// ORDENAMIENTO depto/familia
// ─────────────────────────────────────────
function sortBy(col) {
  if (sortDepto.col === col) sortDepto.dir *= -1;
  else { sortDepto.col = col; sortDepto.dir = col === 'departamento' ? 1 : -1; }
  markSorted('tabla-depto-wrap', COL_ORDER_DEPTO, col);
  render();
}

function sortByFam(col) {
  if (sortFam.col === col) sortFam.dir *= -1;
  else { sortFam.col = col; sortFam.dir = col === 'familia' ? 1 : -1; }
  markSorted('tabla-familia-wrap', COL_ORDER_FAM, col);
  render();
}

function markSorted(wrapId, cols, col) {
  document.querySelectorAll(`#${wrapId} th`).forEach((th, i) => {
    th.classList.toggle('sorted', cols[i] === col);
  });
}

// ─────────────────────────────────────────
// RENDER depto/familia
// ─────────────────────────────────────────
function render() {
  if (vistaActual === 'familias') renderFamilias();
  else                             renderDeptos();
}

function filterRows(data, nameKey) {
  return data.filter(r => {
    if (currentEstado === 'ok'   && r.estado !== 0) return false;
    if (currentEstado === 'warn' && r.estado !== 1) return false;
    if (currentEstado === 'bad'  && r.estado !== 2) return false;
    if (currentFam !== 'all' && r.familia_cod !== currentFam) return false;
    if (searchTerm && !r[nameKey].toLowerCase().includes(searchTerm)) return false;
    return true;
  });
}

function baseRows(data, nameKey) {
  return data.filter(r => {
    if (currentFam !== 'all' && r.familia_cod !== currentFam) return false;
    if (searchTerm && !r[nameKey].toLowerCase().includes(searchTerm)) return false;
    return true;
  });
}

function updateCounters(base) {
  const totProy = base.reduce((s, r) => s + (r.proy || 0), 0);
  document.getElementById('kpi-mayo').textContent  = '$' + fmtNum(totProy);
  document.getElementById('cnt-all').textContent   = base.length;
  document.getElementById('cnt-ok').textContent    = base.filter(r => r.estado === 0).length;
  document.getElementById('cnt-warn').textContent  = base.filter(r => r.estado === 1).length;
  document.getElementById('cnt-bad').textContent   = base.filter(r => r.estado === 2).length;
}

// Toggle modo agrupado
function toggleAgrupado() {
  modoAgrupado = !modoAgrupado;
  const btn = document.getElementById('btn-agrupar');
  if (btn) {
    btn.textContent = modoAgrupado ? '☰ Vista normal' : '🗂️ Agrupar por familia';
    btn.classList.toggle('btn-agrupar-on', modoAgrupado);
  }
  render();
}

// Fila HTML de un departamento individual
function rowDeptHTML(r) {
  const ec  = ['ok','warn','bad'][r.estado];
  const lbl = ['✓ En objetivo','~ Regular','▼ Bajo'][r.estado];
  const bw  = Math.min(100, r.pct === 999 ? 100 : Math.abs(r.pct));
  const pt  = r.pct === 999 ? '★ Nuevo' : (r.pct >= 0 ? '+' : '') + r.pct.toFixed(1) + '%';
  const fc  = FAMILIA_COLORS[r.familia_cod] || '#533AB7';
  // ID único para el panel del gráfico
  const uid = 'chart-' + r.depto_cod.replace(/[^a-z0-9]/gi,'_') + '_' + Math.random().toString(36).slice(2,6);
  // Datos serializados para el onclick
  const dataSer = JSON.stringify([r.Enero, r.Febrero, r.Marzo, r.Abril, r.Mayo, r.proy, r.hist]).replace(/"/g,'&quot;');

  return `<tr class="row-${ec} dept-row" onclick="toggleChart('${uid}','${ec}',${r.Enero},${r.Febrero},${r.Marzo},${r.Abril},${r.Mayo},${r.proy},${r.hist},'${escHtml(r.departamento)}','${pt}')">
    <td class="dept-name">
      <span class="dept-expand-icon" id="icon-${uid}">▶</span>
      ${escHtml(r.departamento)}<br>
      <span class="fam-tag" style="background:${fc}22;color:${fc}">${escHtml(r.familia_cod)} · ${escHtml(r.familia_nom)}</span>
    </td>
    <td class="num">${fmtCell(r.Enero)}</td>
    <td class="num">${fmtCell(r.Febrero)}</td>
    <td class="num">${fmtCell(r.Marzo)}</td>
    <td class="num">${fmtCell(r.Abril)}</td>
    <td class="num">${fmtCell(r.Mayo)}</td>
    <td class="num proy-val">${fmtCell(r.proy)}</td>
    <td class="num hist-val">${fmtCell(r.hist)}</td>
    <td class="num"><div class="pct-cell">
      <span class="pct-txt pct-${ec}">${pt}</span>
      <div class="bar-bg"><div class="bar-fill-${ec}" style="width:${bw}%"></div></div>
    </div></td>
    <td><span class="badge badge-${ec}">${lbl}</span></td>
  </tr>
  <tr class="chart-row" id="${uid}" style="display:none">
    <td colspan="10" class="chart-td"></td>
  </tr>`;
}

// Toggle del gráfico inline
function toggleChart(uid, ec, ene, feb, mar, abr, mayoReal, proy, hist, nombre, variacion) {
  const row  = document.getElementById(uid);
  const icon = document.getElementById('icon-' + uid);
  if (!row) return;

  if (row.style.display !== 'none') {
    // Cerrar
    row.style.display = 'none';
    if (icon) { icon.textContent = '▶'; icon.classList.remove('open'); }
    return;
  }

  // Cerrar cualquier otro abierto
  document.querySelectorAll('.chart-row').forEach(r => r.style.display = 'none');
  document.querySelectorAll('.dept-expand-icon').forEach(i => { i.textContent = '▶'; i.classList.remove('open'); });

  // Abrir este
  row.style.display = '';
  if (icon) { icon.textContent = '▼'; icon.classList.add('open'); }

  const colors = { ok:'#3B6D11', warn:'#BA7517', bad:'#A32D2D' };
  const fills  = { ok:'rgba(59,109,17,0.08)', warn:'rgba(186,117,23,0.08)', bad:'rgba(163,45,45,0.08)' };
  const lineColor = colors[ec] || '#533AB7';
  const fillColor = fills[ec]  || 'rgba(83,58,183,0.08)';

  const meses   = ['Enero','Febrero','Marzo','Abril','Mayo real','Mayo proy.'];
  const valores = [ene, feb, mar, abr, mayoReal, proy];
  const esNuevo = (hist === 0);

  const tdWidth  = row.querySelector('.chart-td').offsetWidth || 900;
  const W = Math.max(tdWidth - 48, 400);
  const H = 160;
  const padL = 56, padR = 24, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...valores, hist) * 1.12 || 1;
  const minVal = Math.min(...valores.filter(v => v > 0), hist > 0 ? hist : Infinity);
  const range  = maxVal - (minVal * 0.85) || 1;

  function xPos(i)  { return padL + (i / (meses.length - 1)) * chartW; }
  function yPos(v)  { return padT + chartH - ((v - minVal * 0.85) / range) * chartH; }

  // Puntos de la línea principal (solo valores > 0)
  const pts = valores.map((v, i) => ({ x: xPos(i), y: v > 0 ? yPos(v) : null, v }));
  const validPts = pts.filter(p => p.y !== null);

  // Path de la línea
  let linePath = '';
  validPts.forEach((p, i) => { linePath += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`; });

  // Path de relleno
  let fillPath = '';
  if (validPts.length > 1) {
    fillPath = `M ${validPts[0].x} ${padT + chartH}`;
    validPts.forEach(p => { fillPath += ` L ${p.x} ${p.y}`; });
    fillPath += ` L ${validPts[validPts.length-1].x} ${padT + chartH} Z`;
  }

  // Línea de promedio histórico
  const histY  = hist > 0 ? yPos(hist) : null;
  const histLine = histY !== null
    ? `<line x1="${padL}" y1="${histY}" x2="${padL + chartW}" y2="${histY}"
          stroke="#aaa" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.7"/>
       <text x="${padL + chartW + 4}" y="${histY + 4}" font-size="9" fill="#aaa" font-family="system-ui">hist.</text>`
    : '';

  // Divisor Mayo real / Mayo proy (línea vertical entre índice 4 y 5)
  const divX = xPos(4.5);
  const divLine = `<line x1="${divX}" y1="${padT}" x2="${divX}" y2="${padT+chartH}"
      stroke="#ddd" stroke-width="1" stroke-dasharray="3,3"/>`;

  // Grids horizontales
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const gy = padT + chartH * (1 - f);
    const gv = Math.round(minVal * 0.85 + range * f);
    return `<line x1="${padL}" y1="${gy}" x2="${padL + chartW}" y2="${gy}" stroke="#eee" stroke-width="1"/>
            <text x="${padL - 5}" y="${gy + 4}" font-size="9" fill="#bbb" text-anchor="end" font-family="system-ui">${fmtNum(gv)}</text>`;
  }).join('');

  // Puntos y etiquetas
  const dotsLabels = pts.map((p, i) => {
    if (p.y === null) return `<text x="${p.x}" y="${padT+chartH-6}" font-size="9" fill="#ccc" text-anchor="middle" font-family="system-ui">—</text>`;
    const isLast = (i === pts.length - 1);
    const labelColor = isLast ? lineColor : '#555';
    const labelWeight = isLast ? '800' : '600';
    const r = isLast ? 5 : 4;
    const dotFill = isLast ? lineColor : '#fff';
    const dotStroke = lineColor;
    return `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${dotFill}" stroke="${dotStroke}" stroke-width="2"/>
            <text x="${p.x}" y="${p.y - 8}" font-size="${isLast ? 11 : 9}" fill="${labelColor}" font-weight="${labelWeight}"
                  text-anchor="middle" font-family="system-ui">${fmtNum(p.v)}</text>`;
  }).join('');

  // Etiquetas eje X
  const xLabels = meses.map((m, i) => {
    const isLast = (i === meses.length - 1);
    return `<text x="${xPos(i)}" y="${padT + chartH + 20}" font-size="${isLast ? 10 : 9}"
                  fill="${isLast ? lineColor : '#888'}" font-weight="${isLast ? '700':'400'}"
                  text-anchor="middle" font-family="system-ui">${m}</text>`;
  }).join('');

  // Badge variación
  const varBg  = { ok:'#EAF3DE', warn:'#FEF3C7', bad:'#FDECEA' }[ec];
  const varTxt = { ok:'#2d5a0a', warn:'#92400e', bad:'#9b1c1c'  }[ec];

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="white"/>
    ${gridLines}
    ${histLine}
    ${divLine}
    ${fillPath ? `<path d="${fillPath}" fill="${fillColor}"/>` : ''}
    ${linePath ? `<path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    ${dotsLabels}
    ${xLabels}
  </svg>`;

  const td = row.querySelector('.chart-td');
  td.innerHTML = `
    <div class="chart-panel chart-panel-${ec}">
      <div class="chart-header">
        <div class="chart-title">${escHtml(nombre)}</div>
        <div class="chart-badges">
          <span class="chart-badge" style="background:${varBg};color:${varTxt}">Variación ${variacion}</span>
          ${!esNuevo ? `<span class="chart-badge" style="background:#f5f5f5;color:#666">Prom. hist. $${fmtNum(hist)}</span>` : ''}
          <span class="chart-badge" style="background:${varBg};color:${varTxt};opacity:.75">Proy. mayo $${fmtNum(proy)}</span>
        </div>
        <button class="chart-close" onclick="event.stopPropagation();toggleChart('${uid}')">✕</button>
      </div>
      <div class="chart-svg-wrap">${svg}</div>
    </div>`;
}

function renderDeptos() {
  let rows = filterRows(DATA_DEPTO, 'departamento');
  const base = baseRows(DATA_DEPTO, 'departamento');
  updateCounters(base);
  document.getElementById('result-count').textContent =
    rows.length !== base.length ? `Mostrando ${rows.length} de ${base.length}` : `${rows.length} departamentos`;

  const tbody   = document.getElementById('tbody-depto');
  const emptyEl = document.getElementById('empty-depto');
  if (!rows.length) { tbody.innerHTML = ''; emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';

  // ── VISTA NORMAL (sort libre) ──────────────────────────────
  if (!modoAgrupado) {
    const col = sortDepto.col, dir = sortDepto.dir;
    rows.sort((a, b) => {
      const va = typeof a[col]==='string' ? a[col] : (a[col]??0);
      const vb = typeof b[col]==='string' ? b[col] : (b[col]??0);
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    tbody.innerHTML = rows.map(rowDeptHTML).join('');
    return;
  }

  // ── VISTA AGRUPADA ─────────────────────────────────────────
  // 1. Agrupar filas por familia
  const grupos = {};
  rows.forEach(r => {
    const k = r.familia_cod;
    if (!grupos[k]) grupos[k] = { cod: k, nom: r.familia_nom, rows: [], totProy: 0, totMayo: 0, totHist: 0 };
    grupos[k].rows.push(r);
    grupos[k].totProy  += r.proy  || 0;
    grupos[k].totMayo  += r.Mayo  || 0;
    grupos[k].totHist  += r.hist  || 0;
  });

  // 2. Ordenar grupos de mayor a menor proyección
  const gruposOrdenados = Object.values(grupos).sort((a, b) => b.totProy - a.totProy);

  // 3. Dentro de cada grupo, ordenar departamentos por proyección desc
  gruposOrdenados.forEach(g => g.rows.sort((a, b) => b.proy - a.proy));

  // 4. Calcular variación del grupo respecto a histórico
  const html = gruposOrdenados.map(g => {
    const fc        = FAMILIA_COLORS[g.cod] || '#533AB7';
    const pctGrupo  = g.totHist > 0 ? ((g.totProy - g.totHist) / g.totHist * 100) : 0;
    const ecGrupo   = pctGrupo >= -5 ? 'ok' : pctGrupo >= -20 ? 'warn' : 'bad';
    const ptGrupo   = (pctGrupo >= 0 ? '+' : '') + pctGrupo.toFixed(1) + '%';
    const cntOk   = g.rows.filter(r => r.estado === 0).length;
    const cntWarn = g.rows.filter(r => r.estado === 1).length;
    const cntBad  = g.rows.filter(r => r.estado === 2).length;

    const estadosPills = [
      cntOk   ? `<span class="grp-pill grp-pill-ok">✓ ${cntOk}</span>`   : '',
      cntWarn ? `<span class="grp-pill grp-pill-warn">~ ${cntWarn}</span>` : '',
      cntBad  ? `<span class="grp-pill grp-pill-bad">▼ ${cntBad}</span>`  : '',
    ].join('');

    // Totales mensuales del grupo
    const totEnero   = g.rows.reduce((s,r) => s + r.Enero,   0);
    const totFebrero = g.rows.reduce((s,r) => s + r.Febrero,  0);
    const totMarzo   = g.rows.reduce((s,r) => s + r.Marzo,    0);
    const totAbril   = g.rows.reduce((s,r) => s + r.Abril,    0);
    const totMayoR   = g.rows.reduce((s,r) => s + r.Mayo,     0);

    const headerRow = `<tr class="grupo-header">
      <td>
        <div class="grupo-fam-info">
          <span class="grupo-dot" style="background:${fc}"></span>
          <span class="grupo-nombre">${escHtml(g.nom)}</span>
          <span class="grupo-cod">Cód. ${escHtml(g.cod)}</span>
          <span class="grupo-depts">${g.rows.length} depto${g.rows.length !== 1 ? 's' : ''}</span>
          <div class="grupo-pills">${estadosPills}</div>
        </div>
      </td>
      <td class="num grupo-mes">${fmtNum(totEnero)}</td>
      <td class="num grupo-mes">${fmtNum(totFebrero)}</td>
      <td class="num grupo-mes">${fmtNum(totMarzo)}</td>
      <td class="num grupo-mes">${fmtNum(totAbril)}</td>
      <td class="num grupo-mes">${fmtNum(totMayoR)}</td>
      <td class="num grupo-proy-cel">$${fmtNum(g.totProy)}</td>
      <td class="num grupo-hist-cel">$${fmtNum(g.totHist)}</td>
      <td class="num"><span class="pct-txt pct-${ecGrupo}" style="font-size:13px;font-weight:800">${ptGrupo}</span></td>
      <td><div class="grupo-pills-estado">${estadosPills}</div></td>
    </tr>`;

    const deptoRows = g.rows.map(rowDeptHTML).join('');

    // Fila separadora al cierre del grupo
    const subtotalRow = `<tr class="grupo-subtotal"><td colspan="10"></td></tr>`;

    return headerRow + deptoRows + subtotalRow;
  }).join('');

  tbody.innerHTML = html;
}

function renderFamilias() {
  let rows = filterRows(DATA_FAMILIA, 'familia');
  const base = baseRows(DATA_FAMILIA, 'familia');
  const col  = sortFam.col, dir = sortFam.dir;
  rows.sort((a, b) => {
    const va = typeof a[col]==='string' ? a[col] : (a[col]??0);
    const vb = typeof b[col]==='string' ? b[col] : (b[col]??0);
    return va < vb ? -dir : va > vb ? dir : 0;
  });
  updateCounters(base);
  document.getElementById('result-count').textContent =
    rows.length !== base.length ? `Mostrando ${rows.length} de ${base.length}` : `${rows.length} familias`;

  const tbody  = document.getElementById('tbody-familia');
  const emptyEl = document.getElementById('empty-familia');
  if (!rows.length) { tbody.innerHTML = ''; emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';

  tbody.innerHTML = rows.map(r => {
    const ec  = ['ok','warn','bad'][r.estado];
    const lbl = ['✓ En objetivo','~ Regular','▼ Bajo'][r.estado];
    const bw  = Math.min(100, r.pct === 999 ? 100 : Math.abs(r.pct));
    const pt  = r.pct === 999 ? '★ Nuevo' : (r.pct >= 0 ? '+' : '') + r.pct.toFixed(1) + '%';
    const fc  = FAMILIA_COLORS[r.familia_cod] || '#533AB7';
    return `<tr class="row-${ec}">
      <td class="dept-name">
        <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${fc};margin-right:6px;vertical-align:middle"></span>
        ${escHtml(r.familia)}
        <br><span class="fam-tag" style="background:${fc}22;color:${fc}">Cód. ${escHtml(r.familia_cod)}</span>
      </td>
      <td class="num">${fmtCell(r.Enero)}</td>
      <td class="num">${fmtCell(r.Febrero)}</td>
      <td class="num">${fmtCell(r.Marzo)}</td>
      <td class="num">${fmtCell(r.Abril)}</td>
      <td class="num">${fmtCell(r.Mayo)}</td>
      <td class="num proy-val">${fmtCell(r.proy)}</td>
      <td class="num hist-val">${fmtCell(r.hist)}</td>
      <td class="num"><div class="pct-cell">
        <span class="pct-txt pct-${ec}">${pt}</span>
        <div class="bar-bg"><div class="bar-fill-${ec}" style="width:${bw}%"></div></div>
      </div></td>
      <td><span class="badge badge-${ec}">${lbl}</span></td>
    </tr>`;
  }).join('');
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function fmtNum(n)  { return Math.round(n).toLocaleString('es-AR'); }
function fmtCell(n) { return (!n || n === 0) ? '<span style="color:#ccc">—</span>' : fmtNum(n); }
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────
// CAMBIO DE PANTALLA
// ─────────────────────────────────────────
function switchScreen(screen) {
  ['inicio','upload','upload-sucursales','upload-dpto-comp','dashboard','sucursales','dpto-comp'].forEach(id => {
    const el = document.getElementById(id + '-screen');
    if (el) el.style.display = (id === screen) ? '' : 'none';
  });
}

function resetDashboard() {
  document.getElementById('file-input').value = '';
  document.getElementById('upload-error').style.display = 'none';
  elegirVista(vistaActual);
  switchScreen('upload');
}

// ─────────────────────────────────────────
// ESTILOS COMPARTIDOS PARA EXPORT / PRINT
// ─────────────────────────────────────────
const CSS_EXPORT_DEPTO = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;padding:24px}
  .ph{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #533AB7;padding-bottom:12px;margin-bottom:16px}
  .ph-left{}
  .pt{font-size:20px;font-weight:800;color:#1a1a2e;letter-spacing:-0.3px}
  .ps{font-size:11px;color:#777;margin-top:4px}
  .pk{text-align:right}
  .pkv{font-size:22px;font-weight:800;color:#533AB7}
  .pkl{font-size:10px;color:#aaa;margin-top:2px}
  .pf{background:#f0effe;border-radius:8px;padding:10px 16px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:16px;font-size:11px;color:#444;border-left:4px solid #533AB7}
  .pf strong{color:#1a1a2e}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:linear-gradient(135deg,#1a1a2e,#2d1f5e);color:#e8e0ff;font-weight:700;padding:10px 12px;text-align:left;border-bottom:2px solid #533AB7;white-space:nowrap;font-size:11px;letter-spacing:0.03em}
  th.num{text-align:right}
  td{padding:8px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;white-space:nowrap}
  tr:last-child td{border-bottom:none}
  tr:nth-child(even) td{background:#fafafa}
  tr.row-ok:hover td{background:#f0f7e8}
  tr.row-warn:hover td{background:#fffbf0}
  tr.row-bad:hover td{background:#fff5f5}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;display:inline-block}
  .badge-ok{background:#EAF3DE;color:#2d5a0a}
  .badge-warn{background:#FEF3C7;color:#92400e}
  .badge-bad{background:#FDECEA;color:#9b1c1c}
  .proy-val{font-weight:700;color:#533AB7}
  .hist-val{color:#999}
  .pct-ok{color:#2d5a0a;font-weight:700}
  .pct-warn{color:#92400e;font-weight:700}
  .pct-bad{color:#9b1c1c;font-weight:700}
  .pct-cell{display:flex;align-items:center;gap:6px;justify-content:flex-end}
  .pct-txt{min-width:52px;text-align:right;font-weight:700}
  .bar-bg{width:50px;height:6px;background:#eee;border-radius:4px;overflow:hidden;flex-shrink:0}
  .bar-fill-ok{background:linear-gradient(90deg,#639922,#97C459);height:100%;border-radius:4px}
  .bar-fill-warn{background:linear-gradient(90deg,#BA7517,#EF9F27);height:100%;border-radius:4px}
  .bar-fill-bad{background:linear-gradient(90deg,#A32D2D,#E24B4A);height:100%;border-radius:4px}
  .fam-tag{font-size:9px;font-weight:600;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:3px}
  .dept-name{white-space:normal;max-width:220px;font-weight:600;color:#222}
  .pft{margin-top:20px;padding-top:12px;border-top:1px solid #eee;font-size:10px;color:#aaa;text-align:center;line-height:1.6}
  .btn-dl{display:none}
  /* ── VISTA AGRUPADA ── */
  tr.grupo-header td,td.grupo-mes,td.grupo-proy-cel,td.grupo-hist-cel{
    background:linear-gradient(135deg,#1a1a2e 0%,#2d1f5e 100%)!important;
    border-top:4px solid #533AB7!important;
    border-bottom:none!important;
    padding:10px 12px;
    vertical-align:middle;
  }
  tr.grupo-header:first-child td{border-top:none!important}
  td.grupo-mes{color:#c4b5fd;font-size:12px;font-weight:600;text-align:right}
  td.grupo-proy-cel{color:#a78bfa;font-size:14px;font-weight:800;text-align:right}
  td.grupo-hist-cel{color:#666;font-size:12px;font-weight:600;text-align:right}
  .grupo-fam-info{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .grupo-dot{width:11px;height:11px;border-radius:3px;display:inline-block;flex-shrink:0;vertical-align:middle}
  .grupo-nombre{font-size:13px;font-weight:800;color:#fff;letter-spacing:0.02em}
  .grupo-cod{font-size:10px;color:#a78bfa;background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);border-radius:4px;padding:2px 7px;font-weight:600}
  .grupo-depts{font-size:10px;color:#888;font-style:italic}
  .grupo-pills,.grupo-pills-estado{display:inline-flex;gap:5px;align-items:center}
  .grp-pill{font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap}
  .grp-pill-ok{background:rgba(59,109,17,0.35);color:#a8d971;border:1px solid rgba(99,153,34,0.4)}
  .grp-pill-warn{background:rgba(186,117,23,0.35);color:#f5c87a;border:1px solid rgba(186,117,23,0.4)}
  .grp-pill-bad{background:rgba(163,45,45,0.35);color:#f7a0a0;border:1px solid rgba(163,45,45,0.4)}
  tr.grupo-subtotal td{padding:0!important;height:5px!important;background:#e8e4f8!important;border:none!important}
  tr.row-ok td,tr.row-warn td,tr.row-bad td{background:#fff}
  tr.row-ok:nth-child(even) td,tr.row-warn:nth-child(even) td,tr.row-bad:nth-child(even) td{background:#fafafa}
  @media print{@page{margin:1.2cm;size:landscape}.btn-dl{display:none!important}}
`;

const CSS_EXPORT_SUC = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;padding:24px}
  .ph{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #16a34a;padding-bottom:12px;margin-bottom:16px}
  .pt{font-size:20px;font-weight:800;color:#1a1a2e;letter-spacing:-0.3px}
  .ps{font-size:11px;color:#777;margin-top:4px}
  .pf{background:#f0fdf4;border-radius:8px;padding:10px 16px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:16px;font-size:11px;color:#444;border-left:4px solid #16a34a}
  .pf strong{color:#1a1a2e}
  .kpi-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
  .kpi-card{background:#f8f8f8;border-radius:8px;padding:10px 16px;text-align:center;min-width:110px;border:1px solid #eee}
  .kpi-val{font-size:16px;font-weight:800}
  .kpi-lbl{font-size:10px;color:#888;margin-top:2px}
  .kpi-pct{font-size:11px;font-weight:700;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:linear-gradient(135deg,#1a1a2e,#2d1f5e);color:#e8e0ff;font-weight:700;padding:10px 12px;text-align:left;border-bottom:2px solid #533AB7;white-space:nowrap;font-size:11px}
  td{padding:7px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
  tr:nth-child(even) td{background:#fafafa}
  tfoot td{background:#f8f5ff;font-weight:700;border-top:2px solid #533AB7;padding:10px 12px}
  .suc-cell{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center}
  .suc-val{font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}
  .suc-pct{font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px;min-width:44px;text-align:center}
  .suc-total-val{font-weight:800;font-size:13px;font-variant-numeric:tabular-nums}
  .suc-distrib-bar{display:flex;height:16px;border-radius:5px;overflow:hidden;min-width:160px;gap:1px}
  .suc-bar-seg{height:100%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:rgba(255,255,255,0.95);min-width:0;overflow:hidden;white-space:nowrap}
  .suc-fam-name{font-weight:700;font-size:12px;color:#1a1a2e}
  .suc-fam-cod{font-size:9px;color:#aaa;margin-top:2px}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .pft{margin-top:20px;padding-top:12px;border-top:1px solid #eee;font-size:10px;color:#aaa;text-align:center;line-height:1.6}
  @media print{@page{margin:1.2cm;size:landscape}}
`;

// ─────────────────────────────────────────
// GENERADORES DE HTML (depto/familia y sucursales)
// ─────────────────────────────────────────
function generarHTMLTabla(paraDescarga) {
  const esFam    = vistaActual === 'familias';
  const tbodyId  = esFam ? 'tbody-familia' : 'tbody-depto';
  const filas    = document.getElementById(tbodyId)?.innerHTML || '';
  const cantidad = document.getElementById('result-count').textContent;
  const kpi      = document.getElementById('kpi-mayo').textContent;
  const dias     = diasElapsed;
  const rango    = getRangoLabel();
  const estadoLabels = { all:'Todos', ok:'✓ En objetivo (≥ −5%)', warn:'~ Regular (−5% a −20%)', bad:'▼ Bajo (< −20%)' };
  const famLabel = currentFam === 'all' ? 'Todas' : `${currentFam} · ${FAMILIA_NOMBRES[currentFam] || currentFam}`;
  const fecha    = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
  const hora     = new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
  const titulo   = esFam ? 'Familias — Sucursal Tucumán' : 'Departamentos — Sucursal Tucumán';
  const col1     = esFam ? 'Familia' : 'Departamento';
  const modoLabel = (!esFam && modoAgrupado) ? ' · Vista agrupada por familia' : '';
  const accion   = paraDescarga ? '' : `<script>window.onload=()=>window.print();<\/script>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${titulo} — ${fecha}</title>
  <style>${CSS_EXPORT_DEPTO}</style>
</head>
<body>
  <div class="ph">
    <div class="ph-left">
      <div class="pt">📊 ${titulo}</div>
      <div class="ps">Mayo 2026 · Datos: ${rango} (${dias} días) · Proyección al 31/05${modoLabel} · Generado: ${fecha} ${hora}</div>
    </div>
    <div class="pk">
      <div class="pkv">${kpi}</div>
      <div class="pkl">Proyección total mayo</div>
    </div>
  </div>
  <div class="pf">
    <span><strong>Vista:</strong> ${esFam ? 'Familias' : 'Departamentos'}</span>
    <span><strong>Período:</strong> ${rango}</span>
    <span><strong>Estado:</strong> ${estadoLabels[currentEstado]}</span>
    ${!esFam ? `<span><strong>Familia:</strong> ${famLabel}</span>` : ''}
    ${searchTerm ? `<span><strong>Búsqueda:</strong> "${searchTerm}"</span>` : ''}
    <span><strong>Registros:</strong> ${cantidad}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>${col1}</th>
        <th class="num">Enero</th><th class="num">Febrero</th><th class="num">Marzo</th><th class="num">Abril</th>
        <th class="num">Mayo real</th><th class="num">Mayo proy.</th><th class="num">Prom. hist.</th>
        <th class="num">Variación</th><th>Estado</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="pft">
    <strong>Proyección</strong> = ventas reales (${rango}) × (31 ÷ ${dias}) &nbsp;|&nbsp;
    <span style="color:#2d5a0a;font-weight:700">✓ En objetivo ≥ −5%</span> &nbsp;|&nbsp;
    <span style="color:#92400e;font-weight:700">~ Regular −5% a −20%</span> &nbsp;|&nbsp;
    <span style="color:#9b1c1c;font-weight:700">▼ Bajo &lt; −20%</span> del promedio histórico (Enero–Abril)
  </div>
  ${accion}
</body>
</html>`;
}

function generarHTMLSucursales(paraDescarga) {
  const tbodyHTML = document.getElementById('tbody-sucursales')?.innerHTML || '';
  const tfootHTML = document.getElementById('tfoot-sucursales')?.innerHTML || '';
  const cantidad  = document.getElementById('suc-result-count').textContent;
  const fecha     = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
  const hora      = new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
  const fileName  = document.getElementById('suc-file-label').textContent;

  // KPIs
  const totales  = {};
  let   grandTotal = 0;
  SUCURSALES.forEach(suc => {
    totales[suc]  = DATA_SUCURSALES.reduce((s, r) => s + (r[suc] || 0), 0);
    grandTotal   += totales[suc];
  });

  const kpiCards = SUCURSALES.map((suc, i) => {
    const p   = SUC_PALETTE[i % SUC_PALETTE.length];
    const pct = grandTotal > 0 ? (totales[suc] / grandTotal * 100).toFixed(1) : '0.0';
    return `<div class="kpi-card">
      <div class="kpi-val" style="color:${p.color}">${fmtNum(totales[suc])}</div>
      <div class="kpi-lbl">${escHtml(suc)}</div>
      <div class="kpi-pct" style="color:${p.color}">${pct}% del total</div>
    </div>`;
  }).join('');

  // Thead
  const theadCols = SUCURSALES.map((suc, i) => {
    const p = SUC_PALETTE[i % SUC_PALETTE.length];
    return `<th style="background:${p.color}">${escHtml(suc)}</th>`;
  }).join('');

  const accion = paraDescarga ? '' : `<script>window.onload=()=>window.print();<\/script>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Comparativa Sucursales — ${fecha}</title>
  <style>${CSS_EXPORT_SUC}</style>
</head>
<body>
  <div class="ph">
    <div>
      <div class="pt">🏪 Comparativa de Sucursales por Familia</div>
      <div class="ps">Participación de ventas por sucursal · ${cantidad} · ${fileName ? 'Archivo: ' + fileName + ' · ' : ''}Generado: ${fecha} ${hora}</div>
    </div>
  </div>
  <div class="kpi-row">${kpiCards}</div>
  <div class="pf">
    <span>Color intenso en cada celda = sucursal con mayor participación en esa familia</span>
    <span><strong>Registros:</strong> ${cantidad}</span>
    ${sucSearchTerm ? `<span><strong>Búsqueda:</strong> "${sucSearchTerm}"</span>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th style="min-width:160px">Familia</th>
        ${theadCols}
        <th class="num" style="background:linear-gradient(135deg,#1a1a2e,#2d1f5e)">Total</th>
        <th style="min-width:180px;background:linear-gradient(135deg,#1a1a2e,#2d1f5e)">Distribución</th>
      </tr>
    </thead>
    <tbody>${tbodyHTML}</tbody>
    <tfoot>${tfootHTML}</tfoot>
  </table>
  <div class="pft">
    <strong>Participación</strong> = ventas de la sucursal ÷ total de la fila × 100 &nbsp;|&nbsp;
    La sucursal con mayor participación en cada fila se resalta con su color intenso
  </div>
  ${accion}
</body>
</html>`;
}

// ─────────────────────────────────────────
// IMPRIMIR
// ─────────────────────────────────────────
function imprimirTabla() {
  const html    = generarHTMLTabla(false);
  const ventana = window.open('', '_blank');
  ventana.document.write(html);
  ventana.document.close();
}

function imprimirSucursales() {
  const html    = generarHTMLSucursales(false);
  const ventana = window.open('', '_blank');
  ventana.document.write(html);
  ventana.document.close();
}

// ─────────────────────────────────────────
// DESCARGAR HTML
// ─────────────────────────────────────────
function descargarHTML(tipo) {
  let html, nombre;
  const fecha = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g,'-');
  if (tipo === 'sucursales') {
    html   = generarHTMLSucursales(true);
    nombre = `comparativa-familias-${fecha}.html`;
  } else if (tipo === 'dpto-comp') {
    html   = generarHTMLDptoComp(true);
    nombre = `comparativa-departamentos-${fecha}.html`;
  } else {
    html   = generarHTMLTabla(true);
    const esFam = vistaActual === 'familias';
    nombre = `${esFam ? 'familias' : 'departamentos'}-${fecha}.html`;
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════
// COMPARATIVA DEPARTAMENTOS — toda la lógica
// ═══════════════════════════════════════════════════════════════

// Estado
let DATA_DPTO_COMP    = [];
let DC_SUCURSALES     = [];
let DC_ELIMINADAS     = new Set();
let DC_FAM_ACTIVA     = 'all';
let dcSearchTerm      = '';
let sortDC            = { col: 'total', dir: -1 };
let dcAgrupado        = false;
let DC_SELECCIONADOS  = new Map();  // depto_cod → row object

// ── Navegación ──
function mostrarDptoComp() { switchScreen('upload-dpto-comp'); }

function irADptoComp() {
  if (DATA_DPTO_COMP.length) switchScreen('dpto-comp');
  else switchScreen('upload-dpto-comp');
}

function irADptoCompDesdeNav() {
  if (DATA_DEPTO.length || DATA_FAMILIA.length) switchScreen('dashboard');
  else switchScreen('inicio');
}

// ── Carga de archivo ──
const dcFileInput = document.getElementById('dc-file-input');
const dcDropZone  = document.getElementById('dc-drop-zone');
const dcErrEl     = document.getElementById('dc-upload-error');

dcDropZone.addEventListener('dragover', e => { e.preventDefault(); dcDropZone.classList.add('drag-over'); });
dcDropZone.addEventListener('dragleave', () => dcDropZone.classList.remove('drag-over'));
dcDropZone.addEventListener('drop', e => {
  e.preventDefault(); dcDropZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) processDcFile(e.dataTransfer.files[0]);
});
dcFileInput.addEventListener('change', e => { if (e.target.files[0]) processDcFile(e.target.files[0]); });

function processDcFile(file) {
  dcErrEl.style.display = 'none';
  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let rows = ext === 'csv' ? parseCSV(e.target.result)
        : (() => { const wb = XLSX.read(e.target.result,{type:'array'}); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:0}); })();
      buildDataDptoComp(rows, file.name);
    } catch(err) { dcErrEl.textContent = '⚠️ ' + err.message; dcErrEl.style.display = ''; }
  };
  ext === 'csv' ? reader.readAsText(file,'UTF-8') : reader.readAsArrayBuffer(file);
}

// ── Build data ──
function buildDataDptoComp(rows, fileName) {
  const COLS_FIJAS = ['depto_cod','departamento','Total_Global','total_global','total','Total'];
  const allKeys    = Object.keys(rows[0] || {});
  const detected   = allKeys.filter(k => !COLS_FIJAS.includes(k));

  if (!detected.length) {
    dcErrEl.textContent = '⚠️ No se encontraron columnas de sucursales.';
    dcErrEl.style.display = ''; return;
  }

  DC_SUCURSALES  = detected;
  DC_ELIMINADAS  = new Set();
  DC_FAM_ACTIVA  = 'all';
  dcSearchTerm   = '';
  dcAgrupado     = false;
  DC_SELECCIONADOS = new Map();

  DATA_DPTO_COMP = rows
    .filter(r => {
      const nombre = String(r.departamento || '').trim();
      const total  = DC_SUCURSALES.reduce((s, c) => s + (Number(r[c]) || 0), 0);
      return nombre !== '' && total > 0;
    })
    .map(r => {
      const cod    = String(r.depto_cod || '').trim();
      const famCod = (cod.split('-')[0] || '99').padStart(2,'0');
      const total  = DC_SUCURSALES.reduce((s, c) => s + (Number(r[c]) || 0), 0);
      const vals   = {};
      const pcts   = {};
      let winner = null, winVal = -1;
      DC_SUCURSALES.forEach(suc => {
        const v = Number(r[suc]) || 0;
        vals[suc] = v;
        pcts[suc] = total > 0 ? v / total * 100 : 0;
        if (v > winVal) { winVal = v; winner = suc; }
      });
      return {
        depto_cod: cod, departamento: String(r.departamento || '').trim(),
        familia_cod: famCod,
        familia_nom: FAMILIA_NOMBRES[famCod] || `FAM ${famCod}`,
        total, vals, pcts, winner,
      };
    });

  if (!DATA_DPTO_COMP.length) {
    dcErrEl.textContent = '⚠️ No se encontraron filas válidas.';
    dcErrEl.style.display = ''; return;
  }

  document.getElementById('dc-file-label').textContent = fileName;
  const panel = document.getElementById('dc-panel-sel');
  if (panel) panel.classList.add('visible');
  buildDcTableHeader();
  buildDcFamPills();
  buildDcHeaderKpis();
  renderDptoComp();
  switchScreen('dpto-comp');
}

// ── Header KPIs ──
function buildDcHeaderKpis() {
  const totales = {};
  let grand = 0;
  DC_SUCURSALES.forEach(suc => {
    totales[suc] = DATA_DPTO_COMP.reduce((s,r) => s + (r.vals[suc]||0), 0);
    grand += totales[suc];
  });
  document.getElementById('dc-header-kpis').innerHTML = DC_SUCURSALES.map((suc, i) => {
    const p   = SUC_PALETTE[i % SUC_PALETTE.length];
    const pct = grand > 0 ? (totales[suc] / grand * 100).toFixed(1) : '0.0';
    return `<div class="suc-kpi-card">
      <div class="kpi-val" style="color:${p.color}">${fmtNum(totales[suc])}</div>
      <div class="kpi-lbl">${escHtml(suc)}</div>
      <div class="kpi-pct" style="color:${p.color}">${pct}% del total</div>
    </div>`;
  }).join('');
}

// ── Thead dinámico ──
function buildDcTableHeader() {
  const thead = document.querySelector('#tabla-dc thead tr');
  const sucHeaders = DC_SUCURSALES.map((suc, i) => {
    const p = SUC_PALETTE[i % SUC_PALETTE.length];
    return `<th style="background:linear-gradient(135deg,${p.color}cc,${p.color});cursor:pointer;text-align:center"
              onclick="setDcSort('${escHtml(suc)}')">${escHtml(suc)} <span class="sa">↕</span></th>`;
  }).join('');
  thead.innerHTML = `
    <th onclick="setDcSort('departamento')" style="min-width:200px">Departamento <span class="sa">↕</span></th>
    ${sucHeaders}
    <th class="num" onclick="setDcSort('total')" style="background:linear-gradient(135deg,#1a1a2e,#2d1f5e);cursor:pointer">Total <span class="sa">↕</span></th>
    <th style="min-width:200px;background:linear-gradient(135deg,#1a1a2e,#2d1f5e)">Distribución</th>
    <th style="width:48px;background:linear-gradient(135deg,#1a1a2e,#2d1f5e);text-align:center" title="Agregar a lista de trabajo">★</th>`;

  // Sort buttons dinámicos
  document.getElementById('dc-sort-btns-dynamic').innerHTML =
    DC_SUCURSALES.map((suc, i) => {
      const p = SUC_PALETTE[i % SUC_PALETTE.length];
      return `<button class="sbtn" onclick="setDcSort('${escHtml(suc)}')"
                style="border-color:${p.color};color:${p.color}">${escHtml(suc)}</button>`;
    }).join('');

  // Leyenda
  document.getElementById('dc-legend-items').innerHTML =
    DC_SUCURSALES.map((suc, i) => {
      const p = SUC_PALETTE[i % SUC_PALETTE.length];
      return `<span class="suc-legend-dot" style="background:${p.color}"></span>
              <span class="suc-legend-label">${escHtml(suc)}</span>
              <span class="suc-legend-sep">·</span>`;
    }).join('');
}

// ── Family pills ──
function buildDcFamPills() {
  const famBar = document.getElementById('dc-fam-pills');
  const famMap = {};
  DATA_DPTO_COMP.forEach(r => {
    if (!famMap[r.familia_cod]) famMap[r.familia_cod] = { nom: r.familia_nom, cnt: 0, vol: 0 };
    famMap[r.familia_cod].cnt++;
    famMap[r.familia_cod].vol += r.total;
  });
  const sorted = Object.entries(famMap).sort((a,b) => b[1].vol - a[1].vol);
  const mkPill = (cod, label, cnt, active) => {
    const fc = FAMILIA_COLORS[cod] || '#533AB7';
    const p  = document.createElement('span');
    p.className   = 'pill' + (active ? ' active' : '');
    p.dataset.fam = cod;
    p.innerHTML   = `${label} <span class="pill-cnt">(${cnt})</span>`;
    p.style.borderColor = fc;
    p.addEventListener('click', () => {
      DC_FAM_ACTIVA = cod;
      document.querySelectorAll('#dc-fam-pills .pill').forEach(x => {
        const on = x.dataset.fam === cod;
        x.classList.toggle('active', on);
        const c = FAMILIA_COLORS[x.dataset.fam] || '#533AB7';
        x.style.background   = on && cod !== 'all' ? c : '';
        x.style.color        = on && cod !== 'all' ? '#fff' : '';
        x.style.borderColor  = c;
      });
      renderDptoComp();
    });
    return p;
  };
  famBar.innerHTML = '';
  famBar.appendChild(mkPill('all','Todas las familias', DATA_DPTO_COMP.length, true));
  sorted.forEach(([cod, info]) => famBar.appendChild(mkPill(cod, `${cod} · ${info.nom}`, info.cnt, false)));
}

function toggleDcAgrupado() {
  dcAgrupado = !dcAgrupado;
  const btn = document.getElementById('btn-dc-agrupar');
  if (btn) {
    btn.textContent = dcAgrupado ? '☰ Vista normal' : '🗂️ Agrupar por familia';
    btn.classList.toggle('btn-agrupar-on', dcAgrupado);
  }
  renderDptoComp();
}

// Fila individual de departamento en comparativa
// stableIdx = posición fija en DATA_DPTO_COMP, número puro, sin caracteres especiales
function dcRowHTML(r) {
  const stableIdx = DATA_DPTO_COMP.indexOf(r);
  const famCod    = r.familia_cod.padStart(2,'0');
  const fc        = FAMILIA_COLORS[famCod] || '#888';
  const selected  = DC_SELECCIONADOS.has(stableIdx);
  const sucCells  = DC_SUCURSALES.map((suc, i) => {
    const p        = SUC_PALETTE[i % SUC_PALETTE.length];
    const val      = r.vals[suc] || 0;
    const pct      = r.pcts[suc] || 0;
    const isWinner = r.winner === suc;
    const bg       = isWinner ? p.bgWin  : 'transparent';
    const txtColor = isWinner ? p.txtWin : '#555';
    const bdColor  = isWinner ? p.bdWin  : p.bdNorm;
    const pctBg    = isWinner ? p.bgWin  : p.bgNorm;
    const pctTxt   = isWinner ? p.txtWin : p.txtNorm;
    const valStr   = val > 0 ? fmtNum(val) : '<span style="color:#ddd">\u2014</span>';
    const pctStr   = pct > 0.05 ? pct.toFixed(1) + '%' : '\u2014';
    return `<td style="background:${bg}">
      <div class="suc-cell">
        <span class="suc-val" style="color:${txtColor}">${valStr}</span>
        <span class="suc-pct" style="background:${pctBg};color:${pctTxt};border:1px solid ${bdColor}">${pctStr}</span>
      </div>
    </td>`;
  }).join('');
  const barSegs = DC_SUCURSALES.map((suc, i) => {
    const pct = r.pcts[suc] || 0;
    if (pct < 0.5) return '';
    const p = SUC_PALETTE[i % SUC_PALETTE.length];
    return `<div class="suc-bar-seg" style="flex:${pct};background:${p.color}" title="${escHtml(suc)}: ${pct.toFixed(1)}%">${pct >= 8 ? pct.toFixed(0)+'%' : ''}</div>`;
  }).join('');

  return `<tr class="suc-row${selected ? ' dc-row-selected' : ''}">
    <td>
      <div class="suc-fam-name">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${fc};margin-right:5px;vertical-align:middle;flex-shrink:0"></span>
        <span style="font-weight:700;color:#1a1a2e">${escHtml(r.departamento)}</span>
        <button class="suc-btn-del" data-sidx="${stableIdx}" onclick="eliminarDeptoDcBtn(this)" title="Ocultar del informe">\u2715</button>
      </div>
      <div class="suc-fam-cod">${escHtml(r.depto_cod)} \u00b7 ${escHtml(r.familia_nom)}</div>
    </td>
    ${sucCells}
    <td class="num"><span class="suc-total-val">${fmtNum(r.total)}</span></td>
    <td><div class="suc-distrib-bar">${barSegs}</div></td>
    <td class="dc-sel-td">
      <button class="dc-btn-sel${selected ? ' dc-btn-sel-on' : ''}"
              data-sidx="${stableIdx}"
              onclick="toggleSeleccionBtn(this)"
              title="${selected ? 'Quitar de la lista' : 'Agregar a lista de trabajo'}">
        ${selected ? '\u2605' : '\u2606'}
      </button>
    </td>
  </tr>`;
}

let DC_ROWS_VISIBLE = [];

function toggleSeleccionBtn(btn) {
  const sidx = parseInt(btn.dataset.sidx, 10);
  if (isNaN(sidx)) return;
  const row = DATA_DPTO_COMP[sidx];
  if (!row) return;

  if (DC_SELECCIONADOS.has(sidx)) {
    DC_SELECCIONADOS.delete(sidx);
  } else {
    DC_SELECCIONADOS.set(sidx, row);
  }

  const selected = DC_SELECCIONADOS.has(sidx);
  btn.textContent = selected ? '\u2605' : '\u2606';
  btn.title = selected ? 'Quitar de la lista' : 'Agregar a lista de trabajo';
  btn.classList.toggle('dc-btn-sel-on', selected);
  const tr = btn.closest('tr');
  if (tr) tr.classList.toggle('dc-row-selected', selected);

  // Si viene del panel, sincronizar el botón en la tabla
  if (!tr || !tr.closest('#tbody-dc')) {
    const tableBtn = document.querySelector('#tbody-dc [data-sidx="' + sidx + '"].dc-btn-sel');
    if (tableBtn) {
      tableBtn.textContent = selected ? '\u2605' : '\u2606';
      tableBtn.title = selected ? 'Quitar de la lista' : 'Agregar a lista de trabajo';
      tableBtn.classList.toggle('dc-btn-sel-on', selected);
      const tableTr = tableBtn.closest('tr');
      if (tableTr) tableTr.classList.toggle('dc-row-selected', selected);
    }
  }

  actualizarPanelSeleccion();
}

function eliminarDeptoDcBtn(btn) {
  const sidx = parseInt(btn.dataset.sidx, 10);
  if (isNaN(sidx)) return;
  const row = DATA_DPTO_COMP[sidx];
  if (!row) return;
  DC_SELECCIONADOS.delete(sidx);
  DC_ELIMINADAS.add(row.depto_cod);
  actualizarBtnRestaurarDc();
  actualizarPanelSeleccion();
  renderDptoComp();
}


function actualizarPanelSeleccion() {
  const panel    = document.getElementById('dc-panel-sel');
  const badge    = document.getElementById('dc-sel-badge');
  const lista    = document.getElementById('dc-sel-lista');
  const cnt      = DC_SELECCIONADOS.size;
  if (!panel) return;

  badge.textContent = cnt;
  badge.style.display = cnt > 0 ? '' : 'none';

  if (cnt === 0) {
    lista.innerHTML = '<div class="dc-sel-empty">Hacé clic en ☆ en cualquier fila para agregar departamentos a tu lista de trabajo.</div>';
    document.getElementById('dc-sel-btns').style.display = 'none';
    return;
  }

  document.getElementById('dc-sel-btns').style.display = '';

  lista.innerHTML = [...DC_SELECCIONADOS.entries()].map(([sidx, r]) => {
    const fc = FAMILIA_COLORS[r.familia_cod] || '#888';
    return `<div class="dc-sel-item">
      <div class="dc-sel-item-info">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${fc};margin-right:5px;vertical-align:middle;flex-shrink:0"></span>
        <span class="dc-sel-item-nombre">${escHtml(r.departamento)}</span>
        <span class="dc-sel-item-fam">${escHtml(r.familia_nom)}</span>
      </div>
      <div class="dc-sel-item-vals">
        ${DC_SUCURSALES.map((suc, i) => {
          const p   = SUC_PALETTE[i % SUC_PALETTE.length];
          const val = r.vals[suc] || 0;
          const isW = r.winner === suc;
          return `<span class="dc-sel-chip" style="background:${isW?p.bgWin:p.bgNorm};color:${isW?p.txtWin:p.txtNorm};border:1px solid ${isW?p.bdWin:p.bdNorm}">
            ${escHtml(suc)}: ${val>0?fmtNum(val):'—'}
          </span>`;
        }).join('')}
      </div>
      <button class="dc-sel-item-del" data-sidx="${sidx}" onclick="toggleSeleccionBtn(this)">✕</button>
    </div>`;
  }).join('');
}

let dcPanelOpen = true;
function togglePanelSel() {
  dcPanelOpen = !dcPanelOpen;
  const body = document.getElementById('dc-panel-body');
  const icon = document.getElementById('dc-panel-toggle-icon');
  if (body) body.style.display = dcPanelOpen ? '' : 'none';
  if (icon) icon.textContent = dcPanelOpen ? '▲' : '▼';
}

function limpiarSeleccion() {
  DC_SELECCIONADOS.clear();
  actualizarPanelSeleccion();
  renderDptoComp();
}

function descargarListaTrabajo() {
  if (!DC_SELECCIONADOS.size) return;
  const fecha  = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
  const hora   = new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const rows   = [...DC_SELECCIONADOS.values()];

  const theadCols = DC_SUCURSALES.map((suc, i) => {
    const p = SUC_PALETTE[i % SUC_PALETTE.length];
    return `<th style="background:${p.color};text-align:center;padding:10px 14px;color:#fff;font-size:13px">${escHtml(suc)}</th>`;
  }).join('');

  const tbodyRows = rows.map(r => {
    const fc = FAMILIA_COLORS[r.familia_cod] || '#888';
    const sucCells = DC_SUCURSALES.map((suc, i) => {
      const p   = SUC_PALETTE[i % SUC_PALETTE.length];
      const val = r.vals[suc] || 0;
      const pct = r.pcts[suc] || 0;
      const isW = r.winner === suc;
      const bg  = isW ? p.bgWin : 'transparent';
      return `<td style="background:${bg};text-align:center;padding:8px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle">
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
          <span style="font-size:13px;font-weight:700;color:${isW?p.txtWin:'#333'}">${val>0?fmtNum(val):'—'}</span>
          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;
            background:${isW?p.bgWin:p.bgNorm};color:${isW?p.txtWin:p.txtNorm};border:1px solid ${isW?p.bdWin:p.bdNorm}">
            ${pct>0.05?pct.toFixed(1)+'%':'—'}
          </span>
        </div>
      </td>`;
    }).join('');

    const barSegs = DC_SUCURSALES.map((suc, i) => {
      const pct = r.pcts[suc] || 0;
      if (pct < 0.5) return '';
      const p = SUC_PALETTE[i % SUC_PALETTE.length];
      return `<div style="flex:${pct};background:${p.color};height:100%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:rgba(255,255,255,0.9)">${pct>=10?pct.toFixed(0)+'%':''}</div>`;
    }).join('');

    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;vertical-align:middle">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:10px;height:10px;border-radius:2px;background:${fc};display:inline-block;flex-shrink:0"></span>
          <div>
            <div style="font-weight:800;font-size:13px;color:#1a1a2e">${escHtml(r.departamento)}</div>
            <div style="font-size:10px;color:#aaa;margin-top:2px">${escHtml(r.depto_cod)} · ${escHtml(r.familia_nom)}</div>
          </div>
        </div>
      </td>
      ${sucCells}
      <td style="text-align:right;padding:8px 14px;font-weight:800;font-size:13px;border-bottom:1px solid #f0f0f0;white-space:nowrap">${fmtNum(r.total)}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #f0f0f0;min-width:160px">
        <div style="display:flex;height:16px;border-radius:4px;overflow:hidden;gap:1px">${barSegs}</div>
      </td>
    </tr>`;
  }).join('');

  // Totales de la selección
  const totSel = {};
  DC_SUCURSALES.forEach(suc => { totSel[suc] = rows.reduce((s,r) => s+(r.vals[suc]||0), 0); });
  const grandSel = DC_SUCURSALES.reduce((s,suc) => s+totSel[suc], 0);
  const totCells = DC_SUCURSALES.map((suc, i) => {
    const p   = SUC_PALETTE[i % SUC_PALETTE.length];
    const pct = grandSel > 0 ? totSel[suc]/grandSel*100 : 0;
    return `<td style="background:#f8f5ff;text-align:center;padding:10px 12px;font-weight:800">
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
        <span style="color:${p.color};font-size:14px">${fmtNum(totSel[suc])}</span>
        <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:${p.bgWin};color:${p.txtWin}">${pct.toFixed(1)}%</span>
      </div>
    </td>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Lista de Trabajo — ${fecha}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;padding:28px;color:#1a1a1a}
  .ph{border-bottom:3px solid #ef4444;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}
  .pt{font-size:22px;font-weight:800;color:#1a1a2e}
  .ps{font-size:12px;color:#888;margin-top:4px}
  .tag{background:#fef2f2;color:#ef4444;border:1px solid #fca5a5;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:700}
  table{width:100%;border-collapse:collapse;font-size:12px;border-radius:10px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08)}
  th{background:linear-gradient(135deg,#1a1a2e,#2d1f5e);color:#e8e0ff;font-weight:700;padding:11px 14px;text-align:left;font-size:11px;letter-spacing:0.03em}
  tfoot td{background:#f8f5ff;border-top:2px solid #533AB7;padding:10px 14px;font-weight:800}
  tr:nth-child(even) td{background:#fafafa}
  .pft{margin-top:18px;font-size:10px;color:#bbb;text-align:center;padding-top:12px;border-top:1px solid #eee}
  @media print{@page{margin:1.2cm;size:landscape}}
</style>
</head><body>
<div class="ph">
  <div>
    <div class="pt">📋 Lista de Trabajo — Departamentos a Atender</div>
    <div class="ps">Comparativa de sucursales · Selección manual · Generado: ${fecha} ${hora}</div>
  </div>
  <div class="tag">${rows.length} departamento${rows.length!==1?'s':''} seleccionado${rows.length!==1?'s':''}</div>
</div>
<table>
  <thead><tr>
    <th style="min-width:200px">Departamento</th>
    ${theadCols}
    <th style="text-align:right;min-width:90px">Total</th>
    <th style="min-width:160px">Distribución</th>
  </tr></thead>
  <tbody>${tbodyRows}</tbody>
  <tfoot><tr>
    <td style="font-size:13px;font-weight:800;color:#1a1a2e">TOTAL SELECCIÓN</td>
    ${totCells}
    <td style="text-align:right;font-size:15px;font-weight:800">${fmtNum(grandSel)}</td>
    <td></td>
  </tr></tfoot>
</table>
<div class="pft">Porcentaje = participación de la sucursal sobre el total de la fila · Color intenso = mayor venta</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`;

  const nombre = `lista-trabajo-${fecha.replace(/\//g,'-')}.html`;
  const blob   = new Blob([html], { type:'text/html;charset=utf-8' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── Sort ──
function setDcSort(col) {
  if (sortDC.col === col) sortDC.dir *= -1;
  else { sortDC.col = col; sortDC.dir = col === 'departamento' ? 1 : -1; }
  renderDptoComp();
}

// ── Search ──
document.getElementById('dc-search').addEventListener('input', e => {
  dcSearchTerm = e.target.value.toLowerCase().trim();
  renderDptoComp();
});

// ── Eliminar/restaurar ──
function eliminarDeptoDcBtn(btn) {
  const cod = btn.dataset.delCod;
  if (!cod) return;
  DC_SELECCIONADOS.delete(cod);
  DC_ELIMINADAS.add(cod);
  actualizarBtnRestaurarDc();
  actualizarPanelSeleccion();
  renderDptoComp();
}

function restaurarDeptos() {
  DC_ELIMINADAS.clear();
  actualizarBtnRestaurarDc();
  renderDptoComp();
}

function actualizarBtnRestaurarDc() {
  const btn = document.getElementById('btn-restaurar-dc');
  if (!btn) return;
  btn.style.display = DC_ELIMINADAS.size > 0 ? '' : 'none';
  btn.textContent   = `↩ Restaurar (${DC_ELIMINADAS.size})`;
}

// ── Render ──
function renderDptoComp() {
  let rows = DATA_DPTO_COMP.filter(r => {
    if (DC_ELIMINADAS.has(r.depto_cod)) return false;
    if (DC_FAM_ACTIVA !== 'all' && r.familia_cod !== DC_FAM_ACTIVA) return false;
    if (dcSearchTerm && !r.departamento.toLowerCase().includes(dcSearchTerm)) return false;
    return true;
  });

  document.getElementById('dc-result-count').textContent =
    rows.length !== DATA_DPTO_COMP.length
      ? `Mostrando ${rows.length} de ${DATA_DPTO_COMP.length}`
      : `${rows.length} departamentos`;

  const tbody   = document.getElementById('tbody-dc');
  const emptyEl = document.getElementById('empty-dc');
  if (!rows.length) { tbody.innerHTML = ''; emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';

  if (!dcAgrupado) {
    // ── VISTA NORMAL ──────────────────────────
    const col = sortDC.col, dir = sortDC.dir;
    rows.sort((a, b) => {
      const va = col === 'departamento' ? a.departamento : col === 'total' ? a.total : (a.vals[col] || 0);
      const vb = col === 'departamento' ? b.departamento : col === 'total' ? b.total : (b.vals[col] || 0);
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    DC_ROWS_VISIBLE = rows;
    tbody.innerHTML = rows.map(r => dcRowHTML(r)).join('');
  } else {
    // ── VISTA AGRUPADA ────────────────────────
    // Agrupar por familia
    const grupos = {};
    rows.forEach(r => {
      const k = r.familia_cod;
      if (!grupos[k]) grupos[k] = { cod: k, nom: r.familia_nom, rows: [], total: 0 };
      grupos[k].rows.push(r);
      grupos[k].total += r.total;
    });

    // Ordenar grupos por total desc
    const gruposOrd = Object.values(grupos).sort((a, b) => b.total - a.total);

    // Dentro de cada grupo ordenar por total desc
    gruposOrd.forEach(g => g.rows.sort((a, b) => b.total - a.total));

    // Construir DC_ROWS_VISIBLE en orden de render (para que el índice coincida)
    DC_ROWS_VISIBLE = gruposOrd.flatMap(g => g.rows);

    tbody.innerHTML = gruposOrd.map(g => {
      const fc = FAMILIA_COLORS[g.cod] || '#533AB7';

      // Totales por sucursal del grupo
      const totSuc = {};
      DC_SUCURSALES.forEach(suc => {
        totSuc[suc] = g.rows.reduce((s, r) => s + (r.vals[suc] || 0), 0);
      });
      let winnerGrupo = null, winValGrupo = -1;
      DC_SUCURSALES.forEach(suc => { if (totSuc[suc] > winValGrupo) { winValGrupo = totSuc[suc]; winnerGrupo = suc; } });

      // Cabecera del grupo — una celda por sucursal con total
      const headerSucCells = DC_SUCURSALES.map((suc, i) => {
        const p        = SUC_PALETTE[i % SUC_PALETTE.length];
        const val      = totSuc[suc] || 0;
        const pct      = g.total > 0 ? val / g.total * 100 : 0;
        const isWinner = suc === winnerGrupo;
        return `<td class="grupo-mes" style="text-align:center;vertical-align:middle">
          <div class="suc-cell" style="gap:2px">
            <span style="font-size:13px;font-weight:800;color:${isWinner ? p.color : '#c4b5fd'}">${fmtNum(val)}</span>
            <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;
              background:${isWinner ? p.bgWin : 'rgba(196,181,253,0.15)'};
              color:${isWinner ? p.txtWin : '#a78bfa'};
              border:1px solid ${isWinner ? p.bdWin : 'rgba(167,139,250,0.3)'}">${pct.toFixed(1)}%</span>
          </div>
        </td>`;
      }).join('');

      // Barra del grupo
      const barSegsGrupo = DC_SUCURSALES.map((suc, i) => {
        const pct = g.total > 0 ? totSuc[suc] / g.total * 100 : 0;
        if (pct < 0.5) return '';
        const p = SUC_PALETTE[i % SUC_PALETTE.length];
        return `<div class="suc-bar-seg" style="flex:${pct};background:${p.color}">${pct >= 8 ? pct.toFixed(0) + '%' : ''}</div>`;
      }).join('');

      const headerRow = `<tr class="grupo-header">
        <td style="padding:10px 12px;vertical-align:middle">
          <div class="grupo-fam-info">
            <span class="grupo-dot" style="background:${fc}"></span>
            <span class="grupo-nombre">${escHtml(g.nom)}</span>
            <span class="grupo-cod">Cód. ${escHtml(g.cod)}</span>
            <span class="grupo-depts">${g.rows.length} depto${g.rows.length !== 1 ? 's' : ''}</span>
          </div>
        </td>
        ${headerSucCells}
        <td class="grupo-proy-cel">$${fmtNum(g.total)}</td>
        <td style="background:linear-gradient(135deg,#1a1a2e,#2d1f5e);border-top:4px solid #533AB7;padding:10px 12px;vertical-align:middle">
          <div class="suc-distrib-bar">${barSegsGrupo}</div>
        </td>
      </tr>`;

      const deptoRows = g.rows.map(r => dcRowHTML(r)).join('');
      const sepRow    = `<tr class="grupo-subtotal"><td colspan="${DC_SUCURSALES.length + 3}"></td></tr>`;

      return headerRow + deptoRows + sepRow;
    }).join('');
  }

  buildDcTotals(rows);
}

function buildDcTotals(rows) {
  const tfoot  = document.getElementById('tfoot-dc');
  const tots   = {};
  let grand    = 0;
  DC_SUCURSALES.forEach(suc => {
    tots[suc] = rows.reduce((s,r) => s + (r.vals[suc]||0), 0);
    grand    += tots[suc];
  });
  const sucCells = DC_SUCURSALES.map((suc, i) => {
    const p   = SUC_PALETTE[i % SUC_PALETTE.length];
    const pct = grand > 0 ? (tots[suc]/grand*100) : 0;
    return `<td><div class="suc-cell">
      <span class="suc-val" style="font-size:14px;font-weight:800">${fmtNum(tots[suc])}</span>
      <span class="suc-pct" style="background:${p.bgWin};color:${p.txtWin};border:1px solid ${p.bdWin}">${pct.toFixed(1)}%</span>
    </div></td>`;
  }).join('');
  const barSegs = DC_SUCURSALES.map((suc, i) => {
    const pct = grand > 0 ? tots[suc]/grand*100 : 0;
    if (pct < 0.5) return '';
    const p = SUC_PALETTE[i % SUC_PALETTE.length];
    return `<div class="suc-bar-seg" style="flex:${pct};background:${p.color}">${pct >= 6 ? pct.toFixed(0)+'%' : ''}</div>`;
  }).join('');
  tfoot.innerHTML = `<tr>
    <td style="font-size:13px;font-weight:800;color:#1a1a2e">TOTAL GENERAL</td>
    ${sucCells}
    <td class="num"><span class="suc-total-val" style="font-size:15px">${fmtNum(grand)}</span></td>
    <td><div class="suc-distrib-bar">${barSegs}</div></td>
  </tr>`;
}

// ── Imprimir ──
function imprimirDptoComp() {
  const html    = generarHTMLDptoComp(false);
  const ventana = window.open('', '_blank');
  ventana.document.write(html); ventana.document.close();
}

function generarHTMLDptoComp(paraDescarga) {
  const tbodyHTML = document.getElementById('tbody-dc')?.innerHTML || '';
  const tfootHTML = document.getElementById('tfoot-dc')?.innerHTML || '';
  const cantidad  = document.getElementById('dc-result-count').textContent;
  const fileName  = document.getElementById('dc-file-label').textContent;
  const fecha     = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
  const hora      = new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});

  const tots = {}; let grand = 0;
  DC_SUCURSALES.forEach(suc => { tots[suc] = DATA_DPTO_COMP.reduce((s,r)=>s+(r.vals[suc]||0),0); grand+=tots[suc]; });

  const kpiCards = DC_SUCURSALES.map((suc,i) => {
    const p = SUC_PALETTE[i%SUC_PALETTE.length];
    const pct = grand>0?(tots[suc]/grand*100).toFixed(1):'0.0';
    return `<div class="kpi-card"><div class="kpi-val" style="color:${p.color}">${fmtNum(tots[suc])}</div><div class="kpi-lbl">${escHtml(suc)}</div><div class="kpi-pct" style="color:${p.color}">${pct}% del total</div></div>`;
  }).join('');

  const theadCols = DC_SUCURSALES.map((suc,i) => {
    const p = SUC_PALETTE[i%SUC_PALETTE.length];
    return `<th style="background:${p.color};text-align:center">${escHtml(suc)}</th>`;
  }).join('');

  const accion = paraDescarga ? '' : `<script>window.onload=()=>window.print();<\/script>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Comparativa Departamentos — ${fecha}</title>
  <style>${CSS_EXPORT_SUC}</style></head><body>
  <div class="ph">
    <div><div class="pt">🔀 Comparativa de Departamentos por Sucursal</div>
    <div class="ps">Ventas por sucursal · ${cantidad} · ${fileName ? 'Archivo: '+fileName+' · ':'' }Generado: ${fecha} ${hora}</div></div>
  </div>
  <div class="kpi-row">${kpiCards}</div>
  <div class="pf"><span>Color intenso = sucursal con mayor venta en ese departamento</span>${dcSearchTerm?`<span><strong>Búsqueda:</strong> "${dcSearchTerm}"</span>`:''}</div>
  <table>
    <thead><tr><th style="min-width:180px">Departamento</th>${theadCols}<th class="num">Total</th><th>Distribución</th></tr></thead>
    <tbody>${tbodyHTML}</tbody>
    <tfoot>${tfootHTML}</tfoot>
  </table>
  <div class="pft">Participación = ventas de la sucursal ÷ total de la fila × 100 | Color intenso = mayor venta en la fila</div>
  ${accion}</body></html>`;
}


// ═══════════════════════════════════════════════════════════════
// PERSISTENCIA — localStorage
// Guarda y restaura los 4 datasets al recargar la página
// ═══════════════════════════════════════════════════════════════

const LS_KEYS = {
  depto:    'dv_depto',
  familia:  'dv_familia',
  suc:      'dv_suc',
  sucNames: 'dv_suc_names',
  dcComp:   'dv_dc_comp',
  dcNames:  'dv_dc_names',
  dias:     'dv_dias',
  rango:    'dv_rango',
};

function guardarEnStorage() {
  try {
    if (DATA_DEPTO.length)
      localStorage.setItem(LS_KEYS.depto, JSON.stringify(DATA_DEPTO));
    if (DATA_FAMILIA.length)
      localStorage.setItem(LS_KEYS.familia, JSON.stringify(DATA_FAMILIA));
    if (DATA_SUCURSALES.length) {
      localStorage.setItem(LS_KEYS.suc,      JSON.stringify(DATA_SUCURSALES));
      localStorage.setItem(LS_KEYS.sucNames, JSON.stringify(SUCURSALES));
    }
    if (DATA_DPTO_COMP.length) {
      localStorage.setItem(LS_KEYS.dcComp,  JSON.stringify(DATA_DPTO_COMP));
      localStorage.setItem(LS_KEYS.dcNames, JSON.stringify(DC_SUCURSALES));
    }
    localStorage.setItem(LS_KEYS.dias, diasElapsed);
    localStorage.setItem(LS_KEYS.rango, JSON.stringify({
      desde: document.getElementById('fecha-desde')?.value || '',
      hasta: document.getElementById('fecha-hasta')?.value || '',
    }));
  } catch(e) { console.warn('localStorage error:', e); }
}

function restaurarDesdeStorage() {
  try {
    const rawDepto   = localStorage.getItem(LS_KEYS.depto);
    const rawFamilia = localStorage.getItem(LS_KEYS.familia);
    const rawSuc     = localStorage.getItem(LS_KEYS.suc);
    const rawSucN    = localStorage.getItem(LS_KEYS.sucNames);
    const rawDc      = localStorage.getItem(LS_KEYS.dcComp);
    const rawDcN     = localStorage.getItem(LS_KEYS.dcNames);
    const rawDias    = localStorage.getItem(LS_KEYS.dias);
    const rawRango   = localStorage.getItem(LS_KEYS.rango);

    if (rawRango) {
      const rango = JSON.parse(rawRango);
      if (rango.desde) document.getElementById('fecha-desde').value = rango.desde;
      if (rango.hasta) document.getElementById('fecha-hasta').value = rango.hasta;
      actualizarPreview();
    }
    if (rawDias) diasElapsed = Number(rawDias);

    let hayDatos = false;

    if (rawDepto)   { DATA_DEPTO   = JSON.parse(rawDepto);   hayDatos = true; }
    if (rawFamilia) { DATA_FAMILIA = JSON.parse(rawFamilia); hayDatos = true; }

    if (rawSuc && rawSucN) {
      DATA_SUCURSALES = JSON.parse(rawSuc);
      SUCURSALES      = JSON.parse(rawSucN);
      injectSucStyles();
      buildSucTableHeader();
      buildSucHeaderKpis();
      hayDatos = true;
    }
    if (rawDc && rawDcN) {
      DATA_DPTO_COMP = JSON.parse(rawDc);
      DC_SUCURSALES  = JSON.parse(rawDcN);
      buildDcTableHeader();
      buildDcFamPills();
      buildDcHeaderKpis();
      const panel = document.getElementById('dc-panel-sel');
      if (panel) panel.classList.add('visible');
      hayDatos = true;
    }

    if (!hayDatos) return;

    const ultimaVista = localStorage.getItem('dv_ultima_vista');

    if (ultimaVista === 'departamentos' && DATA_DEPTO.length) {
      activarDashboard('departamentos');
    } else if (ultimaVista === 'familias' && DATA_FAMILIA.length) {
      activarDashboard('familias');
    } else if (ultimaVista === 'sucursales' && DATA_SUCURSALES.length) {
      renderSucursales(); switchScreen('sucursales');
    } else if (ultimaVista === 'dpto-comp' && DATA_DPTO_COMP.length) {
      renderDptoComp(); switchScreen('dpto-comp');
    } else if (DATA_DEPTO.length)        { activarDashboard('departamentos'); }
    else if (DATA_FAMILIA.length)        { activarDashboard('familias'); }
    else if (DATA_SUCURSALES.length)     { renderSucursales(); switchScreen('sucursales'); }
    else if (DATA_DPTO_COMP.length)      { renderDptoComp(); switchScreen('dpto-comp'); }

    mostrarBtnLimpiarStorage();
  } catch(e) {
    console.warn('Error restaurando:', e);
    limpiarStorage();
  }
}

function limpiarStorage() {
  Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('dv_ultima_vista');
  DATA_DEPTO = []; DATA_FAMILIA = []; DATA_SUCURSALES = []; DATA_DPTO_COMP = [];
  SUCURSALES = []; DC_SUCURSALES = [];
  ocultarBtnLimpiarStorage();
  switchScreen('inicio');
}

function mostrarBtnLimpiarStorage() {
  const btn = document.getElementById('btn-limpiar-storage');
  if (btn) btn.style.display = '';
}
function ocultarBtnLimpiarStorage() {
  const btn = document.getElementById('btn-limpiar-storage');
  if (btn) btn.style.display = 'none';
}

// Sobreescribir switchScreen para auto-guardar al cambiar de vista
const _origSwitchScreen = switchScreen;
switchScreen = function(screen) {
  _origSwitchScreen(screen);
  if (['dashboard','sucursales','dpto-comp'].includes(screen)) {
    const map = { dashboard: vistaActual || 'departamentos', sucursales:'sucursales', 'dpto-comp':'dpto-comp' };
    localStorage.setItem('dv_ultima_vista', map[screen] || screen);
    guardarEnStorage();
    mostrarBtnLimpiarStorage();
  }
};

window.addEventListener('DOMContentLoaded', restaurarDesdeStorage);

function confirmarLimpiarStorage() {
  if (confirm('¿Querés borrar todos los datos guardados y volver al inicio?\n\nTendrás que volver a cargar los archivos CSV.')) {
    limpiarStorage();
  }
}