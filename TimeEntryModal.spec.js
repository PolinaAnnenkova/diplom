import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TimeEntryModal from '@/views/TimeEntryModal.vue'
import realApi from './api/realApi'

const mockTasks = [
  { id: '1', title: 'Задача 1', status: 'active' },
  { id: '2', title: 'Задача 2', status: 'done' },
  { id: '3', title: 'Задача 3', status: 'active' },
]

describe('TimeEntryModal.vue', () => {
  let wrapper

  const factory = (props = {}) => {
    return mount(TimeEntryModal, {
      props: {
        show: true,
        tasks: mockTasks,
        ...props,
      },
    })
  }

  beforeEach(() => {
    wrapper = factory()
  })

  it('отображается с правильным заголовком', () => {
    expect(wrapper.text()).toContain('Новая проводка')
  })

  it('показывает только активные задачи в выпадающем списке', () => {
    const options = wrapper.findAll('select#taskId option')
    const optionTexts = options.map(o => o.text())
    expect(optionTexts).toContain('Задача 1')
    expect(optionTexts).toContain('Задача 3')
    expect(optionTexts).not.toContain('Задача 2')
  })

  it('отображает ошибки при пустой отправке формы', async () => {
  // Instead of using setData, directly access the component's form
  wrapper.vm.form.date = '';
  wrapper.vm.form.taskId = '';
  wrapper.vm.form.hours = 1;

  await wrapper.find('form').trigger('submit.prevent');
  await wrapper.vm.$nextTick();
  
  // Check for error messages in the rendered HTML
  expect(wrapper.text()).toContain('Укажите дату');
  expect(wrapper.text()).toContain('Выберите задачу');
});
  it('успешно создает проводку времени', async () => {
  // Prepare test data
  const testDate = new Date().toISOString().split('T')[0];
  const testTaskId = mockTasks[0].id;
  const testHours = 2;

  // Fill the form
  await wrapper.find('input[type="date"]').setValue(testDate);
  await wrapper.find('select').setValue(testTaskId);
  await wrapper.find('input[type="number"]').setValue(testHours);

  // Trigger form submission
  await wrapper.find('form').trigger('submit.prevent');

  // Wait for Vue to process
  await wrapper.vm.$nextTick();

  // Verify the emitted event
  expect(wrapper.emitted('save')).toBeTruthy();
  expect(wrapper.emitted('save')[0][0]).toEqual({
    id: null,
    date: testDate,
    taskId: testTaskId,
    hours: testHours,
    description: ''
  });
});
})
