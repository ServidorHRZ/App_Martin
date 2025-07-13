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

// Test de conectividad
async function testFirebaseConnection() {
    try {
        console.log('🧪 [TEST] Probando conexión a Firestore...');
        const testCollection = collection(db, 'test');
        console.log('✅ [TEST] Conexión a Firestore exitosa');
        return true;
    } catch (error) {
        console.error('❌ [TEST] Error de conexión a Firestore:', error);
        return false;
    }
}

// Ejecutar test al cargar
testFirebaseConnection();

// Función para registrar usuario en colección de Firestore
export async function registrarUsuario(nombreUsuario, email, password) {
    console.log('\n🔥 [FIREBASE] Iniciando función registrarUsuario');
    console.log('📝 [FIREBASE] Parámetros recibidos:', {
        nombreUsuario: nombreUsuario,
        email: email,
        passwordLength: password ? password.length : 0
    });
    
    try {
        console.log('🔍 [FIREBASE] Verificando conexión a Firestore...');
        
        // Verificar si el email ya existe
        const usuariosRef = collection(db, "usuarios");
        console.log('📊 [FIREBASE] Referencia a colección usuarios creada');
        
        console.log('🔍 [FIREBASE] Buscando email duplicado...');
        const consultaEmail = query(usuariosRef, where("email", "==", email));
        const resultadoEmail = await getDocs(consultaEmail);
        
        console.log('📧 [FIREBASE] Resultado búsqueda email:', {
            vacio: resultadoEmail.empty,
            tamaño: resultadoEmail.size
        });
        
        if (!resultadoEmail.empty) {
            console.log('❌ [FIREBASE] Email ya registrado');
            return { exito: false, error: "Este correo electrónico ya está registrado" };
        }
        
        console.log('🔍 [FIREBASE] Buscando nombre de usuario duplicado...');
        // Verificar si el nombre de usuario ya existe
        const consultaNombre = query(usuariosRef, where("nombreUsuario", "==", nombreUsuario));
        const resultadoNombre = await getDocs(consultaNombre);
        
        console.log('👤 [FIREBASE] Resultado búsqueda nombre:', {
            vacio: resultadoNombre.empty,
            tamaño: resultadoNombre.size
        });
        
        if (!resultadoNombre.empty) {
            console.log('❌ [FIREBASE] Nombre de usuario ya existe');
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
        
        console.log('✨ [FIREBASE] Creando nuevo usuario:', {
            nombreUsuario: nuevoUsuario.nombreUsuario,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol
        });
        
        // Guardar en Firestore
        console.log('💾 [FIREBASE] Guardando en Firestore...');
        const docRef = await addDoc(usuariosRef, nuevoUsuario);
        
        console.log('✅ [FIREBASE] Usuario registrado exitosamente con ID:', docRef.id);
        return { 
            exito: true, 
            usuario: { 
                id: docRef.id, 
                ...nuevoUsuario 
            } 
        };
        
    } catch (error) {
        console.error('💥 [FIREBASE] ERROR COMPLETO:', error);
        console.error('💥 [FIREBASE] Error message:', error.message);
        console.error('💥 [FIREBASE] Error code:', error.code);
        console.error('💥 [FIREBASE] Error stack:', error.stack);
        
        let mensajeError = "Error al registrar usuario";
        
        // Mensajes específicos según el tipo de error
        if (error.code === 'permission-denied') {
            mensajeError = "Error de permisos. Verifica la configuración de Firestore";
        } else if (error.code === 'network-request-failed') {
            mensajeError = "Error de conexión. Verifica tu conexión a internet";
        } else if (error.message) {
            mensajeError = error.message;
        }
        
        return { exito: false, error: mensajeError };
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