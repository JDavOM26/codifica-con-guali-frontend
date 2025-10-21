/*
 * Autor: José David Oliva Muralles
 * Carnet: 3190 22 22485
 * LOGICA VENTANA DE CONFIGURACIÓN
 * Componente: Configuración
 * Descripción: Maneja la creación, edición, eliminación y carga de pistas.
 */

let gridItems = [];
let pistasGuardadas = [];
let seleccionOrdenada = [];
let pistaEnEdicion = null;

function init() {
    inicializarConfig();
}

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find(c => c.startsWith(name + "="));
  return cookie ? cookie.split("=")[1] : null;
}

function inicializarConfig() {
    const idUser = getCookie("idUser");
    inicializarGrid();
    cargarPistasGuardadasPorUsuario(idUser); 
    actualizarTrackList();
    actualizarStatus();
}

function inicializarGrid() {
    gridItems = [];
    seleccionOrdenada = [];
    pistaEnEdicion = null;
    const gridContainer = document.getElementById('grid-container');
    if (!gridContainer) {
        console.error('Grid container no encontrado!');
        return;
    }
    gridContainer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        gridItems.push({ id: i, seleccionado: false });
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.dataset.id = i;
        div.onclick = () => alternarSeleccion(i);
        gridContainer.appendChild(div);
    }
    actualizarGrid();
    actualizarStatus();
}

function alternarSeleccion(id) {
    const item = gridItems.find(item => item.id === id);
    if (item) {
        item.seleccionado = !item.seleccionado;
        if (item.seleccionado) {
            seleccionOrdenada.push(id);
        } else {
            seleccionOrdenada = seleccionOrdenada.filter(selectedId => selectedId !== id);
        }
        actualizarGrid();
    }
}

function actualizarGrid() {
    gridItems.forEach(item => {
        const div = document.querySelector(`.grid-item[data-id="${item.id}"]`);
        if (div) {
            div.className = 'grid-item' + (item.seleccionado ? ' selected' : '');
        }
    });
    actualizarBotones();
}

function actualizarStatus() {
    const status = document.getElementById('status-edicion');
    if (status) {
        if (pistaEnEdicion) {
            status.textContent = `Editando: ${pistaEnEdicion.nombre}`;
            status.style.display = 'block';
        } else {
            status.textContent = 'Modo creación';
            status.style.display = 'block';
        }
    }
}

