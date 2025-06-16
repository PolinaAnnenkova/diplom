<template>
  <div class="admin-dashboard">
    <div class="header">
      <div class="tabs">
        <button 
          @click="activeTab = 'users'"
          :class="{ 'active': activeTab === 'users' }"
        >
          Пользователи
        </button>
        <button 
          @click="activeTab = 'сompetencies'"
          :class="{ 'active': activeTab === 'сompetencies' }"
        >
          Компетенции
        </button>
      </div>
      <button @click="logout" class="logout-btn">Выйти</button>
    </div>

    <div class="tab-content">
      <UsersView 
        v-if="activeTab === 'users'" 
        ref="usersView"
      />
      <CompetenciesView 
        v-else 
        ref="competenciesView"
      />
    </div>

    <!-- Добавляем модальное окно в конец template -->
    <LogoutConfirmModal
      v-if="showLogoutModal"
      :show="showLogoutModal"
      @close="showLogoutModal = false"
      @confirm="performLogout"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import UsersView from '@/views/UsersView.vue';
import CompetenciesView from '@/views/CompetenciesView.vue';
import LogoutConfirmModal from '@/views/LogoutConfirmModal.vue'; // Убедитесь что путь правильный

const router = useRouter();
const activeTab = ref('users');
const usersView = ref(null);
const competenciesView = ref(null);
const showLogoutModal = ref(false);

const logout = () => {
  showLogoutModal.value = true;
};

const performLogout = async () => {
  try {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    router.push('/');
  } catch (err) {
    console.error('Ошибка при выходе:', err);
  } finally {
    showLogoutModal.value = false;
  }
};
</script>

<style scoped>
.admin-dashboard {
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
  }

  .tabs button {
    flex: 1;
    text-align: center;
  }

  .logout-btn {
    width: 100%;
  }
}
</style>