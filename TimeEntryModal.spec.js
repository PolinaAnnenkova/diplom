import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TimeEntryModal from '@/views/TimeEntryModal.vue'
import { nextTick } from 'vue'

// Мокаем зависимости
vi.mock('@/../api/realApi.js', () => ({
  default: {
    addEntry: vi.fn(),
    updateEntry: vi.fn()
  }
}))

vi.mock('vue3-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('TimeEntryModal.vue', () => {
  let wrapper
  let realApi
  const mockTasks = [
    { id: 1, title: 'Задача 1', projectId: 1, status: 'active' },
    { id: 2, title: 'Задача 2', projectId: 2, status: 'inactive' }
  ]
  const mockProjects = [
    { id: 1, name: 'Проект 1' },
    { id: 2, name: 'Проект 2' }
  ]
  const mockEntry = {
    id: 1,
    date: '2023-01-01T00:00:00',
    time: '02:30:00',
    description: 'Тестовая проводка',
    taskId: 1
  }

  beforeEach(async () => {
    // Инициализация моков API
    realApi = await import('@/../api/realApi.js')
    realApi.default.addEntry.mockResolvedValue({})
    realApi.default.updateEntry.mockResolvedValue({})

    wrapper = mount(TimeEntryModal, {
      props: {
        show: false,
        tasks: mockTasks,
        projects: mockProjects
      }
    })
  })

  it('отображает форму создания новой проводки', async () => {
    await wrapper.setProps({ show: true })
    
    expect(wrapper.find('h3').text()).toBe('Новая проводка')
    expect(wrapper.find('input#entry-date').element.value).toBe(new Date().toISOString().split('T')[0])
    expect(wrapper.find('input[type="number"]').element.value).toBe('1') // Часы по умолчанию
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('отображает форму редактирования проводки', async () => {
    await wrapper.setProps({ 
      show: true,
      currentEntry: mockEntry
    })
    
    expect(wrapper.find('h3').text()).toBe('Редактировать проводку')
    expect(wrapper.find('input#entry-date').element.value).toBe('2023-01-01')
    expect(wrapper.findAll('input[type="number"]')[0].element.value).toBe('2')
    expect(wrapper.findAll('input[type="number"]')[1].element.value).toBe('30')
    expect(wrapper.find('textarea').element.value).toBe('Тестовая проводка')
  })

  it('закрывает модальное окно при клике на оверлей', async () => {
    await wrapper.setProps({ show: true })
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('закрывает модальное окно при клике на кнопку отмены', async () => {
    await wrapper.setProps({ show: true })
    await wrapper.find('.btn-secondary').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  
  it('создает новую проводку', async () => {
    await wrapper.setProps({ show: true })
    
    // Заполняем форму
    await wrapper.find('input#entry-date').setValue('2023-01-02')
    await wrapper.findAll('input[type="number"]')[0].setValue(3) // Часы
    await wrapper.findAll('input[type="number"]')[1].setValue(45) // Минуты
    await wrapper.find('select').setValue(1)
    await wrapper.find('textarea').setValue('Новая работа')
    
    // Отправляем форму
    await wrapper.find('form').trigger('submit')
    await nextTick()
    
    expect(realApi.default.addEntry).toHaveBeenCalledWith({
      date: '2023/01/02',
      time: '03:45:00',
      taskId: 1,
      desc: 'Новая работа'
    })
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('обновляет существующую проводку', async () => {
    await wrapper.setProps({ 
      show: true,
      currentEntry: mockEntry
    })
    
    // Изменяем данные
    await wrapper.find('input#entry-date').setValue('2023-01-03')
    await wrapper.findAll('input[type="number"]')[0].setValue(4)
    await wrapper.findAll('input[type="number"]')[1].setValue(15)
    await wrapper.find('textarea').setValue('Обновленная работа')
    
    // Отправляем форму
    await wrapper.find('form').trigger('submit')
    await nextTick()
    
    expect(realApi.default.updateEntry).toHaveBeenCalledWith(1, {
      date: '2023/01/03',
      time: '04:15:00',
      taskId: 1,
      desc: 'Обновленная работа'
    })
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('блокирует кнопку сохранения при отправке', async () => {
    await wrapper.setProps({ show: true })
    
    // Заполняем обязательные поля
    await wrapper.find('select').setValue(1)
    
    // Проверяем что кнопка не заблокирована
    expect(wrapper.find('.btn-primary').attributes('disabled')).toBeUndefined()
    
    // Имитируем отправку
    wrapper.vm.loading = true
    await nextTick()
    
    // Проверяем что кнопка заблокирована
    expect(wrapper.find('.btn-primary').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.btn-primary').text()).toBe('Сохранение...')
  })

  it('отображает только активные задачи', async () => {
    await wrapper.setProps({ show: true })
    
    const options = wrapper.findAll('select option')
    expect(options.length).toBe(2) // 1 задача + disabled option
    expect(options[1].text()).toContain('Задача 1')
    expect(options.some(opt => opt.text().includes('Задача 2'))).toBe(false)
  })

  it('корректно форматирует дату для бэкенда', () => {
    const formattedDate = wrapper.vm.formatDateForBackend('2023-12-31')
    expect(formattedDate).toBe('2023/12/31')
  })

  

  it('корректно отображает название проекта для задачи', async () => {
    await wrapper.setProps({ show: true })
    const projectName = wrapper.vm.getProjectName(1)
    expect(projectName).toBe('Проект 1')
  })
})