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

      <TaskModal
        :showModal="showModal"
        :currentTask="currentTask"
        :isEditing="isEditing"
        :projects="projects"
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
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>{{ task.title }}</td>
              <td>{{ getProjectName(task.projectId) }}</td>
              <td class="description-cell">{{ truncateDescription(task.description) }}</td>
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

// Получаем роль пользователя (в реальном приложении из хранилища)
const userRole = computed(() => {
  // Замените на реальное получение роли, например:
  // return useAuthStore().user.role;
  return localStorage.getItem('userRole') || 'manager'; // временно по умолчанию менеджер
});

const tasks = ref([]);
const projects = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const currentTask = ref(null);

onMounted(async () => {
  await loadProjects();
  await loadTasks();
});

async function loadProjects() {
  projects.value = await mockApi.getProjects();
}

async function loadTasks() {
  tasks.value = await mockApi.getTasks();
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

.edit-btn:hover, 
.delete-btn:hover,
.time-entry-btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .tasks-container {
    padding: 1rem;
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