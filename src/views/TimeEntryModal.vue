<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ editing ? 'Редактировать проводку' : 'Новая проводка' }}</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="submit">
          <div class="form-group">
            <label for="entry-date">Дата:</label>
            <input
              id="entry-date"
              type="date"
              v-model="formData.date"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="entry-time">Время (часы):</label>
            <input
              id="entry-time"
              type="number"
              v-model.number="formData.time"
              min="0.25"
              max="24"
              step="0.25"
              required
              class="form-control"
              placeholder="1.5"
            />
            <small class="hint">Укажите время в часах (0.25 = 15 минут)</small>
          </div>

          <div class="form-group">
            <label for="entry-task">Задача:</label>
            <select
              id="entry-task"
              v-model="formData.taskId"
              required
              class="form-control"
            >
              <option value="" disabled>Выберите задачу</option>
              <option
                v-for="task in availableTasks"
                :key="task.id"
                :value="task.id"
              >
                {{ task.title }} ({{ getProjectName(task.projectId) }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="entry-description">Описание:</label>
            <textarea
              id="entry-description"
              v-model="formData.description"
              class="form-control"
              rows="3"
              placeholder="Опишите выполненную работу"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="close">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Сохранение...' : editing ? 'Обновить' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { toast } from 'vue3-toastify';
import realApi from '../../api/realApi.js';

const props = defineProps({
  show: Boolean,
  tasks: Array,
  projects: Array,
  currentEntry: Object,
});

const emit = defineEmits(['close', 'saved']);

const formData = ref({
  date: new Date().toISOString().split('T')[0],
  time: 1,
  description: '',
  taskId: '',
});

const loading = ref(false);
const editing = ref(false);

const availableTasks = computed(() => props.tasks || []);

const getProjectName = (projectId) => {
  const project = props.projects?.find(p => p.id === projectId);
  return project ? project.name : 'Неизвестный проект';
};

const resetForm = () => {
  formData.value = {
    date: new Date().toISOString().split('T')[0],
    time: 1,
    description: '',
    taskId: '',
  };
  editing.value = false;
};

const close = () => {
  resetForm();
  emit('close');
};

const submit = async () => {
  try {
    loading.value = true;

    const entryData = {
      date: formatDateForBackend(formData.value.date),
      time: formatTimeForBackend(formData.value.time),
      taskId: formData.value.taskId,
      desc: formData.value.description
    };

    if (editing.value && props.currentEntry?.id) {
      // Редактирование существующей проводки
      await realApi.updateEntry(props.currentEntry.id, entryData);
      toast.success('Проводка успешно обновлена');
    } else {
      // Создание новой проводки
      await realApi.addEntry(entryData);
      toast.success('Проводка успешно создана');
    }

    emit('saved');
    close();
  } catch (error) {
    console.error('Ошибка сохранения проводки:', error);
    toast.error(error.message || 'Ошибка при сохранении проводки');
  } finally {
    loading.value = false;
  }
};
// Форматирование даты для бэкенда (YYYY/MM/DD)
const formatDateForBackend = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

// Форматирование времени для бэкенда (заменяем . на :)
const formatTimeForBackend = (time) => {
  // Преобразуем число в строку и заменяем точку на двоеточие
  return time.toString().replace('.', ':');
};

// При открытии модалки для редактирования
watch(() => props.currentEntry, (entry) => {
  if (entry) {
    formData.value = {
      date: entry.date.split('T')[0],
      time: parseFloat(entry.time.replace(':', '.')),
      description: entry.description,
      taskId: entry.taskId
    };
    editing.value = true;
  } else {
    resetForm();
  }
}, { immediate: true });
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
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
}

textarea.form-control {
  resize: vertical;
}

.hint {
  color: #666;
  font-size: 0.8rem;
  display: block;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
}

.btn-secondary:hover {
  background-color: #5a6268;
}
</style>