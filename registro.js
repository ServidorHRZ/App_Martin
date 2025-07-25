// Importar funciones de Firebase
import { registrarUsuario, enviarCodigoVerificacion, verificarCodigo } from './firebase-config.js';

console.log('=== INICIO - Cargando registro.js ===');

// Variables de estado para el proceso de verificación
let estadoVerificacion = {
    codigoEnviado: false,
    emailVerificado: false,
    datosUsuario: null
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
        boton.textContent = texto || 'Registrarse';
        boton.style.opacity = '1';
    }
}

// Función para mostrar/ocultar elementos del formulario
function mostrarElemento(elemento, mostrar = true) {
    if (elemento) {
        elemento.style.display = mostrar ? 'block' : 'none';
    }
}

// Función para actualizar el indicador de progreso
function actualizarProgreso(paso) {
    const pasos = ['paso-1', 'paso-2', 'paso-3'];
    
    pasos.forEach((pasoId, index) => {
        const elemento = document.getElementById(pasoId);
        if (elemento) {
            elemento.classList.remove('activo', 'completado');
            
            if (index < paso - 1) {
                elemento.classList.add('completado');
            } else if (index === paso - 1) {
                elemento.classList.add('activo');
            }
        }
    });
}

// Función para enviar código de verificación
async function manejarEnvioCodigo() {
    console.log('\n=== ENVIANDO CÓDIGO DE VERIFICACIÓN ===');
    
    try {
        const email = document.getElementById('email')?.value || '';
        const nombreUsuario = document.getElementById('nombre')?.value || '';
        const password = document.getElementById('password')?.value || '';
        const botonEnviar = document.getElementById('boton-enviar-codigo');
        
        // Validar datos básicos antes de enviar código
        const validacion = validarFormulario(nombreUsuario, email, password);
        if (!validacion.valido) {
            mostrarMensaje(validacion.mensaje, 'error');
            return;
        }
        
        // Guardar datos temporalmente
        estadoVerificacion.datosUsuario = { nombreUsuario, email, password };
        
        // Cambiar estado del botón
        cambiarEstadoBoton(botonEnviar, true, 'Enviando código...');
        
        // Enviar código de verificación
        const resultado = await enviarCodigoVerificacion(email, nombreUsuario);
        
        if (resultado && resultado.exito) {
            console.log('[VERIFICACION] ✅ Código enviado correctamente');
            mostrarMensaje('Código de verificación enviado a tu correo', 'exito');
            
            // Actualizar estado
            estadoVerificacion.codigoEnviado = true;
            
            // Mostrar campo de verificación
            const campoVerificacion = document.getElementById('campo-verificacion');
            mostrarElemento(campoVerificacion, true);
            
            // Ocultar botón de enviar código y cambiar texto del botón principal
            mostrarElemento(botonEnviar, false);
            const botonRegistro = document.querySelector('button[type="submit"]');
            cambiarEstadoBoton(botonRegistro, false, 'Verificar y Registrarse');
            
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

// Función principal para manejar el registro
async function manejarRegistro(evento) {
    console.log('\n=== INICIO DEL PROCESO DE REGISTRO ===');
    evento.preventDefault();
    
    try {
        const boton = evento.target.querySelector('button[type="submit"]');
        
        // Si no se ha enviado el código, mostrar botón para enviarlo
        if (!estadoVerificacion.codigoEnviado) {
            console.log('[REGISTRO] Paso 1: Mostrar opción para enviar código');
            
            // Actualizar progreso
            actualizarProgreso(1);
            
            // Validar datos básicos
            const nombreUsuario = document.getElementById('nombre')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const password = document.getElementById('password')?.value || '';
            
            const validacion = validarFormulario(nombreUsuario, email, password);
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
        if (estadoVerificacion.codigoEnviado && !estadoVerificacion.emailVerificado) {
            console.log('[REGISTRO] Paso 2: Verificar código');
            
            // Actualizar progreso
            actualizarProgreso(2);
            
            const codigoIngresado = document.getElementById('codigo-verificacion')?.value || '';
            
            if (!codigoIngresado || codigoIngresado.length !== 6) {
                mostrarMensaje('Por favor, ingresa el código de verificación de 6 dígitos', 'error');
                return;
            }
            
            cambiarEstadoBoton(boton, true, 'Verificando código...');
            
            // Verificar código
            const resultadoVerificacion = await verificarCodigo(estadoVerificacion.datosUsuario.email, codigoIngresado);
            
            if (!resultadoVerificacion.exito) {
                mostrarMensaje(resultadoVerificacion.error, 'error');
                cambiarEstadoBoton(boton, false, 'Verificar y Registrarse');
                return;
            }
            
            // Código verificado correctamente
            console.log('[VERIFICACION] ✅ Email verificado correctamente');
            estadoVerificacion.emailVerificado = true;
            mostrarMensaje('Email verificado correctamente', 'exito');
            cambiarEstadoBoton(boton, false, 'Completar Registro');
        }
        
        // Si el email está verificado, proceder con el registro
        if (estadoVerificacion.emailVerificado) {
            console.log('[REGISTRO] Paso 3: Completar registro');
            
            // Actualizar progreso
            actualizarProgreso(3);
            
            cambiarEstadoBoton(boton, true, 'Registrando usuario...');
            
            const { nombreUsuario, email, password } = estadoVerificacion.datosUsuario;
            
            // Registrar usuario
            const resultado = await registrarUsuario(nombreUsuario, email, password);
            
            if (resultado && resultado.exito) {
                console.log('[REGISTRO] ✅ ÉXITO: Usuario registrado correctamente');
                mostrarMensaje('¡Usuario registrado exitosamente!', 'exito');
                
                // Marcar todos los pasos como completados
                actualizarProgreso(4); // Paso extra para mostrar todo completado
                
                // Limpiar formulario y estado
                document.getElementById('nombre').value = '';
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
                document.getElementById('codigo-verificacion').value = '';
                
                // Resetear estado
                estadoVerificacion = {
                    codigoEnviado: false,
                    emailVerificado: false,
                    datosUsuario: null
                };
                
                console.log('[REGISTRO] Redirigiendo en 2 segundos...');
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } else {
                console.error('[REGISTRO] ❌ ERROR:', resultado ? resultado.error : 'Resultado vacío');
                const mensajeError = resultado?.error || 'Error desconocido en el registro';
                mostrarMensaje(mensajeError, 'error');
                cambiarEstadoBoton(boton, false, 'Completar Registro');
            }
        }
        
    } catch (error) {
        console.error('[REGISTRO] ❌ EXCEPCIÓN:', error);
        mostrarMensaje('Error inesperado. Por favor, intenta nuevamente.', 'error');
        const boton = evento.target.querySelector('button[type="submit"]');
        cambiarEstadoBoton(boton, false, 'Registrarse');
    }
    
    console.log('=== FIN DEL PROCESO DE REGISTRO ===\n');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DOM] Documento cargado, inicializando...');
    
    const formulario = document.querySelector('.formulario-registro');
    const botonEnviarCodigo = document.getElementById('boton-enviar-codigo');
    
    if (formulario) {
        console.log('[DOM] ✅ Formulario encontrado, agregando event listener');
        formulario.addEventListener('submit', manejarRegistro);
        
        // Event listener para el botón de enviar código
        if (botonEnviarCodigo) {
            console.log('[DOM] ✅ Botón enviar código encontrado, agregando event listener');
            botonEnviarCodigo.addEventListener('click', manejarEnvioCodigo);
        }
        
        // Validación en tiempo real
        const campoNombre = document.getElementById('nombre');
        const campoEmail = document.getElementById('email');
        const campoPassword = document.getElementById('password');
        const campoCodigoVerificacion = document.getElementById('codigo-verificacion');
        
        console.log('[DOM] Campos encontrados:', {
            nombre: !!campoNombre,
            email: !!campoEmail,
            password: !!campoPassword,
            codigoVerificacion: !!campoCodigoVerificacion
        });
        
        // Validación en tiempo real para el código de verificación
        if (campoCodigoVerificacion) {
            campoCodigoVerificacion.addEventListener('input', function(e) {
                // Solo permitir números y limitar a 6 dígitos
                e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
            });
        }
        
    } else {
        console.error('[DOM] ❌ No se encontró el formulario de registro');
    }
});

console.log('=== FIN - registro.js cargado ==='); 