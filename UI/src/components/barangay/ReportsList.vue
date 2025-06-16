<template>
  <div class="col-view">
    <section class="card shadow-sm bg-white p-4">
      <h3>📋 View Reports</h3>
      <input v-model="searchName" type="text" class="form-control my-2" placeholder="Search by anonymous name" />

      <div class="scrollable-report-list">
        <ul class="list-group mt-3">
          <li class="list-group-item" v-for="(report, index) in filteredReports" :key="index">
            <div class="row">
              <div class="col"><strong>{{ report.name }}</strong></div>
              <div class="col">{{ report.description }}</div>
              <div class="col"><span class="status-text">{{ report.status }}</span></div>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      reports: [],
      searchName: ""
    };
  },
  computed: {
    filteredReports() {
      if (!this.searchName.trim()) return this.reports;
      return this.reports.filter(r =>
        r.name.toLowerCase().includes(this.searchName.toLowerCase())
      );
    }
  },
  async mounted() {
    try {
      const res = await fetch("http://localhost:3000/blockchain-reports");
      const data = await res.json();
      this.reports = data.map(report => ({
        name: report.anonyname,
        description: report.description,
        status: report.status,
        type: 'text'
      }));
    } catch (err) {
      console.error("Failed to fetch blockchain reports:", err);
    }
  }
};
</script>

<style scoped>
.scrollable-report-list {
  max-height: 400px;
  overflow-y: auto;
}

.status-text {
  color: red;
  font-weight: bold;
}
</style>
