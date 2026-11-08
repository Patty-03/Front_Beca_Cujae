import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface UmbralesEdificio {
  pctBueno: number // por defecto 100
  pctRegular: number // por defecto 75 (si está entre pctRegular y pctBueno es regular, debajo es malo)
}

const STORAGE_KEY = 'beca-cujae-umbrales-edificios'

export const useUmbralesEdificiosStore = defineStore('umbralesEdificios', () => {
  const umbrales = ref<UmbralesEdificio>({
    pctBueno: 100,
    pctRegular: 75,
  })

  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (guardado) {
      const parsed = JSON.parse(guardado)
      if (typeof parsed.pctBueno === 'number' && typeof parsed.pctRegular === 'number') {
        umbrales.value = parsed
      }
    }
  } catch {
    // ignorar si localStorage no está disponible
  }

  function actualizar(nuevos: UmbralesEdificio) {
    umbrales.value = nuevos
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
    } catch {
      // ignorar
    }
  }

  return {
    umbrales,
    actualizar,
  }
})
