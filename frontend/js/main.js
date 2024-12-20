document.addEventListener("DOMContentLoaded", async () => {
  const statsContent = document.getElementById("stats-content");
  const usersList = document.getElementById("users-list");
  const processesTable = document.getElementById("processes-table").querySelector("tbody");
  const processSummary = document.getElementById("process-summary");
  const logList = document.getElementById("log-list");
  const lastUsersList = document.getElementById("last-users-list");
  const uptimeDisplay = document.getElementById("uptime-content");

  // Fetch and populate system stats
  async function fetchSystemStats() {
    try {
      const response = await fetch("/api/system_stats");
      const stats = await response.json();
      statsContent.innerHTML = `
        <div><strong>CPU Usage:</strong> ${stats.cpu_percent}%</div>
        <div><strong>Memory Usage:</strong> ${stats.memory_info}%</div>
        <div><strong>Disk Usage:</strong> ${stats.disk_usage.used / (1024 * 1024)} MB / ${stats.disk_usage.total / (1024 * 1024)} MB</div>
      `;
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
    }
  }

  // Fetch and populate current logged-in users
  async function fetchCurrentUsers() {
    try {
      const response = await fetch("/api/current_users");
      const users = await response.json();
      usersList.innerHTML = users.map(user => `<li>${user.username} (${user.login_time})</li>`).join("");
    } catch (error) {
      console.error("Failed to fetch current users:", error);
    }
  }

  // Fetch and populate processes
  async function fetchProcesses() {
    try {
      const response = await fetch("/api/processes");
      const processes = await response.json();

      processesTable.innerHTML = processes
        .map(process => `
          <tr>
            <td>${process.pid}</td>
            <td>${process.name}</td>
            <td>${process.cpu}%</td>
            <td>${process.memory} MB</td>
          </tr>
        `)
        .join("");

      // Update summary
      const totalCPU = processes.reduce((sum, proc) => sum + proc.cpu, 0);
      const totalMemory = processes.reduce((sum, proc) => sum + proc.memory, 0);
      processSummary.innerText = `Total Processes: ${processes.length}, Total CPU: ${totalCPU}%, Total Memory: ${totalMemory} MB`;
    } catch (error) {
      console.error("Failed to fetch processes:", error);
    }
  }

  // Fetch and populate system logs
  async function fetchSystemLogs() {
    try {
      const response = await fetch("/api/system_logs");
      const logs = await response.json();
      logList.innerHTML = logs.map(log => `<li>${log}</li>`).join("");
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
    }
  }

  // Fetch and populate last logged users
  async function fetchLastLoggedUsers() {
    try {
      const response = await fetch("/api/last_logged_users");
      const users = await response.json();
      lastUsersList.innerHTML = users.map(user => `<li>${user.username} (${user.ip_address}, ${user.login_time})</li>`).join("");
    } catch (error) {
      console.error("Failed to fetch last logged users:", error);
    }
  }

  // Fetch and update system uptime
  async function fetchSystemUptime() {
    try {
      const response = await fetch("/api/system_uptime");
      const data = await response.json();
      uptimeDisplay.innerText = `System Uptime: ${data.uptime}`;
    } catch (error) {
      console.error("Failed to fetch uptime:", error);
    }
  }

  // Logout button functionality
  document.getElementById("logout-button").addEventListener("click", async function () {
    try {
      const username = localStorage.getItem("username");
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      window.location.href = "login.html"; // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  });

  // Periodic updates for all data
  setInterval(fetchSystemStats, 3000);
  setInterval(fetchProcesses, 5000);
  setInterval(fetchSystemLogs, 30000);
  setInterval(fetchCurrentUsers, 5000);
  setInterval(fetchLastLoggedUsers, 10000);
  setInterval(fetchSystemUptime, 1000);

  // Initial fetch for all data
  fetchSystemStats();
  fetchCurrentUsers();
  fetchProcesses();
  fetchSystemLogs();
  fetchLastLoggedUsers();
  fetchSystemUptime();
});
