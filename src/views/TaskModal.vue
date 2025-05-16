<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Редактирование задачи' : 'Создание задачи' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">Название задачи</label>
          <input 
            type="text" 
            id="title" 
            v-model="form.title" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="project">Проект</label>
          <select id="project" v-model="form.projectId" required>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }} ({{ project.code }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="description">Описание</label>
          <textarea 
            id="description" 
            v-model="form.description" 
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="status">Статус</label>
          <select id="status" v-model="form.status">
            <option value="todo">К выполнению</option>
            <option value="in_progress">В работе</option>
            <option value="done">Завершена</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Отменить</button>
          <button type="submit" class="save-btn">
            {{ isEditing ? 'Сохранить изменения' : 'Создать задачу' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';

const props = defineProps({
  showModal: Boolean,
  currentTask: Object,
  isEditing: Boolean,
  projects: Array
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  id: null,
  title: '',
  projectId: '',
  description: '',
  status: 'todo'
});

const initialized = ref(false);

watch(
  () => props.showModal,
  (visible) => {
    if (visible && !initialized.value) {
      if (props.currentTask) {
        Object.assign(form, {
          id: props.currentTask.id,
          title: props.currentTask.title,
          projectId: props.currentTask.projectId,
          description: props.currentTask.description,
          status: props.currentTask.status
        });
      } else {
        resetForm();
      }
      initialized.value = true;
    } else if (!visible) {
      resetForm();
      initialized.value = false;
    }
  }
);


function resetForm() {
  Object.assign(form, {
    id: null,
    title: '',
    projectId: props.projects.length ? props.projects[0].id : '',
    description: '',
    status: 'todo'
  });
}

async function handleSubmit() {
  emit('save', { ...form });
  closeModal();
}

function closeModal() {
  emit('close');
}

onMounted(() => {
  if (props.projects.length && !form.projectId) {
    form.projectId = props.projects[0].id;
  }
});
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