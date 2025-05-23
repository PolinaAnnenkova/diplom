<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Редактирование задачи' : 'Создание задачи' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">Название задачи*</label>
          <input 
            type="text" 
            id="title" 
            v-model="form.title"
            :class="{ 'invalid': errors.title }"
            required
          >
          <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
        </div>
        
        <div class="form-group">
          <label for="project">Проект*</label>
          <select 
            id="project" 
            v-model="form.projectId"
            :class="{ 'invalid': errors.projectId }"
            required
          >
            <option value="" disabled>Выберите проект</option>
            <option 
              v-for="project in activeProjects" 
              :key="project.id" 
              :value="project.id"
            >
              {{ project.name }} ({{ project.code }})
            </option>
          </select>
          <span v-if="errors.projectId" class="error-message">{{ errors.projectId }}</span>
        </div>
        
        <div class="form-group">
          <label for="description">Описание</label>
          <textarea 
            id="description" 
            v-model="form.description" 
            rows="4"
            placeholder="Дополнительные детали задачи..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="status">Статус</label>
          <select id="status" v-model="form.status">
            <option value="active">Активна</option>
            <option value="inactive">Не активна</option>
          </select>
        </div>
        
        <!-- Блок выбора требуемых компетенций -->
        <div class="form-group">
          <label>Требуемые компетенции</label>
          <div class="competencies-checkboxes">
            <label v-for="competency in competencies" :key="competency.id">
              <input
                type="checkbox"
                v-model="form.requiredCompetencies"
                :value="competency.id"
              >
              {{ competency.name }}
            </label>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Отменить</button>
          <button type="submit" class="save-btn" :disabled="isSubmitting">
            {{ isEditing ? 'Сохранить изменения' : 'Создать задачу' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import mockApi from '@/../api/mockApi.js';

const props = defineProps({
  showModal: Boolean,
  currentTask: {
    type: Object,
    default: null
  },
  isEditing: Boolean,
  projects: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  id: null,
  title: '',
  projectId: '',
  description: '',
  status: 'active',
  requiredCompetencies: [] // Массив ID требуемых компетенций
});

const errors = reactive({
  title: '',
  projectId: ''
});

const isSubmitting = ref(false);
const competencies = ref([]);

// Загрузка компетенций при монтировании
onMounted(async () => {
  try {
    competencies.value = await mockApi.getCompetencies();
  } catch (err) {
    console.error('Ошибка загрузки компетенций:', err);
    toast.error('Не удалось загрузить список компетенций');
  }
});

// Только активные проекты
const activeProjects = computed(() => {
  return props.projects.filter(project => project.status === 'active');
});

watch(
  () => props.showModal,
  (visible) => {
    if (visible) {
      if (props.currentTask) {
        Object.assign(form, {
          id: props.currentTask.id,
          title: props.currentTask.title,
          projectId: props.currentTask.projectId,
          description: props.currentTask.description,
          status: props.currentTask.status,
          requiredCompetencies: props.currentTask.requiredCompetencies || []
        });
      } else {
        resetForm();
      }
    } else {
      resetForm();
    }
  }
);

function resetForm() {
  Object.assign(form, {
    id: null,
    title: '',
    projectId: activeProjects.value.length ? activeProjects.value[0].id : '',
    description: '',
    status: 'active',
    requiredCompetencies: []
  });
  clearErrors();
}

function clearErrors() {
  errors.title = '';
  errors.projectId = '';
}

function validateForm() {
  let isValid = true;
  clearErrors();

  if (!form.title.trim()) {
    errors.title = 'Введите название задачи';
    toast.error('Название задачи обязательно');
    isValid = false;
  }

  if (!form.projectId) {
    errors.projectId = 'Выберите проект';
    toast.error('Проект обязателен для выбора');
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  if (!validateForm()) return;
  
  isSubmitting.value = true;
  try {
    await emit('save', { 
      ...form,
      // Обеспечиваем, что requiredCompetencies всегда массив
      requiredCompetencies: Array.isArray(form.requiredCompetencies) 
        ? form.requiredCompetencies 
        : []
    });
    
    if (props.isEditing) {
      toast.success('Задача успешно отредактирована');
    } else {
      toast.success('Задача успешно создана');
    }

    closeModal();
  } finally {
    isSubmitting.value = false;
  }
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

/* Стили для блока компетенций */
.competencies-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
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