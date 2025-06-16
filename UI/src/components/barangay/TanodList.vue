<template>
  <div>
    <h2>👮 Assign Barangay Tanod</h2>
    <p>This is the Tanod assignment interface.</p>

    <!-- Toggle button to show/hide registration -->
    <button class="toggle-btn" @click="showForm = !showForm" aria-label="Toggle Register">
      <span v-if="!showForm">➕ Show Registration</span>
      <span v-else>➖ Hide Registration</span>
    </button>

    <!-- Registration Form -->
    <div v-if="showForm" class="form-container">
      <h3>👮 Tanod Registration</h3>

      <div v-if="!isLoggedIn" class="form">
        <input v-model="username" placeholder="Username" />
        <input v-model="password" placeholder="Password" type="password" />

        <div class="buttons">
          <button @click="register">Register</button>
        </div>

        <p class="message" v-if="message">{{ message }}</p>
      </div>

      <div v-else>
        <p>Welcome, {{ username }}! ✅</p>
        <button @click="logout">Logout</button>
      </div>
    </div>

    <hr />

    <!-- Tanod list -->
    <ul v-if="tanods.length">
      <li v-for="tanod in tanods" :key="tanod.id">
        {{ tanod.username }}
      </li>
    </ul>
    <p v-else>No tanods registered yet.</p>
  </div>
</template>

<script>
export default {
  name: 'TanodViews',
  data() {
    return {
      tanods: [],
      username: '',
      password: '',
      isLoggedIn: false,
      message: '',
      showForm: false, // form hidden by default
    };
  },
  async created() {
    await this.fetchTanods();
  },
  methods: {
    async register() {
      const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username, password: this.password }),
      });
      const data = await res.json();
      this.message = data.message || data.error;
      if (data.message) {
        this.isLoggedIn = true;
        this.fetchTanods();
      }
    },
    logout() {
      this.isLoggedIn = false;
      this.username = '';
      this.password = '';
      this.message = '';
    },
    async fetchTanods() {
      try {
        const res = await fetch('http://localhost:3000/tanods');
        if (!res.ok) throw new Error('Failed to fetch tanods');
        this.tanods = await res.json();
      } catch (error) {
        console.error(error);
      }
    }
  }
};
</script>

<style scoped>
.toggle-btn {
  background-color: transparent;
  border: none;
  color: #007bff;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
  font-size: 16px;
  user-select: none;
}

.toggle-btn:hover {
  text-decoration: underline;
}

.form-container {
  border: 1px solid #ccc;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  background: #fafafa;
}

input {
  width: 100%;
  padding: 8px;
  margin: 6px 0;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-size: 14px;
}

.buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

button {
  flex: none;
  padding: 10px 20px;
  margin: 0 5px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.message {
  color: red;
  margin-top: 12px;
  min-height: 18px;
}
</style>
