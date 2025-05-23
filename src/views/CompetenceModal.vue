<template>
  <div class="modal-overlay" v-if="showModal">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ isEditing ? 'Редактирование компетенции' : 'Создание компетенции' }}</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>Название компетенции:</label>
          <input 
            type="text" 
            v-model="formData.name" 
            placeholder="Введите название компетенции"
          >
        </div>
        
        
      </div>
      
      <div class="modal-footer">
        <button @click="close" class="cancel-btn">Отмена</button>
        <button @click="save" class="save-btn">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  showModal: Boolean,
  currentItem: Object,
  isEditing: Boolean
});

const emit = defineEmits(['close', 'save']);

const formData = ref({
  name: '',
  description: ''
});
const resetForm = () => {
  formData.value = {
    name: ''
    
  };
};

// Следим за изменениями currentItem
watch(() => props.currentItem, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal };
  } else {
    resetForm();
  }
}, { immediate: true });



const close = () => {
  emit('close');
  resetForm();
};

const save = () => {
  if (!formData.value.name) {
    alert('Название компетенции обязательно для заполнения');
    return;
  }
  
  emit('save', { ...formData.value });
  resetForm();
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

.modal {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #004080;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn, .save-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
}

.save-btn {
  background-color: #007bff;
  color: white;
  border: none;
}

.save-btn:hover {
  background-color: #0056b3;
}
</style>