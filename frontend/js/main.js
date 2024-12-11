document.addEventListener('DOMContentLoaded', async () => {
    const dashboardContainer = document.getElementById('dashboard-container');
    const logoutButton = document.getElementById('logout-button');

    // Fetch mock data
    try {
        const response = await fetch('js/mock_data.json');
        const data = await response.json();
        console.log('Mock data loaded:', data);

        // Render the mock data
        const htmlContent = `
            <div class="data-box">
                <h2>System Information</h2>
                <p><strong>CPU Usage:</strong> ${data.cpu}%</p>
                <p><strong>Memory Usage:</strong> 
                    ${((data.memory.used / data.memory.total) * 100).toFixed(2)}% 
                    (${data.memory.used} GB / ${data.memory.total} GB)
                </p>
                <p><strong>Disk Usage:</strong> 
                ${data.disk.percent}% 
                (${data.disk.used} GB / ${data.disk.total} GB)
                </p>
            </div>
        `;

        dashboardContainer.innerHTML = htmlContent;
    } catch (error) {
        console.error('Error loading mock data:', error);
        dashboardContainer.innerHTML = `<p class="error">Failed to load data. Please try again later.</p>`;
    }

    // Logout button functionality
    logoutButton.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
});
