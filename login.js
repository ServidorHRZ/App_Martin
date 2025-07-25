// Importar funciones de Firebase
import { iniciarSesion, obtenerUsuarioActual, establecerUsuarioActual } from './firebase-config.js';

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
        top: 20px;
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
    
    // Agregar animación CSS si no existe
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

// Función para validar el formulario de login
function validarFormularioLogin(email, password) {
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
    
    return { valido: true };
}

// Función para cambiar el estado del botón
function cambiarEstadoBoton(boton, cargando = false) {
    const indicadorCarga = boton.querySelector('.indicador-carga');
    const textoBoton = boton.querySelector('.texto-boton');
    
    if (cargando) {
        boton.disabled = true;
        boton.classList.add('cargando');
        if (textoBoton) textoBoton.textContent = 'Iniciando...';
        
        // Vibración en móviles (si está disponible)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    } else {
        boton.disabled = false;
        boton.classList.remove('cargando');
        if (textoBoton) textoBoton.textContent = 'Iniciar Sesión';
    }
}

// Función para crear la página principal después del login
function crearPaginaPrincipal(usuario) {
    const nombre = usuario.nombreUsuario || 'Usuario';
    
    document.body.innerHTML = `
        <div class="contenedor-principal" style="
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
        ">
            <div class="bienvenida" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                border-radius: 20px;
                margin-bottom: 30px;
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            ">
                <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 300;">¡Bienvenido!</h1>
                <p style="margin: 0; font-size: 18px; opacity: 0.9;">${nombre}</p>
            </div>
            
            <div class="informacion-usuario" style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                text-align: left;
            ">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">Información de la cuenta</h3>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #666;">Email:</strong> 
                    <span style="color: #333;">${usuario.email}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #666;">Estado:</strong> 
                    <span style="color: #4caf50;">Conectado</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #666;">Último acceso:</strong> 
                    <span style="color: #333;">${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}</span>
                </div>
            </div>
            
            <div class="acciones" style="
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            ">
                <button id="boton-cerrar-sesion" style="
                    background-color: #f44336;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 3px 10px rgba(244,67,54,0.3);
                ">
                    Cerrar Sesión
                </button>
                
                <button id="boton-volver-login" style="
                    background-color: #2196f3;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 3px 10px rgba(33,150,243,0.3);
                ">
                    Volver al Login
                </button>
            </div>
        </div>
    `;
    
    // Agregar eventos a los botones
    document.getElementById('boton-cerrar-sesion').addEventListener('click', async () => {
        const { cerrarSesion } = await import('./firebase-config.js');
        const resultado = await cerrarSesion();
        if (resultado.exito) {
            mostrarMensaje('Sesión cerrada exitosamente', 'exito');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    });
    
    document.getElementById('boton-volver-login').addEventListener('click', () => {
        location.reload();
    });
    
    // Agregar efectos hover a los botones
    const botones = document.querySelectorAll('button');
    botones.forEach(boton => {
        boton.addEventListener('mouseenter', () => {
            boton.style.transform = 'translateY(-2px)';
        });
        boton.addEventListener('mouseleave', () => {
            boton.style.transform = 'translateY(0)';
        });
    });
}

// Función principal para manejar el login
async function manejarLogin(evento) {
    evento.preventDefault();
    
    // Obtener elementos del formulario
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const boton = evento.target.querySelector('.boton-login-principal');
    
    // Validar formulario
    const validacion = validarFormularioLogin(email, password);
    if (!validacion.valido) {
        mostrarMensaje(validacion.mensaje, 'error');
        return;
    }
    
    // Cambiar estado del botón
    cambiarEstadoBoton(boton, true);
    
    try {
        // Intentar iniciar sesión
        const resultado = await iniciarSesion(email, password);
        
        if (resultado.exito) {
            mostrarMensaje('¡Inicio de sesión exitoso!', 'exito');
            
            // Establecer el usuario actual en la sesión
            establecerUsuarioActual(resultado.usuario);
            
            // Redirigir según el rol del usuario
            setTimeout(() => {
                if (resultado.usuario.rol === 'admin') {
                    window.location.href = 'panel_admin.html';
                } else if (resultado.usuario.rol === 'asesor') {
                    window.location.href = 'panel_asesor.html';
                } else {
                    window.location.href = 'cliente.html';
                }
            }, 1500);
            
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
document.addEventListener('DOMContentLoaded', async function() {
    const formulario = document.querySelector('.formulario-login');
    
    if (formulario) {
        formulario.addEventListener('submit', manejarLogin);
        
        // Mejorar la experiencia de usuario con validación en tiempo real
        const campoEmail = document.getElementById('email');
        const campoPassword = document.getElementById('password');
        
        // Validación en tiempo real para el email
        campoEmail.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value.trim() && !emailRegex.test(this.value)) {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });
        
        // Restaurar color al enfocar
        [campoEmail, campoPassword].forEach(campo => {
            campo.addEventListener('focus', function() {
                this.style.borderColor = '#6200ee';
            });
        });
        
        // Agregar funcionalidad de Enter en los campos
        [campoEmail, campoPassword].forEach(campo => {
            campo.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    formulario.dispatchEvent(new Event('submit'));
                }
            });
        });
    }
});

console.log('Script de login cargado exitosamente'); 