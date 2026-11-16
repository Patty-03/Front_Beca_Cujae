import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AvisosHero from '@/components/app/AvisosHero.vue'
import type { Aviso } from '@/types/estudiante-view'

const aviso: Aviso = {
  id: 'a-1',
  titulo: 'Inicio del curso académico',
  contenido: 'Se recuerda a todos los becados que el curso académico inicia próximamente.',
  fecha: '2026-09-01',
  prioridad: 'alta',
}

describe('AvisosHero', () => {
  it('monta el componente sin avisos', () => {
    const wrapper = mount(AvisosHero, {
      props: {
        avisos: [],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('monta el componente con avisos', () => {
    const wrapper = mount(AvisosHero, {
      props: {
        avisos: [aviso],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })
})
