import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UsersView from '@/views/UsersView.vue'
import UserModal from '@/views/UserModal.vue'
import realApi from '@/../api/realApi.js'
import { nextTick } from 'vue'

// Мокаем API и toast
vi.mock('@/../api/realApi.js', () => ({
  default: { // Добавляем default экспорт
    getUsers: vi.fn(),
    getUserById: vi.fn(),
    deleteUser: vi.fn()
  }
}))

vi.mock('vue3-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('UsersView.vue', () => {
  let wrapper
  const mockUsers = [
    { id: 1, name: 'Иван Петров', is_admin: true, roles: [{ id: 1, name: 'Backend' }] },
    { id: 2, name: 'Мария Сидорова', is_manager: true, roles: [{ id: 2, name: 'Frontend' }] },
    { id: 3, name: 'Алексей Иванов', roles: [{ id: 3, name: 'Design' }] }
  ]

  beforeEach(async () => {
    // Настраиваем моки API
    realApi.getUsers.mockResolvedValue(mockUsers)
    realApi.getUserById.mockImplementation(id => 
      Promise.resolve(mockUsers.find(user => user.id === id)))
    realApi.deleteUser.mockResolvedValue(true)

    wrapper = mount(UsersView, {
      global: {
        stubs: {
          UserModal: true
        }
      }
    })

    await flushPromises()
  })

  it('загружает и отображает список пользователей', async () => {
    expect(realApi.getUsers).toHaveBeenCalled()
    expect(wrapper.findAll('tbody tr').length).toBe(mockUsers.length)
    expect(wrapper.text()).toContain('Иван Петров')
    expect(wrapper.text()).toContain('Мария Сидорова')
  })

  it('фильтрует пользователей по поисковому запросу', async () => {
    await wrapper.find('.search-input').setValue('Иван')
    await nextTick()
    
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(2)
    expect(rows[0].text()).toContain('Иван Петров')
    expect(rows[1].text()).toContain('Алексей Иванов')
  })

  it('открывает модальное окно для добавления пользователя', async () => {
    await wrapper.find('.add-btn').trigger('click')
    expect(wrapper.vm.showAddModal).toBe(true)
  })

  it('удаляет пользователя после подтверждения', async () => {
  const initialCalls = realApi.getUsers.mock.calls.length
  
  const deleteBtn = wrapper.findAll('.delete-btn')[0]
  await deleteBtn.trigger('click')
  
  await wrapper.vm.deleteUser()
  await flushPromises()
  
  // Проверяем что deleteUser был вызван
  expect(realApi.deleteUser).toHaveBeenCalledWith(1)
  
  // Проверяем что getUsers был вызван хотя бы один раз после удаления
  expect(realApi.getUsers.mock.calls.length).toBeGreaterThan(initialCalls)
})
})