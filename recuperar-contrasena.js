// Importar funciones de Firebase
import { enviarCodigoVerificacion, verificarCodigo, obtenerContrasenaUsuario } from './firebase-config.js';

console.log('=== INICIO - Cargando recuperar-contrasena.js ===');

// Variables de estado para el proceso de verificación
let estadoRecuperacion = {
    codigoEnviado: false,
    emailVerificado: false,
    emailUsuario: null,
    contrasenaRecuperada: null
};

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
        max-width: 90%;
        text-align: center;
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
    
    // Remover mensaje después de 7 segundos (más tiempo para leer)
    setTimeout(() => {
        if (elementoMensaje.parentNode) {
            elementoMensaje.remove();
        }
    }, 7000);
}

// Función para validar el email
function validarEmail(email) {
    console.log(`[VALIDACION] Email: ${email}`);
    
    if (!email || !email.trim()) {
        return { valido: false, mensaje: "El correo electrónico es requerido" };
    }
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valido: false, mensaje: "Correo electrónico inválido" };
    }
    
    console.log('[VALIDACION] ✅ Email válido');
    return { valido: true };
}

// Función para cambiar el estado del botón
function cambiarEstadoBoton(boton, cargando = false, texto = null) {
    if (!boton) {
        console.error('[BOTON] Error: Botón no encontrado');
        return;
    }
    
    if (cargando) {
        console.log('[BOTON] Cambiando a estado: Cargando...');
        boton.disabled = true;
        boton.textContent = texto || 'Cargando...';
        boton.style.opacity = '0.7';
    } else {
        console.log('[BOTON] Cambiando a estado: Normal');
        boton.disabled = false;
        boton.textContent = texto || 'Recuperar Contraseña';
        boton.style.opacity = '1';
    }
}

// Función para mostrar/ocultar elementos del formulario
function mostrarElemento(elemento, mostrar = true) {
    if (elemento) {
        elemento.style.display = mostrar ? 'block' : 'none';
    }
}

