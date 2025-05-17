
<template>
  <div class="projects-view">
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
          <tr v-for="project in projects" :key="project.id">
            <td>{{ project.name }}</td>
            <td>{{ project.code }}</td>
            <td>
              <span :class="['status-badge', project.status]">
                {{ getStatusName(project.status) }}
              </span>
            </td>
            <td class="actions">
              <button @click="editProject(project)" class="edit-btn">✏️</button>
              <button @click="deleteProject(project.id)" class="delete-btn">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ProjectModal from '@/views/ProjectModal.vue';
import mockApi from '../../api/mockApi.js';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
const projects = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const currentProject = ref(null);

onMounted(async () => {
  await loadProjects();
});

async function loadProjects() {
  try {
    isLoading.value = true;
    projects.value = await mockApi.getProjects();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
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
      await mockApi.updateProject(projectData.id, projectData);
    } else {
      await mockApi.createProject(projectData);
    }
    await loadProjects();
    closeModal();
    emit('project-created');
  } catch (err) {
    error.value = err.message;
  }
}

async function deleteProject(id) {
  if (confirm('Вы уверены, что хотите удалить этот проект?')) {
    try {
      await mockApi.deleteProject(id);
      await loadProjects();
      toast.success('Проект успешно удалён');
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка при удалении проекта');
    }
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

.edit-btn:hover, .delete-btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .projects-table th,
  .projects-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
