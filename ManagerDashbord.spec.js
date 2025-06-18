import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ManagerDashboard from '@/views/ManagerDashboard.vue'
import { nextTick } from 'vue'

// Мокаем дочерние компоненты и зависимости
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('vue3-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('ManagerDashboard.vue', () => {
  let wrapper
  const mockRouter = {
    push: vi.fn()
  }
  beforeEach(() => {
    // Мокаем sessionStorage
    global.sessionStorage = {
      removeItem: vi.fn(),
       getItem: vi.fn()
    }
    vi.mock('vue3-toastify', () => ({
      toast: {
        success: vi.fn(),
        error: vi.fn()
      }
    }))
    wrapper = mount(ManagerDashboard, {
      global: {
        stubs: {
          ProjectsView: true,
          TasksView: true,
          TasksReportView: true
        }
      }
    })
     
  })

  it('отображает основные элементы интерфейса', () => {
    expect(wrapper.find('.manager-dashboard').exists()).toBe(true)
    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.tabs').exists()).toBe(true)
    expect(wrapper.find('.actions').exists()).toBe(true)
    expect(wrapper.find('.tab-content').exists()).toBe(true)
  })

  it('по умолчанию активна вкладка "Проекты"', () => {
    expect(wrapper.vm.activeTab).toBe('projects')
    expect(wrapper.find('.tabs button.active').text()).toBe('Проекты')
  })

  it('переключает вкладки при клике', async () => {
    const tabs = wrapper.findAll('.tabs button')
    
    await tabs[1].trigger('click') // Клик по "Задачи"
    expect(wrapper.vm.activeTab).toBe('tasks')
    expect(tabs[1].classes()).toContain('active')
    
    await tabs[2].trigger('click') // Клик по "Отчет по задачам"
    expect(wrapper.vm.activeTab).toBe('reports')
    expect(tabs[2].classes()).toContain('active')
    
    await tabs[0].trigger('click') // Возврат к "Проектам"
    expect(wrapper.vm.activeTab).toBe('projects')
    expect(tabs[0].classes()).toContain('active')
  })

  it('отображает кнопку создания проекта только на вкладке проектов', async () => {
    // На вкладке проектов
    expect(wrapper.find('.create-btn').exists()).toBe(true)
    
    // Переключаемся на задачи
    await wrapper.find('.tabs button:nth-child(2)').trigger('click')
    expect(wrapper.find('.create-btn').exists()).toBe(false)
    
    // Переключаемся на отчеты
    await wrapper.find('.tabs button:nth-child(3)').trigger('click')
    expect(wrapper.find('.create-btn').exists()).toBe(false)
  })

  it('вызывает метод открытия модального окна при клике на создание проекта', async () => {
    // Мокаем метод в дочернем компоненте
    wrapper.vm.projectsView = {
      openCreateModal: vi.fn()
    }
    
    await wrapper.find('.create-btn').trigger('click')
    expect(wrapper.vm.projectsView.openCreateModal).toHaveBeenCalled()
  })

  it('обрабатывает создание проекта', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    await wrapper.vm.handleProjectCreated()
    expect(consoleSpy).toHaveBeenCalledWith('Новый проект создан')
  })

  
})