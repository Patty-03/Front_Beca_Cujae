import type { AuthGateway } from '@/types/auth'
import { DemoAuthGateway } from './demoAuthGateway'
import { HttpAuthGateway } from './httpAuthGateway'

export const modoDemo = import.meta.env.VITE_AUTH_MODE === 'demo'

export function crearAuthGateway(): AuthGateway {
  return modoDemo ? new DemoAuthGateway() : new HttpAuthGateway()
}
