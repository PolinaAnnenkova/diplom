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
        <div class="filters">
          <select v-model="projectActivityFilter" @change="applyProjectFilters">
            <option value="all">Все проекты</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>

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
                v-for="project in filteredProjects" 
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
            <th>Требуемые компетенции</th>
            <th>Статус</th>
            <th>Роль</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasksByCompetence" :key="task.id">
            <td>{{ task.title || task.name }}</td>
            <td>{{ getProjectName(task.projectId || task.projectCode) }}</td>
            <td class="description-cell">{{ task.description || '-' }}</td>
            <td>
              <div v-if="task.requiredCompetencies && task.requiredCompetencies.length">
                <span 
                  v-for="compId in task.requiredCompetencies" 
                  :key="compId"
                  class="competence-badge"
                  :class="{
                    'my-competence': hasCompetence(compId),
                    'other-competence': !hasCompetence(compId)
                  }"
                >
                  {{ getCompetenceName(compId) }}
                  <span v-if="hasCompetence(compId)" class="competence-check">✓</span>
                </span>
              </div>
              <span v-else class="no-competencies">Не указаны</span>
            </td>
            <td>
              <span :class="['status-badge', task.status || (task.isActive ? 'active' : 'inactive')]">
                {{ getTaskStatusName(task.status || (task.isActive ? 'active' : 'inactive')) }}
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
    <div class="filters">
      <select v-model="timeEntriesFilterMode" @change="changeFilterMode">
        <option value="period">По периоду</option>
        <option value="day">По конкретной дате</option>
      </select>

      <select 
        v-if="timeEntriesFilterMode === 'period'"
        v-model="timeEntriesPeriod" 
        @change="loadTimeEntries"
      >
        <option value="0">За сегодня</option>
        <option value="7">За последние 7 дней</option>
        <option value="30">За последние 30 дней</option>
        <option value="all">За все время</option>
      </select>

      <input
        v-if="timeEntriesFilterMode === 'day'"
        type="date"
        v-model="selectedDate"
        @change="loadEntriesByDay"
      >
    </div>
    
    <button @click="openCreateTimeEntryModal" class="add-button">
      + Новая проводка
    </button>
  </div>

        <div v-if="loading.timeEntries" class="loading">Загрузка проводок...</div>
        <div v-else-if="error.timeEntries" class="error">{{ error.timeEntries }}</div>
        <div v-else class="time-entries-container">
          <table class="data-table full-width-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Время</th>
                <th>Задача</th>
                <th>Описание</th>
                <th>Пользователь</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in timeEntries" :key="entry.id">
                <td>{{ formatDate(entry.date) }}</td>
                <td>{{ entry.time }}</td>
                <td>{{ getTaskName(entry.taskId) }}</td>
                <td class="description-cell">{{ entry.description || '-' }}</td>
                <td>{{ entry.userName }}</td>
                <td class="actions">
                  <button @click="editTimeEntry(entry)" class="edit-btn" >✏️</button>
                  <button @click="deleteTimeEntry(entry.id)" class="delete-btn">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <TimeEntryModal
      :show="showTimeEntryModal"
      :tasks="allTasks"
      :projects="projects"
      :currentEntry="currentTimeEntry"
      @close="showTimeEntryModal = false"
      @saved="handleTimeEntrySaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import realApi from '@/../api/realApi.js';
import 'vue3-toastify/dist/index.css';
import TimeEntryModal from '@/views/TimeEntryModal.vue';
const router = useRouter();

// Основные данные
const activeTab = ref('tasks');
const projects = ref([]);
const allTasks = ref([]);
const timeEntries = ref([]);
const showTimeEntryModal = ref(false);
const currentTimeEntry = ref(null);
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
const currentUser = ref(null);
const userCompetencies = ref([]);
const allCompetencies = ref([]);
const timeEntriesFilterMode = ref('period');
const selectedDate = ref(new Date().toISOString().split('T')[0]);
function openCreateTimeEntryModal() {
  currentTimeEntry.value = null;
  showTimeEntryModal.value = true;
}

async function handleTimeEntrySaved(newEntry) {
  try {
    await loadTimeEntries();
    toast.success('Проводка успешно добавлена');
  } catch (error) {
    console.error('Ошибка при обновлении списка проводок:', error);
  }
}
// Метод для изменения режима фильтрации
function changeFilterMode() {
  if (timeEntriesFilterMode.value === 'day') {
    loadEntriesByDay();
  } else {
    loadTimeEntries();
  }}
// Фильтры
const projectActivityFilter = ref('all');
const currentProjectFilter = ref('');
const currentStatusFilter = ref('');
const timeEntriesPeriod = ref('7');

// Загрузка данных пользователя и компетенций
async function loadUserData() {
  try {
    const userId = localStorage.getItem('userId');
    if (userId) {
      currentUser.value = { id: userId };
    }
  } catch (err) {
    console.error('Ошибка загрузки данных пользователя:', err);
  }
}
async function loadEntriesByDay() {
  try {
    loading.value.timeEntries = true;
    error.value.timeEntries = null;
    
    // Получаем текущего пользователя
    const currentUser = await realApi.getUserMe();
    console.log('Current user ID 1:', currentUser);

    // Проверяем что дата выбрана
    if (!selectedDate.value) {
      throw new Error('Пожалуйста, выберите дату');
    }

    // Загружаем проводки
    timeEntries.value = await realApi.getEntriesByDay(selectedDate.value, currentUser);
    
  } catch (err) {
    error.value.timeEntries = err.message;
    toast.error(`Ошибка загрузки проводок: ${err.message}`);
    console.error('Ошибка в loadEntriesByDay:', err);
  } finally {
    loading.value.timeEntries = false;
  }
}

