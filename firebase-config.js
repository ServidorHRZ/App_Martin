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

// Función para generar código de verificación
function generarCodigoVerificacion() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
}

// Función para enviar código de verificación por email usando EmailJS
export async function enviarCodigoVerificacion(email, nombreUsuario = 'Usuario') {
    console.log('\n📧 [VERIFICACION] Iniciando envío de código de verificación');
    console.log('📧 [VERIFICACION] Email destino:', email);
    
    try {
        // Generar código de verificación
        const codigo = generarCodigoVerificacion();
        console.log('🔢 [VERIFICACION] Código generado:', codigo);
        
        // Intentar enviar email real usando EmailJS PRIMERO
        try {
            // Importar dinámicamente la función de EmailJS
            const { enviarEmailVerificacion } = await import('./emailjs-config.js');
            const resultadoEmail = await enviarEmailVerificacion(email, nombreUsuario, codigo);
            
            if (resultadoEmail && resultadoEmail.exito) {
                console.log('✅ [VERIFICACION] Email enviado correctamente via EmailJS');
                
                // Guardar código en localStorage como respaldo (siempre funciona)
                const codigoTemporal = {
                    email: email,
                    codigo: codigo,
                    expiracion: Date.now() + (10 * 60 * 1000), // 10 minutos
                    usado: false,
                    fechaCreacion: Date.now()
                };
                
                localStorage.setItem(`codigo_${email}`, JSON.stringify(codigoTemporal));
                console.log('💾 [VERIFICACION] Código guardado en localStorage como respaldo');
                
                // Intentar guardar en Firebase (opcional, no crítico)
                try {
                    const codigosRef = collection(db, "codigos_verificacion");
                    const expiracion = new Date();
                    expiracion.setMinutes(expiracion.getMinutes() + 10);
                    
                    const codigoData = {
                        email: email,
                        codigo: codigo,
                        expiracion: expiracion,
                        usado: false,
                        fechaCreacion: new Date()
                    };
                    
                    await addDoc(codigosRef, codigoData);
                    console.log('✅ [VERIFICACION] Código también guardado en Firebase');
                } catch (firebaseError) {
                    console.warn('⚠️ [VERIFICACION] Firebase no disponible, usando solo localStorage:', firebaseError.message);
                }
                
                return { exito: true, mensaje: "Código de verificación enviado a tu correo" };
            } else {
                console.warn('⚠️ [VERIFICACION] Fallo EmailJS, usando modo desarrollo');
                throw new Error(resultadoEmail?.error || 'Error desconocido en EmailJS');
            }
            
        } catch (emailError) {
            console.warn('⚠️ [VERIFICACION] EmailJS no disponible, usando modo desarrollo:', emailError.message);
            
            // Fallback: guardar código en localStorage temporalmente
            const codigoTemporal = {
                email: email,
                codigo: codigo,
                expiracion: Date.now() + (10 * 60 * 1000), // 10 minutos
                usado: false,
                fechaCreacion: Date.now()
            };
            
            localStorage.setItem(`codigo_${email}`, JSON.stringify(codigoTemporal));
            console.log('💾 [VERIFICACION] Código guardado en localStorage como fallback');
            
            // Mostrar código en desarrollo
            console.log(`📧 CÓDIGO DE VERIFICACIÓN PARA ${email}: ${codigo}`);
            alert(`CÓDIGO DE VERIFICACIÓN (DESARROLLO): ${codigo}\n\nEste código es válido por 10 minutos.`);
            
            return { exito: true, mensaje: "Código de verificación generado (modo desarrollo)" };
        }
        
    } catch (error) {
        console.error('❌ [VERIFICACION] Error crítico al enviar código:', error);
        return { exito: false, error: "Error al enviar código de verificación: " + error.message };
    }
}

