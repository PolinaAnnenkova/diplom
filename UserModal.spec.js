import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UserModal from '@/views/UserModal.vue'
import realApi from '@/../api/realApi.js'
import { nextTick } from 'vue'

// Мокаем API и toast
vi.mock('@/../api/realApi.js', () => ({
  default: {
    getRoles: vi.fn(),
    registerUser: vi.fn(),
    updateUser: vi.fn(),
    assignRoleToUser: vi.fn()
  }
}))

vi.mock('vue3-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('UserModal.vue', () => {
  let wrapper
  const mockRoles = [
    { id: 1, name: 'Backend' },
    { id: 2, name: 'Frontend' },
    { id: 3, name: 'Design' }
  ]

  const mockUser = {
    id: 1,
    name: 'Иван Петров',
    is_admin: true,
    roles: [{ id: 1, name: 'Backend' }]
  }

  beforeEach(() => {
    // Настраиваем моки API
    realApi.getRoles.mockResolvedValue(mockRoles)
    realApi.registerUser.mockResolvedValue({ id: 2, name: 'Новый пользователь' })
    realApi.updateUser.mockResolvedValue(true)
    realApi.assignRoleToUser.mockResolvedValue(true)

    wrapper = mount(UserModal, {
      props: {
        showModal: true,
        isEditing: false
      }
    })
  })

  it('отображает форму добавления пользователя', () => {
    expect(wrapper.find('h2').text()).toBe('Добавление пользователя')
    expect(wrapper.find('input#name').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('button.save-btn').text()).toBe('Добавить пользователя')
  })

  it('отображает форму редактирования пользователя при isEditing', async () => {
    await wrapper.setProps({
      isEditing: true,
      currentUser: mockUser
    })

    expect(wrapper.find('h2').text()).toBe('Редактирование пользователя')
    expect(wrapper.find('input#name').element.value).toBe(mockUser.name)
    expect(wrapper.find('button.save-btn').text()).toBe('Сохранить')
  })

  it('валидирует форму перед отправкой', async () => {
  // 1. Убедимся, что форма изначально пустая
  expect(wrapper.vm.form.name).toBe('')
  expect(wrapper.vm.form.password).toBe('')
  
  // 2. Отправляем форму
  await wrapper.find('form').trigger('submit.prevent')
  
  // 3. Ждем обновления реактивных свойств
  await nextTick()
  
  // 4. Проверяем ошибки валидации
  expect(wrapper.vm.errors.name).toBe('Имя обязательно')
  expect(wrapper.vm.errors.password).toBe('Пароль обязателен')
  
  // Дополнительно можно проверить отображение ошибок в DOM
  expect(wrapper.find('.error-message').text()).toContain('Имя обязательно')
})
  it('отправляет форму добавления пользователя', async () => {
    // Заполняем форму
    await wrapper.find('input#name').setValue('Новый пользователь')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input[value="executor"]').setValue(true)
    await nextTick()

    // Выбираем компетенции
    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true)
    
    // Отправляем форму
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(realApi.registerUser).toHaveBeenCalledWith({
      name: 'Новый пользователь',
      password: 'password123',
      isAdmin: false,
      isManager: false
    })
    expect(realApi.assignRoleToUser).toHaveBeenCalled()
  })

  it('отправляет форму редактирования пользователя', async () => {
    await wrapper.setProps({
      isEditing: true,
      currentUser: mockUser
    })

    // Изменяем имя
    await wrapper.find('input#name').setValue('Измененное имя')
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(realApi.updateUser).toHaveBeenCalledWith(mockUser.id, {
      name: 'Измененное имя',
      password: mockUser.password
    })
  })

  it('закрывает модальное окно при нажатии отмены', async () => {
    const closeBtn = wrapper.find('button.cancel-btn')
    await closeBtn.trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('показывает блок компетенций только для исполнителя', async () => {
    // По умолчанию не должен показываться
    expect(wrapper.find('.competencies-list').exists()).toBe(false)

    // Выбираем исполнителя
    await wrapper.find('input[value="executor"]').setValue(true)
    await nextTick()
    
    expect(wrapper.find('.competencies-list').exists()).toBe(true)
    expect(wrapper.findAll('.competency-option').length).toBe(mockRoles.length)
  })

  it('загружает список ролей при монтировании', () => {
    expect(realApi.getRoles).toHaveBeenCalled()
    expect(wrapper.vm.availableRoles).toEqual(mockRoles)
  })

  it('сбрасывает форму при закрытии', async () => {
    // Заполняем форму
    await wrapper.find('input#name').setValue('Тест')
    await wrapper.find('input#password').setValue('test123')
    
    // Закрываем
    await wrapper.vm.closeModal()
    
    expect(wrapper.vm.form.name).toBe('')
    expect(wrapper.vm.form.password).toBe('')
    expect(wrapper.vm.userType).toBeNull()
  })
})