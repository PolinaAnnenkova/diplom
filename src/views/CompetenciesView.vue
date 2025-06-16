<template>
  <div class="competence-view">
    <div class="admin-actions">
      <div class="add-role-form">
        <input 
          v-model="newRoleName" 
          placeholder="Введите название новой роли"
          @keyup.enter="addRole"
        >
        <button class="add-btn" @click="addRole">
          Добавить роль
        </button>
      </div>
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
          <tr v-for="(role, index) in roles" :key="role.id">
            <td>{{ index + 1 }}</td>
            <td>{{ role.name }}</td>
            <td class="actions">
              <button class="delete-btn" @click="confirmDelete(role)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <CompetenceDelete
      v-if="showDeleteModal"
      :show="showDeleteModal"
      :user-name="roleToDelete?.name || ''"
      @close="showDeleteModal = false"
      @confirm="deleteRole"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import realApi from '@/../api/realApi.js';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import CompetenceDelete from '@/views/CompetenceDelete.vue';

const roles = ref([]);
const isLoading = ref(false);
const error = ref(null);
const newRoleName = ref('');
const showDeleteModal = ref(false);
const roleToDelete = ref(null);

const loadData = async () => {
  try {
    isLoading.value = true;
    roles.value = await realApi.getRoles();
  } catch (err) {
    error.value = err.message;
    toast.error('Ошибка загрузки ролей');
  } finally {
    isLoading.value = false;
  }
};

const addRole = async () => {
  const trimmedName = newRoleName.value.trim();
  if (!trimmedName) {
    toast.warning('Введите название роли');
    return;
  }

  try {
    const createdRole = await realApi.createRole(trimmedName);
    roles.value.push(createdRole);
    newRoleName.value = '';
    toast.success(`Роль "${createdRole.name}" создана`);
  } catch (err) {
    toast.error(err.message || 'Ошибка сервера при создании роли');
    console.error('Ошибка при создании роли:', err);
  }
};

const confirmDelete = (role) => {
  roleToDelete.value = role;
  showDeleteModal.value = true;
};

const deleteRole = async () => {
  if (!roleToDelete.value) return;

  try {
    await realApi.deleteRole(roleToDelete.value.id);
    roles.value = roles.value.filter(role => role.id !== roleToDelete.value.id);
    toast.success('Компетенция успешно удалена');
  } catch (err) {
    toast.error(err.message || 'Ошибка при удалении компетенции');
    console.error('Ошибка при удалении:', err);
  } finally {
    showDeleteModal.value = false;
    roleToDelete.value = null;
  }
};
onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* Существующие стили остаются без изменений */
.competence-view {
  width: 100%;
  padding: 20px;
}

.admin-actions {
  margin-bottom: 1.5rem;
}

.add-role-form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.add-role-form input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 300px;
  flex-grow: 1;
}

.add-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  position: sticky;
  top: 0;
}

.data-table tr:hover {
  background-color: #f5f7fa;
}

.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  background-color: #dc3545;
  color: white;
  transition: opacity 0.3s ease;
}

.delete-btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .add-role-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>