<template>
  <div class="tasks-view">
    <div class="header">
      <h1>Список задач</h1>
      <div class="header-actions">
        <button @click="$emit('back')" class="back-btn">
          ← Назад к проектам
        </button>
        <button @click="openCreateModal" class="create-btn">
          + Создать задачу
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Проект</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ task.id }}</td>
            <td>{{ task.name }}</td>
            <td>
              {{ task.project?.name }} ({{ task.project?.code || task.projectCode }})
              <span :class="['status-badge', task.project?.isActive ? 'active' : 'inactive']">
                {{ task.project?.isActive ? 'Активен' : 'Неактивен' }}
              </span>
            </td>
            <td>{{ task.role?.id }} ({{ task.role?.name }})</td>
            <td>
              <span :class="['status-badge', task.isActive ? 'active' : 'inactive']">
                {{ task.isActive ? 'Активна' : 'Неактивна' }}
              </span>
            </td>
            <td class="actions">
              <button class="edit-btn" @click="openEditModal(task)">✏️</button>
              <button class="delete-btn" @click="confirmDelete(task.id)">🗑️</button>
              <button class="time-entry-btn" @click="openTimeEntry(task.id)">⏱️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно для создания/редактирования задачи -->
    <TaskModal
      v-if="showTaskModal"
      :showModal="showTaskModal"
      :currentTask="currentTask"
      :isEditing="isEditing"
      :projects="projects"
      :roles="roles"
      @close="closeTaskModal"
      @task-created="handleTaskCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import realApi from '../../api/realApi.js';
import TaskModal from './TaskModal.vue';

const emit = defineEmits(['back']);

// Данные
const tasks = ref([]);
const projects = ref([]);
const roles = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Состояние модального окна
const showTaskModal = ref(false);
const isEditing = ref(false);
const currentTask = ref(null);

// Загрузка данных
async function loadData() {
  try {
    isLoading.value = true;
    error.value = null;
    
    // Параллельная загрузка задач, проектов и ролей
    const [tasksData, projectsData, rolesData] = await Promise.all([
      realApi.getTasks(),
      realApi.getProjects(),
      realApi.getRoles()
    ]);
    
    tasks.value = tasksData;
    projects.value = projectsData;
    roles.value = rolesData;
    
  } catch (err) {
    error.value = err.message;
    toast.error('Ошибка загрузки данных');
    console.error('Ошибка загрузки:', err);
  } finally {
    isLoading.value = false;
  }
}
async function confirmDelete(taskId) {
  if (confirm('Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.')) {
    try {
      await realApi.deleteTask(taskId);
      tasks.value = tasks.value.filter(t => t.id !== taskId);
      toast.success('Задача успешно удалена');
    } catch (error) {
      const errorMessage = error.message || 'Ошибка при удалении задачи';
      toast.error(errorMessage);
      console.error('Ошибка удаления:', error);
    }
  }
}
// Управление модальным окном
function openCreateModal() {
  currentTask.value = null;
  isEditing.value = false;
  showTaskModal.value = true;
}

function openEditModal(task) {
  currentTask.value = { ...task };
  isEditing.value = true;
  showTaskModal.value = true;
}

function closeTaskModal() {
  showTaskModal.value = false;
  currentTask.value = null;
}

// Обработчики событий
async function handleTaskCreated(newTask) {
  if (isEditing.value) {
    // Обновляем существующую задачу
    const index = tasks.value.findIndex(t => t.id === newTask.id);
    if (index !== -1) {
      tasks.value[index] = newTask;
    }
  } else {
    // Добавляем новую задачу
    tasks.value.unshift(newTask);
  }
  closeTaskModal();
}



function openTimeEntry(taskId) {
  // Здесь можно реализовать логику для учета времени
  toast.info(`Учет времени для задачи ${taskId}`);
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.tasks-view {
  width: 100%;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

h1 {
  color: #004080;
  margin: 0;
}

.back-btn, .create-btn {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.back-btn:hover, .create-btn:hover {
  background-color: #007bff;
  color: white;
}

.create-btn {
  background-color: #007bff;
  color: white;
}

.create-btn:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.table-container {
  overflow-x: auto;
  margin-top: 20px;
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th,
.tasks-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.tasks-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #004080;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-left: 5px;
}

.status-badge.active {
  background-color: #e6f7e6;
  color: #28a745;
}

.status-badge.inactive {
  background-color: #fff3cd;
  color: #d39e00;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn, 
.delete-btn,
.time-entry-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.3s;
}

.edit-btn:hover, 
.delete-btn:hover,
.time-entry-btn:hover {
  opacity: 1;
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
  background-color: #17a2b8;
  color: white;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .tasks-table th,
  .tasks-table td {
    padding: 8px 6px;
    font-size: 0.9em;
  }
  
  .actions {
    flex-direction: column;
    gap: 4px;
  }
}
</style>