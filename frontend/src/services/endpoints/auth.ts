import api from '../axios';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    has_onboarded: boolean;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: AuthUser;
}

/**
 * Register a new user account with email, password, and optionally name.
 */
export async function registerUser(email: string, password: string, name?: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', {
        email,
        password,
        name: name || '',
    });
    return data;
}

/**
 * Log in an existing user with email and password.
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', {
        email,
        password,
    });
    return data;
}

/**
 * Authenticate (or register) a user via a Google ID token issued by GSI.
 * The backend verifies the token, creates the account if needed, and returns
 * the same AuthResponse shape as email/password flows.
 */
export async function googleAuthUser(credential: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/google', { credential });
    return data;
}

/**
 * Get current user profile details via stored authentication headers.
 */
export async function getMe(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/api/auth/me');
    return data;
}