// Configuración de EmailJS para envío gratuito de emails
// INSTRUCCIONES DE CONFIGURACIÓN:
// 1. Ve a https://www.emailjs.com/ y crea una cuenta gratuita
// 2. Configura un servicio de email (Gmail recomendado)
// 3. Crea una plantilla de email
// 4. Reemplaza los valores de abajo con tus datos reales

const EMAILJS_CONFIG = {
    // Tu Public Key de EmailJS (se obtiene en Account > API Keys)
    PUBLIC_KEY: 'aPuQ4wZS4N4UDi-Sg',
    
    // Tu Service ID (ya configurado)
    SERVICE_ID: 'service_cyns1hc',
    
    // Tu Template ID (se obtiene en Email Templates)
    TEMPLATE_ID: 'template_ud2ms8s'
};

// Inicializar EmailJS
function inicializarEmailJS() {
    try {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
            console.log('✅ [EMAILJS] Inicializado correctamente');
            return true;
        } else {
            console.error('❌ [EMAILJS] SDK no cargado');
            return false;
        }
    } catch (error) {
        console.error('❌ [EMAILJS] Error al inicializar:', error);
        return false;
    }
}

// Función para enviar email con código de verificación
export async function enviarEmailVerificacion(email, nombreUsuario, codigo) {
    console.log('\n📧 [EMAILJS] Enviando email de verificación');
    console.log('📧 [EMAILJS] Destinatario:', email);
    console.log('📧 [EMAILJS] Código:', codigo);
    
    try {
        // Verificar si EmailJS está configurado
        if (EMAILJS_CONFIG.PUBLIC_KEY === 'TU_PUBLIC_KEY_AQUI') {
            console.warn('⚠️ [EMAILJS] Configuración pendiente - usando modo desarrollo');
            // En modo desarrollo, mostrar el código
            alert(`CÓDIGO DE VERIFICACIÓN (DESARROLLO): ${codigo}\n\nPara producción, configura EmailJS en emailjs-config.js`);
            return { exito: true, mensaje: "Código enviado (modo desarrollo)" };
        }
        
        // Inicializar EmailJS si no está inicializado
        if (!inicializarEmailJS()) {
            throw new Error('No se pudo inicializar EmailJS');
        }
        
        // Parámetros para la plantilla de email
        const parametrosEmail = {
            to_email: email,
            to_name: nombreUsuario,
            verification_code: codigo,
            from_name: 'App Ventas Martin',
            message: `Tu código de verificación es: ${codigo}. Este código expira en 10 minutos.`
        };
        
        console.log('📤 [EMAILJS] Enviando email...');
        console.log('📧 [EMAILJS] Parámetros enviados:', parametrosEmail);
        
        // Enviar email usando EmailJS
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            parametrosEmail
        );
        
        console.log('✅ [EMAILJS] Email enviado exitosamente:', response);
        return { 
            exito: true, 
            mensaje: "Código de verificación enviado a tu correo",
            response: response 
        };
        
    } catch (error) {
        console.error('❌ [EMAILJS] Error al enviar email:', error);
        
        // Fallback: mostrar código en desarrollo si falla el envío
        if (error.text && error.text.includes('template')) {
            console.warn('⚠️ [EMAILJS] Error de plantilla - usando modo desarrollo');
            alert(`CÓDIGO DE VERIFICACIÓN (FALLBACK): ${codigo}\n\nError: ${error.text}`);
            return { exito: true, mensaje: "Código enviado (modo fallback)" };
        }
        
        return { 
            exito: false, 
            error: `Error al enviar email: ${error.text || error.message || 'Error desconocido'}` 
        };
    }
}

// Función para verificar si EmailJS está configurado
export function verificarConfiguracionEmailJS() {
    const configurado = EMAILJS_CONFIG.PUBLIC_KEY !== 'TU_PUBLIC_KEY_AQUI' &&
                       EMAILJS_CONFIG.SERVICE_ID !== 'TU_SERVICE_ID_AQUI' &&
                       EMAILJS_CONFIG.TEMPLATE_ID !== 'TU_TEMPLATE_ID_AQUI';
    
    console.log(`[EMAILJS] Configuración: ${configurado ? 'COMPLETA' : 'PENDIENTE'}`);
    return configurado;
}

// Auto-inicializar cuando se carga el script
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        inicializarEmailJS();
        verificarConfiguracionEmailJS();
    }, 100);
});