const API_URL = 'https://codifica-con-guali.onrender.com/api/admin';


let historicos = [];

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find(c => c.startsWith(name + "="));
  return cookie ? cookie.split("=")[1] : null;
}


async function cargarHistoricosDesdeAPI() {
  try {
    const token = getCookie("token"); 
    if (!token) {
      alert("No hay token, inicia sesión primero.");
      return;
    }

    const response = await fetch(`${API_URL}/get-all-historics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      }
    });

    if (!response.ok) {
      throw new Error("Error al cargar historicos");
    }

    historicos = await response.json();
    llenarHistorico();
  } catch (error) {
    console.error("Error:", error);
    alert("Error al cargar los históricos. Verifica que el servidor esté funcionando.");
  }
}


function formatearFecha(timestamp) {
  const fecha = new Date(timestamp);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const hours = String(fecha.getHours()).padStart(2, '0');
  const minutes = String(fecha.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}


function llenarHistorico() {
  const cuerpoTabla = document.getElementById("cuerpo-historico");
  cuerpoTabla.innerHTML = ""; 
  
  historicos.forEach(entrada => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(entrada.timestamp)}</td>
      <td>Usuario ${entrada.idUser || 'N/A'}</td>
      <td>${entrada.action}</td>
    `;
    cuerpoTabla.appendChild(fila);
  });
}


window.onload = cargarHistoricosDesdeAPI;