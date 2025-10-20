/*
 * Autor: José David Oliva Muralles
 * Carnet: 3190 22 22485
 * LOGICA TABLERO USUARIO FINAL
 * Componente: Tablero
 * Descripción: Este componente controla la lógica del tablero, incluyendo
 *              la colocación del robot, ejecución de comandos, detección
 *              de estados del juego y manejo de pistas guardadas.
 */
let robotPos = { x: 2, y: 2 };
let robotDireccion = 0;
let comandos = [];
let pista = [];
let visitado = [];
let ejecutando = false;
let gameOver = false;
let loopActivo = false;
const iconos = { 'ARRIBA': '⬆️', 'IZQUIERDA': '↰', 'DERECHA': '↱', 'INICIA_BUCLE': '🔄', 'FINALIZA_BUCLE': '🔄' };

let gridItems = [];
let pistasGuardadas = [];
let seleccionOrdenada = [];
let pistaEnEdicion = null;

async function sendUsageLog(eventType) {
  try {
    const response = await fetch('https://codifica-con-guali.onrender.com/api/noauth/enter-usage-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `eventType=${encodeURIComponent(eventType)}`,
    });
    if (response.ok) {
      console.log('Log de uso enviado con éxito');
    } else {
      console.error('Error al enviar el log de uso:', response.status);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
}

function init() {
  inicializarJuego();
  sendUsageLog('VISIT');
}

function inicializarJuego() {
  const tablero = document.getElementById('tablero');
  if (!tablero) {
    console.error('Not found: Elemento del tablero no encontrado!');
    return;
  }
  tablero.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const div = document.createElement('div');
    div.id = `div-${i}`;
    tablero.appendChild(div);
  }
  cargarPista();
  actualizarListaComandos();
}

