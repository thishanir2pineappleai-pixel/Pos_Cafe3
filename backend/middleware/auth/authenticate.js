// Protects a route. Requires "Authorization: Bearer <access token>". The token must have a valid signature and
// expiry, its session must exist and not be revoked or expired, and its user must still be active.
// On success it sets req.auth = { userId, accountId, role, sessionId }; every other failure is the same 401.
const { adminProfileRepository, sessionRepository } = require('../../repositories');
const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');
const jwtService = require('../../services/auth/jwtService');
const clock = require('../../utils/clock');

const reject = (message) => new AppError(401, ERROR_CODES.UNAUTHENTICATED, message);

async function authenticate(req, res, next) {
  try {
    const [scheme, token] = (req.get('authorization') || '').split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return next(reject(MESSAGES.AUTH_REQUIRED));

    const payload = jwtService.verify(token);
    if (!payload) return next(reject(MESSAGES.AUTH_INVALID));
    const session = await sessionRepository.find(payload.sid);
    if (!session || session.revokedAt || session.expiresAt <= clock.now() || session.userId !== payload.sub) return next(reject(MESSAGES.AUTH_INVALID));
    const user = await adminProfileRepository.findById(payload.sub);
    if (!user || user.status !== 'active') return next(reject(MESSAGES.AUTH_INVALID));

    req.auth = { userId: user.id, accountId: user.accountId, role: user.role, sessionId: session.sid };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;