async function logAction(idUser, action) {
    try {
         const token = getCookie("token");
        const response = await fetch('https://codifica-con-guali.onrender.com/api/admin/enter-action-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": `Bearer ${token}`
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

function guardarPista() {
    if (seleccionOrdenada.length === 0) {
        alert('Selecciona al menos un elemento para guardar la pista');
        return;
    }
    const idUser = getCookie("idUser");
    if (pistaEnEdicion) {
        if (confirm(`¿Confirmar cambios en la pista "${pistaEnEdicion.nombre}"?`)) {
            // Update pistaEnEdicion with the latest seleccionOrdenada
            pistaEnEdicion.configuracion = [...seleccionOrdenada];
            pistaEnEdicion.fechaCreacion = new Date();
            
            // Update pistasGuardadas
            const indice = pistasGuardadas.findIndex(p => p.id === pistaEnEdicion.id);
            if (indice !== -1) {
                pistasGuardadas[indice] = { ...pistaEnEdicion };
            }
            
            guardarEnBackend(pistaEnEdicion);
            logAction(idUser, 'EDIT_TRACK');
            alert(`Pista "${pistaEnEdicion.nombre}" actualizada exitosamente`);
            pistaEnEdicion = null;
            inicializarGrid();
            actualizarTrackList();
            actualizarStatus();
        }
    } else {
        const nombrePista = prompt('Ingresa el nombre de la pista:');
        if (!nombrePista || nombrePista.trim() === '') {
            alert('Debes ingresar un nombre para la pista');
            return;
        }
        const nuevaPista = {
            id: null, // Backend will assign idPista
            nombre: nombrePista.trim(),
            configuracion: [...seleccionOrdenada],
            fechaCreacion: new Date(),
            idUser: idUser
        };
        pistasGuardadas.push(nuevaPista);
        guardarEnBackend(nuevaPista);
        logAction(idUser, 'SAVE_TRACK');
        alert(`Pista "${nombrePista}" guardada exitosamente`);
        inicializarGrid();
        actualizarTrackList();
        actualizarStatus();
    }
}

async function guardarEnBackend(pista) {
    try {
        const token = getCookie("token");
        const response = await fetch('https://codifica-con-guali.onrender.com/api/admin/save-track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                idPista: pista.id,
                nombre: pista.nombre,
                configuracion: JSON.stringify(pista.configuracion),
                fechaCreacion: pista.fechaCreacion.toISOString(),
                idUser: pista.idUser
            })
        });
        if (response.ok) {
            console.log('Pista guardada/actualizada en el backend con éxito');
            const savedTrack = await response.json();
            // Update pistasGuardadas with the returned track
            const updatedPista = {
                id: savedTrack.idPista,
                nombre: savedTrack.nombre,
                configuracion: JSON.parse(savedTrack.configuracion),
                fechaCreacion: new Date(savedTrack.fechaCreacion),
                idUser: savedTrack.idUser
            };
            const index = pistasGuardadas.findIndex(p => p.id === savedTrack.idPista);
            if (index !== -1) {
                pistasGuardadas[index] = updatedPista;
            } else {
                pistasGuardadas.push(updatedPista);
            }
            actualizarTrackList();
        } else {
            console.error('Error al guardar la pista:', response.status);
            alert('Error al guardar la pista en el servidor');
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error en la conexión con el servidor');
    }
}

function cargarPistaConfig(pista) {
    gridItems.forEach(item => item.seleccionado = false);
    seleccionOrdenada = [];
    pista.configuracion.forEach(id => {
        const item = gridItems.find(gridItem => gridItem.id === id);
        if (item) {
            item.seleccionado = true;
            seleccionOrdenada.push(id);
        }
    });
    pistaEnEdicion = { ...pista };
    actualizarGrid();
    actualizarTrackList();
    actualizarStatus();
}

function limpiarGrid() {
    gridItems.forEach(item => item.seleccionado = false);
    seleccionOrdenada = [];
    actualizarGrid();
}

function borrarPista() {
    if (pistaEnEdicion && confirm(`¿Estás seguro de que quieres eliminar la pista "${pistaEnEdicion.nombre}"?`)) {
        pistasGuardadas = pistasGuardadas.filter(p => p.id !== pistaEnEdicion.id);
        borrarEnBackend(pistaEnEdicion.id);
        logAction(pistaEnEdicion.idUser, 'DELETE_TRACK');
        alert(`Pista "${pistaEnEdicion.nombre}" eliminada`);
        pistaEnEdicion = null;
        limpiarGrid();
        actualizarTrackList();
        actualizarStatus();
    }
}

async function borrarEnBackend(id) {
    try {
        const token = getCookie("token");
        const response = await fetch(`https://codifica-con-guali.onrender.com/api/admin/delete-track?idTrack=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                 "Authorization": `Bearer ${token}`
            }
        });
        if (response.ok) {
            console.log('Pista eliminada del backend con éxito');
        } else {
            console.error('Error al eliminar la pista:', response.status);
            alert('Error al eliminar la pista en el servidor');
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error en la conexión con el servidor');
    }
}

function cancelarEdicion() {
    if (pistaEnEdicion && confirm('¿Cancelar la edición actual? Los cambios no guardados se perderán.')) {
        pistaEnEdicion = null;
        gridItems.forEach(item => item.seleccionado = false);
        seleccionOrdenada = [];
        limpiarGrid();
        actualizarTrackList();
        actualizarStatus();
    }
}

function actualizarTrackList() {
    const pistasList = document.getElementById('pistas-list');
    const noPistas = document.getElementById('no-pistas');
    if (!pistasList || !noPistas) {
        console.error('Pistas list o no-pistas no fue encontrado!');
        return;
    }
    pistasList.innerHTML = '';
    if (pistasGuardadas.length === 0) {
        noPistas.style.display = 'block';
    } else {
        noPistas.style.display = 'none';
        pistasGuardadas.forEach(pista => {
            const li = document.createElement('li');
            li.className = 'pista-item' + (pistaEnEdicion && pistaEnEdicion.id === pista.id ? ' editando' : '');
            const div = document.createElement('div');
            div.className = 'pista-info';
            div.innerHTML = `
                <strong>${pista.nombre}</strong>
                <small>${new Date(pista.fechaCreacion).toLocaleString()}</small>
                ${pistaEnEdicion && pistaEnEdicion.id === pista.id ? '<small style="color: #856404;">En edición</small>' : ''}
            `;
            div.onclick = () => cargarPistaConfig(pista);
            li.appendChild(div);
            pistasList.appendChild(li);
        });
    }
    actualizarBotones();
}

function actualizarBotones() {
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnBorrar = document.getElementById('btn-borrar');
    const btnLimpiar = document.getElementById('btn-limpiar');
     const btnCargar = document.getElementById('btn-cargar');
      const btnExportar = document.getElementById('btn-exportar');
    if (btnGuardar) {
        btnGuardar.textContent = pistaEnEdicion ? 'Confirmar Cambios' : 'Guardar';
        btnGuardar.classList.toggle('editando', !!pistaEnEdicion);
    }
    if (btnCancelar) btnCancelar.style.display = pistaEnEdicion ? 'block' : 'none';
    if (btnBorrar) btnBorrar.style.display = pistaEnEdicion ? 'block' : 'none';
    if (btnLimpiar) btnLimpiar.style.display = pistaEnEdicion ? 'none' : 'block';
     if (btnCargar) btnCargar.style.display = pistaEnEdicion ? 'none' : 'block';
      if (btnExportar) btnExportar.style.display = pistaEnEdicion ? 'none' : 'block';
}

async function cargarPistasGuardadasPorUsuario(idUser) {
    try {
        const token = getCookie("token");
        const response = await fetch(`https://codifica-con-guali.onrender.com/api/admin/get-track-user?idUser=${idUser}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                 "Authorization": `Bearer ${token}`
            }
        });
        if (response.ok) {
            pistasGuardadas = await response.json();
            // Map idPista to id and parse configuracion
            pistasGuardadas = pistasGuardadas.map(pista => ({
                id: pista.idPista,
                nombre: pista.nombre,
                configuracion: typeof pista.configuracion === 'string' ? JSON.parse(pista.configuracion) : pista.configuracion,
                fechaCreacion: new Date(pista.fechaCreacion),
                idUser: pista.idUser
            }));
            console.log('Pistas cargadas con éxito:', pistasGuardadas);
            actualizarTrackList();
        } else {
            console.error('Error al cargar las pistas:', response.status);
            alert('Error al cargar las pistas del servidor');
            pistasGuardadas = [];
            actualizarTrackList();
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error en la conexión con el servidor');
        pistasGuardadas = [];
        actualizarTrackList();
    }
}

