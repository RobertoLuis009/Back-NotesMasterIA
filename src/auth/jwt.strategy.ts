import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * Namespace dos custom claims injetados pela Auth0 Action (post-login).
 * Access tokens do Auth0 não trazem email/name por padrão — eles são
 * adicionados via Action sob este namespace e assinados pelo Auth0,
 * portanto são confiáveis (não podem ser forjados pelo cliente).
 */
const CLAIMS_NAMESPACE = 'https://notesmaster.app';

interface JwtPayload {
  sub?: string;
  [claim: string]: unknown;
}

/** Forma do `req.user` após autenticação bem-sucedida. */
export interface AuthenticatedUser {
  auth0Id: string;
  email?: string;
  name?: string;
  emailVerified: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Token sem identificador de usuário (sub)');
    }

    return {
      auth0Id: payload.sub,
      email: payload[`${CLAIMS_NAMESPACE}/email`] as string | undefined,
      name: payload[`${CLAIMS_NAMESPACE}/name`] as string | undefined,
      emailVerified: payload[`${CLAIMS_NAMESPACE}/email_verified`] === true,
    };
  }
}
