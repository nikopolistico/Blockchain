<template>
  <div class="container">
    <h2>Welcome, {{ username }}! 👮</h2>
    <h3>Barangay Reports</h3>

    <!-- Your report content here -->
  </div>
</template>

<script>
import { useRoute } from 'vue-router';

export default {
  data() {
    return {
      username: '', // Will be populated with query param 'user'
    };
  },
  created() {
    const route = useRoute();
    this.username = route.query.user; // Retrieve 'user' from the query parameter
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.report-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 6px;
}

.verified {
  color: green;
  font-weight: 600;
}

.not-verified {
  color: red;
  font-weight: 600;
}

button {
  padding: 8px 15px;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>
