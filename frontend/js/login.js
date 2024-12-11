document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
  
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;
  
    // Mock credentials for authentication
    const mockUsername = "admin";
    const mockPassword = "password123";
  
    if (usernameInput === mockUsername && passwordInput === mockPassword) {
      // Store authentication status in localStorage
      localStorage.setItem("authenticated", "true");
      // Redirect to the dashboard
      window.location.href = "dashboard.html";
    } else {
      // Display error message
      const errorDiv = document.getElementById("error-message");
      errorDiv.innerText = "Invalid username or password. Please try again.";
      errorDiv.style.display = "block";
    }
  });
  