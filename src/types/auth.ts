export type Role = 'estudiante' | 'operador' | 'administrador'

export type Permission =
  | 'infraestructura:read'
  | 'infraestructura:write'
  | 'deberes:read'
  | 'estudiantes:read'
  | 'estudiantes:write'
  | 'evaluaciones:read'
  | 'usuarios:manage'
  | 'roles:manage'
  | 'documentos:manage'

export interface SessionUser {
  id: string
  name: string
  email: string
  roles: Role[]
  permissions: Permission[]
  estudianteId?: number | null
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

export interface UsuarioAdmin {
  id: string
  nombre: string
  email: string
  roles: Role[]
  activo: boolean
}

export interface CrearUsuarioInput {
  nombre: string
  email: string
  roles: Role[]
  activo: boolean
}

export type ActualizarUsuarioInput = UsuarioAdmin
