// tests/TasksView.spec.js
import { mount, flushPromises } from '@vue/test-utils';
import TasksView from '@/views/TasksView.vue';
import TaskModal from '@/views/TaskModal.vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем realApi
vi.mock('./api/realApi.js', () => ({
  default: {
    getTasks: vi.fn(),
    getProjects: vi.fn(),
    getRoles: vi.fn(),
    deleteTask: vi.fn(),
  }
}));

import realApi from './api/realApi.js';

describe('TasksView.vue', () => {
  const mockTasks = [
    {
      id: 1,
      name: 'Задача 1',
      project: { name: 'Проект 1', code: 'PRJ1', isActive: true },
      projectCode: 'PRJ1',
      role: { id: 1, name: 'Разработчик' },
      isActive: true
    }
  ];
  const mockProjects = [{ id: 1, name: 'Проект 1', code: 'PRJ1', isActive: true }];
  const mockRoles = [{ id: 1, name: 'Разработчик' }];

  beforeEach(() => {
    realApi.getTasks.mockResolvedValue(mockTasks);
    realApi.getProjects.mockResolvedValue(mockProjects);
    realApi.getRoles.mockResolvedValue(mockRoles);
  });

  it('отображает задачи после загрузки', async () => {
    const wrapper = mount(TasksView);
    await flushPromises();

    expect(wrapper.text()).toContain('Список задач');
    expect(wrapper.find('table').text()).toContain('Задача 1');
    expect(wrapper.find('table').text()).toContain('Проект 1');
    expect(wrapper.find('table').text()).toContain('Разработчик');
  });

  it('открывает модальное окно при клике на кнопку "Создать задачу"', async () => {
    const wrapper = mount(TasksView);
    await flushPromises();

    const createBtn = wrapper.find('.create-btn');
    expect(createBtn.exists()).toBe(true);
    await createBtn.trigger('click');

    expect(wrapper.findComponent(TaskModal).exists()).toBe(true);
    expect(wrapper.findComponent(TaskModal).props().isEditing).toBe(false);
  });

  it('эмитит событие "back" при нажатии кнопки "Назад"', async () => {
    const wrapper = mount(TasksView);
    await flushPromises();

    await wrapper.find('.back-btn').trigger('click');
    expect(wrapper.emitted('back')).toBeTruthy();
  });
});