async function cargarPistasAleatorias() {
  try {
    const response = await fetch('https://codifica-con-guali.onrender.com/api/noauth/get-random-tracks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (response.ok) {
      const pistas = await response.json();
      return pistas.map(pista => ({
        ...pista,
        configuracion: typeof pista.configuracion === 'string' ? JSON.parse(pista.configuracion) : pista.configuracion
      }));
    } else {
      console.error('Error al cargar pistas aleatorias:', response.status);
      // Fallback to a default track
      return [{ id: 1, nombre: 'Pista por Defecto', configuracion: [0, 1, 2, 3, 4], fechaCreacion: new Date() }];
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
    // Fallback to a default track
    return [{ id: 1, nombre: 'Pista por Defecto', configuracion: [0, 1, 2, 3, 4], fechaCreacion: new Date() }];
  }
}

async function cargarPista() {
  const pistasGuardadas = await cargarPistasAleatorias();
  const pistaAleatoria = pistasGuardadas[Math.floor(Math.random() * pistasGuardadas.length)];
  pista = pistaAleatoria.configuracion;

  robotPos = { x: pista[0] % 5, y: Math.floor(pista[0] / 5) };
  visitado = [pista[0]];

  renderizarPista();
  colocarRobot(robotPos.x, robotPos.y, false);
}

function renderizarPista() {
  document.querySelectorAll('.pista').forEach(el => el.classList.remove('pista'));
  pista.forEach(pos => {
    const div = document.getElementById(`div-${pos}`);
    if (div) {
      div.classList.add('pista');
    } else {
      console.error(`Elemento div-${pos} no encontrado!`);
    }
  });
}

function colocarRobot(x, y, animate = true) {
  document.querySelectorAll('.robot').forEach(el => {
    el.classList.remove('robot');
    el.innerHTML = '';
  });
  const pos = y * 5 + x;
  const div = document.getElementById(`div-${pos}`);
  if (div) {
    div.classList.add('robot');
    const robotImg = document.createElement('img');
    robotImg.src = 'images/robot.png';
    robotImg.className = 'robot-img';
    robotImg.alt = 'Robot';
    robotImg.style.transform = `rotate(${robotDireccion * 90}deg)`;
    robotImg.style.transition = animate ? 'all 0.3s ease' : 'none';
    if (!ejecutando) {
      robotImg.classList.add('bounce');
    }
    div.appendChild(robotImg);
  } else {
    console.error(`Elemento div-${pos} no encontrado!`);
  }
  robotPos = { x, y };
}

function moverRobot() {
  let newX = robotPos.x;
  let newY = robotPos.y;
  if (robotDireccion === 0) newY = Math.max(0, newY - 1);
  else if (robotDireccion === 1) newX = Math.min(4, newX + 1);
  else if (robotDireccion === 2) newY = Math.min(3, newY + 1);
  else if (robotDireccion === 3) newX = Math.max(0, newX - 1);
  colocarRobot(newX, newY);
}

function rotarRobot(direction) {
  robotDireccion = direction === 'IZQUIERDA' ? (robotDireccion + 3) % 4 : (robotDireccion + 1) % 4;
  colocarRobot(robotPos.x, robotPos.y);
}

function añadirComando(type) {
  if (ejecutando || gameOver) return;
  if (type === 'INICIA_BUCLE' && loopActivo) {
    alert('El bucle ya está activo.');
    return;
  }
  const command = { tipo: type, icono: iconos[type] };
  comandos.push(command);
  if (type === 'INICIA_BUCLE') loopActivo = true;
  else if (loopActivo) {
    comandos.push({ ...command });
    comandos.push({ tipo: 'FINALIZA_BUCLE', icono: iconos['FINALIZA_BUCLE'] });
    loopActivo = false;
  }
  actualizarListaComandos();
}

function actualizarListaComandos() {
  const select = document.getElementById('comandoSeleccionado');
  if (select) {
    select.innerHTML = '<option value="">Comandos Seleccionados</option>';
    comandos.forEach((cmd, i) => {
      const option = document.createElement('option');
      option.value = i.toString();
      option.text = `${i + 1}. ${cmd.tipo} ${cmd.icono}`;
      option.id = `command-${i}`;
      select.appendChild(option);
    });
  }
}

function resaltarComando(index) {
  document.querySelectorAll('#comandoSeleccionado option').forEach(option => {
    option.classList.remove('executing');
  });
  if (index >= 0 && index < comandos.length) {
    const option = document.getElementById(`command-${index}`);
    if (option) {
      option.classList.add('executing');
      option.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

async function ejecutarComandos() {
  if (ejecutando || comandos.length === 0 || gameOver) {
    if (comandos.length === 0) alert('No hay comandos para ejecutar.');
    return;
  }
  ejecutando = true;
  document.getElementById('accion-ejecutar').classList.add('disabled');
  const robotImg = document.querySelector('.robot-img');
  if (robotImg) {
    robotImg.classList.remove('bounce');
  }
  for (let i = 0; i < comandos.length; i++) {
    const cmd = comandos[i];
    if (gameOver) break;
    resaltarComando(i);
    if (cmd.tipo === 'ARRIBA') moverRobot();
    else if (cmd.tipo === 'IZQUIERDA' || cmd.tipo === 'DERECHA') rotarRobot(cmd.tipo);
    await chequearGameState();
    await wait(800);
  }
  document.querySelectorAll('#comandoSeleccionado option').forEach(option => {
    option.classList.remove('executing');
  });
  ejecutando = false;
  document.getElementById('accion-ejecutar').classList.remove('disabled');
}

async function chequearGameState() {
  const pos = robotPos.y * 5 + robotPos.x;
  if (!pista.includes(pos)) {
    gameOver = true;
    await sendUsageLog('FAIL');
    showMessage('¡Game Over! El robot se salió de la pista.', 'game-over');
    return;
  }
  if (!visitado.includes(pos)) {
    visitado.push(pos);
  }
  const allVisited = pista.every(position => visitado.includes(position));
  if (allVisited) {
    gameOver = true;
    await sendUsageLog('SUCCESS');
    showMessage('¡Éxito! Has completado la pista.', 'exito');
  }
}

function showMessage(text, type) {
  const msg = document.getElementById('mensaje-juego');
  if (msg) {
    msg.textContent = text;
    msg.classList.add(type);
    msg.style.display = 'block';
    setTimeout(() => {
      msg.style.display = 'none';
      msg.classList.remove(type);
    }, 3000);
  }
}

function resetearJuego() {
  if (ejecutando) return;
  robotDireccion = 0;
  comandos = [];
  visitado = [pista[0]];
  gameOver = false;
  loopActivo = false;
  robotPos = { x: pista[0] % 5, y: Math.floor(pista[0] / 5) };
  document.querySelectorAll('#comandoSeleccionado option').forEach(option => {
    option.classList.remove('executing');
  });
  colocarRobot(robotPos.x, robotPos.y, false);
  actualizarListaComandos();
  document.getElementById('mensaje-juego').style.display = 'none';
}

function mostrarModalAutenticacion() {
  document.getElementById("modal-autenticacion").style.display = "flex";
  document.getElementById("usuario").value = "";
  document.getElementById("contrasena").value = "";
  document.getElementById("usuario").focus();
}

function cerrarModalAutenticacion() {
  document.getElementById("modal-autenticacion").style.display = "none";
}

// La función validarAutenticacion ahora está en el HTML inline
// para poder usar sessionStorage sin problemas

window.onload = init;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}




  async function validarAutenticacion() {
      const username = document.getElementById("usuario").value.trim();
      const password = document.getElementById("contrasena").value.trim();

      if (!username || !password) {
        alert("Por favor, complete ambos campos.");
        return;
      }

      try {
        const response = await fetch('https://codifica-con-guali.onrender.com/api/noauth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password
          })
        });

        if (response.ok) {
           const data = await response.json();
          document.cookie = `token=${data.token}; path=/; max-age=3600; secure; samesite=strict`;
          document.cookie = `idUser=${data.idUser}; path=/; max-age=3600; secure; samesite=strict`;

          await sendUsageLog('SUCCESS');
          cerrarModalAutenticacion();
          window.location.href = "config.html";
        } else {
          await sendUsageLog('FAIL');
          alert("Usuario o contraseña incorrectos.");
          document.getElementById("contrasena").value = "";
          document.getElementById("usuario").focus();
        }
      } catch (error) {
        console.error('Error en la autenticación:', error);
        alert("Error al conectar con el servidor. Por favor, intente nuevamente.");
      }
    }

    // Permitir login con Enter
    document.addEventListener('DOMContentLoaded', function() {
      const passwordInput = document.getElementById("contrasena");
      const userInput = document.getElementById("usuario");
      
      if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
          if (event.key === 'Enter') {
            validarAutenticacion();
          }
        });
      }
      
      if (userInput) {
        userInput.addEventListener('keypress', function(event) {
          if (event.key === 'Enter') {
            validarAutenticacion();
          }
        });
      }
    });