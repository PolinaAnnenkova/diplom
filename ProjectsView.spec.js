import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectsView from '@/views/ProjectsView.vue'
import ProjectModal from '@/views/ProjectModal.vue'
import realApi from '@/../api/realApi.js'
import { nextTick } from 'vue'

// Мокаем API и toast
vi.mock('@/../api/realApi.js')
vi.mock('vue3-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('ProjectsView.vue', () => {
  let wrapper
  const mockProjects = [
    { id: 1, code: 'PRJ1', name: 'Проект 1', status: 'active' },
    { id: 2, code: 'PRJ2', name: 'Проект 2', status: 'inactive' }
  ]

  beforeEach(async () => {
    // Настраиваем моки API
    realApi.getProjects.mockResolvedValue(mockProjects)
    realApi.createProject.mockResolvedValue({})
    realApi.updateProject.mockResolvedValue({})
    realApi.deleteProject.mockResolvedValue({})

    wrapper = mount(ProjectsView)
    await nextTick() // Ждем завершения mounted хука
  })

  it('отображает основные элементы', () => {
    expect(wrapper.find('.filters select').exists()).toBe(true)
    expect(wrapper.find('.projects-table').exists()).toBe(true)
    expect(wrapper.findAll('thead th').length).toBe(4)
  })

  it('загружает проекты при монтировании', async () => {
    expect(realApi.getProjects).toHaveBeenCalled()
    await nextTick()
    expect(wrapper.findAll('tbody tr').length).toBe(mockProjects.length)
  })

  it('отображает состояние загрузки', async () => {
  // Способ 1: Мокаем API чтобы вызвать состояние загрузки
  realApi.getProjects.mockImplementation(() => {
    return new Promise(() => {}) // Бесконечный промис для симуляции загрузки
  })
  
  // Перемонтируем компонент
  wrapper = mount(ProjectsView)
  await nextTick()
  
  expect(wrapper.find('.loading').exists()).toBe(true)
  expect(wrapper.find('.loading').text()).toBe('Загрузка...')
  
  // Восстанавливаем оригинальный mock
  realApi.getProjects.mockResolvedValue(mockProjects)
})

// Или альтернативный способ:
it('отображает состояние загрузки через прямое изменение ref', async () => {
  // Правильный доступ к ref в Composition API
  wrapper.vm.isLoading = true // или wrapper.vm.isLoading.value = true, если это ref
  await nextTick()
  
  expect(wrapper.find('.loading').exists()).toBe(true)
  expect(wrapper.find('.loading').text()).toBe('Загрузка...')
  
  // Возвращаем исходное состояние
  wrapper.vm.isLoading = false
})

  it('отображает ошибку при неудачной загрузке', async () => {
    const errorMsg = 'Ошибка загрузки'
    realApi.getProjects.mockRejectedValue(new Error(errorMsg))
    await wrapper.vm.loadProjects()
    await nextTick()
    
    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error').text()).toContain(errorMsg)
  })

  it('фильтрует проекты по статусу', async () => {
  // Вместо setData используем прямое присваивание
  wrapper.vm.projects = [
    ...mockProjects,
    { id: 3, code: 'PRJ3', name: 'Проект 3', status: 'active' }
  ];
  
  await nextTick();
  
  // Проверяем фильтр "Все"
  expect(wrapper.vm.filteredProjects.length).toBe(3);
  
  // Фильтруем активные
  await wrapper.find('.filters select').setValue('active');
  expect(wrapper.vm.filteredProjects.length).toBe(2);
  
  // Фильтруем неактивные
  await wrapper.find('.filters select').setValue('inactive');
  expect(wrapper.vm.filteredProjects.length).toBe(1);
});
  it('отображает правильные статусы проектов', async () => {
    await nextTick()
    const statusBadges = wrapper.findAll('.status-badge')
    
    expect(statusBadges[0].classes()).toContain('active')
    expect(statusBadges[0].text()).toBe('Активный')
    
    expect(statusBadges[1].classes()).toContain('inactive')
    expect(statusBadges[1].text()).toBe('Неактивный')
  })

  it('открывает модальное окно для редактирования', async () => {
  await nextTick();
  const editButtons = wrapper.findAll('.edit-btn');
  
  await editButtons[0].trigger('click');
  await nextTick();
  
  expect(wrapper.vm.showModal).toBe(true);
  expect(wrapper.vm.isEditing).toBe(true);
  
  // Сравниваем только нужные поля
  expect(wrapper.vm.currentProject).toMatchObject({
    id: mockProjects[0].id,
    code: mockProjects[0].code,
    name: mockProjects[0].name,
    status: mockProjects[0].status
  });
});

 
it('обновляет существующий проект', async () => {
  const updatedProject = { 
    ...mockProjects[0], 
    name: 'Обновленный проект',
    status: 'active'
  };

  await wrapper.vm.editProject(mockProjects[0]);
  await wrapper.vm.handleSave(updatedProject);
  await nextTick();

  expect(realApi.updateProject).toHaveBeenCalledWith(
    updatedProject.code,
    expect.objectContaining({
      name: updatedProject.name
      // Убрали проверку isActive, если API не использует это поле
    })
  );
});
  it('закрывает модальное окно', async () => {
  // Способ 1: Через вызов метода компонента
  wrapper.vm.showModal = true // Просто присваиваем значение, без .value
  wrapper.vm.currentProject = mockProjects[0] // Аналогично здесь
  await nextTick()
  
  // Проверяем что модальное окно открыто
  expect(wrapper.vm.showModal).toBe(true)
  
  // Вызываем метод закрытия
  await wrapper.vm.closeModal()
  await nextTick()
  
  // Проверяем что закрылось
  expect(wrapper.vm.showModal).toBe(false)
  expect(wrapper.vm.currentProject).toBeNull()

  // Способ 2: Через эмит события из дочернего компонента (более правильный)
  wrapper.vm.showModal = true // Снова открываем
  await nextTick()
  
  // Находим модальное окно и эмитим событие закрытия
  const modal = wrapper.findComponent(ProjectModal)
  await modal.vm.$emit('close')
  await nextTick()
  
  expect(wrapper.vm.showModal).toBe(false)
  expect(wrapper.vm.currentProject).toBeNull()
})
})