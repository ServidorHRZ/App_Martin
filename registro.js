// Importar funciones de Firebase
import { registrarUsuario } from './firebase-config.js';

console.log('=== INICIO - Cargando registro.js ===');

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
    console.log(`[MENSAJE] Tipo: ${tipo}, Mensaje: ${mensaje}`);
    
    // Remover mensaje anterior si existe
    const mensajeAnterior = document.querySelector('.mensaje-estado');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }
    
    // Crear nuevo elemento de mensaje
    const elementoMensaje = document.createElement('div');
    elementoMensaje.className = `mensaje-estado ${tipo}`;
    elementoMensaje.textContent = mensaje;
    
    // Estilos para el mensaje
    elementoMensaje.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1001;
        animation: slideDown 0.3s ease-out;
        ${tipo === 'error' ? 'background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2;' : ''}
        ${tipo === 'exito' ? 'background-color: #e8f5e8; color: #2e7d32; border: 1px solid #c8e6c9;' : ''}
        ${tipo === 'info' ? 'background-color: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb;' : ''}
    `;
    
    // Agregar animación CSS
    if (!document.querySelector('#animacion-mensaje')) {
        const style = document.createElement('style');
        style.id = 'animacion-mensaje';
        style.textContent = `
            @keyframes slideDown {
                from { transform: translate(-50%, -100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(elementoMensaje);
    
    // Remover mensaje después de 5 segundos
    setTimeout(() => {
        if (elementoMensaje.parentNode) {
            elementoMensaje.remove();
        }
    }, 5000);
}

// Función para validar el formulario
function validarFormulario(nombreUsuario, email, password) {
    console.log(`[VALIDACION] Nombre: ${nombreUsuario}, Email: ${email}, Password length: ${password ? password.length : 0}`);
    
    if (!nombreUsuario || !nombreUsuario.trim()) {
        return { valido: false, mensaje: "El nombre de usuario es requerido" };
    }
    
    if (nombreUsuario.trim().length < 3) {
        return { valido: false, mensaje: "El nombre de usuario debe tener al menos 3 caracteres" };
    }
    
    if (!email || !email.trim()) {
        return { valido: false, mensaje: "El correo electrónico es requerido" };
    }
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valido: false, mensaje: "Correo electrónico inválido" };
    }
    
    if (!password) {
        return { valido: false, mensaje: "La contraseña es requerida" };
    }
    
    if (password.length < 6) {
        return { valido: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
    }
    
    console.log('[VALIDACION] ✅ Todos los datos son válidos');
    return { valido: true };
}

// Función para cambiar el estado del botón
function cambiarEstadoBoton(boton, cargando = false) {
    if (!boton) {
        console.error('[BOTON] Error: Botón no encontrado');
        return;
    }
    
    if (cargando) {
        console.log('[BOTON] Cambiando a estado: Cargando...');
        boton.disabled = true;
        boton.textContent = 'Registrando...';
        boton.style.opacity = '0.7';
    } else {
        console.log('[BOTON] Cambiando a estado: Normal');
        boton.disabled = false;
        boton.textContent = 'Registrarse';
        boton.style.opacity = '1';
    }
}

// Función principal para manejar el registro
async function manejarRegistro(evento) {
    console.log('\n=== INICIO DEL PROCESO DE REGISTRO ===');
    evento.preventDefault();
    
    try {
        // Obtener elementos del formulario
        const nombreUsuario = document.getElementById('nombre')?.value || '';
        const email = document.getElementById('email')?.value || '';
        const password = document.getElementById('password')?.value || '';
        const boton = evento.target.querySelector('.boton-registrarse');
        
        console.log('[FORMULARIO] Datos obtenidos:', {
            nombre: nombreUsuario,
            email: email,
            passwordLength: password.length
        });
        
        // Validar formulario
        const validacion = validarFormulario(nombreUsuario, email, password);
        if (!validacion.valido) {
            console.error('[VALIDACION] ❌ Error:', validacion.mensaje);
            mostrarMensaje(validacion.mensaje, 'error');
            return;
        }
        
        // Cambiar estado del botón
        cambiarEstadoBoton(boton, true);
        
        console.log('[FIREBASE] Intentando registrar usuario...');
        
        // Intentar registrar usuario
        const resultado = await registrarUsuario(nombreUsuario, email, password);
        
        console.log('[FIREBASE] Resultado del registro:', resultado);
        
        if (resultado && resultado.exito) {
            console.log('[REGISTRO] ✅ ÉXITO: Usuario registrado correctamente');
            mostrarMensaje('¡Usuario registrado exitosamente!', 'exito');
            
            // Limpiar formulario
            const campoNombre = document.getElementById('nombre');
            const campoEmail = document.getElementById('email');
            const campoPassword = document.getElementById('password');
            
            if (campoNombre) campoNombre.value = '';
            if (campoEmail) campoEmail.value = '';
            if (campoPassword) campoPassword.value = '';
            
            console.log('[REGISTRO] Formulario limpiado, redirigiendo en 2 segundos...');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                console.log('[REGISTRO] Redirigiendo a index.html');
                window.location.href = 'index.html';
            }, 2000);
            
        } else {
            console.error('[REGISTRO] ❌ ERROR:', resultado ? resultado.error : 'Resultado vacío');
            const mensajeError = resultado?.error || 'Error desconocido en el registro';
            mostrarMensaje(mensajeError, 'error');
        }
        
    } catch (error) {
        console.error('[REGISTRO] ❌ EXCEPCIÓN:', error);
        mostrarMensaje('Error inesperado. Por favor, intenta nuevamente.', 'error');
    } finally {
        // Restaurar estado del botón
        const boton = evento.target.querySelector('.boton-registrarse');
        cambiarEstadoBoton(boton, false);
        console.log('=== FIN DEL PROCESO DE REGISTRO ===\n');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DOM] Documento cargado, inicializando...');
    
    const formulario = document.querySelector('.formulario-registro');
    
    if (formulario) {
        console.log('[DOM] ✅ Formulario encontrado, agregando event listener');
        formulario.addEventListener('submit', manejarRegistro);
        
        // Validación en tiempo real
        const campoNombre = document.getElementById('nombre');
        const campoEmail = document.getElementById('email');
        const campoPassword = document.getElementById('password');
        
        console.log('[DOM] Campos encontrados:', {
            nombre: !!campoNombre,
            email: !!campoEmail,
            password: !!campoPassword
        });
        
    } else {
        console.error('[DOM] ❌ No se encontró el formulario de registro');
    }
});

console.log('=== FIN - registro.js cargado ==='); 