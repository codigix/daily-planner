const crypto = require('crypto');

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v24.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const META_APP_SECRET = process.env.META_APP_SECRET || 'dfbca6cabd9f532a8ba0a68a64df9ad7';

class MetaGraphService {
  /**
   * Generates appsecret_proof for secure Meta API requests
   */
  static getAppSecretProof(accessToken) {
    if (!accessToken || !META_APP_SECRET) return null;
    return crypto.createHmac('sha256', META_APP_SECRET).update(accessToken).digest('hex');
  }

  /**
   * Executes HTTP GET request to Meta Graph API v24.0 using native Node fetch
   */
  static async get(endpoint, accessToken, params = {}, retryCount = 0) {
    let urlString = endpoint.startsWith('http') ? endpoint : `${BASE_URL}/${endpoint.replace(/^\//, '')}`;
    const url = new URL(urlString);

    if (accessToken) {
      url.searchParams.set('access_token', accessToken);
      const proof = this.getAppSecretProof(accessToken);
      if (proof) url.searchParams.set('appsecret_proof', proof);
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const startTime = Date.now();

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorData = responseData.error || {};
        const statusCode = response.status;

        // Handle Rate Limiting & Retry (Codes 429, 17, 32, 613)
        if ((statusCode === 429 || [17, 32, 613].includes(errorData.code)) && retryCount < 3) {
          const backoffMs = Math.pow(2, retryCount + 1) * 1000;
          console.warn(`[MetaGraphService] Rate limit hit. Retrying in ${backoffMs}ms... (Attempt ${retryCount + 1}/3)`);
          await new Promise(res => setTimeout(res, backoffMs));
          return this.get(endpoint, accessToken, params, retryCount + 1);
        }

        throw this.normalizeError(errorData, statusCode);
      }

      return responseData;
    } catch (error) {
      if (error.code && error.code.startsWith('META_')) {
        throw error;
      }
      console.error(`[MetaGraphService] GET ${endpoint} Error:`, error.message);
      throw this.normalizeError({ message: error.message }, 500);
    }
  }

  /**
   * Executes HTTP POST request to Meta Graph API v24.0 using native Node fetch
   */
  static async post(endpoint, accessToken, data = {}) {
    let urlString = endpoint.startsWith('http') ? endpoint : `${BASE_URL}/${endpoint.replace(/^\//, '')}`;
    const url = new URL(urlString);

    if (accessToken) {
      url.searchParams.set('access_token', accessToken);
      const proof = this.getAppSecretProof(accessToken);
      if (proof) url.searchParams.set('appsecret_proof', proof);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw this.normalizeError(responseData.error || {}, response.status);
      }

      return responseData;
    } catch (error) {
      if (error.code && error.code.startsWith('META_')) {
        throw error;
      }
      throw this.normalizeError({ message: error.message }, 500);
    }
  }

  /**
   * Fetches all pages of a paginated Meta API response automatically
   */
  static async fetchAllPages(endpoint, accessToken, params = {}, maxPages = 10) {
    let allRecords = [];
    let currentEndpoint = endpoint;
    let currentParams = { ...params };
    let pagesFetched = 0;

    while (currentEndpoint && pagesFetched < maxPages) {
      const res = await this.get(currentEndpoint, accessToken, currentParams);
      if (res && res.data && Array.isArray(res.data)) {
        allRecords = allRecords.concat(res.data);
      } else if (Array.isArray(res)) {
        allRecords = allRecords.concat(res);
      }

      pagesFetched++;

      if (res?.paging?.next) {
        currentEndpoint = res.paging.next;
        currentParams = {};
      } else {
        break;
      }
    }

    return allRecords;
  }

  /**
   * Standardized error response formatter
   */
  static normalizeError(errorData, statusCode) {
    const code = errorData.code || statusCode;
    const subcode = errorData.error_subcode;
    const message = errorData.message || 'Meta API request failed.';

    let errorCode = 'META_API_ERROR';
    if (code === 190 || subcode === 463 || subcode === 467) {
      errorCode = 'META_TOKEN_EXPIRED';
    } else if (code === 200 || code === 10 || code === 298) {
      errorCode = 'META_PERMISSION_ERROR';
    } else if (code === 429 || [17, 32, 613].includes(code)) {
      errorCode = 'META_RATE_LIMIT';
    } else if (code === 100) {
      errorCode = 'META_INVALID_REQUEST';
    } else if (statusCode === 404) {
      errorCode = 'META_OBJECT_NOT_FOUND';
    }

    const err = new Error(message);
    err.code = errorCode;
    err.metaCode = code;
    err.metaSubcode = subcode;
    err.statusCode = statusCode;
    return err;
  }
}

module.exports = MetaGraphService;
