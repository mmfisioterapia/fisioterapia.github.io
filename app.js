import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ===============================
// CONFIGURACIÓN FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyAOCU1LP-4OLRxEGHeGEzFfaqRenwyymBI",
  authDomain: "fisiocomentarios.firebaseapp.com",
  projectId: "fisiocomentarios",
  storageBucket: "fisiocomentarios.firebasestorage.app",
  messagingSenderId: "750986763603",
  appId: "1:750986763603:web:66339e7b4e749da52d15a6",
  measurementId: "G-RPRSXSRG39"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("✅ Firebase conectado correctamente");

// ===============================
// EMAILJS
// ===============================
emailjs.init("qTK4lAwdCswFZjJaR");

// ===============================
// VARIABLES GLOBALES
// ===============================
let comentarios = [];
let citas = [];

// ===============================
// INICIALIZAR APP
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  cargarComentariosDelFirebase();
  cargarCitasDelFirebase();
  configurarFormularioCita();
});

// ========================================
// FUNCIONES COMENTARIOS
// ========================================

async function cargarComentariosDelFirebase() {
  try {
    const q = query(collection(db, "comentarios"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    comentarios = [];
    querySnapshot.forEach(doc => {
      comentarios.push({
        id: doc.id,
        ...doc.data()
      });
    });
    renderComentarios();
  } catch (error) {
    console.error("❌ Error cargando comentarios:", error);
  }
}

async function agregarComentario() {
  const nombre = document.getElementById("nombre").value.trim();
  const texto = document.getElementById("comentarioTexto").value.trim();

  if (nombre === "" || texto === "") {
    alert("❌ Completa todos los campos");
    return;
  }

  try {
    await addDoc(collection(db, "comentarios"), {
      nombre: nombre,
      texto: texto,
      timestamp: new Date()
    });

    alert("✅ Comentario guardado correctamente");
    document.getElementById("nombre").value = "";
    document.getElementById("comentarioTexto").value = "";
    
    await cargarComentariosDelFirebase();
  } catch (error) {
    console.error("❌ Error al guardar comentario:", error);
    alert("❌ Error al guardar comentario");
  }
}

function renderComentarios() {
  const lista = document.getElementById("listaComentarios");
  lista.innerHTML = "";

  if (comentarios.length === 0) {
    lista.innerHTML = "<p style='text-align:center; color:gray;'>No hay comentarios aún.</p>";
    return;
  }

  comentarios.forEach((comentario, index) => {
    const div = document.createElement("div");
    div.classList.add("comentario");

    div.innerHTML = `
      <strong>${comentario.nombre}</strong>
      <p>${comentario.texto}</p>
      <small style="color: gray;">${new Date(comentario.timestamp.toDate()).toLocaleString()}</small>
      <div class="menu">
        <button class="menu-btn" onclick="toggleMenu(${index})">⋮</button>
        <div class="menu-opciones" id="menu-${index}">
          <button onclick="editarComentario(${index})">Editar</button>
          <button onclick="eliminarComentario(${index})">Eliminar</button>
        </div>
      </div>
    `;

    lista.appendChild(div);
  });
}

async function eliminarComentario(index) {
  if (!confirm("¿Eliminar comentario?")) return;

  try {
    await deleteDoc(doc(db, "comentarios", comentarios[index].id));
    alert("✅ Comentario eliminado");
    await cargarComentariosDelFirebase();
  } catch (error) {
    console.error("❌ Error al eliminar:", error);
    alert("❌ Error al eliminar comentario");
  }
}

async function editarComentario(index) {
  const nuevoTexto = prompt("Editar comentario:", comentarios[index].texto);

  if (nuevoTexto === null || nuevoTexto.trim() === "") return;

  try {
    await updateDoc(doc(db, "comentarios", comentarios[index].id), {
      texto: nuevoTexto.trim()
    });
    alert("✅ Comentario actualizado");
    await cargarComentariosDelFirebase();
  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    alert("❌ Error al actualizar comentario");
  }
}

function toggleMenu(index) {
  const menu = document.getElementById(`menu-${index}`);
  menu.classList.toggle("mostrar");
}

// ========================================
// FUNCIONES CITAS
// ========================================

async function cargarCitasDelFirebase() {
  try {
    const q = query(collection(db, "citas"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    citas = [];
    querySnapshot.forEach(doc => {
      citas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    mostrarCitas();
  } catch (error) {
    console.error("❌ Error cargando citas:", error);
  }
}

function configurarFormularioCita() {
  const form = document.getElementById("formCita");
  const fechaInput = document.getElementById("fechaCita");

  // Fecha mínima = hoy
  fechaInput.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    enviarFormularioCita();
  });
}

async function enviarFormularioCita() {
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const servicio = document.getElementById("servicio").value;
  const fecha = document.getElementById("fechaCita").value;
  const hora = document.getElementById("horaCita").value;
  const mensajeExtra = document.getElementById("mensajeExtra").value.trim();

  // Validar domingo
  const partes = fecha.split("-");
  const fechaLocal = new Date(partes[0], partes[1] - 1, partes[2]);
  const dia = fechaLocal.getDay();

  if (dia === 0) {
    mostrarMensaje("❌ No hay servicio los domingos.", "red");
    return;
  }

  // Validar horario ocupado
  const ocupada = citas.some(cita =>
    cita.fecha === fecha && cita.hora === hora
  );

  if (ocupada) {
    mostrarMensaje("❌ Ese horario ya está ocupado.", "red");
    return;
  }

  try {
    // Guardar en Firebase
    await addDoc(collection(db, "citas"), {
      nombre,
      telefono,
      correo,
      servicio,
      fecha,
      hora,
      mensajeExtra,
      timestamp: new Date()
    });

    // Enviar correo
    emailjs.send(
      "service_jujkqjp",
      "template_yayffif",
      {
        nombre: nombre,
        telefono: telefono,
        correo: correo,
        servicio: servicio,
        fecha: fecha,
        hora: hora,
        mensaje: mensajeExtra
      }
    )
    .then(function() {
      mostrarMensaje("✅ Cita agendada y enviada correctamente.", "green");
    })
    .catch(function(error) {
      console.error(error);
      mostrarMensaje("❌ Cita guardada pero error al enviar correo.", "orange");
    });

    // Limpiar formulario
    document.getElementById("formCita").reset();

    // Recargar citas
    await cargarCitasDelFirebase();
  } catch (error) {
    console.error("❌ Error al agendar cita:", error);
    mostrarMensaje("❌ Error al agendar cita.", "red");
  }
}

function mostrarMensaje(texto, color) {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.style.color = color;
  
  setTimeout(() => {
    mensaje.textContent = "";
  }, 5000);
}

async function mostrarCitas() {
  const listaCitas = document.getElementById("listaCitas");
  listaCitas.innerHTML = "";

  if (citas.length === 0) {
    listaCitas.innerHTML = "<li style='text-align:center; color:gray;'>No hay citas agendadas.</li>";
    return;
  }

  citas.forEach((cita, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${cita.fecha}</strong> - Hora: ${cita.hora}
      <br>
      👤 ${cita.nombre}
      <br>
      📋 ${cita.servicio}
      <br>
      📱 ${cita.telefono}
      <br>
      ✉️ ${cita.correo}
      ${cita.mensajeExtra ? `<br>💬 ${cita.mensajeExtra}` : ""}
      <br><br>
    `;

    const boton = document.createElement("button");
    boton.textContent = "Eliminar";
    boton.classList.add("eliminar");
    boton.addEventListener("click", () => eliminarCita(index));

    li.appendChild(boton);
    listaCitas.appendChild(li);
  });
}

async function eliminarCita(index) {
  if (!confirm("¿Eliminar cita?")) return;

  try {
    await deleteDoc(doc(db, "citas", citas[index].id));
    alert("✅ Cita eliminada");
    await cargarCitasDelFirebase();
  } catch (error) {
    console.error("❌ Error al eliminar cita:", error);
    alert("❌ Error al eliminar cita");
  }
}

// Hacer funciones globales para onclick en HTML
window.agregarComentario = agregarComentario;
window.eliminarComentario = eliminarComentario;
window.editarComentario = editarComentario;
window.toggleMenu = toggleMenu;
window.eliminarCita = eliminarCita;