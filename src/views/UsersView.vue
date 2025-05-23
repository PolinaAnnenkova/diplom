<template>
  <div class="users-view">
    <div class="admin-actions">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Поиск по имени или email..."
          class="search-input"
          @input="applySearch"
        >
        <select v-model="roleFilter" @change="applySearch" class="role-filter">
          <option value="all">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="manager">Менеджер</option>
          <option value="executor">Исполнитель</option>
        </select>
      </div>
      
      <button class="add-btn" @click="showAddModal">
        Добавить пользователя
      </button>
    </div>
    
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-if="error" class="error">{{ error }}</div>
    
    <div class="table-container">
      <table class="data-table" v-if="!isLoading">
        <thead>
          <tr>
            <th>№</th>
            <th>ФИО</th>
            <th>Возраст</th>
            <th>Email</th>
            <th>Роль</th>
            <th v-if="hasCompetencies">Компетенции</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in filteredUsers" :key="user.id">
            <td>{{ index + 1 }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.age }}</td>
            <td>{{ user.email }}</td>
            <td>{{ roleNames[user.role] }}</td>
            <td v-if="hasCompetencies">
              <span v-if="user.role === 'executor' && user.competencies?.length">
                {{ getCompetenciesNames(user.competencies) }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="actions">
              <button class="edit-btn" @click="showEditModal(user)">✏️</button>
              <button class="delete-btn" @click="deleteItem(user.id)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserModal 
      :showModal="showModal"
      :currentItem="currentItem"
      :isEditing="isEditing"
      :availableCompetencies="competencies"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import mockApi from '@/../api/mockApi.js';
import UserModal from '@/views/UserModal.vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const users = ref([]);
const competencies = ref([]);
const filteredUsers = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const currentItem = ref(null);
const searchQuery = ref('');
const roleFilter = ref('all');

const roleNames = {
  admin: 'Администратор',
  manager: 'Менеджер',
  executor: 'Исполнитель'
};

const hasCompetencies = computed(() => {
  return users.value.some(user => user.role === 'executor' && user.competencies?.length);
});

const loadData = async () => {
  try {
    isLoading.value = true;
    const [usersData, competenciesData] = await Promise.all([
      mockApi.getUsers(),
      mockApi.getCompetencies()
    ]);
    users.value = usersData;
    competencies.value = competenciesData;
    filteredUsers.value = [...users.value];
  } catch (err) {
    error.value = err.message;
    toast.error('Ошибка загрузки данных');
  } finally {
    isLoading.value = false;
  }
};

const getCompetenciesNames = (competencyIds) => {
  return competencyIds.map(id => {
    const competency = competencies.value.find(c => c.id === id);
    return competency ? competency.name : `Неизвестная (${id})`;
  }).join(', ');
};

const applySearch = () => {
  const query = searchQuery.value.toLowerCase();
  
  filteredUsers.value = users.value.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query);
    
    const matchesRole = 
      roleFilter.value === 'all' || 
      user.role === roleFilter.value;
    
    return matchesSearch && matchesRole;
  });
};

const showAddModal = () => {
  currentItem.value = null;
  isEditing.value = false;
  showModal.value = true;
};

const showEditModal = (user) => {
  currentItem.value = { 
    ...user,
    competencies: user.role === 'executor' ? [...(user.competencies || [])] : []
  };
  isEditing.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  currentItem.value = null;
};

const handleSave = async (userData) => {
  try {
    isEditing.value 
      ? await mockApi.updateUser(userData.id, userData)
      : await mockApi.createUser(userData);
    
    await loadData();
    closeModal();
    toast.success(`Пользователь успешно ${isEditing.value ? 'обновлён' : 'добавлен'}`);
  } catch (err) {
    error.value = err.message;
    toast.error(`Ошибка ${isEditing.value ? 'обновления' : 'создания'} пользователя`);
  }
};

const deleteItem = async (id) => {
  if (confirm('Вы уверены, что хотите удалить пользователя?')) {
    try {
      await mockApi.deleteUser(id);
      await loadData();
      toast.success('Пользователь успешно удалён');
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка при удалении пользователя');
    }
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.users-view {
  width: 100%;
  padding: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  margin-right: 20px;
  flex-grow: 1;
  max-width: 600px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
  min-width: 200px;
}

.role-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.admin-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 10px;
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
}

.edit-btn, .delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .admin-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-container {
    max-width: 100%;
    width: 100%;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
  
  .actions {
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .edit-btn, .delete-btn {
    width: 100%;
  }
}
</style>