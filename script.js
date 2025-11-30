const CHANNEL = 3137281;
const API_KEY = "KPT8T5UKGJBI80J6";

let tempGaugeChart, humGaugeChart, historyChart;
let prevSystemStatus = null;

/* ------------------------------------------------------------
   GAUGE NEEDLE PLUGIN
------------------------------------------------------------ */
const GaugeNeedlePlugin = {
    id: 'gauge-needle',
    afterDatasetsDraw(chart) {
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length === 0) return;

        const arc = meta.data[0];
        const x = arc.x;
        const y = arc.y;
        const r = arc.outerRadius;

        const min = dataset.minValue ?? 0;
        const max = dataset.maxValue ?? 100;
        const raw = dataset.needleValue ?? min;
        const value = Math.min(Math.max(raw, min), max);

        const angle = Math.PI + (value - min) / (max - min) * Math.PI;

        const ctx = chart.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * 0.9, 0);
        ctx.strokeStyle = getFgColor();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = getFgColor();
        ctx.fill();

        // Unit label
        if (dataset.unit) {
            ctx.fillStyle = getFgColor();
            ctx.font = '12px Segoe UI, Roboto, Helvetica';
            ctx.textAlign = 'center';
            ctx.fillText(dataset.unit, x, y + 16);
        }

        // Ticks
        const ticks = dataset.ticks || [];
        ctx.fillStyle = getFgColor();
        ctx.font = '12px Segoe UI, Roboto, Helvetica';
        ctx.textAlign = 'center';

        ticks.forEach(t => {
            const a = Math.PI + (t - min) / (max - min) * Math.PI;
            const tx = Math.round(x + Math.cos(a) * (r * 0.8));
            const ty = Math.round(y + Math.sin(a) * (r * 0.8) + 4);
            ctx.fillText(String(t), tx, ty);
        });
    }
};

Chart.register(GaugeNeedlePlugin);
Chart.defaults.animation = { duration: 600, easing: 'easeInOutCubic' };

/* ------------------------------------------------------------
   COLOR HELPERS
------------------------------------------------------------ */
function getFgColor() {
    const style = getComputedStyle(document.body);
    return style.getPropertyValue('--fg').trim() || '#111';
}

function getMutedColor() {
    return document.body.classList.contains('dark')
        ? 'rgba(229,231,235,0.7)'
        : 'rgba(15,23,42,0.7)';
}

function getGridColor() {
    return document.body.classList.contains('dark')
        ? 'rgba(148,163,184,0.2)'
        : 'rgba(0,0,0,0.06)';
}

function applyThemeToCharts() {
    if (!historyChart) return;

    const muted = getMutedColor();
    const grid = getGridColor();
    const isDark = document.body.classList.contains('dark');
    const axisColor = isDark ? '#ffffff' : '#0f172a';

    historyChart.options.plugins.legend.labels.color = getFgColor();

    historyChart.options.scales.yTemp.ticks.color = muted;
    historyChart.options.scales.yHum.ticks.color = muted;
    historyChart.options.scales.x.ticks.color = axisColor;
    historyChart.options.scales.x.ticks.font = { size: 12, weight: '500' };

    historyChart.options.scales.yTemp.grid.color = grid;
    historyChart.options.scales.x.grid.color = grid;

    historyChart.update();
    tempGaugeChart.update();
    humGaugeChart.update();
}

/* ------------------------------------------------------------
   CREATE GAUGE
------------------------------------------------------------ */
function createGauge(ctx, colorZones, min, max, colors, ticks, unit) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: colorZones,
                backgroundColor: colors,
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
                cutout: '70%',
                minValue: min,
                maxValue: max,
                needleValue: min,
                ticks,
                unit
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

