/* ─────────────────────────────────────────
   CONFIGURACIÓN DE WEBHOOKS
   → URLs de los webhooks de n8n
───────────────────────────────────────── */
const webhooks = {
  vida: 'https://gcal-notion.onrender.com/webhook/9995ac3c-81ee-4af3-a22f-a0e8a70772c9',
  uni:  'https://gcal-notion.onrender.com/webhook/d0f95e91-196f-4d93-b177-df46ca8f2041',
};

const buttonIds = { vida: 'syncBtnVida', uni: 'syncBtnUni' };
const statusIds = { vida: 'statusVida', uni: 'statusUni' };

/* ─────────────────────────────────────────
   SINCRONIZACIÓN
───────────────────────────────────────── */
async function sincronizar(tipo) {
  const btn = document.getElementById(buttonIds[tipo]);
  const status = document.getElementById(statusIds[tipo]);
  const webhookUrl = webhooks[tipo];

  status.classList.remove('error', 'success');
  status.textContent = '';

  if (!webhookUrl) {
    status.textContent = '⚠️ Falta configurar la URL del webhook.';
    status.classList.add('error');
    return;
  }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'Sincronizando...';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      status.textContent = '✅ ¡Sincronización completada!';
      status.classList.add('success');
    } else {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    status.textContent = '❌ Error en la sincronización: ' + error.message;
    status.classList.add('error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = originalText;
  }
}
