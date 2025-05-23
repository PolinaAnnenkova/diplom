<template>
  <div class="tasks-page">
    <div class="tasks-container">
      <div class="header">
        <h1>Управление задачами</h1>
        <button @click="$emit('back')" class="back-btn">
          ← Назад к проектам
        </button>
        <button 
          @click="openCreateModal" 
          class="add-task-btn"
          v-if="userRole === 'manager'"
        >
          + Создать задачу
        </button>
      </div>

      <!-- Фильтры -->
      <div class="filters">
        <div class="filter-group">
          <label>Статус задачи:</label>
          <select v-model="statusFilter" @change="applyFilters">
            <option value="all">Все задачи</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Проект:</label>
          <select v-model="projectFilter" @change="applyFilters">
            <option value="all">Все проекты</option>
            <option 
              v-for="project in projects" 
              :key="project.id" 
              :value="project.id"
            >
              {{ project.name }} ({{ project.code }})
            </option>
          </select>
        </div>

        <div class="filter-group" v-if="userRole === 'executor'">
          <label>Мои компетенции:</label>
          <select v-model="competenceFilter" @change="applyFilters">
            <option value="all">Все задачи</option>
            <option 
              v-for="competence in userCompetencies" 
              :key="competence.id" 
              :value="competence.id"
            >
              {{ competence.name }}
            </option>
          </select>
        </div>
      </div>

      <TaskModal
        :showModal="showModal"
        :currentTask="currentTask"
        :isEditing="isEditing"
        :projects="projects"
        :competencies="competencies"
        @close="closeModal"
        @save="handleSave"
        v-if="userRole === 'manager'"
      />

      <div class="table-container">
        <table class="tasks-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Проект</th>
              <th>Описание</th>
              <th>Требуемые компетенции</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in filteredTasks" :key="task.id">
              <td>{{ task.title }}</td>
              <td>{{ getProjectName(task.projectId) }}</td>
              <td class="description-cell">{{ truncateDescription(task.description) }}</td>
              <td>
                <div v-if="task.requiredCompetencies && task.requiredCompetencies.length">
                  <span 
                    v-for="compId in task.requiredCompetencies" 
                    :key="compId"
                    class="competence-badge"
                  >
                    {{ getCompetenceName(compId) }}
                  </span>
                </div>
                <span v-else class="no-competencies">Не указаны</span>
              </td>
              <td>
                <span :class="['status-badge', task.status]">
                  {{ getStatusName(task.status) }}
                </span>
              </td>
              <td class="actions">
                <!-- Кнопки для менеджера -->
                <template v-if="userRole === 'manager'">
                  <button @click="editTask(task)" class="edit-btn">✏️</button>
                  <button @click="deleteTask(task.id)" class="delete-btn">🗑️</button>
                </template>
                
                <!-- Кнопка для исполнителя -->
                <button 
                  @click="openTimeEntries(task.id)" 
                  class="time-entry-btn"
                  v-if="userRole === 'executor'"
                  :disabled="!canWorkOnTask(task)"
                  :title="canWorkOnTask(task) ? '' : 'У вас нет нужных компетенций'"
                >
                  ⏱️ Проводки
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TaskModal from '@/views/TaskModal.vue';
import mockApi from '@/../api/mockApi.js';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const router = useRouter();
const props = defineProps({
  projectId: String
});

const emit = defineEmits(['back']);

const userRole = computed(() => {
  return localStorage.getItem('userRole') || 'manager';
});

const userId = computed(() => {
  return localStorage.getItem('userId');
});

const tasks = ref([]);
const projects = ref([]);
const competencies = ref([]);
const currentUser = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const currentTask = ref(null);

// Фильтры
const statusFilter = ref('all');
const projectFilter = ref(props.projectId || 'all');
const competenceFilter = ref('all');

// Загрузка данных
onMounted(async () => {
  await loadProjects();
  await loadCompetencies();
  await loadCurrentUser();
  await loadTasks();
});

async function loadCurrentUser() {
  if (userId.value) {
    currentUser.value = await mockApi.getUserById(parseInt(userId.value));
  }
}

async function loadProjects() {
  projects.value = await mockApi.getProjects();
}

async function loadCompetencies() {
  competencies.value = await mockApi.getCompetencies();
}

async function loadTasks() {
  const allTasks = await mockApi.getTasks();
  
  if (props.projectId) {
    tasks.value = allTasks.filter(task => task.projectId === props.projectId);
  } else {
    tasks.value = allTasks;
  }
}

