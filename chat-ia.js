// Sistema de chat con IA Gemini para asesoramiento del negocio
class ChatIA {
    constructor() {
        this.apiKey = 'AIzaSyCQFlK1a9lxjX17WIg6FKEMH3BlXJZYMV0';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        this.conversacion = [];
        this.inicializar();
    }

    inicializar() {
        this.crearElementosUI();
        this.configurarEventListeners();
    }

    crearElementosUI() {
        // No crear botón flotante, solo el modal

        // Modal de chat con IA
        const modalIA = document.createElement('div');
        modalIA.className = 'modal-chat-ia';
        modalIA.innerHTML = `
            <div class="contenedor-chat-ia">
                <div class="header-chat-ia">
                    <div class="info-ia">
                        <div class="avatar-ia">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="nombre-ia">Asesor IA - XSHOP</div>
                    </div>
                    <button class="cerrar-chat-ia" onclick="chatIA.cerrarChat()">&times;</button>
                </div>
                <div class="mensajes-container-ia" id="mensajesContainerIA">
                    <div class="mensaje-ia recibido">
                        <div class="mensaje-contenido-ia">
                            ¡Hola! Soy tu asesor virtual de XSHOP. Puedo ayudarte con:
                            <br><br>
                            • Información sobre productos
                            • Recomendaciones de compra
                            • Dudas sobre tallas y colores
                            • Proceso de pedidos
                            • Métodos de pago y envío
                            • Políticas de la tienda
                            <br><br>
                            ¿En qué puedo ayudarte hoy?
                        </div>
                    </div>
                </div>
                <div class="input-container-ia">
                    <div class="input-mensaje-ia">
                        <textarea 
                            class="campo-mensaje-ia" 
                            id="campoMensajeIA" 
                            placeholder="Pregúntame sobre productos, tallas, envíos..."
                            rows="1"
                        ></textarea>
                        <button class="btn-enviar-ia" id="btnEnviarIA" onclick="chatIA.enviarMensaje()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalIA);
        this.modalIA = modalIA;
    }

    configurarEventListeners() {
        // Auto-resize del textarea
        const campoMensaje = document.getElementById('campoMensajeIA');
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

        // Cerrar modal al hacer clic fuera
        this.modalIA.addEventListener('click', (e) => {
            if (e.target === this.modalIA) {
                this.cerrarChat();
            }
        });
    }

    abrirChatIA() {
        this.modalIA.classList.add('mostrar');
        document.getElementById('campoMensajeIA').focus();
    }

    cerrarChat() {
        this.modalIA.classList.remove('mostrar');
        document.getElementById('campoMensajeIA').value = '';
        document.getElementById('campoMensajeIA').style.height = 'auto';
    }

    async enviarMensaje() {
        const campoMensaje = document.getElementById('campoMensajeIA');
        const btnEnviar = document.getElementById('btnEnviarIA');
        const texto = campoMensaje.value.trim();

        if (!texto) return;

        try {
            btnEnviar.disabled = true;
            campoMensaje.disabled = true;

            // Mostrar mensaje del usuario
            this.agregarMensaje(texto, 'enviado');

            // Limpiar campo
            campoMensaje.value = '';
            campoMensaje.style.height = 'auto';

            // Mostrar indicador de escritura
            this.mostrarIndicadorEscritura();

            // Obtener respuesta de la IA
            const respuesta = await this.obtenerRespuestaIA(texto);
            
            // Ocultar indicador y mostrar respuesta
            this.ocultarIndicadorEscritura();
            this.agregarMensaje(respuesta, 'recibido');

        } catch (error) {
            console.error('Error enviando mensaje a IA:', error);
            this.ocultarIndicadorEscritura();
            this.agregarMensaje('Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.', 'recibido');
        } finally {
            btnEnviar.disabled = false;
            campoMensaje.disabled = false;
            campoMensaje.focus();
        }
    }

    async obtenerRespuestaIA(mensaje) {
        // Contexto del negocio XSHOP
        const contextoNegocio = `
        Eres un asesor virtual experto de XSHOP, una tienda de ropa online. Tu trabajo es ayudar a los clientes con información precisa y útil sobre:

        INFORMACIÓN DE LA TIENDA:
        - XSHOP es una tienda de ropa que vende pantalones, camisas, polos, jeans, chompas, casacas, zapatos, zapatillas y accesorios
        - Ofrecemos productos de calidad con variedad de tallas y colores
        - Tenemos sistema de envío a domicilio y recojo en tienda

        PRODUCTOS DISPONIBLES:
        - Categorías: pantalones, camisas, polos, jeans, chompas, casacas, zapatos, zapatillas, accesorios
        - Tallas disponibles: XS, S, M, L, XL, XXL (según producto)
        - Colores variados según cada producto
        - Precios competitivos en el mercado peruano

        ENVÍOS Y ENTREGAS:
        - Recojo en tienda: GRATIS
        - Envío a domicilio en Arequipa: S/ 5.00 - S/ 20.00
        - Envío nacional: S/ 20.00 - S/ 99.00
        - Tiempo de entrega: 2-3 días hábiles
        - Incluye IGV (18%) en todos los precios

        MÉTODOS DE PAGO:
        - Pago contra entrega
        - Transferencias bancarias
        - Pagos digitales

        POLÍTICAS:
        - Garantía de calidad en todos los productos
        - Cambios y devoluciones según políticas de la tienda
        - Atención personalizada con asesores humanos disponibles

        INSTRUCCIONES:
        - Responde de manera amigable y profesional
        - Usa información específica de XSHOP
        - Si no tienes información exacta, sugiere contactar con un asesor humano
        - Mantén respuestas concisas pero informativas
        - Usa emojis ocasionalmente para ser más amigable
        - Siempre enfócate en ayudar al cliente con su experiencia de compra
        `;

        // Agregar mensaje a la conversación
        this.conversacion.push({
            role: 'user',
            parts: [{ text: mensaje }]
        });

        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: contextoNegocio + '\n\nPregunta del cliente: ' + mensaje }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
            ]
        };

        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Error de API: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const respuesta = data.candidates[0].content.parts[0].text;
            
            // Agregar respuesta a la conversación
            this.conversacion.push({
                role: 'model',
                parts: [{ text: respuesta }]
            });
            
            return respuesta;
        } else {
            throw new Error('Respuesta inválida de la API');
        }
    }

    agregarMensaje(texto, tipo) {
        const mensajesContainer = document.getElementById('mensajesContainerIA');
        const fecha = new Date();
        const horaFormateada = fecha.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-ia ${tipo}`;
        mensajeDiv.innerHTML = `
            <div class="mensaje-contenido-ia">
                ${this.formatearTexto(texto)}
                <div class="mensaje-hora-ia">${horaFormateada}</div>
            </div>
        `;

        mensajesContainer.appendChild(mensajeDiv);
        
        // Scroll al final
        setTimeout(() => {
            mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
        }, 100);
    }

    formatearTexto(texto) {
        // Convertir saltos de línea a <br>
        return texto
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    mostrarIndicadorEscritura() {
        const mensajesContainer = document.getElementById('mensajesContainerIA');
        const indicador = document.createElement('div');
        indicador.className = 'mensaje-ia recibido indicador-escritura';
        indicador.id = 'indicadorEscritura';
        indicador.innerHTML = `
            <div class="mensaje-contenido-ia">
                <div class="puntos-escritura">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        mensajesContainer.appendChild(indicador);
        mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
    }

    ocultarIndicadorEscritura() {
        const indicador = document.getElementById('indicadorEscritura');
        if (indicador) {
            indicador.remove();
        }
    }
}

// Inicializar chat IA cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.chatIA = new ChatIA();
});