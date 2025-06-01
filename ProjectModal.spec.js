import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectModal from '@/views/ProjectModal.vue'

describe('ProjectModal.vue', () => {
  let wrapper
  const closeSpy = vi.fn()
  const saveSpy = vi.fn()
  const createdSpy = vi.fn()

  beforeEach(() => {
    wrapper = mount(ProjectModal, {
      props: {
        showModal: true,
        currentProject: null,
        isEditing: false
      },
      // Прослушка эмитов через слушатели
      attrs: {
        onClose: closeSpy,
        onSave: saveSpy,
        onProjectCreated: createdSpy
      }
    })
  })

  it('отображается при showModal=true', () => {
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
  })

  it('содержит поля для name, code и статус', () => {
    expect(wrapper.find('input#name').exists()).toBe(true)
    expect(wrapper.find('input#code').exists()).toBe(true)
    expect(wrapper.find('.status-toggle').exists()).toBe(true)
  })

  it('показывает ошибки при пустом submit', async () => {
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.find('.error-message').text()).toBe('Введите название проекта')
    expect(wrapper.findAll('.error-message')[1].text()).toBe('Введите код проекта')
  })

  it('может заполнить форму и отправить данные', async () => {
    const nameInput = wrapper.find('input#name')
    const codeInput = wrapper.find('input#code')
    const activeBtn = wrapper.find('button.toggle-btn.active')

    await nameInput.setValue('Мой проект')
    await codeInput.setValue('PRJ001')

    // Проверим, что активный статус true (кнопка Активный активна)
    expect(activeBtn.text()).toBe('Активный')

    await wrapper.find('form').trigger('submit.prevent')

    expect(saveSpy).toHaveBeenCalledOnce()
    const emittedProject = saveSpy.mock.calls[0][0]

    expect(emittedProject).toEqual({
      name: 'Мой проект',
      code: 'PRJ001',
      isActive: true
    })
  })

  it('кнопка отмены вызывает close и очищает форму', async () => {
  // Заполним форму
  await wrapper.find('input#name').setValue('Test')
  await wrapper.find('input#code').setValue('CODE')

  // Reset the spy call count before the actual test
  closeSpy.mockClear()

  await wrapper.find('button.cancel-btn').trigger('click')

  expect(closeSpy).toHaveBeenCalledOnce()
  // Проверяем, что форма очистилась
  expect(wrapper.vm.form.name).toBe('')
  expect(wrapper.vm.form.code).toBe('')
  expect(wrapper.vm.form.isActive).toBe(true)
})
  it('при передаче currentProject в режиме редактирования форма заполняется', async () => {
    const project = {
      id: 123,
      name: 'Existing',
      code: 'EX123',
      status: 'active'
    }

    await wrapper.setProps({ currentProject: project, isEditing: true })

    expect(wrapper.vm.form.id).toBe(123)
    expect(wrapper.vm.form.name).toBe('Existing')
    expect(wrapper.vm.form.code).toBe('EX123')
    expect(wrapper.vm.form.isActive).toBe(true)

    // Проверка readonly для code
    expect(wrapper.find('input#code').attributes('readonly')).toBeDefined()
  })
})
