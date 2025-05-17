<template>
  <div class="admin-page">
    <div class="admin-container">
      <h1>Панель администратора</h1>
      <button @click="logout" class="logout-btn">Выйти</button>
      
      <div class="admin-actions">
        <button class="add-user-btn" @click="showAddModal">
          Добавить пользователя
        </button>
      </div>
      
      <div v-if="isLoading" class="loading">Загрузка...</div>
      <div v-if="error" class="error">{{ error }}</div>
      
      <div class="users-table-container">
        <table class="users-table" v-if="!isLoading">
          <thead>
            <tr>
              <th>№</th>
              <th>ФИО</th>
              <th>Возраст</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="user.id">
              <td>{{ index + 1 }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.age }}</td>
              <td>{{ user.email }}</td>
              <td>{{ roleNames[user.role] }}</td>
              <td class="actions">
                <button class="edit-btn" @click="showEditModal(user)">✏️</button>
                <button class="delete-btn" @click="deleteUser(user.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модальное окно для добавления/редактирования -->
    <UserModal 
      :showModal="showModal"
      :currentUser="currentUser"
      :isEditing="isEditing"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import mockApi from '../../api/mockApi.js';
import UserModal from '@/views/UserModal.vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
//const toast = useToast();
const router = useRouter();

const users = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const currentUser = ref(null);

const roleNames = {
  admin: 'Администратор',
  manager: 'Менеджер',
  executor: 'Исполнитель'
};

// Загрузка пользователей
const loadUsers = async () => {
  try {
    isLoading.value = true;
    users.value = await mockApi.getUsers();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

// Показ модального окна для добавления
const showAddModal = () => {
  currentUser.value = null;
  isEditing.value = false;
  showModal.value = true;
};

// Показ модального окна для редактирования
const showEditModal = (user) => {
  currentUser.value = { ...user };
  isEditing.value = true;
  showModal.value = true;
};

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false;
  currentUser.value = null;
};

// Обработка сохранения пользователя
const handleSave = async (userData) => {
  try {
    if (isEditing.value) {
      await mockApi.updateUser(userData.id, userData);
    } else {
      await mockApi.createUser(userData);
    }
    await loadUsers(); // Перезагружаем список пользователей
    closeModal();
  } catch (err) {
    error.value = err.message;
  }
};

// Удаление пользователя
const deleteUser = async (id) => {
  if (confirm('Вы уверены, что хотите удалить пользователя?')) {
    try {
      await mockApi.deleteUser(id);
      await loadUsers(); // Обновляем список
      toast.success('Пользователь успешно удалён');
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка при удалении пользователя');
    }
  }
};
// Выход из системы
const logout = async () => {
  try {
    await mockApi.logout();
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    router.push('/');
  } catch (err) {
    error.value = err.message;
  }
};

// Загружаем пользователей при монтировании компонента
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.admin-page {
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

.admin-container {
  width: 100%;
  max-width: 1200px;
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 50, 0.1);
  margin: 20px 0;
  position: relative;
}

h1 {
  color: #004080;
  margin-bottom: 1.5rem;
  text-align: center;
}

.logout-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #dc3545;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.admin-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.add-user-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-user-btn:hover {
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

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.users-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #004080;
}

.users-table tr:hover {
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
  .admin-container {
    padding: 1rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>