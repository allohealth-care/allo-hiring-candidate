import { registerAs } from '@nestjs/config';

export default registerAs('reservation', () => ({
  ttlSeconds: parseInt(process.env.RESERVATION_TTL_SECONDS, 10) || 900, // 15 minutes
}));
