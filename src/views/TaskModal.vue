<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Редактирование задачи' : 'Создание задачи' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Название задачи*</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            required
            :class="{ 'invalid': errors.name }"
          >
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>
        
        <div v-if="!isEditing" class="form-group">
          <label for="projectCode">Проект*</label>
          <select
            id="projectCode"
            v-model="form.projectCode"
            required
            :class="{ 'invalid': errors.projectCode }"
          >
            <option value="" disabled>Выберите проект</option>
            <option 
              v-for="project in projects" 
              :key="project.code" 
              :value="project.code"
            >
              {{ project.name }} ({{ project.code }})
            </option>
          </select>
          <span v-if="errors.projectCode" class="error-message">{{ errors.projectCode }}</span>
        </div>
        
        <div v-if="!isEditing" class="form-group">
          <label for="roleId">Роль*</label>
          <select
            id="roleId"
            v-model="form.roleId"
            required
            :class="{ 'invalid': errors.roleId }"
          >
            <option value="" disabled>Выберите роль</option>
            <option 
              v-for="role in roles" 
              :key="role.id" 
              :value="role.id"
            >
              {{ role.name }}
            </option>
          </select>
          <span v-if="errors.roleId" class="error-message">{{ errors.roleId }}</span>
        </div>
        
        <div class="form-group">
          <label>Статус</label>
          <div class="status-toggle">
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ 'active': form.isActive }"
              @click="form.isActive = true"
            >
              Активный
            </button>
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ 'active': !form.isActive }"
              @click="form.isActive = false"
            >
              Неактивный
            </button>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Отменить</button>
          <button type="submit" class="save-btn" :disabled="isSubmitting">
            <span v-if="isSubmitting">Сохранение...</span>
            <span v-else>{{ isEditing ? 'Сохранить' : 'Создать' }}</span>
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
import realApi from '../../api/realApi.js';

const props = defineProps({
  showModal: Boolean,
  currentTask: Object,
  isEditing: Boolean,
  projects: {
    type: Array,
    default: () => []
  },
  roles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'task-created']);

const form = reactive({
  id: null,
  name: '',
  projectCode: '',
  roleId: '',
  isActive: true
});

const errors = reactive({
  name: '',
  projectCode: '',
  roleId: ''
});

const isSubmitting = ref(false);

watch(() => props.currentTask, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      id: newVal.id,
      name: newVal.name,
      projectCode: newVal.projectCode,
      roleId: newVal.roleId,
      isActive: newVal.isActive
    });
  } else {
    resetForm();
  }
}, { immediate: true });

function resetForm() {
  Object.assign(form, {
    id: null,
    name: '',
    projectCode: '',
    roleId: '',
    isActive: true
  });
  clearErrors();
}

function clearErrors() {
  errors.name = '';
  errors.projectCode = '';
  errors.roleId = '';
}

function validate() {
  let isValid = true;
  clearErrors();

  if (!form.name.trim()) {
    errors.name = 'Введите название задачи';
    isValid = false;
  }

  if (!props.isEditing) {
    if (!form.projectCode) {
      errors.projectCode = 'Выберите проект';
      isValid = false;
    }

    if (!form.roleId) {
      errors.roleId = 'Выберите роль';
      isValid = false;
    }
  }

  return isValid;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    if (props.isEditing && form.id) {
      await realApi.updateTask({
        id: form.id,
        name: form.name,
        isActive: form.isActive
      });
      toast.success('Задача успешно обновлена');
      
      emit('task-created', {
        ...props.currentTask,
        name: form.name,
        isActive: form.isActive
      });
    } else {
      const createdTask = await realApi.createTask({
        name: form.name,
        projectCode: form.projectCode,
        roleId: form.roleId,
        isActive: form.isActive
      });
      toast.success('Задача успешно создана');
      emit('task-created', createdTask);
    }
    
    closeModal();
  } catch (error) {
    toast.error(error.message || 'Ошибка при сохранении задачи');
    console.error('Save error:', error);
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

.status-toggle {
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.toggle-btn {
  flex: 1;
  padding: 0.75rem;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn.active {
  background: #007bff;
  color: white;
}

.toggle-btn:first-child {
  border-right: 1px solid #ddd;
}

.toggle-btn.active:first-child {
  border-right-color: #0056b3;
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