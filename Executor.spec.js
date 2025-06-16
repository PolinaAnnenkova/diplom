import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ExecutorView from '@/views/ExecutorView.vue'
import { nextTick } from 'vue'

// Мокаем зависимости
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('@/../api/realApi.js', () => ({
  default: {
    getProjects: vi.fn(),
    getTasksByRole: vi.fn(),
    getEntries: vi.fn(),
    getEntriesByDay: vi.fn(),
    deleteEntry: vi.fn(),
    getUserMe: vi.fn(),
    getRoles: vi.fn()
  }
}))

vi.mock('vue3-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('ExecutorView.vue', () => {
  let wrapper
  let realApi
  let router

  // Фабрики тестовых данных
  const createProject = (id, status = 'active') => ({
    id,
    code: `PRJ${id}`,
    name: `Проект ${id}`,
    status
  })

  const createTask = (id, projectId, isActive = true) => ({
    id,
    name: `Задача ${id}`,
    projectCode: `PRJ${projectId}`,
    isActive,
    roleId: id,
    description: `Описание задачи ${id}`
  })

  const createTimeEntry = (id, taskId) => ({
    id,
    date: `2023-01-0${id}`,
    time: `${id}:00`,
    taskId,
    description: `Работа по задаче ${taskId}`
  })

  const createRole = (id) => ({
    id,
    name: ['Разработчик', 'Тестировщик', 'Аналитик'][id - 1] || `Роль ${id}`
  })

  // Тестовые данные
  const mockProjects = [createProject(1), createProject(2, 'inactive')]
  const mockTasks = [createTask(1, 1), createTask(2, 2, false)]
  const mockTimeEntries = [createTimeEntry(1, 1), createTimeEntry(2, 2)]
  const mockRoles = [createRole(1), createRole(2)]

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Инициализация моков
    realApi = (await import('@/../api/realApi.js')).default
    router = (await import('vue-router')).useRouter()
    
    // Настройка моков API
    realApi.getProjects.mockResolvedValue(mockProjects)
    realApi.getTasksByRole.mockResolvedValue(mockTasks)
    realApi.getEntries.mockResolvedValue(mockTimeEntries)
    realApi.getEntriesByDay.mockResolvedValue([mockTimeEntries[0]])
    realApi.deleteEntry.mockResolvedValue(true)
    realApi.getRoles.mockResolvedValue(mockRoles)
    realApi.getUserMe.mockResolvedValue({ id: 1, name: 'Test User', roleId: 1 })
    
    // Мокаем localStorage
    global.localStorage = {
      getItem: vi.fn((key) => key === 'userId' ? '1' : null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    
    // Монтируем компонент с заглушками
    wrapper = mount(ExecutorView, {
      global: {
        stubs: {
          TimeEntryModal: true,
          DeleteTimeEntryModal: true,
          LogoutConfirmModal: true
        }
      }
    })
    
    await nextTick()
  })

  it('корректно монтируется', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('отображает основные элементы интерфейса', () => {
    expect(wrapper.find('.executor-view').exists()).toBe(true)
    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.tabs').exists()).toBe(true)
    expect(wrapper.find('.tab-content').exists()).toBe(true)
    expect(wrapper.findAll('.tabs button').length).toBe(3)
  })

  it('по умолчанию активна вкладка задач', () => {
    expect(wrapper.vm.activeTab).toBe('tasks')
    expect(wrapper.find('.tabs button.active').text()).toBe('Задачи')
  })

  it('переключает вкладки при клике', async () => {
    const tabs = wrapper.findAll('.tabs button')
    
    await tabs[0].trigger('click')
    expect(wrapper.vm.activeTab).toBe('projects')
    expect(tabs[0].classes()).toContain('active')
    
    await tabs[2].trigger('click')
    expect(wrapper.vm.activeTab).toBe('time-entries')
    expect(tabs[2].classes()).toContain('active')
  })

  describe('вкладка проектов', () => {
    beforeEach(async () => {
      await wrapper.setData({
        activeTab: 'projects',
        projects: [...mockProjects, createProject(3)]
      })
      await nextTick()
    })

    it('загружает проекты при монтировании', () => {
      expect(realApi.getProjects).toHaveBeenCalled()
    })

    it('отображает список проектов', () => {
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBe(3)
      expect(rows[0].text()).toContain('Проект 1')
      expect(rows[0].find('.status-badge').text()).toBe('Активный')
    })

    it('фильтрует проекты по статусу', async () => {
      const select = wrapper.find('select')
      
      await select.setValue('active')
      expect(wrapper.vm.filteredProjects.length).toBe(2)
      
      await select.setValue('inactive')
      expect(wrapper.vm.filteredProjects.length).toBe(1)
    })

    it('переходит к задачам проекта при клике', async () => {
      const firstRow = wrapper.findAll('tbody tr')[0]
      await firstRow.trigger('click')
      
      expect(wrapper.vm.activeTab).toBe('tasks')
      expect(wrapper.vm.currentProjectFilter).toBe(1) // Проверяем числовой ID
    })
  })

  describe('вкладка задач', () => {
    beforeEach(async () => {
      await wrapper.setData({
        activeTab: 'tasks',
        projects: mockProjects,
        allTasks: [...mockTasks, createTask(3, 1, false)],
        roles: mockRoles
      })
      await nextTick()
    })

    it('загружает задачи и роли при монтировании', () => {
      expect(realApi.getTasksByRole).toHaveBeenCalled()
      expect(realApi.getRoles).toHaveBeenCalled()
    })

    it('отображает список задач с названиями проектов и ролей', () => {
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBe(3)
      
      const firstRowCells = rows[0].findAll('td')
      expect(firstRowCells[0].text()).toBe('Задача 1')
      expect(firstRowCells[1].text()).toBe('Проект 1 (PRJ1)')
      expect(firstRowCells[2].text()).toContain('Разработчик')
      expect(firstRowCells[3].find('.status-badge').text()).toBe('Активна')
    })

    it('фильтрует задачи по проекту', async () => {
      const selects = wrapper.findAll('select')
      await selects[0].setValue(1) // Выбираем проект с ID 1
      
      expect(wrapper.vm.filteredTasksByCompetence.length).toBe(2)
      expect(wrapper.findAll('tbody tr').length).toBe(2)
    })

    it('фильтрует задачи по статусу', async () => {
      const selects = wrapper.findAll('select')
      await selects[1].setValue('active')
      
      expect(wrapper.vm.filteredTasksByCompetence.length).toBe(1)
      expect(wrapper.find('tbody tr').text()).toContain('Задача 1')
    })
  })

  describe('вкладка проводок', () => {
    beforeEach(async () => {
      await wrapper.setData({
        activeTab: 'time-entries',
        timeEntries: mockTimeEntries,
        allTasks: mockTasks,
        projects: mockProjects
      })
      await nextTick()
    })

    it('загружает проводки при монтировании', () => {
      expect(realApi.getEntries).toHaveBeenCalled()
    })

    it('отображает список проводок', () => {
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBe(2)
      
      const firstRowCells = rows[0].findAll('td')
      expect(firstRowCells[0].text()).toContain('1 янв. 2023 г.')
      expect(firstRowCells[1].text()).toContain('1 ч')
      expect(firstRowCells[2].text()).toContain('Задача 1')
      expect(firstRowCells[3].text()).toContain('Работа по задаче 1')
    })

    it('переключает режимы фильтрации', async () => {
      const select = wrapper.find('select')
      await select.setValue('day')
      
      expect(wrapper.vm.timeEntriesFilterMode).toBe('day')
      expect(realApi.getEntriesByDay).toHaveBeenCalled()
    })

    it('открывает модальное окно для новой проводки', async () => {
      await wrapper.find('.add-button').trigger('click')
      expect(wrapper.vm.showTimeEntryModal).toBe(true)
      expect(wrapper.vm.currentTimeEntry).toBeNull()
    })

    it('инициирует удаление проводки', async () => {
      const deleteBtn = wrapper.findAll('.delete-btn')[0]
      await deleteBtn.trigger('click')
      
      expect(wrapper.vm.showDeleteModal).toBe(true)
      expect(wrapper.vm.entryToDeleteId).toBe(1)
    })
  })

  describe('логика выхода', () => {
    it('открывает модальное окно при клике на выход', async () => {
      await wrapper.find('.logout-btn').trigger('click')
      expect(wrapper.vm.showLogoutModal).toBe(true)
    })

    it('выполняет выход при подтверждении', async () => {
      wrapper.vm.confirmLogout()
      await nextTick()
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('userId')
      expect(router.push).toHaveBeenCalledWith('/')
    })
  })

  it('корректно форматирует время', () => {
    expect(wrapper.vm.formatTime('2:30')).toBe('2 ч 30 мин')
    expect(wrapper.vm.formatTime('1.00:00')).toBe('1 ч')
    expect(wrapper.vm.formatTime('invalid')).toBe('invalid')
  })

  describe('определяет классы строк для проводок', () => {
  it('правильно присваивает классы в зависимости от времени', async () => {
    // Мокаем данные перед монтированием компонента
    realApi.getEntries.mockResolvedValue([
      { id: 1, date: '2023-01-01', time: '10:00', taskId: 1, description: 'Переработка' },
      { id: 2, date: '2023-01-02', time: '8:00', taskId: 2, description: 'Норма' },
      { id: 3, date: '2023-01-03', time: '6:00', taskId: 3, description: 'Недобор' }
    ])

    // Перемонтируем компонент с новыми моками
    wrapper = mount(ExecutorView, {
      global: {
        stubs: {
          TimeEntryModal: true,
          DeleteTimeEntryModal: true,
          LogoutConfirmModal: true
        }
      }
    })

    // Устанавливаем активную вкладку
    await wrapper.setData({ activeTab: 'time-entries' })
    await nextTick()

    // Ждем загрузки данных
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // Проверяем классы строк
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(3)
    
    expect(rows[0].classes()).toContain('over-hours')
    expect(rows[1].classes()).toContain('exact-hours')
    expect(rows[2].classes()).toContain('under-hours')
  })
})
})