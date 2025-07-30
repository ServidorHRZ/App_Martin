// Sistema de chat para clientes
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
    setDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class ChatCliente {
    constructor(db, usuarioActual) {
        this.db = db;
        this.usuarioActual = usuarioActual;
        this.conversacionActual = null;
        this.asesorSeleccionado = null;
        this.unsubscribeMensajes = null;
        this.unsubscribeConversacion = null;
        
        this.inicializar();
    }

    inicializar() {
        this.crearElementosUI();
        this.configurarEventListeners();
        this.verificarConversacionExistente();
    }

    crearElementosUI() {
        // El botón flotante ya existe en el HTML, solo necesitamos referenciarlo
        this.chatFlotante = document.querySelector('.chat-flotante-cliente');
        if (!this.chatFlotante) {
            console.error('Botón de chat flotante no encontrado');
            return;
        }

        // Modal de selección de asesor
        const modalSeleccion = document.createElement('div');
        modalSeleccion.className = 'modal-seleccion-asesor';
        modalSeleccion.innerHTML = `
            <div class="contenedor-seleccion-asesor">
                <div class="header-seleccion-asesor">
                    <h3>Selecciona un Asesor</h3>
                    <button class="cerrar-seleccion-asesor" onclick="chatCliente.cerrarSeleccionAsesor()">&times;</button>
                </div>
                <div id="conversacionExistente"></div>
                <div class="lista-asesores-chat" id="listaAsesoresChat">
                    <div class="sin-asesores">
                        <h3>Cargando asesores...</h3>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalSeleccion);
        this.modalSeleccion = modalSeleccion;

        // Modal de chat individual
        const modalChat = document.createElement('div');
        modalChat.className = 'modal-chat-cliente';
        modalChat.innerHTML = `
            <div class="contenedor-chat-cliente">
                <div class="header-chat-cliente">
                    <div class="info-asesor-chat">
                        <div class="avatar-asesor" id="avatarAsesor">A</div>
                        <div class="nombre-asesor-chat" id="nombreAsesorChat">Asesor</div>
                    </div>
                    <button class="cerrar-chat-cliente" onclick="chatCliente.cerrarChat()">&times;</button>
                </div>
                <div class="mensajes-container-cliente" id="mensajesContainerCliente">
                    <!-- Mensajes se cargan aquí -->
                </div>
                <div class="input-container-cliente">
                    <div class="input-mensaje-cliente">
                        <textarea 
                            class="campo-mensaje-cliente" 
                            id="campoMensajeCliente" 
                            placeholder="Escribe tu mensaje..."
                            rows="1"
                        ></textarea>
                        <button class="btn-enviar-cliente" id="btnEnviarCliente" onclick="chatCliente.enviarMensaje()">
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
        const campoMensaje = document.getElementById('campoMensajeCliente');
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
        this.modalSeleccion.addEventListener('click', (e) => {
            if (e.target === this.modalSeleccion) {
                this.cerrarSeleccionAsesor();
            }
        });

        this.modalChat.addEventListener('click', (e) => {
            if (e.target === this.modalChat) {
                this.cerrarChat();
            }
        });
    }

    async verificarConversacionExistente() {
        try {
            const conversacionesRef = collection(this.db, 'conversaciones');
            const q = query(
                conversacionesRef,
                where('clienteEmail', '==', this.usuarioActual.email)
            );

            this.unsubscribeConversacion = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const conversacion = snapshot.docs[0].data();
                    const conversacionId = snapshot.docs[0].id;
                    
                    // Verificar si hay mensajes nuevos del asesor
                    const mensajesNuevos = conversacion.mensajesNuevosCliente || 0;
                    this.actualizarBadgeChat(mensajesNuevos);
                    
                    // Guardar información de la conversación existente
                    this.conversacionExistente = {
                        id: conversacionId,
                        asesorEmail: conversacion.asesorEmail,
                        asesorNombre: conversacion.asesorNombre
                    };
                } else {
                    this.conversacionExistente = null;
                    this.actualizarBadgeChat(0);
                }
            });
        } catch (error) {
            console.error('Error verificando conversación existente:', error);
        }
    }

    actualizarBadgeChat(cantidad) {
        if (!this.chatFlotante) return;
        
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

    async mostrarSeleccionAsesor() {
        // Si ya existe una conversación, mostrar opción de continuar
        if (this.conversacionExistente) {
            document.getElementById('conversacionExistente').innerHTML = `
                <div class="conversacion-existente">
                    <h4>Conversación Activa</h4>
                    <p>Tienes una conversación activa con ${this.conversacionExistente.asesorNombre}</p>
                    <button class="btn-continuar-chat" onclick="chatCliente.continuarConversacion()">
                        Continuar Chat
                    </button>
                </div>
            `;
        } else {
            document.getElementById('conversacionExistente').innerHTML = '';
        }

        // Cargar lista de asesores
        await this.cargarAsesores();
        this.modalSeleccion.classList.add('mostrar');
    }

    async cargarAsesores() {
        try {
            const usuariosRef = collection(this.db, 'usuarios');
            const q = query(usuariosRef, where('rol', '==', 'asesor'));
            const snapshot = await getDocs(q);

            const listaAsesores = document.getElementById('listaAsesoresChat');

            if (snapshot.empty) {
                listaAsesores.innerHTML = `
                    <div class="sin-asesores">
                        <h3>No hay asesores disponibles</h3>
                        <p>Intenta más tarde</p>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach((doc) => {
                const asesor = doc.data();
                const iniciales = this.obtenerIniciales(asesor.nombreUsuario || asesor.email);

                html += `
                    <div class="asesor-chat-item" onclick="chatCliente.seleccionarAsesor('${asesor.email}', '${asesor.nombreUsuario || asesor.email}')">
                        <div class="asesor-avatar">${iniciales}</div>
                        <div class="asesor-info-chat">
                            <div class="asesor-nombre-chat">${asesor.nombreUsuario || asesor.email}</div>
                            <div class="asesor-estado-chat">Disponible</div>
                        </div>
                    </div>
                `;
            });

            listaAsesores.innerHTML = html;
        } catch (error) {
            console.error('Error cargando asesores:', error);
            document.getElementById('listaAsesoresChat').innerHTML = `
                <div class="sin-asesores">
                    <h3>Error al cargar asesores</h3>
                    <p>Intenta más tarde</p>
                </div>
            `;
        }
    }

    async seleccionarAsesor(asesorEmail, asesorNombre) {
        this.asesorSeleccionado = {
            email: asesorEmail,
            nombre: asesorNombre
        };

        // Crear o encontrar conversación
        await this.crearConversacion();
        
        // Cerrar selección y abrir chat
        this.cerrarSeleccionAsesor();
        this.abrirChat();
    }

    async continuarConversacion() {
        if (!this.conversacionExistente) return;

        this.conversacionActual = this.conversacionExistente.id;
        this.asesorSeleccionado = {
            email: this.conversacionExistente.asesorEmail,
            nombre: this.conversacionExistente.asesorNombre
        };

        // Marcar mensajes como leídos
        await this.marcarMensajesComoLeidos();

        this.cerrarSeleccionAsesor();
        this.abrirChat();
    }

    async crearConversacion() {
        try {
            // Verificar si ya existe una conversación
            const conversacionesRef = collection(this.db, 'conversaciones');
            const q = query(
                conversacionesRef,
                where('clienteEmail', '==', this.usuarioActual.email),
                where('asesorEmail', '==', this.asesorSeleccionado.email)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // Ya existe una conversación
                this.conversacionActual = snapshot.docs[0].id;
            } else {
                // Crear nueva conversación
                const nuevaConversacion = await addDoc(conversacionesRef, {
                    clienteEmail: this.usuarioActual.email,
                    clienteNombre: this.usuarioActual.displayName || this.usuarioActual.email,
                    asesorEmail: this.asesorSeleccionado.email,
                    asesorNombre: this.asesorSeleccionado.nombre,
                    ultimaActividad: serverTimestamp(),
                    ultimoMensaje: '',
                    mensajesNuevosCliente: 0,
                    mensajesNuevosAsesor: 0
                });

                this.conversacionActual = nuevaConversacion.id;
            }
        } catch (error) {
            console.error('Error creando conversación:', error);
            this.mostrarToast('Error al iniciar conversación', 'error');
        }
    }

    async marcarMensajesComoLeidos() {
        try {
            const conversacionRef = doc(this.db, 'conversaciones', this.conversacionActual);
            await updateDoc(conversacionRef, {
                mensajesNuevosCliente: 0
            });
        } catch (error) {
            console.error('Error marcando mensajes como leídos:', error);
        }
    }

    abrirChat() {
        // Actualizar UI del chat
        document.getElementById('avatarAsesor').textContent = this.obtenerIniciales(this.asesorSeleccionado.nombre);
        document.getElementById('nombreAsesorChat').textContent = this.asesorSeleccionado.nombre;

        // Mostrar modal de chat
        this.modalChat.classList.add('mostrar');

        // Escuchar mensajes de esta conversación
        this.escucharMensajes();
    }

    escucharMensajes() {
        // Limpiar listener anterior
        if (this.unsubscribeMensajes) {
            this.unsubscribeMensajes();
        }

        const mensajesRef = collection(this.db, 'conversaciones', this.conversacionActual, 'mensajes');
        const q = query(mensajesRef, orderBy('timestamp', 'asc'));

        this.unsubscribeMensajes = onSnapshot(q, (snapshot) => {
            this.actualizarMensajes(snapshot);
            // Marcar mensajes como leídos cuando se abren
            this.marcarMensajesComoLeidos();
        });
    }

    actualizarMensajes(snapshot) {
        const mensajesContainer = document.getElementById('mensajesContainerCliente');
        
        if (snapshot.empty) {
            mensajesContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>¡Hola! Escribe tu primera pregunta al asesor</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((doc) => {
            const mensaje = doc.data();
            const esEnviado = mensaje.remitente === 'cliente';
            const fecha = mensaje.timestamp?.toDate();
            const horaFormateada = fecha ? fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }) : '';

            html += `
                <div class="mensaje-cliente ${esEnviado ? 'enviado' : 'recibido'}">
                    <div class="mensaje-contenido-cliente">
                        ${mensaje.texto}
                        <div class="mensaje-hora-cliente">${horaFormateada}</div>
                    </div>
                </div>
            `;
        });

        mensajesContainer.innerHTML = html;
        
        // Scroll al final
        setTimeout(() => {
            mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
        }, 100);
    }

    async enviarMensaje() {
        const campoMensaje = document.getElementById('campoMensajeCliente');
        const btnEnviar = document.getElementById('btnEnviarCliente');
        const texto = campoMensaje.value.trim();

        if (!texto || !this.conversacionActual) return;

        try {
            btnEnviar.disabled = true;
            campoMensaje.disabled = true;

            // Agregar mensaje a la subcolección
            const mensajesRef = collection(this.db, 'conversaciones', this.conversacionActual, 'mensajes');
            await addDoc(mensajesRef, {
                texto: texto,
                remitente: 'cliente',
                timestamp: serverTimestamp()
            });

            // Actualizar conversación principal
            const conversacionRef = doc(this.db, 'conversaciones', this.conversacionActual);
            await updateDoc(conversacionRef, {
                ultimoMensaje: texto,
                ultimaActividad: serverTimestamp(),
                mensajesNuevosAsesor: (await getDoc(conversacionRef)).data()?.mensajesNuevosAsesor + 1 || 1
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

    cerrarSeleccionAsesor() {
        this.modalSeleccion.classList.remove('mostrar');
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
        document.getElementById('campoMensajeCliente').value = '';
        document.getElementById('campoMensajeCliente').style.height = 'auto';
    }

    obtenerIniciales(nombre) {
        if (!nombre) return 'A';
        const palabras = nombre.split(' ');
        if (palabras.length >= 2) {
            return (palabras[0][0] + palabras[1][0]).toUpperCase();
        }
        return nombre[0].toUpperCase();
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
        if (this.unsubscribeMensajes) {
            this.unsubscribeMensajes();
        }
        if (this.unsubscribeConversacion) {
            this.unsubscribeConversacion();
        }
    }
}

// Exportar para uso global
window.ChatCliente = ChatCliente;