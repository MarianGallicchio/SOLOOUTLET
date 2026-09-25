/**
 * Accesos SoloOutlet — cuentas separadas de COMPRADOR y VENDEDOR, listas para DB.
 * ------------------------------------------------------------------
 * HOY (demo): backend local en localStorage. Cuentas por email, una por rol:
 *   - comprador  → role 'buyer'      (catálogo, carrito, pedidos, perfil)
 *   - vendedor   → role 'merchant_approved' + storeName (Mi Tienda / workspace)
 *   - staff      → email en PLATFORM_OWNER_EMAILS (Panel Admin global)
 * Un email puede ser miembro/empleado de una tienda sin ser su dueño
 * (ver `inviteMember` en el contexto: el rol se resuelve por email).
 *
 * MAÑANA (con DB): definí `VITE_API_URL` y esta misma interfaz usa:
 *   POST /auth/register  {fullName, email, password, role, storeName?} → {user, token}
 *   POST /auth/login     {email, password}                             → {user, token}
 *   POST /auth/logout    (Authorization: Bearer <token>)               → 204
 *   GET  /auth/me        (Authorization: Bearer <token>)               → {user}
 *   PATCH /users/me      {…campos}                                     → {user}
 * Tablas sugeridas: `users(id, full_name, email UNIQUE, password_hash,
 * role, store_name, created_at)` + `sessions(token, user_id, expires_at)`.
 * NUNCA guardar ni transportar contraseñas en texto plano.
 */

import { User } from '../types';
import { isApiMode, load, persist, forget } from './db';

const USERS_KEY = 'solooutlet_auth_users';
const SECRETS_KEY = 'solooutlet_auth_secrets';
const SESSION_KEY = 'solooutlet_auth_session';

/** Valor del campo password cuando el usuario no lo tocó (no se valida). */
export const AUTH_PASSWORD_PLACEHOLDER = '••••••••';

export interface AuthSession {
  userId: string;
  token: string;
  createdAt: string;
}

export interface RegisterBuyerInput {
  fullName: string;
  email: string;
  password?: string;
}

export interface RegisterSellerInput extends RegisterBuyerInput {
  storeName: string;
}

export interface AuthBackend {
  /** Comprador: entra o se crea la cuenta. Vendedor: solo entra (ver registerSeller). */
  login(email: string, password?: string, fullName?: string): Promise<User>;
  registerBuyer(input: RegisterBuyerInput): Promise<User>;
  /** Crea la cuenta vendedora o eleva una existente por email. */
  registerSeller(input: RegisterSellerInput): Promise<User>;
  updateUser(user: User): Promise<User>;
  logout(): Promise<void>;
  /** Sesión guardada (recargas). null = invitado (la app usa cuenta demo). */
  restoreSession(): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

/** Hash DEMO (FNV-1a, NO criptográfico). En producción: bcrypt/argon2 en el servidor. */
export function demoHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv1a-${(h >>> 0).toString(16)}`;
}

const norm = (email: string) => email.trim().toLowerCase();
const token = () => `tok-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;

class LocalAuthBackend implements AuthBackend {
  private users(): User[] {
    return load(USERS_KEY, [] as User[]);
  }
  private saveUsers(users: User[]) {
    persist(USERS_KEY, users);
  }
  private secrets(): Record<string, string> {
    return load(SECRETS_KEY, {} as Record<string, string>);
  }
  private checkPassword(userId: string, password?: string) {
    const stored = this.secrets()[userId];
    if (!stored) return; // cuenta sin clave (demo / creada por invitación)
    if (!password) return; // login sin clave: se permite en modo demo
    if (demoHash(password) !== stored) throw new Error('Contraseña incorrecta para este email.');
  }
  private startSession(user: User): User {
    persist(SESSION_KEY, { userId: user.id, token: token(), createdAt: new Date().toISOString() } as AuthSession);
    persist('solooutlet_user', user); // compat: el contexto hidrata desde acá
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users().find((u) => norm(u.email) === norm(email)) ?? null;
  }

  async login(email: string, password?: string, fullName = 'Comprador'): Promise<User> {
    const existing = await this.findByEmail(email);
    if (!existing) return this.registerBuyer({ fullName, email, password });
    this.checkPassword(existing.id, password);
    return this.startSession(existing);
  }

