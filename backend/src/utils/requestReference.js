const crypto = require('crypto');

/** Uppercase without 0, O, 1, I for clearer reading */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function segmentFromBytes(buf, start, len) {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[buf[start + i] % ALPHABET.length];
  }
  return out;
}

function randomSegment(len) {
  return segmentFromBytes(crypto.randomBytes(len), 0, len);
}

/**
 * Human-facing code, e.g. ER-Q7-KM9 (short, no Mongo hex).
 * Stored on new documents; older rows get a deterministic fallback in mapRequest.
 */
async function allocateReferenceCode(RequestModel) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const body = `${randomSegment(2)}-${randomSegment(3)}`;
    const code = `ER-${body}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await RequestModel.exists({ referenceCode: code });
    if (!exists) return code;
  }
  throw new Error('Could not allocate request reference');
}

function deterministicFallbackFromObjectId(objectIdHex24) {
  const h = crypto.createHash('sha256').update(objectIdHex24).digest();
  const body = `${segmentFromBytes(h, 0, 2)}-${segmentFromBytes(h, 2, 3)}`;
  return `ER-${body}`;
}

function displayReference(doc) {
  if (doc.referenceCode) return doc.referenceCode;
  return deterministicFallbackFromObjectId(doc._id.toString());
}

/** Accepts mongo id or ER-xx-xxx (# optional, case-insensitive). */
function normalizeIncomingReference(raw) {
  let s = String(raw || '').trim().toUpperCase().replace(/^#/, '');
  if (!s) return null;
  if (!s.startsWith('ER-')) s = `ER-${s}`;
  return s;
}

function isMongoObjectIdString(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

module.exports = {
  allocateReferenceCode,
  displayReference,
  normalizeIncomingReference,
  isMongoObjectIdString,
};
