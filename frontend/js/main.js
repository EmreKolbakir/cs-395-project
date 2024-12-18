document.addEventListener("DOMContentLoaded", async () => {
  let initialUptime = 0;

  function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
  
    while (bytes >= 1024 && unitIndex < units.length - 1) {
      bytes /= 1024;
      unitIndex++;
    }
  
    return `${bytes.toFixed(2)} ${units[unitIndex]}`;
  }
  
  function formatPercentage(value) {
    return `${value.toFixed(1)}%`;
  }
  
  function formatLoadAverage(loads) {
    return loads.map((load) => load.toFixed(2)).join(", ");
  }
  
  async function fetchStats() {
    try {
      const response = await fetch("/api/system_stats");
      const stats = await response.json();
      const statsContent = document.getElementById("stats-content");
  
      statsContent.innerHTML = `
          <div><strong>CPU Usage:</strong> ${formatPercentage(stats.cpu_percent)}</div>
          <div><strong>Memory Usage:</strong> ${formatBytes(stats.memory_info.used)} / ${formatBytes(stats.memory_info.total)}</div>
          <div><strong>Disk Usage:</strong> ${formatBytes(stats.disk_usage.used)} / ${formatBytes(stats.disk_usage.total)}</div>
          <div><strong>Load Average:</strong> ${formatLoadAverage(stats.load_avg)} (CPU Cores: ${stats.cpu_cores})</div>
      `;
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
    }
  }

  // Fetch and populate logged-in users
  // Fetch and display current logged-in users
  async function fetchLoggedUsers() {
    try {
      const response = await fetch("/api/current_logged_users");
      const users = await response.json();
      const usersList = document.getElementById("users-list");

      usersList.innerHTML = users
        .map(
          (user) =>
            `<li>${user.username} (Terminal: ${user.terminal}, Logged in: ${user.started})</li>`
        )
        .join("");
    } catch (error) {
      console.error("Failed to fetch logged-in users:", error);
      const usersList = document.getElementById("users-list");
      usersList.innerHTML = "<li>Error fetching user data.</li>";
    }
  }


  // Fetch and populate processes
  async function fetchProcesses(sortBy = "pid") {
    try {
      const response = await fetch(`/api/processes?sort_by=${sortBy}`);
      const processes = await response.json();
      const processesTable = document
        .getElementById("processes-table")
        .querySelector("tbody");

      processesTable.innerHTML = processes
        .map(
          (process) => `
            <tr>
                <td>${process.pid}</td>
                <td>${process.name}</td>
                <td>${process.cpu}%</td>
                <td>${process.memory} MB</td>
            </tr>
        `
        )
        .join("");
    } catch (error) {
      console.error("Failed to fetch processes:", error);
    }
  }

  // Fetch and populate system logs
  async function fetchSystemLogs() {
    try {
      const response = await fetch("/api/system_logs");
      const logs = await response.json();
      const logList = document.getElementById("log-list");

      logList.innerHTML = logs.map((log) => `<li>${log}</li>`).join("");
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
    }
  }

  function formatTerminal(terminal) {
    if (terminal.startsWith(":")) {
      return `Graphical Session ${terminal}`;
    } else if (terminal.startsWith("tty")) {
      return `Physical Terminal ${terminal}`;
    } else if (terminal.startsWith("pts")) {
      return `Remote Terminal ${terminal}`;
    } else {
      return terminal; // Default case
    }
  }
  
  async function fetchLastLoggedUsers() {
    try {
      const response = await fetch("/api/last_logged_users");
      const users = await response.json();
  
      const lastUsersList = document.getElementById("last-users-list");
  
      if (users.length > 0) {
        lastUsersList.innerHTML = users
          .map(
            (user) =>
              `<li>${user.username} (Terminal: ${formatTerminal(user.terminal)}, IP: ${user.ip}, Logged in: ${user.login_time})</li>`
          )
          .join("");
      } else {
        lastUsersList.innerHTML = "<li>No recent logins found.</li>";
      }
    } catch (error) {
      console.error("Failed to fetch last logged-in users:", error);
      const lastUsersList = document.getElementById("last-users-list");
      lastUsersList.innerHTML = "<li>Error fetching user data.</li>";
    }
  }
  
  // Fetch initial uptime and start local counter
  async function initializeUptime() {
    try {
      const response = await fetch("/api/system_uptime");
      const data = await response.json();
      const [hours, minutes, seconds] = data.uptime.split(":").map(Number);
      initialUptime = hours * 3600 + minutes * 60 + seconds;

      updateUptimeDisplay();
      setInterval(updateUptimeCounter, 1000); // Increment uptime locally every second
    } catch (error) {
      console.error("Failed to fetch system uptime:", error);
    }
  }

  function updateUptimeDisplay() {
    const uptimeDisplay = document.getElementById("uptime-content");
    const hours = Math.floor(initialUptime / 3600);
    const minutes = Math.floor((initialUptime % 3600) / 60);
    const seconds = initialUptime % 60;

    uptimeDisplay.innerText = `System Uptime: ${hours}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function updateUptimeCounter() {
    initialUptime += 1; // Increment uptime locally
    updateUptimeDisplay();
  }

  // Event listeners for sorting processes
  document.getElementById("sort-pid").addEventListener("click", () => fetchProcesses("pid"));
  document.getElementById("sort-cpu").addEventListener("click", () => fetchProcesses("cpu"));
  document.getElementById("sort-memory").addEventListener("click", () => fetchProcesses("memory"));
  document.getElementById("sort-name").addEventListener("click", () => fetchProcesses("name"));

  // Logout button functionality
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("authenticated");
    window.location.href = "login.html";
  });

  // Fetch all data initially
  fetchStats();
  fetchLoggedUsers();
  fetchProcesses();
  fetchSystemLogs();
  initializeUptime();
  fetchLastLoggedUsers();
  // Set periodic updates for non-uptime data
  setInterval(fetchLoggedUsers, 30000); // Update every 30 seconds
  setInterval(fetchStats, 30000); // Update stats every 30 seconds
  setInterval(fetchSystemLogs, 30000); // Update logs every 30 seconds
  setInterval(fetchLastLoggedUsers, 30000); // Update every 30 seconds

});
