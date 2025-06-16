<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal">
      <div class="modal-header">
        <h3>Подтверждение удаления</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <p>Вы уверены, что хотите удалить компетенцию <strong>{{ userName }}</strong>?</p>
        <p>Это действие нельзя будет отменить.</p>
      </div>
      
      <div class="modal-footer">
        <button @click="close" class="cancel-btn">Отмена</button>
        <button @click="confirm" class="delete-btn">Удалить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  userName: String
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
}

.modal-body p {
  margin: 0 0 1rem;
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