function cargarDesdeArchivo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const pistas = JSON.parse(e.target.result);
                    if (!Array.isArray(pistas)) {
                        throw new Error('El archivo JSON debe contener un arreglo de pistas');
                    }
                    // Validate and assign user ID
                    const idUser = getCookie("idUser");
                    pistas.forEach(pista => {
                        pista.idUser = idUser; // Assign current user ID
                        pista.fechaCreacion = new Date(pista.fechaCreacion); // Ensure date is a Date object
                        if (!pista.nombre || !pista.configuracion || !Array.isArray(pista.configuracion)) {
                            throw new Error('Formato de pista inválido');
                        }
                    });
                    // Merge new pistas with existing ones, avoiding duplicates
                    pistasGuardadas = [...pistasGuardadas, ...pistas.filter(p => !pistasGuardadas.some(existing => existing.nombre === p.nombre))];
                    // Save to backend
                    pistas.forEach(pista => guardarEnBackend(pista));
                    logAction(idUser, 'LOAD_TRACKS_FROM_FILE');
                    actualizarTrackList();
                    alert('Pistas cargadas desde archivo exitosamente');
                } catch (error) {
                    console.error('Error al leer el archivo:', error);
                    alert('Error al leer el archivo. Asegúrate de que sea un archivo JSON válido.');
                }
            };
            reader.readAsText(file);
        }
    };

    input.click();
}

function exportarHaciaArchivo() {
    if (pistasGuardadas.length === 0) {
        alert('No hay pistas guardadas para exportar');
        return;
    }

    const dataStr = JSON.stringify(pistasGuardadas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `pistas_guardadas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    const idUser = getCookie("idUser");
    logAction(idUser, 'EXPORT_TRACKS_TO_FILE');
    alert('Pistas exportadas exitosamente');
}

window.onload = init;