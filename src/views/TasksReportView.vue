<template>
  <div class="tasks-report">
    <h2>Отчет по задачам</h2>
    
    <div class="report-filters">
      <div class="filter-group">
        <label>Тип отчета:</label>
        <div class="report-type-options">
          <button
            v-for="type in reportTypes"
            :key="type.value"
            @click="selectReportType(type.value)"
            :class="{ 'active': selectedReportType === type.value }"
            class="type-btn"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
      
      <div class="filter-group" v-if="selectedReportType === 'date'">
        <label for="date-filter">Дата:</label>
        <input
          id="date-filter"
          type="date"
          v-model="selectedDate"
          class="form-control"
        />
      </div>
      
      <div class="filter-group" v-if="selectedReportType === 'period'">
        <label>Период:</label>
        <div class="period-options">
          <button
            v-for="period in periodOptions"
            :key="period.value"
            @click="selectPeriod(period.value)"
            :class="{ 'active': selectedPeriod === period.value }"
            class="period-btn"
          >
            {{ period.label }}
          </button>
        </div>
        <div v-if="selectedPeriod === 'custom'" class="custom-days-input">
          <label for="custom-days">Количество дней:</label>
          <input
            id="custom-days"
            type="number"
            v-model.number="customDays"
            min="1"
            class="form-control"
          />
        </div>
      </div>
      
      <button @click="generateReport" class="btn btn-primary">
        Сформировать отчет
      </button>
    </div>
    
    <div class="report-results" v-if="reportData.length > 0">
      <div class="report-info">
        Отчет: <strong>{{ currentReportLabel }}</strong>
      </div>
      
      <table class="report-table">
        <thead>
          <tr>
            <th>Название задачи</th>
            <th>Статус</th>
            <th>Пользователи и время</th>
            <th>Суммарное время</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(task, index) in groupedTasks" :key="index">
            <td>{{ task.name }}</td>
            <td :class="{'active': task.isActive, 'inactive': !task.isActive}">
              {{ task.isActive ? 'Активна' : 'Неактивна' }}
            </td>
            <td>
              <div v-for="user in getUniqueUsers(task)" :key="user.id">
                {{ user.name }}: {{ formatTime(user.totalTime) }}
              </div>
            </td>
            <td>{{ formatTime(calculateTaskTotalTime(task)) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="total-label">Общее время по всем задачам:</td>
            <td class="total-value">{{ formatTotalTime(summaryTotalTime) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div class="no-results" v-else>
      <p>Нет данных для отображения. Выберите параметры и сформируйте отчет.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import realApi from '../../api/realApi.js';

const reportTypes = [
  { label: 'За дату', value: 'date' },
  { label: 'За период', value: 'period' }
];

const periodOptions = [
  { label: 'День', value: 1 },
  { label: 'Неделя', value: 7 },
  { label: '2 недели', value: 14 },
  { label: 'Месяц', value: 30 },
  { label: 'Квартал', value: 90 },
  { label: 'Год', value: 365 },
  { label: 'Произвольный', value: 'custom' }
];

const selectedReportType = ref('date');
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedPeriod = ref(7);
const customDays = ref(1);
const reportData = ref([]);
const summaryTotalTime = ref('00:00:00');

const currentReportLabel = computed(() => {
  if (selectedReportType.value === 'date') {
    return `за ${selectedDate.value}`;
  } else {
    if (selectedPeriod.value === 'custom') {
      return `за ${customDays.value} ${getDayLabel(customDays.value)}`;
    }
    const period = periodOptions.find(p => p.value === selectedPeriod.value);
    return period ? `за ${period.label.toLowerCase()}` : '';
  }
});

const groupedTasks = computed(() => {
  const tasksMap = new Map();
  
  reportData.value.forEach(item => {
    if (!tasksMap.has(item.id)) {
      tasksMap.set(item.id, {
        id: item.id,
        name: item.name,
        isActive: item.isActive,
        users: []
      });
    }
    
    const task = tasksMap.get(item.id);
    task.users.push({
      id: item.user.id,
      name: item.user.name,
      time: item.user.entryTime
    });
  });
  
  return Array.from(tasksMap.values());
});

function selectReportType(type) {
  selectedReportType.value = type;
}

function selectPeriod(period) {
  selectedPeriod.value = period;
}

async function generateReport() {
  try {
    if (selectedReportType.value === 'date') {
      const response = await realApi.getTasksByDay(selectedDate.value);
      reportData.value = response.results;
      summaryTotalTime.value = response.sum;
    } else {
      const days = selectedPeriod.value === 'custom' ? customDays.value : selectedPeriod.value;
      const response = await realApi.getTasksForPeriod(days);
      reportData.value = response.results;
      summaryTotalTime.value = response.sum;
    }
  } catch (error) {
    console.error('Ошибка формирования отчета:', error);
    reportData.value = [];
    summaryTotalTime.value = '00:00:00';
  }
}

function getUniqueUsers(task) {
  const usersMap = new Map();
  
  task.users.forEach(user => {
    if (!usersMap.has(user.id)) {
      usersMap.set(user.id, {
        id: user.id,
        name: user.name,
        timeEntries: []
      });
    }
    usersMap.get(user.id).timeEntries.push(user.time);
  });
  
  return Array.from(usersMap.values()).map(user => ({
    ...user,
    totalTime: calculateUserTotalTime(user.timeEntries)
  }));
}

function calculateUserTotalTime(timeEntries) {
  return timeEntries.reduce((total, time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return total + hours * 3600 + minutes * 60 + seconds;
  }, 0);
}

function calculateTaskTotalTime(task) {
  return task.users.reduce((total, user) => {
    return total + calculateUserTotalTime([user.time]);
  }, 0);
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} ч ${minutes} мин`;
}

function formatTotalTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  return `${hours} ч ${minutes} мин`;
}

function getDayLabel(days) {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'дней';
  }
  
  switch (lastDigit) {
    case 1: return 'день';
    case 2:
    case 3:
    case 4: return 'дня';
    default: return 'дней';
  }
}
</script>

<style scoped>
.tasks-report {
  padding: 20px;
}

.report-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.report-type-options,
.period-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-btn,
.period-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover,
.period-btn:hover {
  background-color: #f5f5f5;
}

.type-btn.active,
.period-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 38px;
}

.custom-days-input {
  margin-top: 10px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.report-table th, .report-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.report-table th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.active {
  color: green;
  font-weight: bold;
}

.inactive {
  color: #999;
}

.no-results {
  margin-top: 20px;
  padding: 20px;
  text-align: center;
  color: #666;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  height: 38px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.total-label {
  font-weight: bold;
  text-align: right;
}

.total-value {
  font-weight: bold;
}

.report-info {
  margin-bottom: 15px;
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .report-filters {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .report-type-options,
  .period-options {
    justify-content: space-between;
  }
  
  .type-btn,
  .period-btn {
    flex: 1;
    min-width: 60px;
    text-align: center;
  }
}
</style>