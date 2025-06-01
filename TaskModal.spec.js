import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TaskModal from '@/views/TaskModal.vue'
import { nextTick } from 'vue'

vi.mock('/api/realApi.js', () => ({
  default: {
    createTask: vi.fn(async (data) => ({
      id: 1,
      ...data
    })),
    updateTask: vi.fn(async (data) => data)
  }
}))

describe('TaskModal.vue', () => {
  let wrapper
  const sampleProjects = [
    { name: 'Проект A', code: 'A001' }
  ]

  const sampleRoles = [
    { id: 'r1', name: 'Разработчик' }
  ]

  beforeEach(() => {
    wrapper = mount(TaskModal, {
      props: {
        showModal: true,
        isEditing: false,
        currentTask: null,
        projects: sampleProjects,
        roles: sampleRoles
      }
    })
  })

  it('отображается модальное окно с заголовком создания', () => {
    expect(wrapper.text()).toContain('Создание задачи')
    expect(wrapper.find('input#name').exists()).toBe(true)
  })

  it('показывает ошибки при отправке пустой формы', async () => {
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Введите название задачи')
    expect(wrapper.text()).toContain('Выберите проект')
    expect(wrapper.text()).toContain('Выберите роль')
  })

  it('успешно создает задачу', async () => {
  // Mount with all required props including projects and roles
  wrapper = mount(TaskModal, {
    props: {
      showModal: true,
      isEditing: false,
      projects: sampleProjects,
      roles: sampleRoles,
      currentTask: null
    }
  });

  // Fill out the form completely
  await wrapper.find('#name').setValue('Новая задача');
  await wrapper.find('#projectCode').setValue('A001');
  await wrapper.find('#roleId').setValue('r1');
  
  // Trigger form submission
  await wrapper.find('form').trigger('submit.prevent');
  
  // Wait for promises and DOM updates
  await flushPromises();
  await nextTick();

  // Check that the event was emitted
  expect(wrapper.emitted('task-created')).toBeTruthy();
  
  // Check the emitted payload
  expect(wrapper.emitted('task-created')[0][0]).toMatchObject({
    name: 'Новая задача',
    projectCode: 'A001',
    roleId: 'r1'
  });
});

  it('в режиме редактирования показывает другой заголовок и не отображает проект и роль', async () => {
    await wrapper.setProps({
      isEditing: true,
      currentTask: {
        id: 101,
        name: 'Старая задача',
        projectCode: 'A001',
        roleId: 'r1',
        isActive: false
      }
    })

    expect(wrapper.text()).toContain('Редактирование задачи')
    expect(wrapper.find('#projectCode').exists()).toBe(false)
    expect(wrapper.find('#roleId').exists()).toBe(false)
    expect(wrapper.find('input#name').element.value).toBe('Старая задача')
  })
})
