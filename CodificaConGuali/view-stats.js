let chartInstance = null;

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find(c => c.startsWith(name + "="));
  return cookie ? cookie.split("=")[1] : null;
}

async function filtrarEstadisticas() {
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  // Validate dates
  if (!fechaInicio || !fechaFin) {
    alert("Por favor, seleccione ambas fechas.");
    return;
  }

  try {
    const token = getCookie("token");

    if (!token) {
      alert("No hay token, inicia sesión primero.");
      return;
    }


    const response =await fetch('https://codifica-con-guali.onrender.com/api/auth/view-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
         "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        rangoInferior: fechaInicio,
        rangoSuperior: fechaFin
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || 'Error al obtener las estadísticas');
      return;
    }

    const data = await response.json();

    // Update table
    document.getElementById("visitantes").textContent = data.visits;
    document.getElementById("exitos").textContent = data.successes;
    document.getElementById("fallos").textContent = data.failures;

    // Prepare data for chart
    const chartData = [{
      fecha: `${fechaInicio} - ${fechaFin}`,
      visitantes: data.visits,
      exitos: data.successes,
      fallos: data.failures,
    }];

    // Update chart
    actualizarGrafico(chartData);

  } catch (error) {
    console.error('Error fetching stats:', error);
    alert('Error al conectar con el servidor');
  }
}

function actualizarGrafico(datos) {
  const ctx = document.getElementById("grafico-estadisticas").getContext("2d");

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: datos.map(d => d.fecha),
      datasets: [
        {
          label: "Visitantes",
          data: datos.map(d => d.visitantes),
          backgroundColor: "#4682b4",
        },
        {
          label: "Misiones Exitosas",
          data: datos.map(d => d.exitos),
          backgroundColor: "#32cd32",
        },
        {
          label: "Misiones Fallidas",
          data: datos.map(d => d.fallos),
          backgroundColor: "#ff4444",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#fff" },
          grid: { color: "#555" },
        },
        x: {
          ticks: { color: "#fff" },
          grid: { color: "#555" },
        },
      },
      plugins: {
        legend: {
          labels: { color: "#fff" },
        },
      },
    },
  });
}

// Load initial statistics on page load
window.onload = () => {
  // Set default date range (last 7 days, including today: September 30, 2025)
  const hoy = new Date('2025-09-30');
  const haceSieteDias = new Date(hoy);
  haceSieteDias.setDate(hoy.getDate() - 7);

  document.getElementById("fecha-inicio").value = haceSieteDias.toISOString().split("T")[0];
  document.getElementById("fecha-fin").value = hoy.toISOString().split("T")[0];

  filtrarEstadisticas();
};