import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectModal from '@/views/ProjectModal.vue'
import { nextTick } from 'vue'

describe('ProjectModal.vue', () => {
  let wrapper
  const mockProject = {
    id: 1,
    name: 'Тестовый проект',
    code: 'TEST',
    status: 'active'
  }

  beforeEach(() => {
    // Мокаем toast
    vi.mock('vue3-toastify', () => ({
      toast: {
        success: vi.fn(),
        error: vi.fn()
      }
    }))

    wrapper = mount(ProjectModal, {
      props: {
        showModal: false,
        isEditing: false
      }
    })
  })

  it('отображает форму создания проекта', async () => {
    await wrapper.setProps({ showModal: true })
    expect(wrapper.find('h2').text()).toBe('Создание проекта')
    expect(wrapper.find('input#code').exists()).toBe(false)
  })

  it('отображает форму редактирования проекта', async () => {
    await wrapper.setProps({ 
      showModal: true,
      isEditing: true,
      currentProject: mockProject
    })
    
    expect(wrapper.find('h2').text()).toBe('Редактирование проекта')
    expect(wrapper.find('input#code').exists()).toBe(true)
    expect(wrapper.find('input#name').element.value).toBe(mockProject.name)
    expect(wrapper.find('input#code').element.value).toBe(mockProject.code)
  })

  it('закрывает модальное окно при клике на оверлей', async () => {
    await wrapper.setProps({ showModal: true })
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('закрывает модальное окно при нажатии отмены', async () => {
    await wrapper.setProps({ showModal: true })
    await wrapper.find('.cancel-btn').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('валидирует форму перед сохранением', async () => {
    await wrapper.setProps({ showModal: true })
    
    // Пытаемся сохранить с пустым названием
    await wrapper.find('form').trigger('submit')
    await nextTick()
    
    expect(wrapper.find('.error-message').text()).toBe('Введите название проекта')
    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('отправляет данные формы при создании', async () => {
    await wrapper.setProps({ showModal: true })
    
    // Заполняем форму
    await wrapper.find('input#name').setValue('Новый проект')
    await wrapper.find('.toggle-btn:first-child').trigger('click') // Активный
    
    // Отправляем форму
    await wrapper.find('form').trigger('submit')
    await nextTick()
    
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0]).toEqual([{
      name: 'Новый проект',
      isActive: true
    }])
  })

  it('отправляет данные формы при редактировании', async () => {
    await wrapper.setProps({ 
      showModal: true,
      isEditing: true,
      currentProject: mockProject
    })
    
    // Изменяем данные
    await wrapper.find('input#name').setValue('Измененное название')
    await wrapper.find('.toggle-btn:last-child').trigger('click') // Неактивный
    
    // Отправляем форму
    await wrapper.find('form').trigger('submit')
    await nextTick()
    
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0]).toEqual([{
      id: 1,
      code: 'TEST',
      name: 'Измененное название',
      isActive: false
    }])
  })

  it('блокирует кнопку сохранения при отправке', async () => {
    await wrapper.setProps({ showModal: true })
    await wrapper.find('input#name').setValue('Новый проект')
    
    // Проверяем что кнопка не заблокирована
    expect(wrapper.find('.save-btn').attributes('disabled')).toBeUndefined()
    
    // Отправляем форму
    wrapper.vm.isSubmitting = true
    await nextTick()
    
    // Проверяем что кнопка заблокирована
    expect(wrapper.find('.save-btn').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.save-btn').text()).toBe('Сохранение...')
  })

  

  it('отображает статус проекта', async () => {
    await wrapper.setProps({ 
      showModal: true,
      currentProject: mockProject
    })
    
    // Проверяем активный статус
    expect(wrapper.find('.toggle-btn:first-child').classes()).toContain('active')
    
    // Меняем на неактивный
    await wrapper.find('.toggle-btn:last-child').trigger('click')
    expect(wrapper.vm.form.isActive).toBe(false)
    expect(wrapper.find('.toggle-btn:last-child').classes()).toContain('active')
  })
})