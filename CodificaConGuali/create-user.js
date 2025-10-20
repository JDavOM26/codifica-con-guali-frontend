// URL base de tu API
const API_URL = 'https://codifica-con-guali.onrender.com/api/auth';

let usuarios = [];

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find(c => c.startsWith(name + "="));
  return cookie ? cookie.split("=")[1] : null;
}

// Cargar usuarios desde la API
async function cargarUsuariosDesdeAPI() {
  try {
     const token = getCookie("token");

      if (!token) {
      alert("No hay token, inicia sesión primero.");
      return;
    }

    const response = await fetch(`${API_URL}/get-users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // inyectamos el token aquí
      }
    });
    if (!response.ok) {
      throw new Error('Error al cargar usuarios');
    }
    usuarios = await response.json();
    llenarTablaUsuarios();
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar los usuarios. Verifica que el servidor esté funcionando.');
  }
}

async function logAction(idUser, action) {
    try {
          const token = getCookie("token");

      if (!token) {
      alert("No hay token, inicia sesión primero.");
      return;
    }
        const response = await fetch('http://localhost:8585/api/auth/enter-action-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                 "Authorization": `Bearer ${token}` // inyectamos el token aquí
            },
            body: `idUser=${encodeURIComponent(idUser)}&action=${encodeURIComponent(action)}`
        });
        if (response.ok) {
            console.log(`Acción "${action}" registrada con éxito para idUser: ${idUser}`);
        } else {
            console.error(`Error al registrar acción "${action}":`, response.status);
        }
    } catch (error) {
        console.error('Error en la solicitud de registro de acción:', error);
    }
}

function llenarTablaUsuarios() {
  const cuerpoTabla = document.getElementById("cuerpo-usuarios");
  cuerpoTabla.innerHTML = "";
  
  usuarios.forEach(usuario => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${usuario.username}</td>
      <td>${usuario.rol}</td>
      <td>
        <span class="accion-tabla accion-modificar" onclick="cargarUsuario(${usuario.idUser})">Modificar</span>
        <span class="accion-tabla accion-eliminar" onclick="eliminarUsuario(${usuario.idUser})">Eliminar</span>
      </td>
    `;
    cuerpoTabla.appendChild(fila);
  });
}

function limpiarFormulario() {
  document.getElementById("id-usuario").value = "";
  document.getElementById("nombre").value = "";
  document.getElementById("rol").value = "";
  document.getElementById("contrasena").value = "";
  document.getElementById("titulo-formulario").textContent = "Crear Nuevo Administrador";
  document.getElementById("accion-cancelar").style.display = "none";
}

function validarFormulario() {
  const nombre = document.getElementById("nombre").value.trim();
  const rol = document.getElementById("rol").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  
  if (!nombre || !rol || !contrasena) {
    alert("Por favor, complete todos los campos.");
    return false;
  }
  
  return true;
}

async function guardarUsuario() {
  if (!validarFormulario()) return;
  const idUser = getCookie("idUser");
  const id = document.getElementById("id-usuario").value;
  const nombre = document.getElementById("nombre").value.trim();
  const rol = document.getElementById("rol").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();

  const usuario = {
    username: nombre,
    rol: rol,
    password: contrasena
  };

  // Si hay un ID, estamos modificando
  if (id) {
    usuario.idUser = parseInt(id);
  }

  try {
      const token = getCookie("token");

      if (!token) {
      alert("No hay token, inicia sesión primero.");
      return;
    }
    const response = await fetch(`${API_URL}/save-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(usuario)
    });

    if (!response.ok) {
      throw new Error('Error al guardar el usuario');
    }

    const usuarioGuardado = await response.json();
    
    if (id) {
       logAction(idUser, 'USER_MODIFIED');
      alert('Usuario modificado exitosamente');
    } else {
       logAction(idUser, 'USER_CREATED');
      alert('Usuario creado exitosamente');
    }

    limpiarFormulario();
    await cargarUsuariosDesdeAPI(); // Recargar la lista
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar el usuario. Verifica la conexión con el servidor.');
  }
}

function cargarUsuario(id) {
  const usuario = usuarios.find(u => u.idUser === id);
  if (usuario) {
    document.getElementById("id-usuario").value = usuario.idUser;
    document.getElementById("nombre").value = usuario.username;
    document.getElementById("rol").value = usuario.rol;
    document.getElementById("contrasena").value = usuario.password;
    document.getElementById("titulo-formulario").textContent = "Modificar Administrador";
    document.getElementById("accion-cancelar").style.display = "inline-flex";
  }
}

async function eliminarUsuario(id) {
  if (confirm("¿Está seguro de que desea eliminar este administrador?")) {
    const idUser =  getCookie("idUser");
    try {
       const token = getCookie("token");

      if (!token) {
      alert("No hay token, inicia sesión primero.");
      return;
    }
      const response = await fetch(`${API_URL}/delete-user?idUser=${id}`,{
     
        method: 'DELETE',
           headers: { "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario');
      }
       logAction(idUser, 'USER_DELETED');
      alert('Usuario eliminado exitosamente');
      limpiarFormulario();
      await cargarUsuariosDesdeAPI(); // Recargar la lista
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el usuario. Verifica la conexión con el servidor.');
    }
  }
}

// Cargar usuarios al iniciar la página
window.onload = cargarUsuariosDesdeAPI;