// Inicialización de variables de entorno desde el archivo .env correspondiente, así como importación de módulos:
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`
});

console.log(`🚀 Server starting in ${process.env.NODE_ENV} mode`)

const express = require('express');
const helmet = require('helmet');
const path = require('path');
const session = require('express-session');

// Importar rutas definidas en otros archivos
const httpRoutes = require('./routes/httpRoutes');
const authRoutes = require('./routes/auth');

// Crear la aplicación Express
const app = express();

// Uso de Helmet.js con configuración personalizada para Content Security Policy (CSP)
// Esto permite el uso de frameworks como Bootstrap y jQuery desde CDNs
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://code.jquery.com",
                "https://cdn.jsdelivr.net",
                "https://stackpath.bootstrapcdn.com"
            ],
            styleSrc: [
                "'self'",
                "https://stackpath.bootstrapcdn.com",
                "https://fonts.googleapis.com",
                "https://maxcdn.bootstrapcdn.com",
                "'unsafe-inline'" // Necesario para estilos en línea en Bootstrap
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://maxcdn.bootstrapcdn.com", // Necesario para Font Awesome
                "data:"
            ],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));


// Middleware para parsear JSON y manejar archivos estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Establecer una ruta estática para servir el archivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

// Servir archivos estáticos desde la carpeta 'views' y la raíz del proyecto
app.use(express.static('views'));
app.use(express.static(__dirname));

// Configuración de la sesión con express-session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // ← Set to false for HTTP (not HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax' // ← Protección CSRF básica
    },
    name: 'app.session',
    proxy: true // ← Permite conexión a través de NGINX
}))

// Middleware para registrar detalles de la sesión en cada solicitud, útil para depuración
app.use((req, res, next) => {
    console.log('Session Info:', {
        path: req.path,
        sessionId: req.sessionID,
        userId: req.session.userId,
        hasSession: !!req.sessionID
    });
    next();
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Middleware para proteger rutas
const requireLogin = (req, res, next) => {
    console.log('Auth check for:', req.path, 'User ID:', req.session.userId);

    if (!req.session.userId) {
        console.log('No user ID in session, redirecting to login');

        // Si es una petición API, responder con JSON en lugar de redirigir
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({
                error: 'Authentication required',
                redirect: '/login.html'
            });
        }

        // Para peticiones normales, redirigir al login
        return res.redirect('/login.html');
    }

    console.log('User authenticated, proceeding...');
    next();
};


// Rutas protegidas para operaciones CRUD
app.use('/api', requireLogin, httpRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});


// Iniciar el servidor solo si no estamos en modo test
if (process.env.NODE_ENV === 'test') {
    module.exports = app;
} else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server listening in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}