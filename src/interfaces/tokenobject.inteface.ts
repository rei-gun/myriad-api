import {UserProfile} from '@loopback/security';

/**
 * Describes the token object that returned by the refresh token service functions.
 */
export type TokenObject = {
  accessToken: string;
  tokenType?: string;
  expiresIn?: string | undefined;
  refreshToken?: string | undefined;
};

/**
 * The token refresh service. An access token expires in limited time. Therefore
 * token refresh service is needed to keep replacing the old access token with
 * a new one periodically.
 */
export interface RefreshTokenService {
  /**
   * Generate a refresh token, bind it with the given user profile + access
   * token, then store them in backend.
   */
  generateToken(userProfile: UserProfile, token: string): Promise<TokenObject>;

  /**
   * Refresh the access token bound with the given refresh token.
   */
  refreshToken(refreshToken: string): Promise<TokenObject>;
}