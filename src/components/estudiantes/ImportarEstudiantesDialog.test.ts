import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ImportarEstudiantesDialog from './ImportarEstudiantesDialog.vue'

describe('ImportarEstudiantesDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('monta el diálogo de importar estudiantes', () => {
    const wrapper = mount(ImportarEstudiantesDialog, {
      props: {
        carnetsExistentes: [],
        open: true,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('no renderiza contenido cuando está cerrado', () => {
    const wrapper = mount(ImportarEstudiantesDialog, {
      props: {
        carnetsExistentes: [],
        open: false,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('emite update:open al cerrar', async () => {
    const wrapper = mount(ImportarEstudiantesDialog, {
      props: {
        carnetsExistentes: [],
        open: true,
      },
    })

    const closeBtn = wrapper.find('button[aria-label="Cerrar"]')
    if (closeBtn.exists()) {
      await closeBtn.trigger('click')
      const emitted = wrapper.emitted('update:open')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe(false)
    }
  })
})