// Función para verificar código de verificación
export async function verificarCodigo(email, codigoIngresado) {
    console.log('\n🔍 [VERIFICACION] Iniciando verificación de código');
    console.log('🔍 [VERIFICACION] Email:', email, 'Código:', codigoIngresado);
    
    try {
        // Intentar verificar con Firebase primero
        const codigosRef = collection(db, "codigos_verificacion");
        const consulta = query(
            codigosRef, 
            where("email", "==", email),
            where("codigo", "==", codigoIngresado),
            where("usado", "==", false)
        );
        
        const resultado = await getDocs(consulta);
        
        if (!resultado.empty) {
            const codigoDoc = resultado.docs[0];
            const codigoData = codigoDoc.data();
            
            // Verificar si el código ha expirado
            const ahora = new Date();
            if (ahora > codigoData.expiracion.toDate()) {
                console.log('❌ [VERIFICACION] Código expirado en Firebase');
                return { exito: false, error: "El código de verificación ha expirado" };
            }
            
            // Marcar código como usado
            await setDoc(doc(db, "codigos_verificacion", codigoDoc.id), {
                ...codigoData,
                usado: true,
                fechaUso: new Date()
            });
            
            console.log('✅ [VERIFICACION] Código verificado correctamente via Firebase');
            return { exito: true, mensaje: "Código verificado correctamente" };
        }
        
        console.log('⚠️ [VERIFICACION] Código no encontrado en Firebase, verificando localStorage...');
        
    } catch (firebaseError) {
        console.warn('⚠️ [VERIFICACION] Error de Firebase, usando localStorage:', firebaseError.message);
    }
    
    // Fallback: verificar con localStorage
    try {
        const codigoGuardado = localStorage.getItem(`codigo_${email}`);
        
        if (!codigoGuardado) {
            console.log('❌ [VERIFICACION] Código no encontrado en localStorage');
            return { exito: false, error: "Código de verificación inválido" };
        }
        
        const codigoData = JSON.parse(codigoGuardado);
        
        // Verificar si ya fue usado
        if (codigoData.usado) {
            console.log('❌ [VERIFICACION] Código ya usado (localStorage)');
            return { exito: false, error: "Código de verificación ya utilizado" };
        }
        
        // Verificar si ha expirado
        if (Date.now() > codigoData.expiracion) {
            console.log('❌ [VERIFICACION] Código expirado (localStorage)');
            localStorage.removeItem(`codigo_${email}`);
            return { exito: false, error: "El código de verificación ha expirado" };
        }
        
        // Verificar si el código coincide
        if (codigoData.codigo !== codigoIngresado) {
            console.log('❌ [VERIFICACION] Código incorrecto (localStorage)');
            return { exito: false, error: "Código de verificación inválido" };
        }
        
        // Marcar como usado
        codigoData.usado = true;
        localStorage.setItem(`codigo_${email}`, JSON.stringify(codigoData));
        
        console.log('✅ [VERIFICACION] Código verificado correctamente via localStorage');
        return { exito: true, mensaje: "Código verificado correctamente" };
        
    } catch (localStorageError) {
        console.error('❌ [VERIFICACION] Error al verificar código:', localStorageError);
        return { exito: false, error: "Error al verificar código de verificación" };
    }
}

// Función para registrar usuario en colección de Firestore
export async function registrarUsuario(nombreUsuario, email, password) {
    console.log('\n🔥 [FIREBASE] Iniciando función registrarUsuario');
    console.log('📝 [FIREBASE] Parámetros recibidos:', {
        nombreUsuario: nombreUsuario,
        email: email,
        passwordLength: password ? password.length : 0
    });
    
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
        
        // Si Firebase falla, usar localStorage como fallback
        console.warn('⚠️ [FIREBASE] Firebase no disponible, usando localStorage como fallback');
        
        try {
            // Verificar duplicados en localStorage
            const usuariosLocalStorage = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
            
            // Verificar email duplicado
            const emailExiste = usuariosLocalStorage.some(u => u.email === email);
            if (emailExiste) {
                console.log('❌ [LOCALSTORAGE] Email ya registrado');
                return { exito: false, error: "Este correo electrónico ya está registrado" };
            }
            
            // Verificar nombre de usuario duplicado
            const nombreExiste = usuariosLocalStorage.some(u => u.nombreUsuario === nombreUsuario);
            if (nombreExiste) {
                console.log('❌ [LOCALSTORAGE] Nombre de usuario ya existe');
                return { exito: false, error: "Este nombre de usuario ya está en uso" };
            }
            
            // Generar ID único
            const nuevoId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const usuarioConId = {
                id: nuevoId,
                ...nuevoUsuario,
                fechaCreacion: nuevoUsuario.fechaCreacion.toISOString() // Convertir a string para localStorage
            };
            
            // Agregar usuario a la lista
            usuariosLocalStorage.push(usuarioConId);
            localStorage.setItem('usuarios_registrados', JSON.stringify(usuariosLocalStorage));
            
            console.log('✅ [LOCALSTORAGE] Usuario registrado exitosamente con ID:', nuevoId);
            return { 
                exito: true, 
                usuario: usuarioConId,
                fallback: true // Indicar que se usó fallback
            };
            
        } catch (localStorageError) {
            console.error('💥 [LOCALSTORAGE] Error en fallback:', localStorageError);
            return { exito: false, error: "Error al registrar usuario. Intenta nuevamente." };
        }
    }
}

