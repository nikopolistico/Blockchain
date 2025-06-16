<template>
  <div class="app-container" style="display: flex; height: 100vh;">
    <!-- Sidebar -->
    <aside style="width: 250px; background-color: #343a40; color: white; padding: 20px;">
      <h2 style="color: #ffc107;">Barangay Mahay</h2>
      <nav>
        <ul style="list-style: none; padding: 0;">
          <li><button @click="selectPage('compose')" style="width: 100%; margin-bottom: 10px;">📄 Compose Reports</button></li>
          <li><button @click="selectPage('verified')" style="width: 100%; margin-bottom: 10px;">✅ Verified Reports</button></li>
          <li><button @click="selectPage('assign')" style="width: 100%; margin-bottom: 10px;">👮 Assign Tanod</button></li>
          <li><button @click="selectPage('search')" style="width: 100%;">🔍 Search Record</button></li>
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main style="flex-grow: 1; padding: 20px;">
  <h1>🚓 Crime Report System</h1>

  <section v-if="activePage === 'search'" class="card">
    <h2>🔍 Search Crime Record</h2>
    <input v-model="searchId" placeholder="Enter Crime ID" type="text" />
    <button @click="fetchCrime">Find</button>
    <pre>{{ result }}</pre>
    <button @click="clearResults">Clear</button>
  </section>

  <section v-if="activePage === 'verified'">
    <h2>✅ Verified Reports</h2>
    <p>List of verified crime reports will be shown here.</p>
  </section>

  <component :is="currentView" v-if="currentView" />
</main>

  </div>
</template>

<script scoped>
import TanodViews from '@/components/barangay/TanodList.vue';
import ReportsList from '@/components/barangay/ReportsList.vue';

export default {
  components: {
    TanodViews,
    ReportsList,
  },
  data() {
    return {
      searchId: '',
      result: '',
      activePage: 'search',
    };
  },
  computed: {
    currentView() {
      switch (this.activePage) {
        case 'assign':
          return 'TanodViews';
        case 'compose':
          return 'ReportsList';
        default:
          return null;
      }
    },
  },
  methods: {
    selectPage(page) {
      this.activePage = page;
      this.clearResults();
    },
    async fetchCrime() {
      if (!this.searchId || isNaN(this.searchId)) {
        alert("Please enter a valid Crime ID");
        return;
      }
      try {
        this.result = '';
        const res = await fetch(`http://localhost:3000/crime/${this.searchId}`);
        if (!res.ok) {
          const result = await res.json();
          alert(`Error fetching crime record: ${result.error}`);
          return;
        }
        const data = await res.json();
        const crimeData = data.data.split(",");
        this.result = `
          Crime ID: ${crimeData[0]}
          Description: ${crimeData[1]}
          Date: ${crimeData[2]}
          Status: ${crimeData[3]}
          Message: ${data.message}
        `;
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while fetching the crime record.");
      }
    },
    clearResults() {
      this.result = '';
      this.searchId = '';
    },
  },
};
</script>
