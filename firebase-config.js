// Configuración de Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración real de Firebase obtenida desde la consola
const firebaseConfig = {
    apiKey: "AIzaSyAkGt9mcgneJCofgY5fwSyHWcKJVNUmUoU",
    authDomain: "app-ventas-martin.firebaseapp.com",
    projectId: "app-ventas-martin",
    storageBucket: "app-ventas-martin.firebasestorage.app",
    messagingSenderId: "309262005814",
    appId: "1:309262005814:web:d1d3fc9df63f55e31cca97",
    measurementId: "G-2ZZT0VSKT7"
};

console.log("🔥 Iniciando Firebase con configuración real - Proyecto:", firebaseConfig.projectId);

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para registrar usuario en colección de Firestore
export async function registrarUsuario(nombreUsuario, email, password) {
    try {
        // Verificar si el email ya existe
        const usuariosRef = collection(db, "usuarios");
        const consultaEmail = query(usuariosRef, where("email", "==", email));
        const resultadoEmail = await getDocs(consultaEmail);
        
        if (!resultadoEmail.empty) {
            return { exito: false, error: "Este correo electrónico ya está registrado" };
        }
        
        // Verificar si el nombre de usuario ya existe
        const consultaNombre = query(usuariosRef, where("nombreUsuario", "==", nombreUsuario));
        const resultadoNombre = await getDocs(consultaNombre);
        
        if (!resultadoNombre.empty) {
            return { exito: false, error: "Este nombre de usuario ya está en uso" };
        }
        
        // Crear el nuevo usuario (siempre como cliente)
        const nuevoUsuario = {
            nombreUsuario: nombreUsuario,
            email: email,
            password: password, // En producción deberías encriptar la contraseña
            rol: "cliente", // Todos los registros nuevos son clientes
            fechaCreacion: new Date(),
            activo: true,
            ultimoAcceso: null
        };
        
        // Guardar en Firestore
        const docRef = await addDoc(usuariosRef, nuevoUsuario);
        
        console.log("Usuario cliente registrado exitosamente:", docRef.id);
        return { 
            exito: true, 
            usuario: { 
                id: docRef.id, 
                ...nuevoUsuario 
            } 
        };
        
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        return { exito: false, error: "Error al registrar usuario: " + error.message };
    }
}

// Función para iniciar sesión desde colección de Firestore
export async function iniciarSesion(email, password) {
    try {
        // Buscar usuario por email
        const usuariosRef = collection(db, "usuarios");
        const consulta = query(usuariosRef, where("email", "==", email));
        const resultado = await getDocs(consulta);
        
        if (resultado.empty) {
            return { exito: false, error: "Usuario no encontrado" };
        }
        
        // Verificar contraseña
        const usuarioDoc = resultado.docs[0];
        const datosUsuario = usuarioDoc.data();
        
        if (datosUsuario.password !== password) {
            return { exito: false, error: "Contraseña incorrecta" };
        }
        
        // Verificar si el usuario está activo
        if (!datosUsuario.activo) {
            return { exito: false, error: "Usuario inactivo" };
        }
        
        // Actualizar último acceso
        await setDoc(doc(db, "usuarios", usuarioDoc.id), {
            ...datosUsuario,
            ultimoAcceso: new Date()
        });
        
        console.log("Sesión iniciada exitosamente:", usuarioDoc.id);
        return { 
            exito: true, 
            usuario: { 
                id: usuarioDoc.id, 
                ...datosUsuario 
            } 
        };
        
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        return { exito: false, error: "Error al iniciar sesión: " + error.message };
    }
}

// Variable para almacenar el usuario actual en la sesión
let usuarioActual = null;

// Función para establecer el usuario actual
export function establecerUsuarioActual(usuario) {
    usuarioActual = usuario;
    // Guardar en localStorage para persistencia
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
}

// Función para obtener el usuario actual
export function obtenerUsuarioActual() {
    if (!usuarioActual) {
        // Intentar recuperar de localStorage
        const usuarioGuardado = localStorage.getItem('usuarioActual');
        if (usuarioGuardado) {
            usuarioActual = JSON.parse(usuarioGuardado);
        }
    }
    return usuarioActual;
}

// Función para cerrar sesión
export function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('usuarioActual');
    return { exito: true };
} 