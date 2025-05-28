<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Редактирование проекта' : 'Создание проекта' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Название проекта*</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            required
            :class="{ 'invalid': errors.name }"
          >
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>
        
        <div class="form-group">
          <label for="code">Код проекта*</label>
          <input 
            type="text" 
            id="code" 
            v-model="form.code" 
            required
            :readonly="isEditing"
            :class="{ 'invalid': errors.code }"
          >
          <span v-if="errors.code" class="error-message">{{ errors.code }}</span>
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

const props = defineProps({
  showModal: Boolean,
  currentProject: Object,
  isEditing: Boolean
});

const emit = defineEmits(['close', 'save', 'project-created']);

const form = reactive({
  id: null,
  name: '',
  code: '',
  isActive: true // Изменено с status на isActive (boolean)
});

const errors = reactive({
  name: '',
  code: ''
});

const isSubmitting = ref(false);

watch(() => props.currentProject, (newVal) => {
   console.log('Current project data:', newVal); // Логируем входящие данные
  if (newVal) {
    Object.assign(form, {
      id: newVal.id,
      name: newVal.name,
      code: newVal.code,
      isActive: newVal.status === 'active' // Преобразуем в boolean
    });
    console.log('Form after assignment:', {...form});
  } else {
    resetForm();
  }
}, { immediate: true });

function resetForm() {
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    isActive: true
  });
  clearErrors();
}

function clearErrors() {
  errors.name = '';
  errors.code = '';
}

function validate() {
  let isValid = true;
  clearErrors();

  if (!form.name.trim()) {
    errors.name = 'Введите название проекта';
    isValid = false;
  }

  if (!form.code.trim()) {
    errors.code = 'Введите код проекта';
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  if (!validate()) return;
console.log('Submitting form:', {...form});
  isSubmitting.value = true;

  try {
    const projectData = {
      name: form.name,
      code: form.code,
      isActive: form.isActive
    };

    if (props.isEditing && form.id) {
      projectData.id = form.id;
    }
console.log('Sending projectData:', projectData);

    emit('save', projectData);
    emit('project-created');
    
    toast.success(props.isEditing 
      ? 'Проект успешно обновлён' 
      : 'Проект успешно создан');
      
    closeModal();
  } catch (error) {
    toast.error('Ошибка при сохранении проекта');
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

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
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