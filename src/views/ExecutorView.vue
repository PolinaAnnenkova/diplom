<template>
   <div class="executor-view">
    <div class="header">
      <div class="tabs">
        <button 
          @click="activeTab = 'projects'"
          :class="{ 'active': activeTab === 'projects' }"
        >
          Проекты
        </button>
        <button 
          @click="activeTab = 'tasks'"
          :class="{ 'active': activeTab === 'tasks' }"
        >
          Задачи
        </button>
        <button 
          @click="activeTab = 'time-entries'"
          :class="{ 'active': activeTab === 'time-entries' }"
        >
          Проводки
        </button>
      </div>
      <button @click="logout" class="logout-btn">Выйти</button>
    </div>

    <div class="tab-content">
      <!-- Вкладка проектов -->
      <div v-if="activeTab === 'projects'" class="projects-tab full-height-tab">
        <div v-if="loading.projects" class="loading">Загрузка проектов...</div>
        <div v-else-if="error.projects" class="error">{{ error.projects }}</div>
        <div v-else class="projects-container">
          <table class="data-table full-width-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Код</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="project in projects" 
                :key="project.id"
                @click="viewProjectTasks(project.id)"
                class="clickable-row"
              >
                <td>{{ project.name }}</td>
                <td>{{ project.code }}</td>
                <td>
                  <span :class="['status-badge', project.status]">
                    {{ getProjectStatusName(project.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Вкладка задач -->
      <div v-else-if="activeTab === 'tasks'" class="tasks-tab full-height-tab">
        <div v-if="loading.tasks" class="loading">Загрузка задач...</div>
        <div v-else-if="error.tasks" class="error">{{ error.tasks }}</div>
        <div v-else class="tasks-container">
          <div class="filters">
            <select v-model="currentProjectFilter" @change="applyFilters">
              <option value="">Все проекты</option>
              <option 
                v-for="project in projects" 
                :key="project.id" 
                :value="project.id"
              >
                {{ project.name }} ({{ project.code }})
              </option>
            </select>
            
            <select v-model="currentStatusFilter" @change="applyFilters">
              <option value="">Все статусы</option>
              <option value="active">Активна</option>
              <option value="inactive">Не активна</option>
            </select>
          </div>

          <table class="data-table full-width-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Проект</th>
                <th>Описание</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in filteredTasks" :key="task.id">
                <td>{{ task.title }}</td>
                <td>{{ getProjectName(task.projectId) }}</td>
                <td class="description-cell">{{ task.description || '-' }}</td>
                <td>
                  <span :class="['status-badge', task.status]">
                    {{ getTaskStatusName(task.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Вкладка проводок -->
      <div v-else class="time-entries-tab full-height-tab">
        <div class="time-entries-header">
          <button @click="openCreateTimeEntryModal" class="add-button">
            + Новая проводка
          </button>
        </div>

        <TimeEntryModal
          v-if="showTimeEntryModal"
          :show="showTimeEntryModal"
          :tasks="allTasks"
          :currentEntry="currentTimeEntry"
          @save="handleTimeEntrySave"
          @close="closeTimeEntryModal"
        />

        <div v-if="loading.timeEntries" class="loading">Загрузка проводок...</div>
        <div v-else-if="error.timeEntries" class="error">{{ error.timeEntries }}</div>
        <div v-else class="time-entries-container">
          <table class="data-table full-width-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Задача</th>
                <th>Часы</th>
                <th>Описание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="entry in groupedTimeEntries" 
                :key="entry.id"
                :class="getDayRowClass(entry.date)"
              >
                <td>{{ formatDate(entry.date) }}</td>
                <td>{{ getTaskName(entry.taskId) }}</td>
                <td>{{ entry.hours }}</td>
                <td class="description-cell">{{ entry.description || '-' }}</td>
                <td class="actions">
                  <button @click="editTimeEntry(entry)" class="edit-btn">✏️</button>
                  <button @click="deleteTimeEntry(entry.id)" class="delete-btn">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import mockApi from '@/../api/mockApi.js';
import TimeEntryModal from '@/views/TimeEntryModal.vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
const router = useRouter();

const logout = async () => {
  try {
    // Очистка данных пользователя
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    // Перенаправление на страницу авторизации
    router.push('/');
  } catch (err) {
    console.error('Ошибка при выходе:', err);
  }
};

const activeTab = ref('tasks');
const projects = ref([]);
const allTasks = ref([]);
const timeEntries = ref([]);
const loading = ref({
  projects: false,
  tasks: false,
  timeEntries: false
});
const error = ref({
  projects: null,
  tasks: null,
  timeEntries: null
});
const currentProjectFilter = ref('');
const currentStatusFilter = ref('');
const showTimeEntryModal = ref(false);
const currentTimeEntry = ref(null);

// Фильтрация задач
const filteredTasks = computed(() => {
  let tasks = [...allTasks.value];
  
  if (currentProjectFilter.value) {
    tasks = tasks.filter(task => task.projectId == currentProjectFilter.value);
  }
  
  if (currentStatusFilter.value) {
    tasks = tasks.filter(task => task.status === currentStatusFilter.value);
  }
  
  return tasks;
});

// Группировка проводок по дням с подсчетом суммы часов
const groupedTimeEntries = computed(() => {
  const grouped = {};
  
  timeEntries.value.forEach(entry => {
    const date = entry.date?.split('T')[0] || entry.date;
    if (!grouped[date]) {
      grouped[date] = {
        totalHours: 0,
        entries: []
      };
    }
    grouped[date].entries.push(entry);
    grouped[date].totalHours += parseFloat(entry.hours) || 0;
  });

  return Object.values(grouped).flatMap(group => 
    group.entries.map(entry => ({
      ...entry,
      totalHours: group.totalHours
    }))
  );
});

// Определение класса строки в зависимости от суммы часов
function getDayRowClass(date) {
  const entry = groupedTimeEntries.value.find(e => {
    const eDate = e.date?.split('T')[0] || e.date;
    const currentDate = date?.split('T')[0] || date;
    return eDate === currentDate;
  });
  
  if (!entry) return '';
  
  if (entry.totalHours > 8) return 'day-overlimit';
  if (entry.totalHours === 8) return 'day-exact';
  return 'day-underlimit';
}

// Загрузка данных
onMounted(async () => {
  await loadProjects();
  await loadTasks();
  await loadTimeEntries();
});

async function loadProjects() {
  try {
    loading.value.projects = true;
    projects.value = await mockApi.getProjects();
  } catch (err) {
    error.value.projects = err.message;
  } finally {
    loading.value.projects = false;
  }
}

async function loadTasks() {
  try {
    loading.value.tasks = true;
    allTasks.value = await mockApi.getTasks();
  } catch (err) {
    error.value.tasks = err.message;
  } finally {
    loading.value.tasks = false;
  }
}

async function loadTimeEntries() {
  try {
    loading.value.timeEntries = true;
    const entries = await mockApi.getTimeEntries();
    timeEntries.value = entries.map(entry => ({
      ...entry,
      date: entry.date?.split('T')[0] || new Date(entry.date).toISOString().split('T')[0]
    }));
  } catch (err) {
    error.value.timeEntries = err.message;
  } finally {
    loading.value.timeEntries = false;
  }
}

function viewProjectTasks(projectId) {
  currentProjectFilter.value = projectId;
  activeTab.value = 'tasks';
}

function applyFilters() {
  // Фильтрация происходит через computed свойство
}

function openCreateTimeEntryModal() {
  currentTimeEntry.value = null;
  showTimeEntryModal.value = true;
}

function editTimeEntry(entry) {
  currentTimeEntry.value = { 
    ...entry,
    date: entry.date?.split('T')[0] || new Date(entry.date).toISOString().split('T')[0]
  };
  showTimeEntryModal.value = true;
}

function closeTimeEntryModal() {
  showTimeEntryModal.value = false;
  currentTimeEntry.value = null;
}

async function handleTimeEntrySave(timeEntryData) {
  try {
    const dataToSave = {
      ...timeEntryData,
      date: new Date(timeEntryData.date).toISOString()
    };
    
    if (timeEntryData.id) {
      await mockApi.updateTimeEntry(timeEntryData.id, dataToSave);
    } else {
      await mockApi.createTimeEntry(dataToSave);
    }
    await loadTimeEntries();
    closeTimeEntryModal();
  } catch (err) {
    error.value.timeEntries = err.message;
  }
}

async function deleteTimeEntry(id) {
  if (confirm('Вы уверены, что хотите удалить эту проводку?')) {
    try {
      await mockApi.deleteTimeEntry(id);
      await loadTimeEntries();
        toast.success('Проводка успешна удалена');
    } catch (err) {
      error.value.timeEntries = err.message;
      toast.error('Ошибка при удалении проводки');
    }
  }
}

function getProjectName(projectId) {
  const project = projects.value.find(p => p.id === projectId);
  return project ? `${project.name} (${project.code})` : '';
}

function getTaskName(taskId) {
  const task = allTasks.value.find(t => t.id === taskId);
  return task ? task.title : 'Неизвестная задача';
}

function getProjectStatusName(status) {
  const statusMap = {
    active: 'Активный',
    inactive: 'Неактивный',
    archived: 'Архивированный'
  };
  return statusMap[status] || status;
}

function getTaskStatusName(status) {
  const statusMap = {
    active: 'Активна',
    inactive: 'Не активна'
  };
  return statusMap[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('ru-RU', options);
}
</script>

<style scoped>
.executor-view {
   width: 100vw;
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.tabs {
  display: flex;
  gap: 10px;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #bb2d3b;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tabs button.active {
  color: #004080;
  border-bottom: 2px solid #004080;
  font-weight: bold;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.full-height-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.projects-container,
.tasks-container,
.time-entries-container {
  flex: 1;
  overflow-y: auto;
}

.full-width-table {
  width: 100%;
  table-layout: fixed;
}

.data-table {
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #004080;
  position: sticky;
  top: 0;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f5f7fa;
}

.description-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.active {
  background-color: #e6f7e6;
  color: #28a745;
}

.status-badge.inactive {
  background-color: #fff3cd;
  color: #d39e00;
}

.status-badge.archived {
  background-color: #f8f9fa;
  color: #6c757d;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.time-entries-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.add-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-button:hover {
  background-color: #0056b3;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.3s;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.edit-btn:hover, .delete-btn:hover {
  opacity: 0.8;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #dc3545;
  padding: 1rem;
  background-color: #f8d7da;
  border-radius: 4px;
  margin-bottom: 1rem;
}

/* Стили для подсветки проводок */
.day-overlimit {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
}

.day-exact {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.day-underlimit {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
}

@media (max-width: 768px) {
  .executor-view {
    padding: 10px;
    height: calc(100vh - 20px);
  }
  
  .tabs button {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .full-height-tab {
    padding: 10px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
    font-size: 14px;
  }
  
  .filters {
    flex-direction: column;
    gap: 10px;
  }
}
</style>