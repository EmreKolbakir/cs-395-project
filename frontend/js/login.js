document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameInput, password: passwordInput }),
        });

        const data = await response.json();

        if (response.ok) {
            // Login successful
            localStorage.setItem("authenticated", "true");
            window.location.href = "dashboard.html";
        } else {
            // Display error message
            const errorDiv = document.getElementById("error-message");
            errorDiv.innerText = data.message || "Invalid username or password. Please try again.";
            errorDiv.style.display = "block";
        }
    } catch (error) {
        console.error("Error during login:", error);
        const errorDiv = document.getElementById("error-message");
        errorDiv.innerText = "Failed to connect to the server. Please try again later.";
        errorDiv.style.display = "block";
    }
});
