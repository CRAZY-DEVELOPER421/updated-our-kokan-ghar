/**
 * Server-Side GA4 Measurement Protocol
 *
 * Forward e-commerce events to GA4 from the server, bypassing ad-blockers
 * and browser tracking prevention. Used primarily for the `purchase` event
 * to ensure 100% accurate conversion tracking.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events
 */
const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;
const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

/**
 * POST /api/ga4/track
 *
 * Body:
 * {
 *   "client_id": "string (required) — unique visitor ID, e.g. from client_id cookie or fingerprint",
 *   "event_name": "string (required) — e.g. purchase, begin_checkout",
 *   "user_id": "string (optional) — logged-in user id",
 *   "params": { ... } // event parameters
 * }
 */
router.post(
  '/track',
  asyncHandler(async (req, res) => {
    // Skip if GA4 is not configured
    if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
      return ApiResponse.success(res, null, 'GA4 Measurement Protocol not configured');
    }

    const { client_id, event_name, user_id, params = {} } = req.body;

    if (!client_id || !event_name) {
      return ApiResponse.error(res, 'client_id and event_name are required', 400);
    }

    // Build the payload
    const payload = {
      client_id,
      events: [
        {
          name: event_name,
          params: {
            engagement_time_msec: '100',
            ...params,
          },
        },
      ],
    };

    // Add user_id if provided
    if (user_id) {
      payload.user_id = String(user_id);
    }

    try {
      const url = `${GA4_ENDPOINT}?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // GA4 Measurement Protocol returns 204 No Content on success
      if (response.status === 204 || response.ok) {
        return ApiResponse.success(res, { sent: true }, 'Event tracked');
      } else {
        const text = await response.text();
        console.error('[GA4 MP] Error:', response.status, text);
        return ApiResponse.error(res, 'GA4 tracking failed', 502);
      }
    } catch (err) {
      console.error('[GA4 MP] Request failed:', err.message);
      return ApiResponse.error(res, 'GA4 tracking request failed', 502);
    }
  })
);

module.exports = router;
