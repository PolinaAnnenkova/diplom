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
          <select id="role" v-model="form.role">
            <option value="admin">Администратор</option>
            <option value="manager">Менеджер</option>
            <option value="executor">Исполнитель</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Отменить</button>
          <button type="submit" class="save-btn">
            {{ isEditing ? 'Сохранить изменения' : 'Добавить пользователя' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>


<script setup>
import { ref, reactive, watch } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const props = defineProps({
  showModal: Boolean,
  currentUser: Object,
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
  role: 'user'
});

const errors = reactive({
  name: '',
  age: '',
  login: '',
  password: '',
  email: ''
});

const isSubmitting = ref(false);

// Следим за текущим пользователем
watch(() => props.currentUser, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      id: newVal.id,
      name: newVal.name,
      age: newVal.age,
      login: newVal.login,
      password: '',
      email: newVal.email,
      role: newVal.role
    });
  } else {
    resetForm();
  }
}, { immediate: true });

// Сброс формы при закрытии модалки
watch(() => props.showModal, (visible) => {
  if (!visible) resetForm();
});

function resetForm() {
  Object.assign(form, {
    id: null,
    name: '',
    age: null,
    login: '',
    password: '',
    email: '',
    role: 'user'
  });
  Object.keys(errors).forEach(key => errors[key] = '');
}

function validate() {
  let isValid = true;

  if (!form.name.trim()) {
    errors.name = 'ФИО обязательно';
    toast.error(errors.name);
    isValid = false;
  } else {
    errors.name = '';
  }

  if (form.age === null || form.age === '') {
    errors.age = 'Возраст обязателен';
    toast.error(errors.age);
    isValid = false;
  } else if (form.age < 14 || form.age > 120) {
    errors.age = 'Возраст 14-120 лет';
    toast.error(errors.age);
    isValid = false;
  } else {
    errors.age = '';
  }

  if (!form.login.trim()) {
    errors.login = 'Логин обязателен';
    toast.error(errors.login);
    isValid = false;
  } else {
    errors.login = '';
  }

  if (!props.isEditing && !form.password) {
    errors.password = 'Пароль обязателен';
    toast.error(errors.password);
    isValid = false;
  } else if (form.password && form.password.length < 6) {
    errors.password = 'Минимум 6 символов';
    toast.error(errors.password);
    isValid = false;
  } else {
    errors.password = '';
  }

  if (!form.email.trim()) {
    errors.email = 'Email обязателен';
    toast.error(errors.email);
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Некорректный email';
    toast.error(errors.email);
    isValid = false;
  } else {
    errors.email = '';
  }

  return isValid;
}


async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    const dataToSave = { ...form };
    if (props.isEditing && !dataToSave.password) {
      delete dataToSave.password;
    }

    emit('save', dataToSave);
    resetForm();
    closeModal();

    // ✅ Уведомление об успешной операции
    toast.success(props.isEditing 
      ? 'Пользователь успешно обновлён' 
      : 'Пользователь добавлен');
  } catch (err) {
    console.error('Ошибка:', err);
    toast.error('Произошла ошибка при сохранении');
  } finally {
    isSubmitting.value = false;
  }
}

function closeModal() {
  resetForm();
  emit('close');
}
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
</style>