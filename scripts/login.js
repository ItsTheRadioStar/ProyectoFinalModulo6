
//Lógica para manejar el formulario de login

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include' // ← Crítico para enviar cookies
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Login successful, redirecting...');
            window.location.href = '/dashboard.html';
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error de inicio de sesión');
    }
});

// Lógica para manejar el formulario de registro

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        // Manejo de la respuesta del servidor; si es exitosa, notificar y cambiar a la vista de login refrescando la página y reseteando el formulario

        if (response.ok) {
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            document.getElementById('registerForm').reset();
            window.location.reload();
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert('Error de registro:', error);
    }
});
document.getElementById('registerPrompt').addEventListener('click', () => {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('error').textContent = '';
});

// Configuración de la vista inicial para mostrar el formulario de login y ocultar el de registro

document.getElementById('loginSection').style.display = 'block';
document.getElementById('registerSection').style.display = 'none';


