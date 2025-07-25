# 📧 Configuración de EmailJS para Envío Gratuito de Emails

## 🚀 ¿Qué es EmailJS?

EmailJS es un servicio que permite enviar emails directamente desde el frontend (JavaScript) sin necesidad de un servidor backend. Ofrece **200 emails gratis por mes**, perfecto para aplicaciones pequeñas y medianas.

## 📋 Pasos para Configurar EmailJS (100% Gratuito)

### Paso 1: Crear Cuenta en EmailJS

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Haz clic en **"Sign Up"**
3. Crea tu cuenta gratuita con tu email
4. Confirma tu email

### Paso 2: Configurar un Servicio de Email

1. Una vez logueado, ve a **"Email Services"** en el menú lateral
2. Haz clic en **"Add New Service"**
3. Selecciona tu proveedor de email (recomendado: **Gmail**)
4. Sigue estos pasos para Gmail:
   - Selecciona **"Gmail"**
   - Haz clic en **"Connect Account"**
   - Autoriza EmailJS para usar tu cuenta de Gmail
   - Asigna un **Service ID** (ejemplo: `service_gmail_123`)

### Paso 3: Crear una Plantilla de Email

1. Ve a **"Email Templates"** en el menú lateral
2. Haz clic en **"Create New Template"**
3. Configura la plantilla así:

```
Subject: Código de Verificación - App Ventas Martin

Content:
Hola {{to_name}},

Tu código de verificación es: **{{verification_code}}**

Este código expira en 10 minutos.

Si no solicitaste este código, ignora este mensaje.

Saludos,
{{from_name}}
```

4. En **"Settings"**:
   - **Template Name**: `Verificacion Email`
   - **Template ID**: `template_verificacion` (anota este ID)

5. Guarda la plantilla

### Paso 4: Obtener las Claves de API

1. Ve a **"Account"** → **"API Keys"**
2. Copia tu **Public Key** (ejemplo: `user_abc123def456`)

### Paso 5: Configurar el Código

Abre el archivo `emailjs-config.js` y reemplaza los valores:

```javascript
const EMAILJS_CONFIG = {
    // Tu Public Key de EmailJS
    PUBLIC_KEY: 'user_abc123def456',  // ← Reemplaza con tu Public Key
    
    // Tu Service ID 
    SERVICE_ID: 'service_gmail_123',  // ← Reemplaza con tu Service ID
    
    // Tu Template ID
    TEMPLATE_ID: 'template_verificacion'  // ← Reemplaza con tu Template ID
};
```

## 🧪 Probar la Configuración

1. Abre tu aplicación en el navegador
2. Ve al formulario de registro
3. Llena los datos y haz clic en "Enviar Código de Verificación"
4. Si está configurado correctamente, recibirás un email real
5. Si no está configurado, verás un alert con el código (modo desarrollo)

## 📊 Límites del Plan Gratuito

- **200 emails por mes** (suficiente para la mayoría de aplicaciones)
- **Todos los proveedores de email soportados** (Gmail, Outlook, Yahoo, etc.)
- **Sin límite de plantillas**
- **Soporte básico**

## 🔧 Alternativas Gratuitas Adicionales

### Opción 2: Formspree (Alternativa)
- 50 envíos gratis por mes
- Más simple de configurar
- URL: https://formspree.io/

### Opción 3: Netlify Forms (Si usas Netlify)
- 100 envíos gratis por mes
- Integración automática con Netlify

### Opción 4: Firebase Functions + Nodemailer
- Más complejo pero completamente gratuito
- Requiere configuración de servidor

## 🛠️ Solución de Problemas

### Error: "Template not found"
- Verifica que el `TEMPLATE_ID` sea correcto
- Asegúrate de que la plantilla esté guardada

### Error: "Service not found"
- Verifica que el `SERVICE_ID` sea correcto
- Asegúrate de que el servicio esté conectado

### Error: "Invalid public key"
- Verifica que el `PUBLIC_KEY` sea correcto
- Asegúrate de usar la clave pública, no la privada

### No llegan los emails
- Revisa la carpeta de spam
- Verifica que el email de origen esté verificado
- Comprueba los límites de tu plan

## 📝 Ejemplo de Email que Recibirás

```
De: tu-email@gmail.com
Para: usuario@ejemplo.com
Asunto: Código de Verificación - App Ventas Martin

Hola Juan,

Tu código de verificación es: **123456**

Este código expira en 10 minutos.

Si no solicitaste este código, ignora este mensaje.

Saludos,
App Ventas Martin
```

## 🎯 Ventajas de EmailJS

✅ **Completamente gratuito** hasta 200 emails/mes  
✅ **No requiere backend** - funciona desde el frontend  
✅ **Fácil de configurar** - solo JavaScript  
✅ **Múltiples proveedores** - Gmail, Outlook, etc.  
✅ **Plantillas personalizables**  
✅ **Estadísticas básicas**  

¡Con esta configuración tendrás un sistema de verificación por email completamente funcional y gratuito! 🚀