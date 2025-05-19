<template>
  <div class="modal-overlay" v-if="show" @click.self="close">
    <div class="modal-content">
      <h2>{{ currentEntry ? 'Редактирование проводки' : 'Новая проводка' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="date">Дата*</label>
          <input
            type="date"
            id="date"
            v-model="form.date"
            :class="{ 'invalid': errors.date }"
            :max="maxDate"
            required
          >
          <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
        </div>

        <div class="form-group">
          <label for="taskId">Задача*</label>
          <select 
            id="taskId" 
            v-model="form.taskId"
            :class="{ 'invalid': errors.taskId }"
            required
          >
            <option value="" disabled>Выберите задачу</option>
            <option 
              v-for="task in activeTasks" 
              :key="task.id" 
              :value="task.id"
            >
              {{ task.title }}
            </option>
          </select>
          <span v-if="errors.taskId" class="error-message">{{ errors.taskId }}</span>
        </div>

        <div class="form-group">
          <label for="hours">Количество часов*</label>
          <input
            type="number"
            id="hours"
            v-model.number="form.hours"
            min="0.5"
            max="24"
            step="0.5"
            :class="{ 'invalid': errors.hours }"
            required
          >
          <span v-if="errors.hours" class="error-message">{{ errors.hours }}</span>
        </div>

        <div class="form-group">
          <label for="description">Описаниеttttttt</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="Опишите выполненную работу..."
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="close">Отменить</button>
          <button type="submit" class="save-btn" :disabled="isSubmitting">
            {{ currentEntry ? 'Сохранить изменения' : 'Создать проводку' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
const props = defineProps({
  show: Boolean,
  tasks: {
    type: Array,
    default: () => []
  },
  currentEntry: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['save', 'close']);

const form = reactive({
  id: null,
  date: '',
  taskId: '',
  hours: 1,
  description: ''
});

const errors = reactive({
  date: '',
  taskId: '',
  hours: ''
});

const isSubmitting = ref(false);

const maxDate = computed(() => {
  const today = new Date();
   today.setDate(today.getDate());
  return today.toISOString().split('T')[0];
});

const activeTasks = computed(() => {
  return props.tasks.filter(task => task.status === 'active');
});

watch(() => props.currentEntry, (newEntry) => {
  if (newEntry) {
    form.id = newEntry.id;
    form.date = newEntry.date?.split('T')[0] || new Date().toISOString().split('T')[0];
    form.taskId = newEntry.taskId;
    form.hours = newEntry.hours || 1;
    form.description = newEntry.description || '';
  } else {
    resetForm();
  }
}, { immediate: true });

function resetForm() {
  form.id = null;
  form.date = new Date().toISOString().split('T')[0];
  form.taskId = activeTasks.value.length ? activeTasks.value[0].id : '';
  form.hours = 1;
  form.description = '';
  clearErrors();
}

function clearErrors() {
  errors.date = '';
  errors.taskId = '';
  errors.hours = '';
}

function validateForm() {
  let isValid = true;
  clearErrors();

  if (!form.date) {
    errors.date = 'Укажите дату';
    isValid = false;
  } else {
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      errors.date = 'Нельзя выбирать дату в будущем';
      isValid = false;
    }
  }

  if (!form.taskId) {
    errors.taskId = 'Выберите задачу';
    isValid = false;
  }

  if (!form.hours || form.hours < 0.5 || form.hours > 24) {
    errors.hours = 'Введите значение от 0.5 до 24';
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  // Сначала валидация
  if (!validateForm()) {
    // Показываем все ошибки
    if (errors.date) toast.error(errors.date);
    if (errors.taskId) toast.error(errors.taskId);
    if (errors.hours) toast.error(errors.hours);
    return;
  }

  isSubmitting.value = true;
  
  try {
    emit('save', { ...form });
    toast.success(
      props.currentEntry ? "Проводка успешно обновлена!" : "Проводка успешно создана!",
      { autoClose: 2000 }
    );
    
    // Даем время показать уведомление перед закрытием
    await new Promise(resolve => setTimeout(resolve, 2000));
    close();
  } catch (error) {
    toast.error("Произошла ошибка при сохранении");
    isSubmitting.value = false;
  }
}

function close() {
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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

input, select, textarea {
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

textarea {
  resize: vertical;
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
  transition: all 0.3s;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.save-btn:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>