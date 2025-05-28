<template>
  <div class="users-view">
    <div class="admin-actions">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Поиск по имени..."
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
      
      <button class="add-btn" @click="showAddModal = true">
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
            <th>Имя</th>
            <th>Роль</th>
            <th>Компетенции</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in filteredUsers" :key="user.id">
            <td>{{ index + 1 }}</td>
            <td>{{ user.name }}</td>
            <td>{{ getUserRole(user) }}</td>
            <td>
      <span v-if="user.roles.length">{{ user.roles.map(r => r.name).join(', ') }}</span>
      <span v-else>—</span>
    </td>
            <td class="actions">
              <button class="edit-btn" @click="openEditModal(user)">✏️</button>
              <button 
      class="delete-btn" 
      @click="confirmDelete(user)"
       
      
    >
      🗑️
    </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserModal 
      v-if="showAddModal"
      :showModal="showAddModal"
      
      @close="showAddModal = false"
      @user-added="handleUserAdded"
    />
    <UserModal 
      v-if="showUserModal"
      :showModal="showUserModal"
      :currentUser="currentUser"
      :isEditing="isEditing"
      @close="closeModal"
      @user-saved="handleUserSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import realApi from '@/../api/realApi.js';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import UserModal from '@/views/UserModal.vue';

const users = ref([]);
const filteredUsers = ref([]);
const isLoading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const roleFilter = ref('all');
const showAddModal = ref(false);
const showUserModal = ref(false);
const currentUser = ref(null);
const isEditing = ref(false);


const loadData = async () => {
  try {
    isLoading.value = true;
    const usersData = await realApi.getUsers();

    // Загружаем компетенции для каждого пользователя
    const usersWithRoles = await Promise.all(
      usersData.map(async (user) => {
        const fullUser = await realApi.getUserById(user.id);
        return { ...user, roles: fullUser.roles || [] };
      })
    );

    users.value = usersWithRoles;
    applySearch();
  } catch (err) {
    error.value = err.message;
    toast.error('Ошибка загрузки данных');
  } finally {
    isLoading.value = false;
  }
};

const confirmDelete = async (user) => {
  if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.name}"?`)) {
    return;
  }

  try {
    await realApi.deleteUser(user.id);
    toast.success('Пользователь успешно удален');
    loadData(); // Перезагружаем список пользователей
  } catch (err) {
    console.error('Ошибка удаления пользователя:', err);
    toast.error(err.message || 'Не удалось удалить пользователя');
  }
};
const getUserRole = (user) => {
  if (user.is_admin) return 'Администратор';
  if (user.is_manager) return 'Менеджер';
  return 'Исполнитель';
};

const applySearch = () => {
  const query = searchQuery.value.toLowerCase();
  filteredUsers.value = users.value.filter(user => {
    const role = getUserRole(user);
    const roleKey = role === 'Администратор'
      ? 'admin'
      : role === 'Менеджер'
        ? 'manager'
        : 'executor';

    const matchesSearch = user.name.toLowerCase().includes(query);
    const matchesRole = roleFilter.value === 'all' || roleKey === roleFilter.value;

    return matchesSearch && matchesRole;
  });
};
// Открытие модалки для редактирования
const openEditModal = (user) => {
  currentUser.value = { ...user };
  isEditing.value = true;
  showUserModal.value = true;
};

// Закрытие модалки
const closeModal = () => {
  showUserModal.value = false;
  currentUser.value = null;
  isEditing.value = false;
};

const handleUserSaved = (savedUser) => {
  console.log('[handleUserSaved] Получен savedUser:', savedUser);
  console.log('[handleUserSaved] isEditing:', isEditing.value);


  if (isEditing.value) {
    loadData();

    
  } else {
    console.log('[handleUserSaved] Режим добавления. Добавляем пользователя:', savedUser);
    users.value.unshift(savedUser);
    toast.success('Пользователь добавлен');
  }

  applySearch();
  closeModal();
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
  font-size: 1rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
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