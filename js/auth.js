document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // --- SIGNUP LOGIC ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const fullname = document.getElementById('fullname').value;
            const btn = document.getElementById('signup-btn');

            btn.innerText = "Creating Account...";
            btn.disabled = true;

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullname,
                        role: 'user' // Default role
                    }
                }
            });

            if (error) {
                alert("Signup Error: " + error.message);
                btn.innerText = "Create Account";
                btn.disabled = false;
            } else {
                alert("Registration successful! Please check your email for verification.");
                window.location.href = '/login.html';
            }
        });
    }

    // --- LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');

            btn.innerText = "Logging in...";
            btn.disabled = true;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                alert("Login Error: " + error.message);
                btn.innerText = "Login";
                btn.disabled = false;
            } else {
                window.location.href = '/dashboard.html';
            }
        });
    }

    // --- LOGOUT BUTTON TRIGGER ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = logoutUser;
    }
});
