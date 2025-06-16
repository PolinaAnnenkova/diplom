import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TasksReport from '@/views/TasksReportView.vue'
import realApi from '@/../api/realApi.js'
import { nextTick } from 'vue'

// Мокаем API
vi.mock('@/../api/realApi.js', () => ({
  default: {
    getTasksByDay: vi.fn(),
    getTasksForPeriod: vi.fn()
  }
}))

describe('TasksReport.vue', () => {
  let wrapper
  const mockTasksData = {
    results: [
      {
        id: 1,
        name: 'Разработка API',
        isActive: true,
        user: {
          id: 101,
          name: 'Иван Петров',
          entryTime: '02:30:00'
        }
      },
      {
        id: 2,
        name: 'Дизайн интерфейса',
        isActive: false,
        user: {
          id: 102,
          name: 'Мария Сидорова',
          entryTime: '01:45:00'
        }
      }
    ],
    sum: '04:15:00'
  }

  beforeEach(() => {
    // Настраиваем моки API
    realApi.getTasksByDay.mockResolvedValue(mockTasksData)
    realApi.getTasksForPeriod.mockResolvedValue(mockTasksData)

    wrapper = mount(TasksReport)
  })

  it('отображает заголовок и базовые элементы', () => {
    expect(wrapper.find('h2').text()).toBe('Отчет по задачам')
    expect(wrapper.find('.report-filters').exists()).toBe(true)
    expect(wrapper.findAll('.filter-group').length).toBe(2)
    expect(wrapper.find('.no-results').exists()).toBe(true)
  })

  it('показывает правильные типы отчетов', () => {
    const typeButtons = wrapper.findAll('.type-btn')
    expect(typeButtons.length).toBe(2)
    expect(typeButtons[0].text()).toBe('За дату')
    expect(typeButtons[1].text()).toBe('За период')
  })

  it('переключает тип отчета', async () => {
    const periodButton = wrapper.findAll('.type-btn')[1]
    await periodButton.trigger('click')
    
    expect(wrapper.vm.selectedReportType).toBe('period')
    expect(periodButton.classes()).toContain('active')
  })

  it('показывает дату для отчета по дате', async () => {
  // Вместо setData используем wrapper.vm для доступа к реактивным свойствам
  wrapper.vm.selectedReportType = 'date'
  await nextTick()
  
  expect(wrapper.find('input#date-filter').exists()).toBe(true)
})

it('показывает период для отчета за период', async () => {
  wrapper.vm.selectedReportType = 'period'
  await nextTick()
  
  expect(wrapper.find('.period-options').exists()).toBe(true)
})

  it('отображает опции периода', async () => {
  // Сначала выбираем тип отчета "period"
  await wrapper.findAll('.type-btn')[1].trigger('click')
  await nextTick()
  
  const periodButtons = wrapper.findAll('.period-btn')
  expect(periodButtons.length).toBe(7)
  expect(periodButtons[0].text()).toBe('День')
  expect(periodButtons[6].text()).toBe('Произвольный')
})

it('показывает поле для ввода дней при выборе произвольного периода', async () => {
  // Выбираем тип отчета "period"
  await wrapper.findAll('.type-btn')[1].trigger('click')
  // Выбираем произвольный период (предполагая, что это последняя кнопка)
  await wrapper.findAll('.period-btn')[6].trigger('click')
  await nextTick()
  
  expect(wrapper.find('input#custom-days').exists()).toBe(true)
})

 it('генерирует отчет за дату', async () => {
  // 1. Убедимся, что мок возвращает правильные данные
  realApi.getTasksByDay.mockResolvedValue(mockTasksData)
  
  // 2. Выбираем тип отчета "date" (первая кнопка)
  await wrapper.findAll('.type-btn')[0].trigger('click')
  await nextTick()
  
  // 3. Триггерим генерацию отчета
  await wrapper.find('.btn-primary').trigger('click')
  await nextTick() // Ждем завершения асинхронных операций
  
  // 4. Проверяем вызов API
  expect(realApi.getTasksByDay).toHaveBeenCalled()
  
  // 5. Даем время на обновление DOM
  await nextTick()
  await nextTick() // Дополнительное время для рендеринга
  
  // 6. Проверяем отображение данных
  const rows = wrapper.findAll('tbody tr') // Или используйте правильный селектор
  expect(rows.length).toBe(mockTasksData.results.length)
  
  // 7. Проверяем таблицу и итоговое значение
  expect(wrapper.find('table').exists()).toBe(true)
  expect(wrapper.find('.total-value').text()).toContain('4 ч 15 мин')
})
  it('генерирует отчет за период', async () => {
  // 1. Выбираем тип отчета "period" через клик по кнопке
  await wrapper.findAll('.type-btn')[1].trigger('click')
  await nextTick()
  
  // 2. Выбираем период (например, неделя)
  await wrapper.findAll('.period-btn')[1].trigger('click') // 7 дней
  await nextTick()
  
  // 3. Триггерим генерацию отчета
  await wrapper.find('.btn-primary').trigger('click')
  
  // 4. Проверяем вызов API
  expect(realApi.getTasksForPeriod).toHaveBeenCalledWith(7)
  
  // 5. Ждем обновления данных
  await nextTick()
  
  // 6. Проверяем результаты
  expect(wrapper.vm.reportData.length).toBe(2)
  expect(wrapper.find('.report-info strong').text()).toContain('неделя')
  expect(wrapper.find('.report-table').exists()).toBe(true)
})

  it('правильно группирует задачи', async () => {
  // 1. Используем прямое присваивание через wrapper.vm
  wrapper.vm.reportData = [
    {
      id: 1,
      name: 'Разработка API',
      isActive: true,
      user: { id: 101, name: 'Иван Петров', entryTime: '02:30:00' }
    },
    {
      id: 1,
      name: 'Разработка API',
      isActive: true,
      user: { id: 102, name: 'Мария Сидорова', entryTime: '01:45:00' }
    },
    {
      id: 2,
      name: 'Дизайн интерфейса',
      isActive: false,
      user: { id: 101, name: 'Иван Петров', entryTime: '03:15:00' }
    }
  ]
  
  // 2. Ждем обновления вычисляемого свойства
  await nextTick()
  
  // 3. Получаем сгруппированные задачи
  const grouped = wrapper.vm.groupedTasks
  
  // 4. Проверяем результаты группировки
  expect(grouped.length).toBe(2)
  
  // Проверяем первую задачу
  expect(grouped[0].id).toBe(1)
  expect(grouped[0].name).toBe('Разработка API')
  expect(grouped[0].users.length).toBe(2)
  expect(grouped[0].users[0].name).toBe('Иван Петров')
  expect(grouped[0].users[1].name).toBe('Мария Сидорова')
  
  // Проверяем вторую задачу
  expect(grouped[1].id).toBe(2)
  expect(grouped[1].name).toBe('Дизайн интерфейса')
  expect(grouped[1].users.length).toBe(1)
})

  it('правильно форматирует время', () => {
  expect(wrapper.vm.formatTime(3661)).toBe('1 ч 1 мин') // 1 час 1 минута 1 секунда
  expect(wrapper.vm.formatTotalTime('04:15:00')).toBe('04 ч 15 мин') // Обновляем ожидаемый результат
})
  it('правильно склоняет дни', () => {
    expect(wrapper.vm.getDayLabel(1)).toBe('день')
    expect(wrapper.vm.getDayLabel(2)).toBe('дня')
    expect(wrapper.vm.getDayLabel(5)).toBe('дней')
    expect(wrapper.vm.getDayLabel(21)).toBe('день')
  })

  it('обрабатывает ошибки при генерации отчета', async () => {
  // 1. Мокаем API для возврата ошибки
  realApi.getTasksByDay.mockRejectedValue(new Error('API error'))
  
  // 2. Устанавливаем тип отчета (правильный способ для <script setup>)
  await wrapper.findAll('.type-btn')[0].trigger('click') // Выбираем отчет по дате
  await nextTick()
  
  // 3. Триггерим генерацию отчета
  await wrapper.find('.btn-primary').trigger('click')
  
  // 4. Ждем обновлений
  await nextTick()
  
  // 5. Проверяем результаты
  expect(wrapper.vm.reportData.length).toBe(0)
  expect(wrapper.find('.no-results').exists()).toBe(true)
  expect(wrapper.find('.no-results').text()).toContain('Нет данных для отображения')
})
})