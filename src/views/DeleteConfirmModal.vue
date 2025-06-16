<template>
  <div class="modal-overlay" v-if="show" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>Удаление проекта</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="warning-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <p>Вы действительно хотите удалить проект <strong>{{ projectName }}</strong>?</p>
        <p class="warning-text">Это действие нельзя будет отменить.</p>
      </div>
      
      <div class="modal-footer">
        <button @click="close" class="cancel-btn">Отменить</button>
        <button @click="confirm" class="delete-btn">Удалить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  projectName: String
})

const emit = defineEmits(['confirm', 'close'])

const close = () => emit('close')
const confirm = () => emit('confirm')
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
  max-width: 400px;
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
  color: #dc3545;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.warning-icon {
  margin-bottom: 1rem;
}

.warning-icon svg {
  width: 48px;
  height: 48px;
}

.modal-body p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn, .delete-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  min-width: 100px;
}

.cancel-btn {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
}

.delete-btn:hover {
  background-color: #bb2d3b;
}
</style>