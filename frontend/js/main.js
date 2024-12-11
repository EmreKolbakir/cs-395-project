document.addEventListener("DOMContentLoaded", () => {
    // Mock data for logged-in users and processes
    const mockLoggedInUsers = ["user1", "user2", "admin"];
    const mockProcesses = [
      { pid: 123, name: "Process A", cpu: 5, memory: 100 },
      { pid: 456, name: "Process B", cpu: 15, memory: 50 },
      { pid: 789, name: "Process C", cpu: 25, memory: 30 },
      { pid: 321, name: "Process D", cpu: 10, memory: 150 },
    ];
  
    // Populate stats (already implemented in the last step)
    const statsContainer = document.getElementById("stats-container");
    statsContainer.innerHTML = `
      <div><strong>CPU Usage:</strong> 25%</div>
      <div><strong>Memory Usage:</strong> 45%</div>
      <div><strong>Disk Usage:</strong> 60%</div>
      <div><strong>Load Average:</strong> 0.5, 0.7, 1.2</div>
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
      processSummary.innerText = `Total Processes: ${totalProcesses}, Total CPU: ${totalCPU}%`;
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

    // Add functionality for the logout button
    document.getElementById("logout-button").addEventListener("click", function () {
        // Clear session storage (if any) or redirect to the login page
        console.log("Logout button clicked!");
        window.location.href = "login.html"; // Redirect to login page
    });
  
  });
  