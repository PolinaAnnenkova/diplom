<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Редактирование проекта' : 'Создание проекта' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Название проекта</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="code">Код проекта</label>
          <input 
            type="text" 
            id="code" 
            v-model="form.code" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="status">Статус</label>
          <select id="status" v-model="form.status">
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
            
          </select>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Отменить</button>
          <button type="submit" class="save-btn">
            {{ isEditing ? 'Сохранить изменения' : 'Создать проект' }}
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

const emit = defineEmits(['close', 'save']);

const form = reactive({
  id: null,
  name: '',
  code: '',
  status: 'active'
});

watch(() => props.currentProject, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      id: newVal.id,
      name: newVal.name,
      code: newVal.code,
      status: newVal.status
    });
  } else {
    resetForm();
  }
});

function resetForm() {
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    status: 'active'
  });
}

async function handleSubmit() {
   // ✅ Уведомление об успешной операции
    
  
  emit('save', { ...form });
  closeModal();
  toast.success(props.isEditing 
      ? 'Проект успешно обновлён' 
      : 'Проект добавлен');
}

function closeModal() {
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