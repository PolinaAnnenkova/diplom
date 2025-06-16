<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal">
      <div class="modal-header">
        <h3>Выход из системы</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="logout-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </div>
        <p>Вы действительно хотите выйти из системы?</p>
        <p class="warning-text">Все несохраненные данные будут потеряны.</p>
      </div>
      
      <div class="modal-footer">
        <button @click="close" class="cancel-btn">Остаться</button>
        <button @click="confirm" class="logout-confirm-btn">Выйти</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean
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
  animation: modal-appear 0.3s ease;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.logout-icon {
  margin-bottom: 1rem;
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

.cancel-btn, .logout-confirm-btn {
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

.logout-confirm-btn {
  background-color: #dc3545;
  color: white;
  border: none;
}

.logout-confirm-btn:hover {
  background-color: #bb2d3b;
}
</style>