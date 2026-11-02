export type Role = 'estudiante' | 'operador' | 'administrador'

export type Permission =
  | 'infraestructura:read'
  | 'infraestructura:write'
  | 'deberes:read'
  | 'estudiantes:read'
  | 'estudiantes:write'
  | 'evaluaciones:read'

export interface SessionUser {
  id: string
  name: string
  email: string
  roles: Role[]
  permissions: Permission[]
}

export interface Session {
  user: SessionUser
  expiresAt: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  remember: boolean
}

export interface AuthGateway {
  login(credentials: LoginCredentials): Promise<Session>
  logout(): Promise<void>
  getSession(): Promise<Session | null>
}
