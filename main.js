const CREDENCIALES = {
    login: "7a7a0d14a3acbb02458c19bdcd420be2",
    secretKey: "6RiSgQUFRjfo4VW0"
};

const APPS = {
    checkout: {
        baseUrl: "https://checkout-test.placetopay.com",
        endpoint: "/api/session",
        payload: {
            "locale": "es_CO",
            "payment": {
                "reference": "Test cors",
                "description": "p2p apis test 111",
                "amount": { "currency": "COP", "total": 11000 },
                "subscribe": false
            },
            "paymentMethod": null,
            "ipAddress": "186.86.52.69",
            "returnUrl": "https://p2p-apis.pages.dev/apis/checkout",
            "userAgent": "Mozilla/5.0",
            "metadata": []
        }
    },
    paymentLink: {
        baseUrl: "https://sites-test.placetopay.com",
        endpoint: "/api/payment-link",
        payload: {
            "name": "Link de Pago Técnico",
            "description": "Pago por servicios de integración P2P",
            "reference": "REF-432382",
            "locale": "es",
            "expirationDate": "2026-02-14 12:23:52",
            "paymentExpiration": 1440,
            "payment": {
                "amount": { "currency": "COP", "total": 11000 }
            }
        }
    },
    gateway: {
        baseUrl: "https://api-test.placetopay.com/rest",
        endpoint: "/gateway/information",
        payload: {
            "locale": "es_CO",
            "metadata": [],
            "payment": {
                "reference": "Ref: rest-2026-02-13",
                "description": "P2P APIS rest test 314",
                "amount": { "currency": "COP", "total": 11000 },
                "subscribe": false
            },
            "instrument": {
                "card": { "number": "4110760000000081", "cvv": null, "expiration": null },
                "token": null,
                "redirection": null
            }
        }
    }
};

document.getElementById('origin-display').innerText = window.location.origin;

function logMessage(msg, type = '') {
    const logDiv = document.getElementById('log');
    const span = document.createElement('div');
    span.className = type;
    span.innerText = `> ${msg}`;
    logDiv.appendChild(span);
    logDiv.scrollTop = logDiv.scrollHeight;
}

function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function getRandomString(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

async function generateAuth(login, secretKey) {
    const nonceValues = new Uint8Array(16);
    crypto.getRandomValues(nonceValues);

    const seed = new Date().toISOString();
    const rawNonce = getRandomString(16);
    const nonceToSend = btoa(rawNonce);
    const msg = rawNonce + seed + secretKey;

    const encoder = new TextEncoder();
    const data = encoder.encode(msg);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const tranKey = arrayBufferToBase64(hashBuffer);

    return { login, tranKey, nonce: nonceToSend, seed };
}

const correrPrueba = async (appKey) => {
    const config = APPS[appKey];
    document.getElementById('log').innerHTML = '';

    const sendReferer = document.getElementById('chk-referer').checked;
    const refPolicy = sendReferer ? "strict-origin-when-cross-origin" : "no-referrer";

    logMessage(`Auditoría de seguridad hacia: ${config.baseUrl}${config.endpoint}`, 'info');
    logMessage(`Configuración de Referer: ${refPolicy}`, 'info');

    try {
        const auth = await generateAuth(CREDENCIALES.login, CREDENCIALES.secretKey);
        const body = JSON.stringify({ auth, ...config.payload });

        logMessage(`Ejecutando ataque simulado (Fetch POST desde navegador)...`);

        const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}${config.endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body,
            referrerPolicy: refPolicy
        });

        const json = await response.json();

        // SI LA PETICIÓN PASA, ESTO ES UN ERROR DE SEGURIDAD
        if (response.ok) {
            logMessage(`🚨 VULNERABILIDAD DETECTADA: El servidor permitió la petición (HTTP ${response.status})`, 'error');
            logMessage(`El CORS está abierto. Las credenciales viajan expuestas desde el navegador y el servidor lo está permitiendo.`, 'warn');
            logMessage(JSON.stringify(json, null, 2));
        } else {
            logMessage(`🚨 RIESGO DE SEGURIDAD: Aunque la API falló (HTTP ${response.status}), el CORS permitió leer la respuesta.`, 'error');
            logMessage(`El servidor debe bloquear completamente las peticiones desde orígenes no autorizados.`, 'warn');
            logMessage(JSON.stringify(json, null, 2));
        }

    } catch (error) {
        // SI LA PETICIÓN FALLA (TypeError), LA SEGURIDAD ES CORRECTA
        logMessage(`✅ PRUEBA EXITOSA: LA PETICIÓN FUE BLOQUEADA POR CORS`, 'success');

        logMessage(`\n🛡️ ANÁLISIS DE SEGURIDAD: El servidor rechazó la comunicación con el navegador. Esto es el comportamiento esperado y correcto.`, 'info');
        logMessage(`Las APIs con autenticación WSSE contienen un "secretKey" y deben ser consumidas única y exclusivamente desde el backend (servidor a servidor).`, 'info');

        logMessage(`\n(Mensaje técnico: ${error.message})`, 'info');
    }
};

window.correrPrueba = correrPrueba;

const btnCheckout = document.getElementById('btn-checkout');
const btnPaymentLink = document.getElementById('btn-paymentLink');
const btnGateway = document.getElementById('btn-gateway');

if (btnCheckout) btnCheckout.addEventListener('click', () => correrPrueba('checkout'));
if (btnPaymentLink) btnPaymentLink.addEventListener('click', () => correrPrueba('paymentLink'));
if (btnGateway) btnGateway.addEventListener('click', () => correrPrueba('gateway'));