// Загрузка проектов
async function loadProjects() {
  try {
    loading.value.projects = true;
    error.value.projects = null;
    
    // Загружаем проекты из API
    const apiProjects = await realApi.getProjects();
    
    // Преобразуем данные API в нужный формат
    projects.value = apiProjects.map(project => ({
      id: project.id || project.code,
      code: project.code,
      name: project.name,
      status: project.status === 'active' ? 'active' : 'inactive'
    }));
    
  } catch (err) {
    error.value.projects = err.message || 'Ошибка загрузки проектов';
    toast.error('Ошибка загрузки проектов');
  } finally {
    loading.value.projects = false;
  }
}


// Загрузка задач по роли с сохранением в allTasks
async function loadTasks() {
  try {
    loading.value.tasks = true;
    error.value.tasks = null;
    
    // Получаем roleId текущего пользователя (здесь нужно реализовать логику получения)
    const roleId = currentUser.value?.roleId || 3; // Заглушка - нужно заменить на реальное получение roleId
    
    // Загружаем задачи через API
    const tasksFromApi = await realApi.getTasksByRole(roleId);
    
    // Преобразуем данные API в формат, совместимый с allTasks
    allTasks.value = tasksFromApi.map(task => ({
      id: task.id,
      title: task.name,
      projectId: task.projectCode,
      description: task.description || '',
      requiredCompetencies: task.requiredCompetencies || [],
      status: task.isActive ? 'active' : 'inactive',
      roleId: task.roleId
    }));
    
  } catch (err) {
    error.value.tasks = err.message || 'Ошибка загрузки задач';
    toast.error('Ошибка загрузки задач');
  } finally {
    loading.value.tasks = false;
  }
}
function editTimeEntry(entry) {
  currentTimeEntry.value = entry;
  showTimeEntryModal.value = true;
}
// Загрузка проводок с использованием метода getEntries
async function loadTimeEntries() {
  try {
    loading.value.timeEntries = true;
    const currentUser = await realApi.getUserMe();
    console.log('Current user ID 2 :', currentUser);
    // Определяем параметры запроса
    const days = timeEntriesPeriod.value === 'all' 
      ? null 
      : timeEntriesPeriod.value;
    
    timeEntries.value = await realApi.getEntries(days, currentUser);
    
  } catch (err) {
    error.value.timeEntries = err.message;
    toast.error('Ошибка загрузки проводок');
  } finally {
    loading.value.timeEntries = false;
  }
}


// Инициализация данных
onMounted(async () => {
  await loadUserData();
  await loadProjects();
  await loadTasks();
  await loadTimeEntries();
});

// Фильтры и computed свойства
const filteredProjects = computed(() => {
  if (projectActivityFilter.value === 'all') return projects.value;
  return projects.value.filter(p => p.status === projectActivityFilter.value);
});

const filteredTasksByCompetence = computed(() => {
  let tasks = [...allTasks.value];
  
  if (currentProjectFilter.value) {
    tasks = tasks.filter(task => task.projectId == currentProjectFilter.value);
  }
  
  if (currentStatusFilter.value) {
    tasks = tasks.filter(task => task.status === currentStatusFilter.value);
  }
  
  return tasks;
});

// Вспомогательные методы
function viewProjectTasks(projectId) {
  currentProjectFilter.value = projectId;
  activeTab.value = 'tasks';
}

function applyProjectFilters() {
  // Фильтрация происходит через computed свойство
}

function applyFilters() {
  // Фильтрация происходит через computed свойство
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
    inactive: 'Неактивный'
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

function hasCompetence(competenceId) {
  return userCompetencies.value.includes(competenceId);
}

function getCompetenceName(competenceId) {
  const competence = allCompetencies.value.find(c => c.id === competenceId);
  return competence ? competence.name : `Неизвестно (${competenceId})`;
}

// Методы для проводок (заблокированы)




async function deleteTimeEntry(id) {
  if (!confirm('Вы уверены, что хотите удалить эту проводку?')) {
    return;
  }

  try {
    loading.value.timeEntries = true;
    const result = await realApi.deleteEntry(id);
    
    if (result === true) {
      toast.success('Проводка успешно удалена');
      await loadTimeEntries(); // Обновляем список проводок
    }
  } catch (error) {
    console.error('Ошибка удаления проводки:', error);
    toast.error(error.message || 'Ошибка при удалении проводки');
  } finally {
    loading.value.timeEntries = false;
  }
}

const logout = async () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    router.push('/');
  } catch (err) {
    console.error('Ошибка при выходе:', err);
  }
};
</script>

<style scoped>
/* Стили остаются такими же, как в исходном коде */
input[type="date"] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
}
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

.competence-badge {
  display: inline-block;
  padding: 3px 8px;
  margin: 2px;
  border-radius: 12px;
  font-size: 12px;
  background-color: #e0e0e0;
}

.my-competence {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
}

.other-competence {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  opacity: 0.7;
}

.competence-check {
  color: #4caf50;
  margin-left: 4px;
  font-weight: bold;
}

.no-competencies {
  color: #9e9e9e;
  font-style: italic;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.time-entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.add-button:disabled,
.edit-btn:disabled,
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  
  .time-entries-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>