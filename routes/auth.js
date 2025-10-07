const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/loginDatabase');
const router = express.Router();

// Registro de usuario nuevo
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validación básica
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Revisar si el usuario ya existe
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Hash de la contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Agregar el nuevo usuario a la base de datos
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error('Error de registro:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'El nombre de usuario y contraseña son requeridos' });
        }

        // Encontrar al usuario en la lista users
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales no válidas' });
        }

        const user = users[0];

        // Revisión de la contraseña hasheada
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales no válidas' });
        }

        // Sesión de usuario
        console.log('Setting session for user:', user.id, user.username);
        req.session.userId = user.id;
        req.session.username = user.username;

        // Detalles del log de sesión
        console.log('Session after login:', {
            userId: req.session.userId,
            username: req.session.username,
            sessionId: req.sessionID
        });

        res.json({
            message: 'Login successful',
            user: { id: user.id, username: user.username }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Revisar estado de autenticación
router.get('/check', (req, res) => {
    if (req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;



