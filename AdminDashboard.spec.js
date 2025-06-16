import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminDashboard from '@/views/AdminPanel.vue'
import { useRouter } from 'vue-router'
import { nextTick } from 'vue'

// Мокаем зависимости
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

vi.mock('@/views/UsersView.vue', () => ({
  default: {
    template: '<div class="users-view-mock">UsersView Mock</div>'
  }
}))

vi.mock('@/views/CompetenciesView.vue', () => ({
  default: {
    template: '<div class="competencies-view-mock">CompetenciesView Mock</div>'
  }
}))

describe('AdminDashboard.vue', () => {
  let wrapper
  let router

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks()
    
    // Инициализируем router
    router = useRouter()
    
    // Мокаем sessionStorage
    global.sessionStorage = {
      removeItem: vi.fn()
    }
    
    // Мокаем confirm
    global.confirm = vi.fn(() => true)
    
    // Монтируем компонент
    wrapper = mount(AdminDashboard)
  })

  it('отображает основные элементы', () => {
    expect(wrapper.find('.admin-dashboard').exists()).toBe(true)
    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.tabs').exists()).toBe(true)
    expect(wrapper.find('.logout-btn').exists()).toBe(true)
    expect(wrapper.find('.tab-content').exists()).toBe(true)
  })

  it('по умолчанию активна вкладка "Пользователи"', () => {
    expect(wrapper.find('.tabs button.active').text()).toBe('Пользователи')
    expect(wrapper.find('.users-view-mock').exists()).toBe(true)
    expect(wrapper.find('.competencies-view-mock').exists()).toBe(false)
  })

  it('переключает вкладки при клике', async () => {
    const competencyTab = wrapper.findAll('.tabs button')[1]
    await competencyTab.trigger('click')
    
    expect(wrapper.vm.activeTab).toBe('сompetencies')
    expect(wrapper.find('.tabs button.active').text()).toBe('Компетенции')
    expect(wrapper.find('.users-view-mock').exists()).toBe(false)
    expect(wrapper.find('.competencies-view-mock').exists()).toBe(true)
  })

  describe('выход из системы', () => {
    let sessionStorageMock

  beforeEach(() => {
    // Создаем мок sessionStorage
    routerPush = vi.fn()
    useRouter.mockImplementation(() => ({
      push: routerPush
    }))
    
    // Мокаем sessionStorage
    global.sessionStorage = {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    }
  })

  it('полный процесс выхода из системы', async () => {
    // 1. Устанавливаем тестовые данные
    sessionStorage.setItem('authToken', 'test-token')
    sessionStorage.setItem('currentUser', 'test-user')

    // 2. Имитируем клик на кнопку выхода
    await wrapper.find('.logout-btn').trigger('click')
    
    // 3. Проверяем что модальное окно открылось
    expect(wrapper.vm.showLogoutModal).toBe(true)

    // 4. Эмулируем подтверждение выхода
    await wrapper.vm.performLogout()
    await wrapper.vm.$nextTick() // Ждем обновления компонента

    // 5. Проверяем очистку sessionStorage
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('authToken')
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('currentUser')

    // 6. Проверяем перенаправление
    expect(routerPush).toHaveBeenCalledTimes(1)
    expect(routerPush).toHaveBeenCalledWith('/')

    // 7. Проверяем закрытие модального окна
    expect(wrapper.vm.showLogoutModal).toBe(false)
  })

  it('не выполняет выход при отмене', async () => {
    // 1. Имитируем клик на кнопку выхода
    await wrapper.find('.logout-btn').trigger('click')
    
    // 2. Закрываем модальное окно без подтверждения
    await wrapper.vm.$emit('close')
    await wrapper.vm.$nextTick()

    // 3. Проверяем что sessionStorage не очищался
    expect(sessionStorage.removeItem).not.toHaveBeenCalled()
    
    // 4. Проверяем что перенаправления не было
    expect(routerPush).not.toHaveBeenCalled()
    
    // 5. Проверяем что модальное окно закрылось
    expect(wrapper.vm.showLogoutModal).toBe(false)
  })
    sessionStorageMock = {
      store: {},
      setItem: vi.fn((key, value) => {
        sessionStorageMock.store[key] = value
      }),
      getItem: vi.fn(key => sessionStorageMock.store[key]),
      removeItem: vi.fn(key => {
        delete sessionStorageMock.store[key]
      }),
      clear: vi.fn(() => {
        sessionStorageMock.store = {}
      })
    }
      // Заменяем глобальный sessionStorage на наш мок
    global.sessionStorage = sessionStorageMock
  })

     it('открывает модальное окно подтверждения при клике на выход', async () => {
    await wrapper.find('.logout-btn').trigger('click')
    expect(wrapper.vm.showLogoutModal).toBe(true)
  })

  it('очищает sessionStorage и перенаправляет при подтверждении', async () => {
    // Устанавливаем тестовые данные
    sessionStorage.setItem('authToken', 'test-token')
    sessionStorage.setItem('currentUser', 'test-user')

    // Имитируем клик на кнопку выхода
    await wrapper.find('.logout-btn').trigger('click')
    
    // Проверяем что модальное окно открылось
    expect(wrapper.vm.showLogoutModal).toBe(true)

    // Эмулируем подтверждение выхода
    await wrapper.vm.performLogout()

    // Проверяем что данные удалены из sessionStorage
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('authToken')
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('currentUser')
    
    // Проверяем что хранилище очищено
    expect(sessionStorage.getItem('authToken')).toBeUndefined()
    expect(sessionStorage.getItem('currentUser')).toBeUndefined()

    // Проверяем перенаправление
    expect(router.push).toHaveBeenCalledWith('/')

    // Проверяем что модальное окно закрылось
    expect(wrapper.vm.showLogoutModal).toBe(false)
  })
    it('не выполняет выход при отмене', async () => {
      global.confirm.mockReturnValue(false)
      await wrapper.find('.logout-btn').trigger('click')
      
      expect(sessionStorage.removeItem).not.toHaveBeenCalled()
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  
})