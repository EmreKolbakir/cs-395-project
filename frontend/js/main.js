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

  function formatCPU(cpuValue) {
    const val = parseFloat(cpuValue);
    if (val < 0.1 && val > 0) {
      return `%${val.toFixed(4)}`;
    }
    return `%${val.toFixed(2)}`;
  }

  function formatMemoryMB(mbValue) {
    let bytes = mbValue * 1024 * 1024;
    return formatBytes(bytes);
  }

  async function fetchStats() {
    try {
      const response = await fetch("/api/system_stats");
      const stats = await response.json();

      // Update inline stat elements at the top
      document.getElementById("cpu-value").innerText = formatPercentage(stats.cpu_percent);
      document.getElementById("memory-value").innerText = 
        `${formatBytes(stats.memory_info.used)} / ${formatBytes(stats.memory_info.total)}`;
      document.getElementById("disk-value").innerText = 
        `${formatBytes(stats.disk_usage.used)} / ${formatBytes(stats.disk_usage.total)}`;
      document.getElementById("load-value").innerText = 
        `${formatLoadAverage(stats.load_avg)} (Cores: ${stats.cpu_cores})`;
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
      document.getElementById("cpu-value").innerText = "Error";
      document.getElementById("memory-value").innerText = "Error";
      document.getElementById("disk-value").innerText = "Error";
      document.getElementById("load-value").innerText = "Error";
    }
  }

  // Current Users Pagination
  let currentUsers = [];
  let currentUsersPage = 1;
  const usersPerPageCurrent = 2;
  let currentUsersTotalPages = 1;

  async function fetchLoggedUsers() {
    const response = await fetch("/api/current_logged_users");
    const users = await response.json();
    
    currentUsers = users;
    currentUsersTotalPages = Math.ceil(currentUsers.length / usersPerPageCurrent);
    
    // Dynamically create bubbles for current users
    createCurrentUsersBubbles(currentUsersTotalPages);
    
    // Render the first page (or the current page if it was set before)
    renderCurrentUsersPage(currentUsersPage);
  }

  function createCurrentUsersBubbles(totalPages) {
    const container = document.getElementById("current-users-page-indicators");
    container.innerHTML = ""; // Clear old bubbles
  
    for (let i = 1; i <= totalPages; i++) {
      const bubble = document.createElement('span');
      bubble.classList.add('page-bubble-current');
      bubble.setAttribute('data-page', i);
      container.appendChild(bubble);
    }
  }

  function renderCurrentUsersPage(page) {
    const startIndex = (page - 1) * usersPerPageCurrent;
    const endIndex = page * usersPerPageCurrent;
    const usersToShow = currentUsers.slice(startIndex, endIndex);
  
    const usersList = document.getElementById("users-list");
    if (usersToShow.length > 0) {
      usersList.innerHTML = usersToShow.map(user => `
        <li class="user-box">
          <div class="user-name">${user.username}</div>
          <div class="user-info">Logged in: ${user.login_time}</div>
        </li>`).join("");
    } else {
      usersList.innerHTML = `<li class="user-box">No users currently logged in.</li>`;
    }
    updateCurrentUsersPageIndicators(page);
  }
  

  function updateCurrentUsersPageIndicators(activePage) {
    const bubbles = document.querySelectorAll(".page-bubble-current");
    bubbles.forEach((bubble) => {
      bubble.classList.remove("active");
      const bubblePage = parseInt(bubble.getAttribute("data-page"), 10);
      if (bubblePage === activePage && activePage <= currentUsersTotalPages) {
        bubble.classList.add("active");
      }
    });
  }

  document.getElementById("prev-current-users").addEventListener("click", () => {
    if (currentUsersPage > 1) {
      currentUsersPage -= 1;
      renderCurrentUsersPage(currentUsersPage);
    }
  });

  document.getElementById("next-current-users").addEventListener("click", () => {
    if (currentUsersPage < currentUsersTotalPages) {
      currentUsersPage += 1;
      renderCurrentUsersPage(currentUsersPage);
    }
  });

  document.getElementById("current-users-page-indicators").addEventListener("click", (e) => {
    if (e.target.classList.contains("page-bubble-current")) {
      const page = parseInt(e.target.getAttribute("data-page"), 10);
      if (page >= 1 && page <= currentUsersTotalPages) {
        currentUsersPage = page;
        renderCurrentUsersPage(currentUsersPage);
      }
    }
  });

  // Processes
  let originalProcesses = [];
  let currentProcesses = [];
  let sortStates = { pid: "initial", name: "initial", cpu: "initial", memory: "initial" };
  const processesWrapper = document.getElementById("processes-wrapper");

  function renderProcesses(processes) {
    const processesTable = document.getElementById("processes-table").querySelector("tbody");
    processesTable.innerHTML = processes.map(
      (process) => `
        <tr>
            <td>${process.pid}</td>
            <td>${process.name}</td>
            <td>${formatCPU(process.cpu)}</td>
            <td>${formatMemoryMB(process.memory)}</td>
        </tr>
      `
    ).join("");

    processesWrapper.scrollTop = 0;
  }

  async function fetchProcesses() {
    try {
      const response = await fetch("/api/processes");
      const processes = await response.json();
      originalProcesses = processes;
      currentProcesses = [...originalProcesses];
      renderProcesses(currentProcesses);
    } catch (error) {
      console.error("Failed to fetch processes:", error);
    }
  }

  function handleSort(column) {
    let currentState = sortStates[column];
    let newState;

    if (currentState === "initial") {
      newState = "desc";
    } else if (currentState === "desc") {
      newState = "asc";
    } else {
      newState = "initial";
    }

    for (let col in sortStates) {
      if (col !== column) {
        sortStates[col] = "initial";
      }
    }

    sortStates[column] = newState;

    if (newState === "initial") {
      currentProcesses = [...originalProcesses];
      renderProcesses(currentProcesses);
      return;
    }

    currentProcesses.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (column === "name") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (newState === "desc") {
        if (valA < valB) return 1;
        if (valA > valB) return -1;
        return 0;
      } else {
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      }
    });

    renderProcesses(currentProcesses);
  }

  // System Logs
  async function fetchSystemLogs() {
    try {
      const response = await fetch("/api/system_logs");
      let logs = await response.json();
      const logList = document.getElementById("log-list");

      logList.innerHTML = logs.map((log) => `<li>${log}</li>`).join("");
      logList.scrollTop = 0;
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
    }
  }

  // Last Users Pagination
  let lastUsers = [];
  let currentPage = 1;
  const usersPerPage = 2;
  let totalPages = 1; 

  // Similar logic for last logged users:
  async function fetchLastLoggedUsers() {
    const response = await fetch("/api/last_logged_users");
    const users = await response.json();
    
    lastUsers = users;
    totalPages = Math.ceil(lastUsers.length / usersPerPage);

    // Dynamically create bubbles for last users
    createLastUsersBubbles(totalPages);

    // Render the current page
    renderLastUsersPage(currentPage);
  }

  function createLastUsersBubbles(totalPages) {
    const container = document.getElementById("last-users-page-indicators");
    container.innerHTML = ""; // Clear old bubbles
    
    for (let i = 1; i <= totalPages; i++) {
      const bubble = document.createElement('span');
      bubble.classList.add('page-bubble');
      bubble.setAttribute('data-page', i);
      container.appendChild(bubble);
    }
  }

  function renderLastUsersPage(page) {
    const startIndex = (page - 1) * usersPerPage;
    const endIndex = page * usersPerPage;
    const usersToShow = lastUsers.slice(startIndex, endIndex);

    const lastUsersList = document.getElementById("last-users-list");
    if (usersToShow.length > 0) {
      lastUsersList.innerHTML = usersToShow
        .map((user) => {
          return `
            <li class="user-box">
              <div class="user-name">${user.actual_username}</div>
              <div class="user-info">Logged in: ${user.login_time}, IP: ${user.ip_address}</div>
            </li>
          `;
        })
        .join("");
    } else {
      lastUsersList.innerHTML = `<li class="user-box">No recent logins found.</li>`;
    }

    updatePageIndicators(page);
  }

  function updatePageIndicators(activePage) {
    const bubbles = document.querySelectorAll(".page-bubble");
    bubbles.forEach((bubble) => {
      bubble.classList.remove("active");
      const bubblePage = parseInt(bubble.getAttribute("data-page"), 10);
      if (bubblePage === activePage && activePage <= totalPages) {
        bubble.classList.add("active");
      }
    });
  }

  document.getElementById("prev-users").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderLastUsersPage(currentPage);
    }
  });

  document.getElementById("next-users").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      renderLastUsersPage(currentPage);
    }
  });

  document.getElementById("last-users-page-indicators").addEventListener("click", (e) => {
    if (e.target.classList.contains("page-bubble")) {
      const page = parseInt(e.target.getAttribute("data-page"), 10);
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderLastUsersPage(currentPage);
      }
    }
  });

  async function initializeUptime() {
    try {
      const response = await fetch("/api/system_uptime");
      const data = await response.json();
      const [hours, minutes, seconds] = data.uptime.split(":").map(Number);
      initialUptime = hours * 3600 + minutes * 60 + seconds;

      updateUptimeDisplay();
      setInterval(updateUptimeCounter, 1000);
    } catch (error) {
      console.error("Failed to fetch system uptime:", error);
    }
  }

  function updateUptimeDisplay() {
    const uptimeDisplay = document.getElementById("uptime-value");
    const hours = Math.floor(initialUptime / 3600);
    const minutes = Math.floor((initialUptime % 3600) / 60);
    const seconds = initialUptime % 60;

    uptimeDisplay.innerText = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function updateUptimeCounter() {
    initialUptime += 1;
    updateUptimeDisplay();
  }

  // Sorting event listeners
  document.getElementById("sort-pid").addEventListener("click", () => handleSort("pid"));
  document.getElementById("sort-name").addEventListener("click", () => handleSort("name"));
  document.getElementById("sort-cpu").addEventListener("click", () => handleSort("cpu"));
  document.getElementById("sort-memory").addEventListener("click", () => handleSort("memory"));

  // Logout button functionality
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("authenticated");
    window.location.href = "login.html";
  });

  // Show more/less for logs
  const logList = document.getElementById("log-list");
  const showMoreLogsBtn = document.getElementById("show-more-logs");
  const showLessLogsBtn = document.getElementById("show-less-logs");

  showMoreLogsBtn.addEventListener("click", () => {
    logList.style.maxHeight = "400px";
    showMoreLogsBtn.style.display = "none";
    showLessLogsBtn.style.display = "inline-block";
  });

  showLessLogsBtn.addEventListener("click", () => {
    logList.style.maxHeight = "150px";
    showLessLogsBtn.style.display = "none";
    showMoreLogsBtn.style.display = "inline-block";
    logList.scrollTop = 0; 
  });

  // Show more/less for processes
  const showMoreProcessesBtn = document.getElementById("show-more-processes");
  const showLessProcessesBtn = document.getElementById("show-less-processes");

  showMoreProcessesBtn.addEventListener("click", () => {
    processesWrapper.style.maxHeight = "600px";
    showMoreProcessesBtn.style.display = "none";
    showLessProcessesBtn.style.display = "inline-block";
  });

  showLessProcessesBtn.addEventListener("click", () => {
    processesWrapper.style.maxHeight = "200px";
    showLessProcessesBtn.style.display = "none";
    showMoreProcessesBtn.style.display = "inline-block";
    processesWrapper.scrollTop = 0; 
  });

  // Initial fetch calls
  await fetchStats();
  await fetchLoggedUsers();
  await fetchProcesses();
  await fetchSystemLogs();
  await initializeUptime();
  await fetchLastLoggedUsers();

  // Set periodic updates
  setInterval(fetchLoggedUsers, 30000);
  setInterval(fetchStats, 30000);
  setInterval(fetchSystemLogs, 30000);
  setInterval(fetchLastLoggedUsers, 30000);
});
