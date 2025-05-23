<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Редактирование пользователя' : 'Добавление пользователя' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">ФИО</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            :class="{ 'invalid': errors.name }"
          >
          <div class="error-message" v-if="errors.name">{{ errors.name }}</div>
        </div>
        
        <div class="form-group">
          <label for="age">Возраст</label>
          <input 
            type="number" 
            id="age" 
            v-model.number="form.age" 
            :class="{ 'invalid': errors.age }"
          >
          <div class="error-message" v-if="errors.age">{{ errors.age }}</div>
        </div>
        
        <div class="form-group">
          <label for="login">Логин</label>
          <input 
            type="text" 
            id="login" 
            v-model="form.login" 
            :class="{ 'invalid': errors.login }"
          >
          <div class="error-message" v-if="errors.login">{{ errors.login }}</div>
        </div>
        
        <div class="form-group">
          <label for="password">Пароль</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            :class="{ 'invalid': errors.password }"
            :placeholder="isEditing ? 'Оставьте пустым, чтобы не изменять' : ''"
          >
          <div class="error-message" v-if="errors.password">{{ errors.password }}</div>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            :class="{ 'invalid': errors.email }"
          >
          <div class="error-message" v-if="errors.email">{{ errors.email }}</div>
        </div>
        
        <div class="form-group">
          <label for="role">Роль</label>
          <select id="role" v-model="form.role" @change="handleRoleChange">
            <option value="admin">Администратор</option>
            <option value="manager">Менеджер</option>
            <option value="executor">Исполнитель</option>
          </select>
        </div>
        
        <!-- Блок выбора компетенций (только для исполнителей) -->
        <div class="form-group" v-if="showCompetencies">
          <label>Компетенции исполнителя</label>
          <div class="competencies-checkboxes">
            <label v-for="competency in competencies" :key="competency.id">
              <input
                type="checkbox"
                v-model="selectedCompetencies"
                :value="competency.id"
              >
              {{ competency.name }}
            </label>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Отменить</button>
          <button type="submit" class="save-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Добавить пользователя' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import mockApi from '@/../api/mockApi.js';

const props = defineProps({
  showModal: Boolean,
  currentItem: Object,
  isEditing: Boolean
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  id: null,
  name: '',
  age: null,
  login: '',
  password: '',
  email: '',
  role: 'user',
  competencies: []
});

const errors = reactive({
  name: '',
  age: '',
  login: '',
  password: '',
  email: ''
});

const isSubmitting = ref(false);
const competencies = ref([]);
const selectedCompetencies = ref([]);
const showCompetencies = ref(false);

// Загрузка компетенций при монтировании
onMounted(async () => {
  try {
    competencies.value = await mockApi.getCompetencies();
  } catch (err) {
    console.error('Ошибка загрузки компетенций:', err);
    toast.error('Не удалось загрузить список компетенций');
  }
});

// Обработчик изменения роли
const handleRoleChange = () => {
  showCompetencies.value = form.role === 'executor';
  if (form.role !== 'executor') {
    selectedCompetencies.value = [];
  }
};
const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    age: null,
    login: '',
    password: '',
    email: '',
    role: 'user',
    competencies: []
  });
  selectedCompetencies.value = [];
  showCompetencies.value = false;
  Object.keys(errors).forEach(key => errors[key] = '');
};

// Следим за текущим пользователем
watch(
  [() => props.showModal, () => props.currentItem],
  ([visible, user]) => {
    if (visible && user && props.isEditing) {
      Object.assign(form, {
        id: user.id,
        name: user.name,
        age: user.age,
        login: user.login,
        password: '',
        email: user.email,
        role: user.role,
        competencies: user.competencies || []
      });
      
      // Загружаем выбранные компетенции для исполнителя
      if (user.role === 'executor' && user.competencies) {
        selectedCompetencies.value = [...user.competencies];
      }
      showCompetencies.value = user.role === 'executor';
    } else if (!visible) {
      resetForm();
    }
  },
  { immediate: true }
);

// Сброс формы


// Валидация формы
const validate = () => {
  let isValid = true;
  errors.name = !form.name.trim() ? 'ФИО обязательно' : '';
  errors.age = !form.age ? 'Возраст обязателен' : 
               (form.age < 14 || form.age > 120) ? 'Возраст 14-120 лет' : '';
  errors.login = !form.login.trim() ? 'Логин обязателен' : '';
  errors.password = !props.isEditing && !form.password ? 'Пароль обязателен' :
                   (form.password && form.password.length < 6) ? 'Минимум 6 символов' : '';
  errors.email = !form.email.trim() ? 'Email обязателен' :
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Некорректный email' : '';
  
  // Дополнительная валидация для исполнителей
  if (form.role === 'executor' && selectedCompetencies.value.length === 0) {
    toast.error('Выберите хотя бы одну компетенцию для исполнителя');
    isValid = false;
  }

  // Проверяем все ошибки
  Object.values(errors).forEach(error => {
    if (error) {
      toast.error(error);
      isValid = false;
    }
  });

  return isValid;
};

// Обработка отправки формы
const handleSubmit = async () => {
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    const dataToSave = { 
      ...form,
      competencies: form.role === 'executor' ? selectedCompetencies.value : []
    };

    if (props.isEditing && !dataToSave.password) {
      delete dataToSave.password;
    }

    emit('save', dataToSave);
    resetForm();
    closeModal();

    toast.success(props.isEditing 
      ? 'Пользователь успешно обновлён' 
      : 'Пользователь добавлен');
  } catch (err) {
    console.error('Ошибка:', err);
    toast.error('Произошла ошибка при сохранении');
  } finally {
    isSubmitting.value = false;
  }
};

// Закрытие модалки
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
  margin-bottom: 1rem;
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

.competencies-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.competencies-checkboxes label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.competencies-checkboxes input[type="checkbox"] {
  width: auto;
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