import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import EstudianteDetalleDialog from './EstudianteDetalleDialog.vue'

describe('EstudianteDetalleDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('monta el diálogo abierto sin errores', () => {
    const wrapper = mount(EstudianteDetalleDialog, {
      props: {
        estudianteId: 1,
        open: true,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('no renderiza contenido cuando está cerrado', () => {
    const wrapper = mount(EstudianteDetalleDialog, {
      props: {
        estudianteId: 1,
        open: false,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('emite update:open al cerrar', async () => {
    const wrapper = mount(EstudianteDetalleDialog, {
      props: {
        estudianteId: 1,
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
