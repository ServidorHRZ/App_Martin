// Importar funciones de Firebase
import { registrarUsuario } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAkGt9mcgneJCofgY5fwSyHWcKJVNUmUoU",
    authDomain: "app-ventas-martin.firebaseapp.com",
    projectId: "app-ventas-martin",
    storageBucket: "app-ventas-martin.firebasestorage.app",
    messagingSenderId: "309262005814",
    appId: "1:309262005814:web:d1d3fc9df63f55e31cca97",
    measurementId: "G-2ZZT0VSKT7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
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
    if (!nombreUsuario.trim()) {
        return { valido: false, mensaje: "El nombre de usuario es requerido" };
    }
    
    if (nombreUsuario.trim().length < 3) {
        return { valido: false, mensaje: "El nombre de usuario debe tener al menos 3 caracteres" };
    }
    
    if (!email.trim()) {
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
    
    return { valido: true };
}

// Función para cambiar el estado del botón
function cambiarEstadoBoton(boton, cargando = false) {
    if (cargando) {
        boton.disabled = true;
        boton.textContent = 'Registrando...';
        boton.style.opacity = '0.7';
    } else {
        boton.disabled = false;
        boton.textContent = 'Registrarse';
        boton.style.opacity = '1';
    }
}

// Función principal para manejar el registro
async function manejarRegistro(evento) {
    evento.preventDefault();
    
    // Obtener elementos del formulario
    const nombreUsuario = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const boton = evento.target.querySelector('.boton-registrarse');
    
    // Validar formulario
    const validacion = validarFormulario(nombreUsuario, email, password);
    if (!validacion.valido) {
        mostrarMensaje(validacion.mensaje, 'error');
        return;
    }
    
    // Cambiar estado del botón
    cambiarEstadoBoton(boton, true);
    
    try {
        // Intentar registrar usuario
        const resultado = await registrarUsuario(nombreUsuario, email, password);
        
        if (resultado.exito) {
            mostrarMensaje('¡Usuario registrado exitosamente!', 'exito');
            
            // Limpiar formulario
            document.getElementById('nombre').value = '';
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } else {
            mostrarMensaje(resultado.error, 'error');
        }
        
    } catch (error) {
        console.error('Error inesperado:', error);
        mostrarMensaje('Error inesperado. Por favor, intenta nuevamente.', 'error');
    } finally {
        // Restaurar estado del botón
        cambiarEstadoBoton(boton, false);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.querySelector('.formulario-registro');
    
    if (formulario) {
        formulario.addEventListener('submit', manejarRegistro);
        
        // Mejorar la experiencia de usuario con validación en tiempo real
        const campoNombre = document.getElementById('nombre');
        const campoEmail = document.getElementById('email');
        const campoPassword = document.getElementById('password');
        
        // Validación en tiempo real para el nombre
        campoNombre.addEventListener('blur', function() {
            if (this.value.trim() && this.value.trim().length < 3) {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });
        
        // Validación en tiempo real para el email
        campoEmail.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value.trim() && !emailRegex.test(this.value)) {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });
        
        // Validación en tiempo real para la contraseña
        campoPassword.addEventListener('blur', function() {
            if (this.value && this.value.length < 6) {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });
        
        // Restaurar color al enfocar
        [campoNombre, campoEmail, campoPassword].forEach(campo => {
            campo.addEventListener('focus', function() {
                this.style.borderColor = '#6200ee';
            });
        });
    }
});

// Registro normal de usuarios
document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.querySelector('.formulario-registro');
    
    formulario.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Guardar información en Firestore
            await addDoc(collection(db, 'usuarios'), {
                email: email,
                rol: 'cliente'
            });

            // Mostrar mensaje de éxito
            mostrarToast('Registro exitoso');
            
            // Redirigir al inicio de sesión
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            let mensajeError = 'Error en el registro';
            mostrarToast(mensajeError, 'error');
        }
    });
});

// Función para mostrar mensajes toast
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('mostrar');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

console.log('Script de registro cargado exitosamente'); 