# Instrucciones para Configurar Firebase

## 🔥 Pasos para obtener la configuración de Firebase

### 1. Ir a la Consola de Firebase
- Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
- Selecciona tu proyecto "App Ventas Martin"

### 2. Obtener la configuración web
1. En el panel lateral izquierdo, haz clic en el ícono de configuración (⚙️)
2. Selecciona "Configuración del proyecto"
3. Baja hasta la sección "Tus aplicaciones"
4. Si no tienes una aplicación web, haz clic en "Agregar aplicación" y selecciona el ícono web (`</>`)
5. Si ya tienes una aplicación web, haz clic en el ícono de configuración

### 3. Copiar la configuración
Verás algo como esto:
```javascript
const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "app-ventas-martin.firebaseapp.com",
  projectId: "app-ventas-martin",
  storageBucket: "app-ventas-martin.appspot.com",
  messagingSenderId: "309262005814",
  appId: "1:309262005814:web:d1d3fc9df63f55e31cca97"
};
```

### 4. Actualizar firebase-config.js
- Abre el archivo `firebase-config.js`
- Reemplaza la línea que dice `apiKey: "AIzaSyBY3Y8n8Q2QbOHYVfKJC3Q0nU4v1s3Y5M8"` con tu API key real

### 5. Configurar Authentication
1. En la consola de Firebase, ve a "Authentication" en el menú lateral
2. Haz clic en "Get started"
3. Ve a la pestaña "Sign-in method"
4. Habilita "Email/password"

### 6. Configurar Firestore Database
1. Ve a "Firestore Database" en el menú lateral
2. Haz clic en "Crear base de datos"
3. Selecciona "Iniciar en modo de prueba" (para desarrollo)
4. Elige una ubicación (recomendado: us-central)

### 7. Reglas de seguridad (temporales para pruebas)
En Firestore, ve a "Rules" y usa estas reglas temporales:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## ⚠️ Notas importantes
- Las reglas actuales permiten lectura/escritura solo a usuarios autenticados
- Para producción, deberás configurar reglas más específicas
- La API key no es secreta en aplicaciones web del lado del cliente

## 🚀 Uso de la aplicación
1. Abre `index.html` en tu navegador
2. Regístrate con un email y contraseña
3. Inicia sesión con las credenciales creadas

## 🛠️ Solución de problemas
- Si ves errores de CORS, asegúrate de estar sirviendo los archivos desde un servidor web
- Puedes usar Live Server en VSCode o Python: `python -m http.server 8000`
- Verifica que todas las URLs en firebase-config.js sean correctas 