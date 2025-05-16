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
      </div>
      <button 
        @click="openCreateModal"
        class="create-btn"
      >
        {{ activeTab === 'projects' ? '+ Создать проект' : '+ Создать задачу' }}
      </button>
    </div>

    <div class="tab-content">
      <ProjectsView 
        v-if="activeTab === 'projects'" 
        ref="projectsView"
        @project-created="handleProjectCreated"
      />
      <TasksView 
        v-else 
        ref="tasksView"
        @task-created="handleTaskCreated"
        @back="activeTab = 'projects'" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ProjectsView from '@/views/ProjectsView.vue';
import TasksView from '@/views/TasksView.vue';

const activeTab = ref('projects');
const projectsView = ref(null);
const tasksView = ref(null);

function openCreateModal() {
  if (activeTab.value === 'projects') {
    projectsView.value?.openCreateModal();
  } else {
    tasksView.value?.openCreateModal();
  }
}

function handleProjectCreated() {
  console.log('Новый проект создан');
}

function handleTaskCreated() {
  console.log('Новая задача создана');
}
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
  }

  .tabs button {
    flex: 1;
    text-align: center;
  }

  .create-btn {
    width: 100%;
  }
}
</style>