// Компетенции текущего пользователя
const userCompetencies = computed(() => {
  if (!currentUser.value || !currentUser.value.competencies) return [];
  return competencies.value.filter(comp => 
    currentUser.value.competencies.includes(comp.id)
  );
});

// Фильтрация задач
const filteredTasks = computed(() => {
  let result = [...tasks.value];

  // Фильтр по статусу
  if (statusFilter.value !== 'all') {
    result = result.filter(task => task.status === statusFilter.value);
  }

  // Фильтр по проекту
  if (projectFilter.value !== 'all') {
    result = result.filter(task => task.projectId === projectFilter.value);
  }

  // Фильтр по компетенциям (для исполнителя)
  if (userRole.value === 'executor' && competenceFilter.value !== 'all') {
    result = result.filter(task => 
      task.requiredCompetencies && 
      task.requiredCompetencies.includes(competenceFilter.value)
    );
  }

  return result;
});

function applyFilters() {
  // Фильтрация происходит через computed свойство filteredTasks
}

function canWorkOnTask(task) {
  if (userRole.value !== 'executor') return true;
  if (!task.requiredCompetencies || !task.requiredCompetencies.length) return true;
  if (!currentUser.value?.competencies) return false;
  
  return task.requiredCompetencies.some(compId => 
    currentUser.value.competencies.includes(compId)
  );
}

function openCreateModal() {
  currentTask.value = props.projectId 
    ? { projectId: props.projectId }
    : null;
  isEditing.value = false;
  showModal.value = true;
}

function editTask(task) {
  currentTask.value = { ...task };
  isEditing.value = true;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function handleSave(taskData) {
  try {
    let updatedTask;
    if (isEditing.value) {
      updatedTask = await mockApi.updateTask(taskData.id, taskData);
      const index = tasks.value.findIndex(t => t.id === taskData.id);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
    } else {
      updatedTask = await mockApi.createTask(taskData);
      tasks.value.push(updatedTask);
    }
    closeModal();
  } catch (error) {
    console.error('Ошибка сохранения задачи:', error);
  }
}

async function deleteTask(id) {
  if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
    try {
      await mockApi.deleteTask(id);
      tasks.value = tasks.value.filter(task => task.id !== id);
      toast.success('Задача успешно удалена');
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
      toast.error('Ошибка при удалении задачи');
    }
  }
}

function openTimeEntries(taskId) {
  router.push({ name: 'time-entries', params: { taskId } });
}

function getProjectName(projectId) {
  const project = projects.value.find(p => p.id === projectId);
  return project ? `${project.name} (${project.code})` : '';
}

function getCompetenceName(compId) {
  const competence = competencies.value.find(c => c.id === compId);
  return competence ? competence.name : `Неизвестно (${compId})`;
}

function truncateDescription(description) {
  return description?.length > 50 
    ? `${description.substring(0, 50)}...` 
    : description || '-';
}

function getStatusName(status) {
  const statusMap = {
    active: 'Активна',
    inactive: 'Не активна'
  };
  return statusMap[status] || status;
}
</script>

<style scoped>
.tasks-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 20px;
}

.tasks-container {
  width: 100%;
  max-width: 1200px;
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 50, 0.1);
  margin: 20px 0;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 10px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-weight: 500;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

h1 {
  color: #004080;
  margin: 0;
}

.back-btn {
  background-color: transparent;
  color: #007bff;
  border: none;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  margin-right: auto;
}

.back-btn:hover {
  text-decoration: underline;
}

.add-task-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-task-btn:hover {
  background-color: #0056b3;
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th,
.tasks-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.tasks-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #004080;
}

.description-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.competence-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #e9ecef;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  color: #495057;
}

.no-competencies {
  color: #6c757d;
  font-style: italic;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #f8f9fa;
  color:#28a745 ;
}

.status-badge.inactive {
  background-color: #fff3cd;
  color:#6c757d;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.3s ease;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.time-entry-btn {
  background-color: #20c997;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.3s ease;
}

.time-entry-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.edit-btn:hover, 
.delete-btn:hover,
.time-entry-btn:hover:not(:disabled) {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .tasks-container {
    padding: 1rem;
  }

  .filters {
    flex-direction: column;
    gap: 10px;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .tasks-table th,
  .tasks-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .actions {
    flex-direction: column;
    gap: 0.3rem;
  }
}
</style>