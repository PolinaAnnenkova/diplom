<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal">
      <div class="modal-header">
        <h3>Подтверждение удаления</h3>
      </div>
      
      <div class="modal-body">
        <p>Вы уверены, что хотите удалить эту проводку?</p>
      </div>
      
      <div class="modal-footer">
        <button @click="onCancel" class="cancel-btn">Отмена</button>
        <button @click="onConfirm" class="confirm-btn">Удалить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['confirm', 'cancel']);

const onConfirm = () => {
  emit('confirm');
};

const onCancel = () => {
  emit('cancel');
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
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #dc3545;
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn, .confirm-btn {
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

.confirm-btn {
  background-color: #dc3545;
  color: white;
  border: none;
}

.confirm-btn:hover {
  background-color: #bb2d3b;
}
</style>