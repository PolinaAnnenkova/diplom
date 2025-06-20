<template>
  <div class="manager-dashboard">
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
          @click="activeTab = 'reports'"
          :class="{ 'active': activeTab === 'reports' }"
        >
          Отчет по задачам
        </button>
      </div>
      <div class="actions">
        <button 
          v-if="activeTab === 'projects'"
          @click="openCreateModal"
          class="create-btn"
        >
          + Создать проект
        </button>
        <button @click="showLogoutModal = true" class="logout-btn">Выйти</button>
      </div>
    </div>

    <div class="tab-content">
      <ProjectsView 
        v-if="activeTab === 'projects'" 
        ref="projectsView"
        @project-created="handleProjectCreated"
      />
      <TasksView 
        v-else-if="activeTab === 'tasks'"
        ref="tasksView"
        @task-created="handleTaskCreated"
        @back="activeTab = 'projects'" 
      />
      <TasksReportView
        v-else
        ref="tasksReportView"
      />
    </div>

    <LogoutConfirmModal
      :show="showLogoutModal"
      @close="showLogoutModal = false"
      @confirm="logout"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ProjectsView from '@/views/ProjectsView.vue';
import TasksView from '@/views/TasksView.vue';
import TasksReportView from '@/views/TasksReportView.vue';
import LogoutConfirmModal from '@/views/LogoutConfirmModal.vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const router = useRouter();
const activeTab = ref('projects');
const projectsView = ref(null);
const tasksView = ref(null);
const tasksReportView = ref(null);
const showLogoutModal = ref(false);

function openCreateModal() {
  if (activeTab.value === 'projects') {
    projectsView.value?.openCreateModal();
  }
}

function handleProjectCreated() {
  console.log('Новый проект создан');
}

function handleTaskCreated() {
  console.log('Новая задача создана');
}

const logout = async () => {
  try {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    router.push('/');
    toast.success('Вы успешно вышли из системы');
  } catch (err) {
    console.error('Ошибка при выходе:', err);
    toast.error('Ошибка при выходе из системы');
  } finally {
    showLogoutModal.value = false;
  }
};
</script>

<style scoped>
.manager-dashboard {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
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

.tabs button {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
}

.tabs button.active {
  color: #004080;
  background-color: #e6f2ff;
  font-weight: 600;
}

.tabs button:hover:not(.active) {
  background-color: #f0f0f0;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.create-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.create-btn:hover {
  background-color: #0056b3;
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

.tab-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .tabs {
    width: 100%;
    flex-wrap: wrap;
  }

  .tabs button {
    flex: 1;
    min-width: 100px;
    text-align: center;
  }

  .actions {
    width: 100%;
    flex-direction: column;
  }

  .create-btn,
  .logout-btn {
    width: 100%;
  }
}
</style>