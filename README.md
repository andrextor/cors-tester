# cors-tester

# 🚀 Validador de CORS - Placetopay API

Este es un mini-proyecto de pruebas construido con Vanilla JS y Vite. Su único propósito es aislar el código del frontend principal para validar las políticas de **CORS (Cross-Origin Resource Sharing)** de los diferentes endpoints de Placetopay (Checkout, Payment Link y Gateway).

Dado que los errores de CORS solo ocurren en el contexto de un navegador web, este proyecto levanta un servidor de desarrollo local para simular las peticiones exactamente como las haría la aplicación final en producción.

## ⚙️ Requisitos Previos

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- NPM, Yarn o PNPM

## 🛠️ Instalación y Ejecución

1. Abre la terminal en esta carpeta.
2. Instala las dependencias (solo Vite):

```bash
npm install
```

3. Levanta el servidor local:

```bash
npm run dev
```

4. Abre la URL que te proporciona Vite en tu navegador (usualmente <http://localhost:5173>).

## Instrucciones de Prueba

- Abre las Herramientas de Desarrollador (F12) en tu navegador y ve a la pestaña Consola o Red (Network).

- En la interfaz web, haz clic en los botones de los servicios que deseas probar.

- El sistema generará automáticamente la autenticación WSSE (login, tranKey, nonce, seed) y enviará el payload correspondiente mediante fetch().

- Revisa los logs en la pantalla o en la consola del navegador.

## 📊 Interpretación de Resultados (Auditoría de Seguridad)

**⚠️ CONTEXTO CRÍTICO:** Dado que la autenticación WSSE requiere firmar las peticiones con un `secretKey`, **estas APIs NUNCA deben ser consumidas directamente desde un navegador web (Frontend)**. Hacerlo expondría las llaves privadas al público. La comunicación debe ser estricta e inquebrantablemente de Servidor a Servidor (Backend a Backend).

Por lo tanto, la lectura de los resultados se invierte:

✅ **PRUEBA EXITOSA (Bloqueo por CORS / TypeError):**
Si el log marca una excepción cruda de JavaScript (ej. `Failed to fetch`), significa que el navegador bloqueó la petición. **Este es el comportamiento correcto y seguro.** Confirma que el servidor de destino (EC2 o API Gateway) no está devolviendo cabeceras CORS permisivas, protegiendo así la API de ser consumida desde clientes web inseguros.

🚨 **VULNERABILIDAD DETECTADA (HTTP 200, 400, 401, etc.):**
Si la interfaz logra imprimir un JSON de respuesta (incluso si la API responde con un error por falta de campos), significa que **la infraestructura tiene una brecha de seguridad**. El CORS está configurado de forma demasiado permisiva, permitiendo que un navegador web negocie y lea las respuestas de una API que debería estar restringida.

### 🛡️ Acción requerida en Infraestructura (Si se detecta la vulnerabilidad)

Si el servidor permitió leer la petición desde este tester web, el equipo de IT/Ops debe restringir inmediatamente las políticas del API Gateway, WAF o EC2:

1. **Eliminar cabeceras permisivas:** Asegurarse de que el servidor **NO** esté devolviendo `Access-Control-Allow-Origin: *` ni aprobando orígenes de aplicaciones web (`http://localhost`, dominios de Vue/React/Angular) para estas rutas.
2. **Restricción de Origen:** El consumo de los endpoints de `/api/payment-link` y `/gateway/information` debe estar limitado exclusivamente a las IPs o rangos de la VPC de nuestros propios servidores Backend.