/* ------------------------------------------------------------
   INIT HISTORY CHART
------------------------------------------------------------ */
function initHistoryChart() {
    const ctx = document.getElementById('historyChart');

    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.2)',
                    tension: 0.3,
                    yAxisID: 'yTemp',
                    spanGaps: true,
                    pointRadius: 2,
                    pointHoverRadius: 3
                },
                {
                    label: 'Humidity',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.2)',
                    tension: 0.3,
                    yAxisID: 'yHum',
                    spanGaps: true,
                    pointRadius: 2,
                    pointHoverRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', align: 'start' } },
            layout: { padding: { left: 12, right: 12, top: 8, bottom: 8 } },
            scales: {
                yTemp: {
                    position: 'left',
                    beginAtZero: true,
                    suggestedMax: 50,
                    title: { display: true, text: '°C' }
                },
                yHum: {
                    position: 'right',
                    beginAtZero: true,
                    suggestedMax: 100,
                    title: { display: true, text: '%' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

/* ------------------------------------------------------------
   THEME SWITCH
------------------------------------------------------------ */
function setTheme(isDark) {
    document.body.classList.toggle('dark', !!isDark);
    applyThemeToCharts();
}

function toggleDarkMode() {
    const ds = document.getElementById('darkSwitch');
    const isDark = ds ? ds.checked : document.body.classList.contains('dark');
    setTheme(isDark);
}

/* ------------------------------------------------------------
   PAGE LOAD
------------------------------------------------------------ */
window.onload = () => {

    tempGaugeChart = createGauge(
        document.getElementById('tempGauge'),
        [30, 10, 10],
        0,
        50,
        ['#22C55E', '#F59E0B', '#EF4444'],
        [10, 20, 30, 40, 50],
        '°C'
    );

    humGaugeChart = createGauge(
        document.getElementById('humGauge'),
        [30, 30, 25, 15],
        0,
        100,
        ['#F59E0B', '#22C55E', '#3B82F6', '#EF4444'],
        [20, 40, 60, 80, 100],
        '%'
    );

    initHistoryChart();

    const ds = document.getElementById('darkSwitch');
    if (ds) {
        const stored = localStorage.getItem('theme');
        ds.checked = stored === 'dark';
        setTheme(ds.checked);

        ds.addEventListener('change', () => {
            setTheme(ds.checked);
            localStorage.setItem('theme', ds.checked ? 'dark' : 'light');
        });
    }

    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportLastReadingsPDF);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const saved = JSON.parse(localStorage.getItem('user') || '{}');
            const msg = document.getElementById('loginMsg');
            if (saved.email && email.toLowerCase() === saved.email.toLowerCase() && password === saved.password) {
                localStorage.setItem('session', JSON.stringify({ email: saved.email }));
                msg.textContent = 'Login successful';
                window.location.href = 'dashboard.html';
            } else {
                msg.textContent = 'Invalid credentials';
            }
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            localStorage.setItem('user', JSON.stringify({ email, password }));
            const msg = document.getElementById('signupMsg');
            msg.textContent = 'Account created. You can log in now.';
            window.location.href = 'login.html';
        });
    }

    updateData();

    const alertsForm = document.getElementById('alertsForm');
    if (alertsForm) {
        const stored = JSON.parse(localStorage.getItem('alertsSettings') || '{}');
        const toggle = document.getElementById('emailAlertsToggle');
        const emailInput = document.getElementById('alertsEmail');
        const msg = document.getElementById('alertsMsg');
        if (toggle) toggle.checked = !!stored.optIn;
        if (emailInput) emailInput.value = stored.email || '';
        alertsForm.addEventListener('submit', e => {
            e.preventDefault();
            const optIn = toggle ? !!toggle.checked : false;
            const email = emailInput ? emailInput.value.trim() : '';
            localStorage.setItem('alertsSettings', JSON.stringify({ optIn, email }));
            if (msg) msg.textContent = 'Saved';
        });

        const testBtn = document.getElementById('sendTestAlertBtn');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                const settings = JSON.parse(localStorage.getItem('alertsSettings') || '{}');
                const email = (settings && settings.email) ? String(settings.email).trim() : '';
                const optIn = !!(settings && settings.optIn);
                if (!optIn || !email) { if (msg) msg.textContent = 'Enable and save email first'; return; }
                try {
                    const resp = await fetch('api/send-alert.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to: email, status: 'Test', temperature: '--', humidity: '--', timestamp: new Date().toISOString() })
                    });
                    if (!resp.ok) throw new Error('send failed');
                    if (msg) msg.textContent = 'Test email sent';
                } catch (err) {
                    if (msg) msg.textContent = 'Test send failed';
                }
            });
        }
    }
};

