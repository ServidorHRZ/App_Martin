// Sistema de chat para asesores
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    addDoc,
    onSnapshot,
    orderBy,
    updateDoc,
    serverTimestamp,
    limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class ChatAsesor {
    constructor(db, usuarioActual) {
        this.db = db;
        this.usuarioActual = usuarioActual;
        this.conversacionActual = null;
        this.unsubscribeConversaciones = null;
        this.unsubscribeMensajes = null;
        this.conversaciones = new Map();
        
        this.inicializar();
    }

    inicializar() {
        console.log('Inicializando ChatAsesor para usuario:', this.usuarioActual);
        this.crearElementosUI();
        this.configurarEventListeners();
        this.escucharConversaciones();
    }

    crearElementosUI() {
        // Botón flotante de chat
        const chatFlotante = document.createElement('button');
        chatFlotante.className = 'chat-flotante';
        chatFlotante.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        chatFlotante.title = 'Abrir chats';
        chatFlotante.onclick = () => this.mostrarListaChats();
        document.body.appendChild(chatFlotante);
        this.chatFlotante = chatFlotante;

        // Modal de lista de chats
        const modalChats = document.createElement('div');
        modalChats.className = 'modal-chats';
        modalChats.innerHTML = `
            <div class="contenedor-lista-chats">
                <div class="header-lista-chats">
                    <h3>Conversaciones</h3>
                    <button class="cerrar-lista-chats" onclick="chatAsesor.cerrarListaChats()">&times;</button>
                </div>
                <div class="lista-conversaciones" id="listaConversaciones">
                    <div class="sin-conversaciones">
                        <h3>No hay conversaciones</h3>
                        <p>Las conversaciones aparecerán aquí cuando los clientes te escriban</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalChats);
        this.modalChats = modalChats;

        // Modal de chat individual
        const modalChat = document.createElement('div');
        modalChat.className = 'modal-chat';
        modalChat.innerHTML = `
            <div class="contenedor-chat">
                <div class="header-chat">
                    <div class="info-cliente-chat">
                        <div class="avatar-cliente" id="avatarCliente">C</div>
                        <div class="nombre-cliente-chat" id="nombreClienteChat">Cliente</div>
                    </div>
                    <button class="cerrar-chat" onclick="chatAsesor.cerrarChat()">&times;</button>
                </div>
                <div class="mensajes-container" id="mensajesContainer">
                    <!-- Mensajes se cargan aquí -->
                </div>
                <div class="input-container">
                    <div class="input-mensaje">
                        <textarea 
                            class="campo-mensaje" 
                            id="campoMensaje" 
                            placeholder="Escribe tu mensaje..."
                            rows="1"
                        ></textarea>
                        <button class="btn-enviar" id="btnEnviar" onclick="chatAsesor.enviarMensaje()">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalChat);
        this.modalChat = modalChat;
    }

    configurarEventListeners() {
        // Auto-resize del textarea
        const campoMensaje = document.getElementById('campoMensaje');
        campoMensaje.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });

        // Enviar mensaje con Enter
        campoMensaje.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.enviarMensaje();
            }
        });

        // Cerrar modales al hacer clic fuera
        this.modalChats.addEventListener('click', (e) => {
            if (e.target === this.modalChats) {
                this.cerrarListaChats();
            }
        });

        this.modalChat.addEventListener('click', (e) => {
            if (e.target === this.modalChat) {
                this.cerrarChat();
            }
        });
    }

    async escucharConversaciones() {
        try {
            console.log('Iniciando escucha de conversaciones para:', this.usuarioActual.email);
            
            const conversacionesRef = collection(this.db, 'conversaciones');
            
            // Primero intentar sin orderBy para evitar problemas de índice
            const q = query(
                conversacionesRef,
                where('asesorEmail', '==', this.usuarioActual.email)
            );

            this.unsubscribeConversaciones = onSnapshot(q, (snapshot) => {
                console.log('Conversaciones encontradas:', snapshot.size);
                snapshot.forEach(doc => {
                    console.log('Conversación:', doc.id, doc.data());
                });
                this.actualizarListaConversaciones(snapshot);
            }, (error) => {
                console.error('Error en onSnapshot:', error);
                // Si falla, intentar consulta más simple
                this.escucharConversacionesSimple();
            });
        } catch (error) {
            console.error('Error escuchando conversaciones:', error);
            // Fallback a consulta simple
            this.escucharConversacionesSimple();
        }
    }

    async escucharConversacionesSimple() {
        try {
            console.log('Usando consulta simple para conversaciones');
            const conversacionesRef = collection(this.db, 'conversaciones');
            
            this.unsubscribeConversaciones = onSnapshot(conversacionesRef, (snapshot) => {
                console.log('Total conversaciones en BD:', snapshot.size);
                
                // Filtrar manualmente las conversaciones del asesor
                const conversacionesAsesor = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.asesorEmail === this.usuarioActual.email) {
                        conversacionesAsesor.push({id: doc.id, data: data});
                    }
                });
                
                console.log('Conversaciones del asesor:', conversacionesAsesor.length);
                this.actualizarListaConversacionesFiltradas(conversacionesAsesor);
            });
        } catch (error) {
            console.error('Error en consulta simple:', error);
        }
    }

    actualizarListaConversaciones(snapshot) {
        const listaConversaciones = document.getElementById('listaConversaciones');
        
        if (snapshot.empty) {
            listaConversaciones.innerHTML = `
                <div class="sin-conversaciones">
                    <h3>No hay conversaciones</h3>
                    <p>Las conversaciones aparecerán aquí cuando los clientes te escriban</p>
                </div>
            `;
            this.actualizarBadgeChat(0);
            return;
        }

        let html = '';
        let totalMensajesNuevos = 0;

        snapshot.forEach((doc) => {
            const conversacion = doc.data();
            const conversacionId = doc.id;
            
            // Guardar conversación en el mapa
            this.conversaciones.set(conversacionId, conversacion);

            const fechaUltima = conversacion.ultimaActividad?.toDate();
            const fechaFormateada = fechaUltima ? this.formatearFecha(fechaUltima) : '';
            
            const mensajesNuevos = conversacion.mensajesNuevosAsesor || 0;
            totalMensajesNuevos += mensajesNuevos;

            const iniciales = this.obtenerIniciales(conversacion.clienteNombre || conversacion.clienteEmail);

            html += `
                <div class="conversacion-item" onclick="chatAsesor.abrirChat('${conversacionId}')">
                    <div class="cliente-nombre">${conversacion.clienteNombre || conversacion.clienteEmail}</div>
                    <div class="ultimo-mensaje">${conversacion.ultimoMensaje || 'Nueva conversación'}</div>
                    <div class="fecha-ultimo-mensaje">${fechaFormateada}</div>
                    ${mensajesNuevos > 0 ? `<div class="badge-mensajes-nuevos">${mensajesNuevos}</div>` : ''}
                </div>
            `;
        });

        listaConversaciones.innerHTML = html;
        this.actualizarBadgeChat(totalMensajesNuevos);
    }

    actualizarListaConversacionesFiltradas(conversacionesArray) {
        const listaConversaciones = document.getElementById('listaConversaciones');
        
        if (conversacionesArray.length === 0) {
            listaConversaciones.innerHTML = `
                <div class="sin-conversaciones">
                    <h3>No hay conversaciones</h3>
                    <p>Las conversaciones aparecerán aquí cuando los clientes te escriban</p>
                </div>
            `;
            this.actualizarBadgeChat(0);
            return;
        }

        let html = '';
        let totalMensajesNuevos = 0;

        // Ordenar por última actividad (más reciente primero)
        conversacionesArray.sort((a, b) => {
            const fechaA = a.data.ultimaActividad?.toDate() || new Date(0);
            const fechaB = b.data.ultimaActividad?.toDate() || new Date(0);
            return fechaB - fechaA;
        });

        conversacionesArray.forEach((item) => {
            const conversacion = item.data;
            const conversacionId = item.id;
            
            // Guardar conversación en el mapa
            this.conversaciones.set(conversacionId, conversacion);

            const fechaUltima = conversacion.ultimaActividad?.toDate();
            const fechaFormateada = fechaUltima ? this.formatearFecha(fechaUltima) : '';
            
            const mensajesNuevos = conversacion.mensajesNuevosAsesor || 0;
            totalMensajesNuevos += mensajesNuevos;

            const iniciales = this.obtenerIniciales(conversacion.clienteNombre || conversacion.clienteEmail);

            html += `
                <div class="conversacion-item" onclick="chatAsesor.abrirChat('${conversacionId}')">
                    <div class="cliente-nombre">${conversacion.clienteNombre || conversacion.clienteEmail}</div>
                    <div class="ultimo-mensaje">${conversacion.ultimoMensaje || 'Nueva conversación'}</div>
                    <div class="fecha-ultimo-mensaje">${fechaFormateada}</div>
                    ${mensajesNuevos > 0 ? `<div class="badge-mensajes-nuevos">${mensajesNuevos}</div>` : ''}
                </div>
            `;
        });

        listaConversaciones.innerHTML = html;
        this.actualizarBadgeChat(totalMensajesNuevos);
    }

    actualizarBadgeChat(cantidad) {
        if (cantidad > 0) {
            this.chatFlotante.classList.add('tiene-mensajes');
            this.chatFlotante.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span style="position:absolute;top:-5px;right:-5px;background:#dc3545;color:white;border-radius:50%;width:20px;height:20px;font-size:12px;display:flex;align-items:center;justify-content:center;">${cantidad > 99 ? '99+' : cantidad}</span>
            `;
        } else {
            this.chatFlotante.classList.remove('tiene-mensajes');
            this.chatFlotante.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
    }

    mostrarListaChats() {
        console.log('Abriendo lista de chats. Usuario actual:', this.usuarioActual.email);
        console.log('Conversaciones en memoria:', this.conversaciones.size);
        this.modalChats.classList.add('mostrar');
    }

    cerrarListaChats() {
        this.modalChats.classList.remove('mostrar');
    }

    async abrirChat(conversacionId) {
        this.conversacionActual = conversacionId;
        const conversacion = this.conversaciones.get(conversacionId);
        
        if (!conversacion) return;

        // Actualizar UI del chat
        document.getElementById('avatarCliente').textContent = this.obtenerIniciales(conversacion.clienteNombre || conversacion.clienteEmail);
        document.getElementById('nombreClienteChat').textContent = conversacion.clienteNombre || conversacion.clienteEmail;

        // Marcar mensajes como leídos
        await this.marcarMensajesComoLeidos(conversacionId);

        // Cerrar lista y abrir chat
        this.cerrarListaChats();
        this.modalChat.classList.add('mostrar');

        // Escuchar mensajes de esta conversación
        this.escucharMensajes(conversacionId);
    }

    async marcarMensajesComoLeidos(conversacionId) {
        try {
            const conversacionRef = doc(this.db, 'conversaciones', conversacionId);
            await updateDoc(conversacionRef, {
                mensajesNuevosAsesor: 0
            });
        } catch (error) {
            console.error('Error marcando mensajes como leídos:', error);
        }
    }

    escucharMensajes(conversacionId) {
        // Limpiar listener anterior
        if (this.unsubscribeMensajes) {
            this.unsubscribeMensajes();
        }

        const mensajesRef = collection(this.db, 'conversaciones', conversacionId, 'mensajes');
        const q = query(mensajesRef, orderBy('timestamp', 'asc'));

        this.unsubscribeMensajes = onSnapshot(q, (snapshot) => {
            this.actualizarMensajes(snapshot);
        });
    }

    actualizarMensajes(snapshot) {
        const mensajesContainer = document.getElementById('mensajesContainer');
        
        if (snapshot.empty) {
            mensajesContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>Inicia la conversación con el cliente</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((doc) => {
            const mensaje = doc.data();
            const esEnviado = mensaje.remitente === 'asesor';
            const fecha = mensaje.timestamp?.toDate();
            const horaFormateada = fecha ? fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }) : '';

            // Verificar si es un mensaje con imagen
            if (mensaje.tipo === 'imagen' && mensaje.imagen) {
                html += `
                    <div class="mensaje ${esEnviado ? 'enviado' : 'recibido'}">
                        <div class="mensaje-contenido mensaje-imagen">
                            <img src="${mensaje.imagen}" alt="Imagen enviada" class="imagen-mensaje" onclick="this.requestFullscreen()">
                            <div class="mensaje-hora">${horaFormateada}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="mensaje ${esEnviado ? 'enviado' : 'recibido'}">
                        <div class="mensaje-contenido">
                            ${mensaje.texto}
                            <div class="mensaje-hora">${horaFormateada}</div>
                        </div>
                    </div>
                `;
            }
        });

        mensajesContainer.innerHTML = html;
        
        // Scroll al final
        setTimeout(() => {
            mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
        }, 100);
    }

    async enviarMensaje() {
        const campoMensaje = document.getElementById('campoMensaje');
        const btnEnviar = document.getElementById('btnEnviar');
        const texto = campoMensaje.value.trim();

        if (!texto || !this.conversacionActual) return;

        try {
            btnEnviar.disabled = true;
            campoMensaje.disabled = true;

            // Agregar mensaje a la subcolección
            const mensajesRef = collection(this.db, 'conversaciones', this.conversacionActual, 'mensajes');
            await addDoc(mensajesRef, {
                texto: texto,
                remitente: 'asesor',
                timestamp: serverTimestamp()
            });

            // Actualizar conversación principal
            const conversacionRef = doc(this.db, 'conversaciones', this.conversacionActual);
            await updateDoc(conversacionRef, {
                ultimoMensaje: texto,
                ultimaActividad: serverTimestamp(),
                mensajesNuevosCliente: (this.conversaciones.get(this.conversacionActual)?.mensajesNuevosCliente || 0) + 1
            });

            // Limpiar campo
            campoMensaje.value = '';
            campoMensaje.style.height = 'auto';

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            this.mostrarToast('Error al enviar mensaje', 'error');
        } finally {
            btnEnviar.disabled = false;
            campoMensaje.disabled = false;
            campoMensaje.focus();
        }
    }

    cerrarChat() {
        this.modalChat.classList.remove('mostrar');
        
        // Limpiar listener de mensajes
        if (this.unsubscribeMensajes) {
            this.unsubscribeMensajes();
            this.unsubscribeMensajes = null;
        }
        
        this.conversacionActual = null;
        
        // Limpiar campo de mensaje
        document.getElementById('campoMensaje').value = '';
        document.getElementById('campoMensaje').style.height = 'auto';
    }

    obtenerIniciales(nombre) {
        if (!nombre) return 'C';
        const palabras = nombre.split(' ');
        if (palabras.length >= 2) {
            return (palabras[0][0] + palabras[1][0]).toUpperCase();
        }
        return nombre[0].toUpperCase();
    }

    formatearFecha(fecha) {
        const ahora = new Date();
        const diff = ahora - fecha;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (minutos < 1) return 'Ahora';
        if (minutos < 60) return `${minutos}m`;
        if (horas < 24) return `${horas}h`;
        if (dias < 7) return `${dias}d`;
        
        return fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    }

    mostrarToast(mensaje, tipo = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${tipo === 'error' ? 'error' : ''}`;
        toast.textContent = mensaje;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('mostrar'), 100);
        setTimeout(() => {
            toast.classList.remove('mostrar');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    destruir() {
        if (this.unsubscribeConversaciones) {
            this.unsubscribeConversaciones();
        }
        if (this.unsubscribeMensajes) {
            this.unsubscribeMensajes();
        }
    }
}

// Exportar para uso global
window.ChatAsesor = ChatAsesor;

// Función de prueba para debugging
window.probarChatAsesor = async function() {
    if (!window.chatAsesor) {
        console.error('ChatAsesor no está inicializado');
        return;
    }
    
    console.log('=== PRUEBA DE CHAT ASESOR ===');
    console.log('Usuario actual:', window.chatAsesor.usuarioActual);
    console.log('Base de datos:', window.chatAsesor.db);
    console.log('Conversaciones en memoria:', window.chatAsesor.conversaciones.size);
    
    // Probar consulta manual
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const conversacionesRef = collection(window.chatAsesor.db, 'conversaciones');
        const snapshot = await getDocs(conversacionesRef);
        
        console.log('Total conversaciones en BD:', snapshot.size);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log('Conversación encontrada:', {
                id: doc.id,
                asesorEmail: data.asesorEmail,
                clienteEmail: data.clienteEmail,
                ultimoMensaje: data.ultimoMensaje
            });
        });
    } catch (error) {
        console.error('Error en prueba manual:', error);
    }
};