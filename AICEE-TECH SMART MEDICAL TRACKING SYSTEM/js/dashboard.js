/* ═══════════════════════════════════════════════════
   DASHBOARD.JS — Dashboard, Clock, Stats, Chart
═══════════════════════════════════════════════════ */

'use strict';

const Dashboard = (() => {

  let clockInterval = null;
  let visitsChart   = null;

  /* ─── Real-Time Clock ─── */
  function updateClock() {
    const now  = new Date();
    const h    = String(now.getHours()).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    const s    = String(now.getSeconds()).padStart(2, '0');
    const timeEl = document.getElementById('clock-time');
    if (timeEl) timeEl.textContent = `${h}:${m}:${s}`;

    const dateEl = document.getElementById('clock-date');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  function startClock() {
    updateClock();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
  }

  /* ─── Statistics ─── */
  function updateStats() {
    const totalPatientsEl = document.getElementById('stat-total-patients');
    const admittedEl      = document.getElementById('stat-admitted');
    const dischargedEl   = document.getElementById('stat-discharged');
    const totalRecordsEl  = document.getElementById('stat-total-records');
    
    if (totalPatientsEl) totalPatientsEl.textContent = db.getTotalPatients();
    if (admittedEl)      admittedEl.textContent      = db.getCurrentlyAdmitted();
    if (dischargedEl)    dischargedEl.textContent     = db.getDischargedPatients();
    
    // Only show "Currently Admitted" for nurses/admins, hide for staff
    const admittedCard = document.getElementById('stat-admitted')?.closest('.stat-card');
    if (admittedCard) {
      admittedCard.style.display = (isAdmin() || isNurse()) ? '' : 'none';
    }
    
    // Only show "Discharged" for nurses/admins, hide for staff
    const dischargedCard = document.getElementById('stat-discharged')?.closest('.stat-card');
    if (dischargedCard) {
      dischargedCard.style.display = (isAdmin() || isNurse()) ? '' : 'none';
    }
    
    // Hide Total Records entirely - replaced by admitted count
    if (totalRecordsEl) {
      const recordsCard = totalRecordsEl.closest('.stat-card');
      if (recordsCard) {
        recordsCard.style.display = 'none';
      }
    }
  }

  /* ─── Monthly Visits Chart ─── */
  function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      gridColor:   isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
      labelColor:  isDark ? '#94a3b8' : '#64748b',
      barColor:    'rgba(14,165,233,.8)',
      barHover:    'rgba(2,132,199,.9)',
      borderColor: '#0ea5e9'
    };
  }

  function buildChart() {
    const canvas = document.getElementById('visits-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const year = new Date().getFullYear();
    const data = db.getMonthlyVisits(year);

    const yearEl = document.getElementById('chart-year');
    if (yearEl) yearEl.textContent = year;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const c = getChartColors();

    if (visitsChart) {
      visitsChart.data.datasets[0].data = data;
      visitsChart.update();
      return;
    }

    visitsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Visits',
          data,
          backgroundColor: c.barColor,
          borderColor: c.borderColor,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: c.barHover
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.y} visit${ctx.parsed.y !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: c.labelColor,
              font: { size: 12 }
            },
            grid: { color: c.gridColor }
          },
          x: {
            ticks: { color: c.labelColor, font: { size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function updateChart() {
    if (!visitsChart) {
      buildChart();
      return;
    }
    const year = new Date().getFullYear();
    visitsChart.data.datasets[0].data = db.getMonthlyVisits(year);
    const c = getChartColors();
    visitsChart.options.scales.y.ticks.color = c.labelColor;
    visitsChart.options.scales.x.ticks.color = c.labelColor;
    visitsChart.options.scales.y.grid.color   = c.gridColor;
    visitsChart.update();
  }

  function refresh() {
    updateStats();
    updateChart();
  }

  function init() {
    startClock();
    updateStats();
    buildChart();
  }

  return { init, refresh, updateChart };
})();