/* ------------------------------------------------------------
   FETCH & UPDATE DATA
------------------------------------------------------------ */
async function updateData() {
    let connText;
    const connDot = document.getElementById('connectionDot');

    try {
        const connEl = document.getElementById("connectionText");
        connText = connEl;
        connText.textContent = "Connecting...";

        if (connDot) {
            connDot.classList.remove('red');
            connDot.classList.add('green');
        }

        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 18000);

        const url = `https://api.thingspeak.com/channels/${CHANNEL}/feeds.json?api_key=${API_KEY}&results=60`;
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });

        clearTimeout(t);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json.feeds || json.feeds.length === 0)
            throw new Error("No data");

        const feeds = json.feeds;
        const last = feeds[feeds.length - 1];

        connText.textContent = "Connected";

        // -----------------------------
        // FIXED FIELD DETECTION
        // -----------------------------
        const fieldNames = Array.from({ length: 8 }, (_, i) => `field${i + 1}`);

        const ranked = fieldNames.map(name => ({
            name,
            count: feeds.reduce(
                (acc, f) => acc + (!isNaN(parseFloat(f[name])) ? 1 : 0),
                0
            )
        }))
            .sort((a, b) => b.count - a.count);

        const tempField = ranked[0].count > 0 ? ranked[0].name : "field1";
        const humField = ranked[1].count > 0 ? ranked[1].name : "field2";

        // Extract latest values
        const temp = parseNum(last[tempField]);
        const hum = parseNum(last[humField]);

        // Update gauges
        document.getElementById("tempValue").innerText = !isNaN(temp) ? fmt(temp, 1, '°C') : "-- °C";
        document.getElementById("humValue").innerText = !isNaN(hum) ? fmt(hum, 1, '%') : "-- %";

        document.getElementById("tempStatus").innerText =
            isNaN(temp) ? "--" : (temp > 35 ? "Danger" : temp > 30 ? "Warning" : "Normal");

        document.getElementById("humStatus").innerText =
            isNaN(hum) ? "--" : (hum >= 85 ? "Very High" : hum >= 60 ? "Comfortable" : hum >= 30 ? "Comfortable" : "Low");

        const systemStatus = isNaN(temp) ? "--" : (temp > 35 ? "Danger" : temp > 30 ? "Warning" : "Normal");
        const sysText = document.getElementById('systemStatusText');
        const sysDot = document.getElementById('systemStatusDot');
        const sysIcon = document.querySelector('.status-left .status-icon');
        if (sysText) sysText.textContent = systemStatus === "Normal" ? "All Systems Normal" : `System ${systemStatus}`;
        if (sysDot) {
            sysDot.classList.toggle('green', systemStatus === "Normal");
            sysDot.classList.toggle('red', systemStatus !== "Normal");
        }
        if (sysIcon) sysIcon.style.color = systemStatus === "Normal" ? '#22c55e' : '#ef4444';

        if (systemStatus !== prevSystemStatus && (systemStatus === "Danger" || systemStatus === "Warning")) {
            const settings = JSON.parse(localStorage.getItem('alertsSettings') || '{}');
            const email = (settings && settings.email) ? String(settings.email).trim() : '';
            const optIn = !!(settings && settings.optIn);
            if (optIn && email) {
                try {
                    const resp = await fetch('api/send-alert.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            status: systemStatus,
                            temperature: isNaN(temp) ? '--' : temp.toFixed(1),
                            humidity: isNaN(hum) ? '--' : hum.toFixed(1),
                            timestamp: new Date().toISOString()
                        })
                    });
                    if (!resp.ok) throw new Error('send failed');
                } catch (err) {
                    const msg = document.getElementById('alertsMsg');
                    if (msg) msg.textContent = 'Email send failed';
                }
            }
            prevSystemStatus = systemStatus;
        }

        tempGaugeChart.data.datasets[0].needleValue = isNaN(temp) ? 0 : temp;
        humGaugeChart.data.datasets[0].needleValue = isNaN(hum) ? 0 : hum;

        tempGaugeChart.update();
        humGaugeChart.update();

        // HISTORY CHART DATA
        const labels = feeds.map(f => {
            const d = new Date(f.created_at);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });

        const temps = feeds.map(f => {
            const v = parseNum(f[tempField]);
            return isNaN(v) ? null : v;
        });

        const hums = feeds.map(f => {
            const v = parseNum(f[humField]);
            return isNaN(v) ? null : v;
        });

        historyChart.data.labels = labels;
        historyChart.data.datasets[0].data = temps;
        historyChart.data.datasets[1].data = hums;
        historyChart.update();

        // Table
        const tbody = document.getElementById('historyTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            const recent = json.feeds.slice(-20);
            recent.forEach(f => {
                const tr = document.createElement('tr');
                const time = new Date(f.created_at).toLocaleString();
                const t = parseFloat(f[tempField]);
                const h = parseFloat(f[humField]);
                tr.innerHTML = `<td>${time}</td><td>${!isNaN(t) ? t.toFixed(1) : '--'}</td><td>${!isNaN(h) ? h.toFixed(1) : '--'}</td>`;
                tbody.appendChild(tr);
            });
        }

        // Updated timestamp
        const updatedAt = new Date(last.created_at);
        document.getElementById("lastUpdatedText").innerText =
            "Last Updated: " + formatTimestamp(updatedAt);

    } catch (e) {
        if (connText) connText.textContent = "Connection Error";
        if (connDot) {
            connDot.classList.remove('green');
            connDot.classList.add('red');
        }
        console.log("[fetch error]", e);
    }
}