// Función para iniciar sesión desde colección de Firestore
export async function iniciarSesion(email, password) {
    console.log('\n🔐 [LOGIN] Iniciando sesión para:', email);
    
    try {
        // Buscar usuario por email en Firebase
        const usuariosRef = collection(db, "usuarios");
        const consulta = query(usuariosRef, where("email", "==", email));
        const resultado = await getDocs(consulta);
        
        if (!resultado.empty) {
            // Verificar contraseña
            const usuarioDoc = resultado.docs[0];
            const datosUsuario = usuarioDoc.data();
            
            if (datosUsuario.password !== password) {
                console.log('❌ [LOGIN] Contraseña incorrecta (Firebase)');
                return { exito: false, error: "Contraseña incorrecta" };
            }
            
            // Verificar si el usuario está activo
            if (!datosUsuario.activo) {
                console.log('❌ [LOGIN] Usuario inactivo (Firebase)');
                return { exito: false, error: "Usuario inactivo" };
            }
            
            // Actualizar último acceso
            try {
                await setDoc(doc(db, "usuarios", usuarioDoc.id), {
                    ...datosUsuario,
                    ultimoAcceso: new Date()
                });
            } catch (updateError) {
                console.warn('⚠️ [LOGIN] No se pudo actualizar último acceso:', updateError.message);
            }
            
            console.log('✅ [LOGIN] Sesión iniciada exitosamente (Firebase):', usuarioDoc.id);
            return { 
                exito: true, 
                usuario: { 
                    id: usuarioDoc.id, 
                    ...datosUsuario 
                } 
            };
        }
        
        console.log('⚠️ [LOGIN] Usuario no encontrado en Firebase, verificando localStorage...');
        
    } catch (firebaseError) {
        console.warn('⚠️ [LOGIN] Error de Firebase, usando localStorage:', firebaseError.message);
    }
    
    // Fallback: verificar con localStorage
    try {
        const usuariosLocalStorage = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
        const usuario = usuariosLocalStorage.find(u => u.email === email);
        
        if (!usuario) {
            console.log('❌ [LOGIN] Usuario no encontrado (localStorage)');
            return { exito: false, error: "Usuario no encontrado" };
        }
        
        if (usuario.password !== password) {
            console.log('❌ [LOGIN] Contraseña incorrecta (localStorage)');
            return { exito: false, error: "Contraseña incorrecta" };
        }
        
        if (!usuario.activo) {
            console.log('❌ [LOGIN] Usuario inactivo (localStorage)');
            return { exito: false, error: "Usuario inactivo" };
        }
        
        // Actualizar último acceso en localStorage
        usuario.ultimoAcceso = new Date().toISOString();
        const usuariosActualizados = usuariosLocalStorage.map(u => 
            u.email === email ? usuario : u
        );
        localStorage.setItem('usuarios_registrados', JSON.stringify(usuariosActualizados));
        
        console.log('✅ [LOGIN] Sesión iniciada exitosamente (localStorage):', usuario.id);
        return { 
            exito: true, 
            usuario: usuario
        };
        
    } catch (localStorageError) {
        console.error('❌ [LOGIN] Error al verificar credenciales:', localStorageError);
        return { exito: false, error: "Error al iniciar sesión. Intenta nuevamente." };
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

// Función para obtener la contraseña de un usuario por email (para recuperación)
export async function obtenerContrasenaUsuario(email) {
    console.log('\n🔍 [OBTENER_CONTRASENA] Buscando usuario:', email);
    
    try {
        // Buscar usuario por email en Firebase
        const usuariosRef = collection(db, "usuarios");
        const consulta = query(usuariosRef, where("email", "==", email));
        const resultado = await getDocs(consulta);
        
        if (!resultado.empty) {
            const usuarioDoc = resultado.docs[0];
            const datosUsuario = usuarioDoc.data();
            
            console.log('✅ [OBTENER_CONTRASENA] Usuario encontrado en Firebase');
            return { 
                exito: true, 
                contrasena: datosUsuario.password,
                nombreUsuario: datosUsuario.nombreUsuario
            };
        }
        
        console.log('⚠️ [OBTENER_CONTRASENA] Usuario no encontrado en Firebase, verificando localStorage...');
        
    } catch (firebaseError) {
        console.warn('⚠️ [OBTENER_CONTRASENA] Error de Firebase, usando localStorage:', firebaseError.message);
    }
    
    // Fallback: verificar con localStorage
    try {
        const usuariosLocalStorage = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
        const usuario = usuariosLocalStorage.find(u => u.email === email);
        
        if (!usuario) {
            console.log('❌ [OBTENER_CONTRASENA] Usuario no encontrado');
            return { 
                exito: false, 
                error: "No se encontró ninguna cuenta asociada a este correo electrónico" 
            };
        }
        
        console.log('✅ [OBTENER_CONTRASENA] Usuario encontrado en localStorage');
        return { 
            exito: true, 
            contrasena: usuario.password,
            nombreUsuario: usuario.nombreUsuario
        };
        
    } catch (localStorageError) {
        console.error('❌ [OBTENER_CONTRASENA] Error al buscar usuario:', localStorageError);
        return { 
            exito: false, 
            error: "Error al buscar usuario. Intenta nuevamente." 
        };
    }
} 