  async registerBuyer(input: RegisterBuyerInput): Promise<User> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      this.checkPassword(existing.id, input.password);
      return this.startSession(existing);
    }
    const user: User = {
      id: `usr-${Date.now()}`,
      fullName: input.fullName.trim() || 'Comprador',
      email: input.email.trim(),
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      role: 'buyer',
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.saveUsers([...this.users(), user]);
    if (input.password) {
      const s = this.secrets();
      s[user.id] = demoHash(input.password);
      persist(SECRETS_KEY, s);
    }
    return this.startSession(user);
  }

  async registerSeller(input: RegisterSellerInput): Promise<User> {
    const existing = await this.findByEmail(input.email);
    const base: User = existing ?? {
      id: `usr-${Date.now()}`,
      fullName: input.fullName.trim() || input.storeName,
      email: input.email.trim(),
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      role: 'buyer',
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (existing) this.checkPassword(existing.id, input.password);
    const seller: User = { ...base, role: 'merchant_approved', storeName: input.storeName };
    const users = this.users();
    this.saveUsers(users.some((u) => u.id === seller.id) ? users.map((u) => (u.id === seller.id ? seller : u)) : [...users, seller]);
    if (input.password) {
      const s = this.secrets();
      s[seller.id] = demoHash(input.password);
      persist(SECRETS_KEY, s);
    }
    return this.startSession(seller);
  }

  async updateUser(user: User): Promise<User> {
    const users = this.users();
    this.saveUsers(users.some((u) => u.id === user.id) ? users.map((u) => (u.id === user.id ? user : u)) : [...users, user]);
    persist('solooutlet_user', user);
    return user;
  }

  async logout(): Promise<void> {
    forget(SESSION_KEY);
    forget('solooutlet_user');
  }

  async restoreSession(): Promise<User | null> {
    const session = load<AuthSession | null>(SESSION_KEY, null);
    if (!session) return null;
    const user = this.users().find((u) => u.id === session.userId) ?? null;
    if (!user) {
      forget(SESSION_KEY);
      return null;
    }
    return user;
  }
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

class ApiAuthBackend implements AuthBackend {
  private token: string | null = null;
  private headers(): HeadersInit {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const session = load<AuthSession | null>(SESSION_KEY, null);
    const t = this.token ?? session?.token;
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  }
  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...this.headers(), ...(init?.headers || {}) } });
    if (res.status === 401) throw new Error('Sesión vencida o credenciales inválidas.');
    if (!res.ok) throw new Error(`Error de autenticación (${res.status}).`);
    return (await res.json()) as T;
  }
  async login(email: string, password?: string): Promise<User> {
    const { user, token } = await this.req<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = token;
    persist(SESSION_KEY, { userId: user.id, token, createdAt: new Date().toISOString() } as AuthSession);
    persist('solooutlet_user', user);
    return user;
  }
  async registerBuyer(input: RegisterBuyerInput): Promise<User> {
    const { user, token } = await this.req<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...input, role: 'buyer' }),
    });
    this.token = token;
    persist(SESSION_KEY, { userId: user.id, token, createdAt: new Date().toISOString() } as AuthSession);
    persist('solooutlet_user', user);
    return user;
  }
  async registerSeller(input: RegisterSellerInput): Promise<User> {
    const { user, token } = await this.req<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...input, role: 'merchant_approved' }),
    });
    this.token = token;
    persist(SESSION_KEY, { userId: user.id, token, createdAt: new Date().toISOString() } as AuthSession);
    persist('solooutlet_user', user);
    return user;
  }
  async updateUser(user: User): Promise<User> {
    const updated = await this.req<User>('/users/me', { method: 'PATCH', body: JSON.stringify(user) });
    persist('solooutlet_user', updated);
    return updated;
  }
  async logout(): Promise<void> {
    try {
      await this.req('/auth/logout', { method: 'POST', body: '{}' });
    } catch {
      /* igual se limpia local */
    }
    this.token = null;
    forget(SESSION_KEY);
    forget('solooutlet_user');
  }
  async restoreSession(): Promise<User | null> {
    const session = load<AuthSession | null>(SESSION_KEY, null);
    if (!session) return null;
    this.token = session.token;
    try {
      const user = await this.req<User>('/auth/me');
      persist('solooutlet_user', user);
      return user;
    } catch {
      return null;
    }
  }
  async findByEmail(): Promise<User | null> {
    return null; // en modo API no se expone búsqueda por email al front
  }
}

export const auth: AuthBackend = isApiMode ? new ApiAuthBackend() : new LocalAuthBackend();
