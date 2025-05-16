<template>
  <div class="modal-overlay" v-if="show" @click.self="close">
    <div class="modal-content">
      <h2>{{ currentEntry ? 'Редактирование проводки' : 'Новая проводка' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="date">Дата</label>
          <input
            type="date"
            id="date"
            v-model="form.date"
            required
          >
        </div>

        <div class="form-group">
          <label for="taskId">Задача</label>
          <select id="taskId" v-model="form.taskId" required>
            <option 
              v-for="task in tasks" 
              :key="task.id" 
              :value="task.id"
            >
              {{ task.title }} ({{ getProjectName(task.projectId) }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="hours">Количество часов</label>
          <input
            type="number"
            id="hours"
            v-model.number="form.hours"
            min="0.5"
            max="24"
            step="0.5"
            required
          >
        </div>

        <div class="form-group">
          <label for="description">Описание</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="close">Отменить</button>
          <button type="submit" class="save-btn">Сохранить</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';

const props = defineProps({
  show: Boolean,
  tasks: Array,
  currentEntry: Object
});

const emit = defineEmits(['save', 'close']);

const form = reactive({
  id: null,
  date: new Date().toISOString().split('T')[0],
  taskId: '',
  hours: 1,
  description: ''
});

watch(() => props.currentEntry, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      id: newVal.id,
      date: newVal.date.split('T')[0],
      taskId: newVal.taskId,
      hours: newVal.hours,
      description: newVal.description
    });
  } else {
    resetForm();
  }
});

function resetForm() {
  Object.assign(form, {
    id: null,
    date: new Date().toISOString().split('T')[0],
    taskId: props.tasks.length ? props.tasks[0].id : '',
    hours: 1,
    description: ''
  });
}

function handleSubmit() {
  emit('save', { ...form });
}

function close() {
  emit('close');
}

function getProjectName(projectId) {
  const project = props.tasks.find(t => t.projectId === projectId)?.projectId;
  return project || '';
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