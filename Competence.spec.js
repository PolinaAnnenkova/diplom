import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CompetenceView from '@/views/CompetenciesView.vue'
import { nextTick } from 'vue'

// Мокаем зависимости
vi.mock('@/../api/realApi.js', () => ({
  default: {
    getRoles: vi.fn(),
    createRole: vi.fn(),
    deleteRole: vi.fn()
  }
}))

vi.mock('vue3-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}))

describe('CompetenceView.vue', () => {
  let wrapper
  let realApi
  let toast

  const mockRoles = [
    { id: 1, name: 'Разработчик' },
    { id: 2, name: 'Тестировщик' }
  ]

  beforeEach(async () => { // Добавил async здесь
    // Инициализируем моки
    realApi = (await import('@/../api/realApi.js')).default
    toast = (await import('vue3-toastify')).toast
    
    // Настраиваем моки API
    realApi.getRoles.mockResolvedValue(mockRoles)
    realApi.createRole.mockImplementation((name) => 
      Promise.resolve({ id: 3, name })
    )
    realApi.deleteRole.mockResolvedValue(true)
    
    // Мокаем confirm
    global.confirm = vi.fn(() => true)
    
    // Монтируем компонент
    wrapper = mount(CompetenceView)
    await nextTick() // Добавил ожидание завершения монтирования
  })

  it('отображает основные элементы интерфейса', () => {
    expect(wrapper.find('.competence-view').exists()).toBe(true)
    expect(wrapper.find('.add-role-form').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Введите название новой роли"]').exists()).toBe(true)
    expect(wrapper.find('.add-btn').exists()).toBe(true)
    expect(wrapper.find('.table-container').exists()).toBe(true)
  })

  it('загружает список ролей при монтировании', async () => {
    expect(realApi.getRoles).toHaveBeenCalled()
    await nextTick()
    expect(wrapper.vm.roles).toEqual(mockRoles)
  })

  it('отображает состояние загрузки', async () => {
    // Для Composition API с <script setup> используйте:
    wrapper.vm.isLoading = true
    await nextTick()
    expect(wrapper.find('.loading').exists()).toBe(true)
    expect(wrapper.find('.loading').text()).toBe('Загрузка...')
  })

  it('отображает ошибку загрузки', async () => {
    const errorMsg = 'Ошибка сервера'
    wrapper.vm.error = errorMsg
    await nextTick()
    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error').text()).toBe(errorMsg)
  })

  it('отображает список ролей в таблице', async () => {
    await wrapper.vm.loadData()
    await nextTick()
    
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(mockRoles.length)
    
    // Проверяем содержимое первой строки
    const firstRowCells = rows[0].findAll('td')
    expect(firstRowCells[0].text()).toBe('1')
    expect(firstRowCells[1].text()).toBe('Разработчик')
    expect(firstRowCells[2].find('.delete-btn').exists()).toBe(true)
  })

  describe('добавление роли', () => {
  beforeEach(() => {
    realApi.createRole.mockClear()
    toast.warning.mockClear()
  })

  it('добавляет новую роль при нажатии кнопки', async () => {
    const newRoleName = 'Менеджер'
    await wrapper.find('input').setValue(newRoleName)
    await wrapper.find('.add-btn').trigger('click')
    
    expect(realApi.createRole).toHaveBeenCalledWith(newRoleName)
    expect(toast.success).toHaveBeenCalled()
  })

  it('не добавляет роль с пустым названием', async () => {
    await wrapper.find('input').setValue('')
    await wrapper.find('.add-btn').trigger('click')
    
    expect(realApi.createRole).not.toHaveBeenCalled()
    expect(toast.warning).toHaveBeenCalledWith('Введите название роли')
  })
})

describe('удаление роли', () => {
  beforeEach(() => {
    realApi.deleteRole.mockClear()
    toast.error.mockClear()
  })

  it('не удаляет роль без подтверждения', async () => {
    global.confirm.mockReturnValue(false)
    await wrapper.vm.deleteRole(1)
    expect(realApi.deleteRole).not.toHaveBeenCalled()
  })
})
  it('отображает адаптивный дизайн на мобильных устройствах', async () => {
    // Имитируем мобильный экран
    global.innerWidth = 500
    global.dispatchEvent(new Event('resize'))
    await nextTick()
    
    expect(wrapper.find('.add-role-form').classes()).not.toContain('flex-row')
  })
})