<template>
  <div class="projects-view">
    <div class="filters">
      <select v-model="statusFilter" @change="applyFilters">
        <option value="all">Все проекты</option>
        <option value="active">Активные</option>
        <option value="inactive">Неактивные</option>
      </select>
    </div>

    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <ProjectModal
      :showModal="showModal"
      :currentProject="currentProject"
      :isEditing="isEditing"
      @close="closeModal"
      @save="handleSave"
      @project-created="$emit('project-created')"
    />

    <DeleteConfirmModal
      v-if="showDeleteModal"
      :show="showDeleteModal"
      :project-name="projectToDeleteName"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
    />

    <div class="table-container">
      <table class="projects-table" v-if="!isLoading">
        <thead>
          <tr>
            <th>Название</th>
            <th>Код</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in filteredProjects" :key="project.id">
            <td>{{ project.name }}</td>
            <td>{{ project.code }}</td>
            <td>
              <span :class="['status-badge', project.status]">
                {{ getStatusName(project.status) }}
              </span>
            </td>
            <td class="actions">
              <button @click="editProject(project)" class="edit-btn">✏️</button>
              <button @click="initiateDelete(project)" class="delete-btn">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import ProjectModal from '@/views/ProjectModal.vue';
import realApi from '../../api/realApi.js';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import DeleteConfirmModal from '@/views/DeleteConfirmModal.vue';

const projects = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const currentProject = ref(null);
const statusFilter = ref('all');
const showDeleteModal = ref(false);
const projectToDelete = ref(null);
const projectToDeleteName = computed(() => projectToDelete.value?.name || '');

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') {
    return projects.value;
  }
  return projects.value.filter(project => project.status === statusFilter.value);
});

onMounted(async () => {
  await loadProjects();
});

async function loadProjects() {
  try {
    isLoading.value = true;
    error.value = null;
    
    const apiProjects = await realApi.getProjects();
    
    projects.value = apiProjects.map(project => ({
      id: project.id || project.code,
      code: project.code,
      name: project.name,
      status: project.status === 'active' ? 'active' : 'inactive',
      isActive: project.status === 'active'
    }));
    
    console.log('Transformed projects:', projects.value);
    
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки проектов';
    toast.error('Ошибка загрузки проектов');
  } finally {
    isLoading.value = false;
  }
}

function applyFilters() {
  // Фильтрация происходит через computed свойство filteredProjects
}

function openCreateModal() {
  currentProject.value = null;
  isEditing.value = false;
  showModal.value = true;
}

function editProject(project) {
  currentProject.value = { ...project };
  isEditing.value = true;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  currentProject.value = null;
}

async function handleSave(projectData) {
  try {
    if (isEditing.value) {
      const result = await realApi.updateProject(projectData.code, {
        name: projectData.name,
        isActive: projectData.isActive
      });
      console.log('Project updated:', result);
    } else {
      await realApi.createProject(projectData);
    }

    await loadProjects();
    toast.success('Проект сохранён');
    closeModal();
  } catch (error) {
    toast.error(error.message);
  }
}

function initiateDelete(project) {
  projectToDelete.value = project;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!projectToDelete.value) return;
  
  try {
    await realApi.deleteProject(projectToDelete.value.code);
    await loadProjects();
    toast.success('Проект успешно удалён');
  } catch (err) {
    error.value = err.message;
    toast.error('Ошибка при удалении проекта');
  } finally {
    showDeleteModal.value = false;
    projectToDelete.value = null;
  }
}

function getStatusName(status) {
  const statusMap = {
    active: 'Активный',
    inactive: 'Неактивный'
  };
  return statusMap[status] || status;
}

defineExpose({
  openCreateModal
});
</script>

<style scoped>
.projects-view {
  width: 100%;
}

.filters {
  margin-bottom: 20px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
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

.table-container {
  overflow-x: auto;
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
}

.projects-table th,
.projects-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.projects-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #004080;
}

.projects-table tr:hover {
  background-color: #f5f7fa;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
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
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
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
  transform: scale(1.05);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .projects-table th,
  .projects-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>