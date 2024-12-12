document.addEventListener("DOMContentLoaded", async () => {
  let mockData;

  // Fetch mock data from mock_data.json (for static placeholders)
  try {
    const response = await fetch("js/mock_data.json");
    mockData = await response.json();
  } catch (error) {
    console.error("Failed to load mock data:", error);
    return;
  }

  const mockLoggedInUsers = mockData.loggedInUsers;
  const mockProcesses = mockData.processes;
  const stats = mockData.stats;
  const systemLogs = mockData.systemLog; // Correct key for logs
  const lastUsersLogged = mockData.lastUsersLogged;

  // Populate stats
  const statsContent = document.getElementById("stats-content");
  statsContent.innerHTML = `
      <div><strong>CPU Usage:</strong> ${stats.cpu}%</div>
      <div><strong>Memory Usage:</strong> ${stats.memory.used} / ${stats.memory.total}</div>
      <div><strong>Disk Usage:</strong> ${stats.disk.used} / ${stats.disk.total}</div>
      <div><strong>Load Average:</strong> ${stats.loadAverage.join(", ")}</div>
  `;

  // Populate logged-in users
  const usersList = document.getElementById("users-list");
  usersList.innerHTML = mockLoggedInUsers
    .map((user) => `<li>${user}</li>`)
    .join("");

  // Populate processes table
  const processesTable = document.getElementById("processes-table").querySelector("tbody");
  const processSummary = document.getElementById("process-summary");

  function renderProcesses(processes) {
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

    // Update process summary
    const totalProcesses = processes.length;
    const totalCPU = processes.reduce((acc, proc) => acc + proc.cpu, 0);
    const totalMemory = processes.reduce((acc, proc) => acc + proc.memory, 0);
    processSummary.innerText = `Total Processes: ${totalProcesses}, Total CPU: ${totalCPU}%, Total Memory: ${totalMemory} MB`;
  }

  // Initial render
  renderProcesses(mockProcesses);

  // Sorting functionality
  document.getElementById("sort-pid").addEventListener("click", () => {
    mockProcesses.sort((a, b) => a.pid - b.pid);
    renderProcesses(mockProcesses);
  });

  document.getElementById("sort-cpu").addEventListener("click", () => {
    mockProcesses.sort((a, b) => b.cpu - a.cpu);
    renderProcesses(mockProcesses);
  });

  document.getElementById("sort-memory").addEventListener("click", () => {
    mockProcesses.sort((a, b) => b.memory - a.memory);
    renderProcesses(mockProcesses);
  });

  document.getElementById("sort-name").addEventListener("click", () => {
    mockProcesses.sort((a, b) => a.name.localeCompare(b.name));
    renderProcesses(mockProcesses);
  });

  // Add functionality for the logout button
  document.getElementById("logout-button").addEventListener("click", function () {
    console.log("Logout button clicked!");
    window.location.href = "login.html"; // Redirect to login page
  });

  // Populate system logs
  const logList = document.getElementById("log-list");

  function renderLogs(logs) {
    logList.innerHTML = logs
      .map((log) => `<li>${log}</li>`)
      .join("");
  }

  // Pagination logic for logs
  let currentLogStartIndex = 0;
  const logsPerPage = 5;

  function updateLogDisplay() {
    const visibleLogs = systemLogs.slice(currentLogStartIndex, currentLogStartIndex + logsPerPage);
    renderLogs(visibleLogs);
  }

  // Add navigation button functionality
  document.getElementById("prev-logs").addEventListener("click", () => {
    if (currentLogStartIndex > 0) {
      currentLogStartIndex -= logsPerPage;
      updateLogDisplay();
    }
  });

  document.getElementById("next-logs").addEventListener("click", () => {
    if (currentLogStartIndex + logsPerPage < systemLogs.length) {
      currentLogStartIndex += logsPerPage;
      updateLogDisplay();
    }
  });

  // Populate last users logged
  const lastUsersList = document.getElementById("last-users-list");
  let currentUsersStartIndex = 0;
  const usersPerPage = 5;

  function renderLastUsers(users) {
    lastUsersList.innerHTML = users.map(user => `<li>${user}</li>`).join("");
  }

  function updateUsersDisplay() {
    const visibleUsers = lastUsersLogged.slice(currentUsersStartIndex, currentUsersStartIndex + usersPerPage);
    renderLastUsers(visibleUsers);
  }

  document.getElementById("prev-users").addEventListener("click", () => {
    if (currentUsersStartIndex > 0) {
      currentUsersStartIndex -= usersPerPage;
      updateUsersDisplay();
    }
  });

  document.getElementById("next-users").addEventListener("click", () => {
    if (currentUsersStartIndex + usersPerPage < lastUsersLogged.length) {
      currentUsersStartIndex += usersPerPage;
      updateUsersDisplay();
    }
  });

  // Fetch and update uptime dynamically
  async function fetchUptime() {
    try {
      const response = await fetch("/api/uptime");
      const data = await response.json();
      const uptimeDisplay = document.getElementById("uptime-content");
      uptimeDisplay.innerText = `System Uptime: ${data.uptime}`;
    } catch (error) {
      console.error("Failed to fetch uptime:", error);
    }
  }

  // Update uptime periodically every 30 seconds
  setInterval(fetchUptime, 30000);

  // Initial render
  updateLogDisplay();
  updateUsersDisplay();
  fetchUptime();
});
