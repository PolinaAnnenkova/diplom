import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CompetenceModal from '@/views/CompetenceModal.vue'
import { nextTick } from 'vue'

describe('CompetenceModal.vue', () => {
  let wrapper
  const mockCompetence = {
    id: 1,
    name: 'Тестовая компетенция'
  }

  beforeEach(() => {
    wrapper = mount(CompetenceModal, {
      props: {
        showModal: false,
        currentItem: null,
        isEditing: false
      }
    })
  })

  it('отображает модальное окно только при showModal=true', async () => {
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    
    await wrapper.setProps({ showModal: true })
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
  })

  it('отображает правильный заголовок в зависимости от режима', async () => {
    await wrapper.setProps({ showModal: true })
    expect(wrapper.find('h3').text()).toBe('Создание компетенции')
    
    await wrapper.setProps({ isEditing: true })
    expect(wrapper.find('h3').text()).toBe('Редактирование компетенции')
  })

  it('сбрасывает форму при закрытии', async () => {
    await wrapper.setProps({ showModal: true })
    await wrapper.find('input').setValue('Тест')
    await wrapper.find('.close-btn').trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('заполняет форму при редактировании', async () => {
    await wrapper.setProps({ 
      showModal: true,
      currentItem: mockCompetence,
      isEditing: true
    })
    await nextTick()
    
    expect(wrapper.find('input').element.value).toBe(mockCompetence.name)
  })

  describe('валидация формы', () => {
    beforeEach(async () => {
      await wrapper.setProps({ showModal: true })
      window.alert = vi.fn()
    })

    it('не позволяет сохранить с пустым названием', async () => {
      await wrapper.find('input').setValue('')
      await wrapper.find('.save-btn').trigger('click')
      
      expect(window.alert).toHaveBeenCalledWith('Название компетенции обязательно для заполнения')
      expect(wrapper.emitted('save')).toBeFalsy()
    })

    it('эмитит событие save с корректными данными', async () => {
      const testName = 'Новая компетенция'
      await wrapper.find('input').setValue(testName)
      await wrapper.find('.save-btn').trigger('click')
      
      expect(wrapper.emitted('save')).toBeTruthy()
      expect(wrapper.emitted('save')[0][0]).toEqual({
        name: testName
      })
    })
  })

  it('сбрасывает форму после сохранения', async () => {
    await wrapper.setProps({ showModal: true })
    await wrapper.find('input').setValue('Тест')
    await wrapper.find('.save-btn').trigger('click')
    
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('реагирует на изменения currentItem', async () => {
    await wrapper.setProps({ 
      showModal: true,
      currentItem: mockCompetence 
    })
    await nextTick()
    
    expect(wrapper.find('input').element.value).toBe(mockCompetence.name)
    
    await wrapper.setProps({ currentItem: null })
    await nextTick()
    
    expect(wrapper.find('input').element.value).toBe('')
  })
})