// Función para mostrar la contraseña con opción de copiar
function mostrarContrasena(contrasena) {
    console.log('[CONTRASENA] Mostrando contraseña recuperada');
    
    const contenedorContrasena = document.getElementById('contenedor-contrasena');
    const contrasenaElement = document.getElementById('contrasena-mostrada');
    const botonCopiar = document.getElementById('boton-copiar');
    
    if (contenedorContrasena && contrasenaElement && botonCopiar) {
        // Mostrar la contraseña
        contrasenaElement.textContent = contrasena;
        contenedorContrasena.style.display = 'block';
        
        // Agregar animación de entrada
        contenedorContrasena.style.animation = 'slideInUp 0.5s ease-out';
        
        // Configurar botón de copiar (solo una vez)
        if (!botonCopiar.hasAttribute('data-configurado')) {
            botonCopiar.setAttribute('data-configurado', 'true');
            
            botonCopiar.addEventListener('click', async function() {
                try {
                    await navigator.clipboard.writeText(contrasena);
                    
                    // Cambiar temporalmente el texto del botón
                    const textoOriginal = this.innerHTML;
                    this.classList.add('copiado');
                    this.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        ¡Copiado!
                    `;
                    
                    // Vibración en móviles (si está disponible)
                    if (navigator.vibrate) {
                        navigator.vibrate(100);
                    }
                    
                    // Restaurar después de 2 segundos
                    setTimeout(() => {
                        this.innerHTML = textoOriginal;
                        this.classList.remove('copiado');
                    }, 2000);
                    
                    mostrarMensaje('Contraseña copiada al portapapeles', 'exito');
                    
                } catch (error) {
                    console.error('[COPIAR] Error al copiar:', error);
                    
                    // Fallback: seleccionar texto para móviles
                    try {
                        contrasenaElement.select();
                        contrasenaElement.setSelectionRange(0, 99999); // Para móviles
                        document.execCommand('copy');
                        mostrarMensaje('Contraseña copiada (método alternativo)', 'exito');
                    } catch (fallbackError) {
                        // Último recurso: seleccionar texto visualmente
                        const range = document.createRange();
                        range.selectNode(contrasenaElement);
                        window.getSelection().removeAllRanges();
                        window.getSelection().addRange(range);
                        mostrarMensaje('Contraseña seleccionada. Mantén presionado y selecciona "Copiar"', 'info');
                    }
                }
            });
        }
        
        // Scroll suave hacia la contraseña en móviles
        setTimeout(() => {
            contenedorContrasena.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }
}

// Función para enviar código de verificación
async function manejarEnvioCodigo() {
    console.log('\n=== ENVIANDO CÓDIGO DE VERIFICACIÓN PARA RECUPERACIÓN ===');
    
    try {
        const email = document.getElementById('email-recuperacion')?.value || '';
        const botonEnviar = document.getElementById('boton-enviar-codigo');
        
        // Validar email antes de enviar código
        const validacion = validarEmail(email);
        if (!validacion.valido) {
            mostrarMensaje(validacion.mensaje, 'error');
            return;
        }
        
        // Verificar que el usuario existe antes de enviar código
        const usuarioExiste = await obtenerContrasenaUsuario(email);
        if (!usuarioExiste.exito) {
            mostrarMensaje('No se encontró ninguna cuenta asociada a este correo electrónico', 'error');
            return;
        }
        
        // Guardar email temporalmente
        estadoRecuperacion.emailUsuario = email;
        
        // Cambiar estado del botón
        cambiarEstadoBoton(botonEnviar, true, 'Enviando código...');
        
        // Enviar código de verificación
        const resultado = await enviarCodigoVerificacion(email, 'Usuario');
        
        if (resultado && resultado.exito) {
            console.log('[VERIFICACION] ✅ Código enviado correctamente');
            mostrarMensaje('Código de verificación enviado a tu correo', 'exito');
            
            // Actualizar estado
            estadoRecuperacion.codigoEnviado = true;
            
            // Mostrar campo de verificación
            const campoVerificacion = document.getElementById('campo-verificacion');
            mostrarElemento(campoVerificacion, true);
            
            // Ocultar botón de enviar código y cambiar texto del botón principal
            mostrarElemento(botonEnviar, false);
            const botonRecuperacion = document.querySelector('button[type="submit"]');
            cambiarEstadoBoton(botonRecuperacion, false, 'Verificar y Mostrar Contraseña');
            
            // Enfocar el campo de código
            const campoCodigoVerificacion = document.getElementById('codigo-verificacion');
            if (campoCodigoVerificacion) {
                campoCodigoVerificacion.focus();
            }
            
        } else {
            console.error('[VERIFICACION] ❌ Error:', resultado ? resultado.error : 'Resultado vacío');
            const mensajeError = resultado?.error || 'Error desconocido al enviar código';
            mostrarMensaje(mensajeError, 'error');
        }
        
    } catch (error) {
        console.error('[VERIFICACION] ❌ Excepción:', error);
        mostrarMensaje('Error al enviar código de verificación: ' + error.message, 'error');
    } finally {
        const botonEnviar = document.getElementById('boton-enviar-codigo');
        cambiarEstadoBoton(botonEnviar, false, 'Enviar Código de Verificación');
    }
}

// Función principal para manejar la recuperación de contraseña
async function manejarRecuperacion(evento) {
    console.log('\n=== INICIO DEL PROCESO DE RECUPERACIÓN ===');
    evento.preventDefault();
    
    try {
        const boton = evento.target.querySelector('button[type="submit"]');
        
        // Si no se ha enviado el código, mostrar botón para enviarlo
        if (!estadoRecuperacion.codigoEnviado) {
            console.log('[RECUPERACION] Paso 1: Mostrar opción para enviar código');
            
            // Validar email básico
            const email = document.getElementById('email-recuperacion')?.value || '';
            
            const validacion = validarEmail(email);
            if (!validacion.valido) {
                mostrarMensaje(validacion.mensaje, 'error');
                return;
            }
            
            // Mostrar botón para enviar código
            const botonEnviarCodigo = document.getElementById('boton-enviar-codigo');
            mostrarElemento(botonEnviarCodigo, true);
            cambiarEstadoBoton(boton, false, 'Primero envía el código de verificación');
            boton.disabled = true;
            
            mostrarMensaje('Haz clic en "Enviar Código de Verificación" para continuar', 'info');
            return;
        }
        
        // Si el código fue enviado pero no verificado, verificar código
        if (estadoRecuperacion.codigoEnviado && !estadoRecuperacion.emailVerificado) {
            console.log('[RECUPERACION] Paso 2: Verificar código');
            
            const codigoIngresado = document.getElementById('codigo-verificacion')?.value || '';
            
            if (!codigoIngresado || codigoIngresado.length !== 6) {
                mostrarMensaje('Por favor, ingresa el código de verificación de 6 dígitos', 'error');
                return;
            }
            
            cambiarEstadoBoton(boton, true, 'Verificando código...');
            
            // Verificar código
            const resultadoVerificacion = await verificarCodigo(estadoRecuperacion.emailUsuario, codigoIngresado);
            
            if (!resultadoVerificacion.exito) {
                mostrarMensaje(resultadoVerificacion.error, 'error');
                cambiarEstadoBoton(boton, false, 'Verificar y Mostrar Contraseña');
                return;
            }
            
            // Código verificado correctamente, obtener contraseña
            console.log('[VERIFICACION] ✅ Email verificado correctamente');
            estadoRecuperacion.emailVerificado = true;
            
            // Obtener la contraseña del usuario
            const resultadoContrasena = await obtenerContrasenaUsuario(estadoRecuperacion.emailUsuario);
            
            if (resultadoContrasena.exito) {
                estadoRecuperacion.contrasenaRecuperada = resultadoContrasena.contrasena;
                
                // Mostrar la contraseña
                mostrarContrasena(resultadoContrasena.contrasena);
                
                // Ocultar el botón principal
                boton.style.display = 'none';
                
                mostrarMensaje('¡Contraseña recuperada exitosamente!', 'exito');
                
                // Limpiar campos
                document.getElementById('email-recuperacion').value = '';
                document.getElementById('codigo-verificacion').value = '';
                
            } else {
                mostrarMensaje('Error al obtener la contraseña', 'error');
                cambiarEstadoBoton(boton, false, 'Verificar y Mostrar Contraseña');
            }
        }
        
    } catch (error) {
        console.error('[RECUPERACION] ❌ EXCEPCIÓN:', error);
        mostrarMensaje('Error inesperado. Por favor, intenta nuevamente.', 'error');
        const boton = evento.target.querySelector('button[type="submit"]');
        cambiarEstadoBoton(boton, false, 'Recuperar Contraseña');
    }
    
    console.log('=== FIN DEL PROCESO DE RECUPERACIÓN ===\n');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DOM] Documento cargado, inicializando recuperación...');
    
    const formulario = document.querySelector('.formulario-recuperacion');
    const botonEnviarCodigo = document.getElementById('boton-enviar-codigo');
    
    if (formulario) {
        console.log('[DOM] ✅ Formulario encontrado, agregando event listener');
        formulario.addEventListener('submit', manejarRecuperacion);
        
        // Event listener para el botón de enviar código
        if (botonEnviarCodigo) {
            console.log('[DOM] ✅ Botón enviar código encontrado, agregando event listener');
            botonEnviarCodigo.addEventListener('click', manejarEnvioCodigo);
        }
        
        // Validación en tiempo real para el email
        const campoEmail = document.getElementById('email-recuperacion');
        const campoCodigoVerificacion = document.getElementById('codigo-verificacion');
        
        console.log('[DOM] Campos encontrados:', {
            email: !!campoEmail,
            codigoVerificacion: !!campoCodigoVerificacion
        });
        
        if (campoEmail) {
            // Validación visual en tiempo real
            campoEmail.addEventListener('blur', function() {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (this.value.trim() && !emailRegex.test(this.value)) {
                    this.style.borderColor = '#f44336';
                } else {
                    this.style.borderColor = '#e0e0e0';
                }
            });
            
            // Restaurar color al enfocar
            campoEmail.addEventListener('focus', function() {
                this.style.borderColor = '#6200ee';
            });
        }
        
        // Validación en tiempo real para el código de verificación
        if (campoCodigoVerificacion) {
            campoCodigoVerificacion.addEventListener('input', function(e) {
                // Solo permitir números y limitar a 6 dígitos
                e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
            });
        }
        
    } else {
        console.error('[DOM] ❌ No se encontró el formulario de recuperación');
    }
});

console.log('=== FIN - recuperar-contrasena.js cargado ===');