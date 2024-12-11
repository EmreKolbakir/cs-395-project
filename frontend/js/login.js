// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');

    loginButton.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'admin' && password === 'password') {
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid username or password');
        }
    });
});
