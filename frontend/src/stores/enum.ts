import { defineStore } from 'pinia'
import { EnumOption } from '@/types'

interface EnumState {
  enums: Record<string, EnumOption[]>
  loaded: boolean
}

export const useEnumStore = defineStore('enum', {
  state: (): EnumState => ({
    enums: {},
    loaded: false,
  }),
  getters: {
    getEnum: (state) => (key: string): EnumOption[] => state.enums[key] || [],
  },
  actions: {
    setEnums(data: Record<string, EnumOption[]>) {
      this.enums = data
      this.loaded = true
    },
  },
})
