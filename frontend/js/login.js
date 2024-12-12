document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  let mockData;

  // Fetch mock data from mock_data.json
  try {
      const response = await fetch("js/mock_data.json");
      mockData = await response.json();
  } catch (error) {
      console.error("Failed to load mock data:", error);
      return;
  }

  const { username, password } = mockData.loginCredentials;

  const usernameInput = document.getElementById("username").value;
  const passwordInput = document.getElementById("password").value;

  if (usernameInput === username && passwordInput === password) {
      localStorage.setItem("authenticated", "true");
      window.location.href = "dashboard.html";
  } else {
      const errorDiv = document.getElementById("error-message");
      errorDiv.innerText = "Invalid username or password. Please try again.";
      errorDiv.style.display = "block";
  }
});
