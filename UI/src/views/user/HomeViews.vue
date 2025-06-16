<template>
  <div class="container-fluid">
    <div class="header bg-dark text-white text-center p-3 rounded">
      <h1>🚨 Crime Report System</h1>
      <p>Submit details about a crime you witnessed or experienced</p>
    </div>

    <div class="row-layout">
      <!-- Left: Report Form -->
      <div class="col-form">
        <section class="card shadow-lg p-4">
          <h2 class="mb-3">📝 Report a Crime</h2>

          <div class="form-group mb-3">
            <label>Your Anonymous Name</label>
            <input v-model="anonymousName" type="text" class="form-control" placeholder="e.g. Witness101" />
          </div>

          <div class="form-group mb-3">
            <label>Choose Input Type</label>
            <div>
              <label class="me-3">
                <input type="radio" v-model="inputType" value="text" />
                <span>Text Input</span>
              </label>
              <label>
                <input type="radio" v-model="inputType" value="voice" />
                <span>Voice Recording</span>
              </label>
            </div>
          </div>

          <div class="form-group mb-3" v-if="inputType === 'text'">
            <label>Crime Description</label>
            <textarea v-model="description" rows="4" class="form-control" placeholder="Describe what happened..."></textarea>
          </div>

          <div class="form-group mb-3" v-if="inputType === 'voice'">
            <label>Voice Recording</label><br />
            <button class="btn btn-primary me-2" @click="startRecording" :disabled="isRecording">🎤 Start</button>
            <button class="btn btn-secondary" @click="stopRecording" :disabled="!isRecording">⏹ Stop</button>
            <audio v-if="audioUrl" :src="audioUrl" controls class="mt-3"></audio>
          </div>

          <div class="text-end mt-3">
            <button class="btn btn-danger" @click="submitReport">📤 Submit Report</button>
          </div>
        </section>
      </div>

      <!-- Right: View Reports -->
<div class="col-view">
  <section class="card shadow-sm p-4" style="max-height: 500px; overflow-y: auto;">
    <h3>📋 View Reports</h3>
    <input v-model="searchName" type="text" class="form-control my-2" placeholder="Search by anonymous name" />

    <ul class="list-group mt-3">
      <li
        class="list-group-item d-flex justify-content-between align-items-start"
        v-for="(report, index) in filteredReports"
        :key="index"
      >
        <div class="col-4">
          <strong>{{ report.name }}</strong>
        </div>
        <div class="col-5">
          <span v-if="report.type === 'text'">{{ report.description }}</span>
          <audio v-if="report.type === 'voice'" :src="report.audioUrl" controls></audio>
        </div>
        <div class="col-3 text-end">
          <span class="text-danger fw-bold">{{ report.status }}</span>
        </div>
      </li>
    </ul>
  </section>
</div>

    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      anonymousName: '',
      inputType: 'text',
      description: '',
      audioChunks: [],
      audioBlob: null,
      audioUrl: '',
      mediaRecorder: null,
      isRecording: false,
      reports: [],
      searchName: '',
    };
  },
  computed: {
    filteredReports() {
      if (!this.searchName.trim()) return this.reports;
      return this.reports.filter(r =>
        r.name.toLowerCase().includes(this.searchName.toLowerCase())
      );
    },
  },
  methods: {
    async startRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    },
    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
    },
    async submitReport() {
      if (!this.anonymousName.trim()) {
        alert("Please enter your anonymous name.");
        return;
      }

      if (this.inputType === 'text' && !this.description.trim()) {
        alert("Please enter a crime description.");
        return;
      }

      if (this.inputType === 'voice' && !this.audioBlob) {
        alert("Please record your voice.");
        return;
      }

      // Push to local display (optional)
      if (this.inputType === 'text') {
        this.reports.push({
          name: this.anonymousName,
          description: this.description,
          status: 'Pending',
          type: 'text',
        });
      } else {
        this.reports.push({
          name: this.anonymousName,
          audioUrl: this.audioUrl,
          status: 'Pending',
          type: 'voice',
        });
      }

      // Submit to server
      const formData = new FormData();
      formData.append('anonyname', this.anonymousName);

      if (this.inputType === 'text') {
        formData.append('description', this.description);
      } else {
        formData.append('description', '[Voice Report Attached]');
        formData.append('audio', this.audioBlob, 'voice.webm');
      }

      try {
        const res = await fetch("http://localhost:3000/report", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();
        if (res.ok) {
          alert(result.message || "Report submitted.");
          this.fetchReports(); // refresh after submission
        } else {
          alert("Error: " + result.error);
        }
      } catch (err) {
        console.error(err);
        alert("Server error.");
      }

      // Reset fields
      this.anonymousName = '';
      this.description = '';
      this.audioBlob = null;
      this.audioUrl = '';
    },
    async fetchReports() {
      try {
        const res = await fetch("http://localhost:3000/reports");
        const data = await res.json();
        this.reports = data;
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    },
  },
  mounted() {
    this.fetchReports(); // fetch on page load
  },
};
</script>


<style scoped>
/* Layout */
.container-fluid {
  padding: 20px;
  background: linear-gradient(to right, #667eea, #2A3335, #667eea);
  min-height: 100vh;
}

.header {
  background-color: #1c1c1c;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 5px;
  color: #fff;
}

.header p {
  font-size: 14px;
  color: #d1d1d1;
}

/* 2-Column Layout */
.row-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
}

.col-form {
  flex: 1 1 54%;
}

.col-view {
  flex: 1 1 44%;
}

/* Card Style */
.card {
  border: 1px solid #ced4da;
  border-radius: 12px;
  background: #FEF9F2;
  padding: 24px;
}

/* Form Inputs */
label {
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

input[type="text"],
textarea,
.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 10px;
}

textarea {
  resize: vertical;
}

/* Buttons */
button {
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: #fff;
}

.btn-secondary {
  background-color: #6c757d;
  color: #fff;
}

.btn-danger {
  background-color: #08C2FF;
  color: #141313;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger:hover {
  background-color: #c82333;
}

audio {
  width: 100%;
  margin-top: 10px;
}

/* Reports List */
.list-group {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 500px;
  overflow-y: auto;
}

.list-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid #ddd;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #fdfdfd;
}

.list-group-item .col-4 {
  flex: 0 0 33%;
  font-weight: bold;
  color: #333;
}

.list-group-item .col-5 {
  flex: 0 0 47%;
}

.list-group-item .col-3 {
  flex: 0 0 20%;
  text-align: right;
}

.list-group-item audio {
  width: 100%;
  margin-top: 4px;
}

.text-danger {
  color: red;
  font-weight: bold;
}

/* Responsive */
@media (max-width: 768px) {
  .row-layout {
    flex-direction: column;
  }

  .col-form,
  .col-view {
    flex: 1 1 100%;
  }

  .list-group-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-group-item .col-4,
  .list-group-item .col-5,
  .list-group-item .col-3 {
    width: 100%;
    margin-bottom: 6px;
    text-align: left;
  }

  .list-group-item .col-3 {
    text-align: left;
  }
}
</style>

