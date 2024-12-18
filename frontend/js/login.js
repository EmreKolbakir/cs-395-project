document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usernameInput = document.getElementById("username").value;
  const passwordInput = document.getElementById("password").value;

  // Fetch the OS-level username dynamically
  const osUsername = await fetchOSUsername();

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
        os_username: osUsername, // Send OS-level username
      }),
    });

    if (response.ok) {
      localStorage.setItem("authenticated", "true");
      window.location.href = "/dashboard"; // Redirect on success
    } else {
      const errorDiv = document.getElementById("error-message");
      errorDiv.innerText = "Invalid username or password. Please try again.";
      errorDiv.style.display = "block";
    }
  } catch (error) {
    console.error("Failed to login:", error);
  }
});

// Function to fetch OS-level username
async function fetchOSUsername() {
  try {
    const response = await fetch("/api/os_username");
    const data = await response.json();
    return data.username;
  } catch (error) {
    console.error("Failed to fetch OS username:", error);
    return "unknown";
  }
}
