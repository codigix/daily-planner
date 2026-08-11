const express = require('express');
const router = express.Router();
const MetaWebhookService = require('../services/meta/metaWebhook.service.cjs');

// GET /api/webhooks/meta - Meta Webhook Subscription Verification
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifiedChallenge = MetaWebhookService.verifyChallenge(mode, token, challenge);
  if (verifiedChallenge) {
    return res.status(200).send(verifiedChallenge);
  }

  return res.status(403).json({ error: 'Webhook verification failed.' });
});

// POST /api/webhooks/meta - Meta Live Webhook Event Receiver
router.post('/meta', express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}), async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  const isValid = MetaWebhookService.validateSignature(signature, rawBody);
  if (!isValid) {
    console.warn('[WebhookRoute] Invalid signature received on Meta webhook.');
    return res.status(401).json({ error: 'Invalid HMAC signature.' });
  }

  try {
    const companyId = 1;
    await MetaWebhookService.handleIncomingEvent(companyId, req.body);
    // Respond 200 OK immediately to Meta
    return res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('[WebhookRoute] Webhook processing error:', err.message);
    return res.status(200).send('EVENT_RECEIVED'); // Always return 200 OK to prevent Meta webhook disablement
  }
});

module.exports = router;