/* ------------------------------------------------------------
   HELPERS
------------------------------------------------------------ */
function calcDewPoint(t, rh) {
    if (isNaN(t) || isNaN(rh)) return NaN;
    const a = 17.27, b = 237.7;
    const gamma = (a * t) / (b + t) + Math.log(rh / 100);
    return (b * gamma) / (a - gamma);
}

function calcHeatIndex(tC, rh) {
    if (isNaN(tC) || isNaN(rh)) return NaN;
    const tF = tC * 9/5 + 32;
    const HI = -42.379 + 2.04901523*tF + 10.14333127*rh - 0.22475541*tF*rh
        - 0.00683783*tF*tF - 0.05481717*rh*rh + 0.00122874*tF*tF*rh
        + 0.00085282*tF*rh*rh - 0.00000199*tF*tF*rh*rh;
    return (HI - 32) * 5/9;
}

function fmt(n, decimals, unit) {
    if (isNaN(n)) return `-- ${unit}`;
    return `${Number(n).toFixed(decimals).replace('.', ',')}${unit}`;
}

function formatTimestamp(d) {
    if (!(d instanceof Date) || isNaN(d)) return '--';
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${day} ${month} ${year}, ${hh}.${mm}`;
}

function parseNum(v) {
    if (v == null) return NaN;
    if (typeof v === 'number') return v;
    const s = v.replace(/,/g, '.').trim();
    const n = Number(s);
    return isFinite(n) ? n : NaN;
}

setInterval(updateData, 20000);

function exportLastReadingsPDF() {
    const tableScroll = document.querySelector('.table-card .table-scroll');
    if (!tableScroll) return;

    const doc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Last Readings</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 24px; }
  h3 { margin: 0 0 12px 0; font-size: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; }
  thead { background: #f0f4fa; }
</style>
</head>
<body>
<h3>Last Readings</h3>
${tableScroll.innerHTML}
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(doc);
    w.document.close();
    w.focus();
    w.onload = () => w.print();
}
