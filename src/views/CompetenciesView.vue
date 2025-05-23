<template>
  <div class="competence-view">
    <div class="admin-actions">
      <button class="add-btn" @click="showAddModal">
        Добавить компетенцию
      </button>
    </div>
    
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-if="error" class="error">{{ error }}</div>
    
    <div class="table-container">
      <table class="data-table" v-if="!isLoading">
        <thead>
          <tr>
            <th>№</th>
            <th>Название</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(competence, index) in competencies" :key="competence.id">
            <td>{{ index + 1 }}</td>
            <td>{{ competence.name }}</td>
            <td class="actions">
              <button class="edit-btn" @click="showEditModal(competence)">✏️</button>
              <button class="delete-btn" @click="deleteItem(competence.id)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CompetenceModal 
      :showModal="showModal"
      :currentItem="currentItem"
      :isEditing="isEditing"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import mockApi from '@/../api/mockApi.js';
import CompetenceModal from '@/views/CompetenceModal.vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const competencies = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const currentItem = ref(null);

const loadData = async () => {
  try {
    isLoading.value = true;
    competencies.value = await mockApi.getCompetencies();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const showAddModal = () => {
  currentItem.value = null;
  isEditing.value = false;
  showModal.value = true;
};

const showEditModal = (competence) => {
  currentItem.value = { ...competence };
  isEditing.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  currentItem.value = null;
};

const handleSave = async (CompetenceData) => {
  try {
    if (isEditing.value) {
      await mockApi.updateCompetence(CompetenceData.id, CompetenceData);
    } else {
      await mockApi.createCompetence(CompetenceData);
    }
    await loadData();
    closeModal();
  } catch (err) {
    error.value = err.message;
  }
};

const deleteItem = async (id) => {
  if (confirm('Вы уверены, что хотите удалить роль?')) {
    try {
      await mockApi.deleteCompetence(id);
      await loadData();
      toast.success('Роль успешно удалена');
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка при удалении роли');
    }
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.competence-view {
  width: 100%;
}

.admin-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.add-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-btn:hover {
  background-color: #0056b3;
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

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #004080;
}

.data-table tr:hover {
  background-color: #f5f7fa;
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
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>