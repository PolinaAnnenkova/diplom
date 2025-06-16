<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Редактирование пользователя' : 'Добавление пользователя' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Имя</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            :class="{ 'invalid': errors.name }"
            required
          >
          <div class="error-message" v-if="errors.name">{{ errors.name }}</div>
        </div>
        
        <!-- Пароль только при создании -->
        <div class="form-group">
          <label for="password">Пароль</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            :class="{ 'invalid': errors.password }"
            required
          >
          <div class="error-message" v-if="errors.password">{{ errors.password }}</div>
        </div>
        
        <div class="form-group">
          <label>Тип пользователя:</label>
          <div class="role-options">
            <label class="role-option">
              <input
                type="radio"
                v-model="userType"
                value="admin"
                :disabled="isEditing"
              >
              <span>Администратор</span>
            </label>
            <label class="role-option">
              <input
                type="radio"
                v-model="userType"
                value="manager"
                :disabled="isEditing"
              >
              <span>Менеджер</span>
            </label>
            <label class="role-option">
              <input
                type="radio"
                v-model="userType"
                value="executor"
                :disabled="isEditing"
              >
              <span>Исполнитель</span>
            </label>
          </div>
        </div>

        <!-- Блок компетенций -->
        <div class="form-group" v-if="userType === 'executor' && availableRoles.length">
          <label>Компетенции исполнителя:</label>
          <div class="competencies-list">
            <label 
              v-for="role in availableRoles" 
              :key="role.id" 
              class="competency-option"
            >
              <input
                type="checkbox"
                v-model="selectedCompetencies"
                :value="role.id"
              >
              <span>{{ role.name }}</span>
            </label>
          </div>
          <div class="error-message" v-if="errors.competencies">{{ errors.competencies }}</div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Отменить</button>
          <button type="submit" class="save-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Добавить пользователя' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import realApi from '@/../api/realApi.js';

const props = defineProps({
  showModal: Boolean,
  currentUser: Object,
  isEditing: Boolean
});

const emit = defineEmits(['close', 'user-saved']);

const form = reactive({
  name: '',
  password: ''
});

const errors = reactive({
  name: '',
  password: '',
  competencies: ''
});

const isSubmitting = ref(false);
const userType = ref(null);
const availableRoles = ref([]);
const selectedCompetencies = ref([]);

// Объявляем resetForm ДО watch
const resetForm = () => {
  form.name = '';
  form.password = '';
  userType.value = null;
  selectedCompetencies.value = [];
  Object.keys(errors).forEach(key => errors[key] = '');
};
const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s]+$/;
// Инициализация формы при изменении currentUser
watch(() => props.currentUser, (user) => {
  if (user) {
    form.name = user.name;
    form.password = user.password; // Пароль не редактируем
    
    // Определяем тип пользователя
    if (user.is_admin) {
      userType.value = 'admin';
    } else if (user.is_manager) {
      userType.value = 'manager';
    } else {
      userType.value = 'executor';
    }
    
    // Загружаем компетенции пользователя
    if (user.roles) {
      selectedCompetencies.value = user.roles.map(r => r.id);
    }
  } else {
    resetForm();
  }
}, { immediate: true });

// Остальной код остается без изменений
const loadRoles = async () => {
  try {
    availableRoles.value = await realApi.getRoles();
  } catch (err) {
    toast.error('Не удалось загрузить список компетенций');
  }
};

loadRoles();

const validate = () => {
  let isValid = true;
  
  if (!form.name.trim()) {
    errors.name = 'Имя обязательно';
    isValid = false;
  } else if (!nameRegex.test(form.name)) {
    errors.name = 'Имя может содержать только буквы и пробелы';
    isValid = false;
  } else {
    errors.name = '';
  }
  
  if (!props.isEditing) {
    errors.password = !form.password ? 'Пароль обязателен' : 
                     form.password.length < 6 ? 'Минимум 6 символов' : '';
    if (errors.password) isValid = false;
  }

  if (!userType.value) {
    toast.error('Выберите тип пользователя');
    isValid = false;
  }

  if (userType.value === 'executor' && !selectedCompetencies.value.length) {
    errors.competencies = 'Выберите хотя бы одну компетенцию';
    isValid = false;
  }

  return isValid;
};
const updateUserCompetencies = async (userId) => {
  try {
    // Получаем текущие роли пользователя (если редактирование)
    const currentRoles = props.isEditing && props.currentUser.roles 
      ? props.currentUser.roles.map(role => role.id) 
      : [];
    
    // Фильтруем - назначаем только новые роли
    const rolesToAdd = selectedCompetencies.value.filter(
      roleId => !currentRoles.includes(roleId)
    );
    
    // Добавляем только новые роли
    for (const roleId of rolesToAdd) {
      await realApi.assignRoleToUser(roleId, userId);
    }
    
    console.log('[updateUserCompetencies] Назначены новые компетенции:', rolesToAdd);
  } catch (err) {
    console.error('[updateUserCompetencies] Ошибка:', err);
    throw err;
  }
};

const handleSubmit = async () => {
  console.log('[handleSubmit] Начало. isEditing:', props.isEditing);

  if (!validate()) {
    console.warn('[handleSubmit] Валидация не пройдена:', errors);
    return;
  }

  isSubmitting.value = true;

  try {
    let userData;
    let savedUser;

    if (props.isEditing) {
      console.log('[handleSubmit] Режим редактирования');
      console.log('[handleSubmit] currentUser:', props.currentUser);

      if (!props.currentUser || !props.currentUser.id) {
        console.error('[handleSubmit] ❌ Нет props.currentUser.id!');
        throw new Error('Не удалось получить ID пользователя для редактирования');
      }

      userData = {
        name: form.name,
        password:form.password,
      };

      console.log('[handleSubmit] Отправка на update:', userData, 'ID:', props.currentUser.id);

      await realApi.updateUser(props.currentUser.id, userData);

      if (userType.value === 'executor') {
        console.log('[handleSubmit] Назначение компетенций исполнителю');
        await updateUserCompetencies(props.currentUser.id);
      }
      
     
    } else {
      console.log('[handleSubmit] Режим добавления нового пользователя');

      userData = {
        name: form.name,
        password: form.password,
        isAdmin: userType.value === 'admin',
        isManager: userType.value === 'manager'
      };

      console.log('[handleSubmit] Отправка на регистрацию:', userData);
      savedUser = await realApi.registerUser(userData);

      if (userType.value === 'executor') {
        console.log('[handleSubmit] Назначение компетенций исполнителю');
        await updateUserCompetencies(savedUser.id);
      }
    }

    toast.success(`Пользователь успешно ${props.isEditing ? 'обновлен' : 'добавлен'}`);
    emit('user-saved', savedUser);
    resetForm();
    closeModal();
  } catch (err) {
    console.error('[handleSubmit] Ошибка:', err);
  }
}


const closeModal = () => {
  resetForm();
  emit('close');
};
</script>



<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1.5rem;
  color: #004080;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input.invalid, select.invalid {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.role-options {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.competencies-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.competency-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn {
  background-color: #f0f0f0;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.save-btn {
  background-color: #007bff;
  color: white;
}

.save-btn:hover {
  background-color: #0056b3;
}

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>