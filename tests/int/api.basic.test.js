const { expect } = require('chai');
const request = require('supertest');
const app = require('../../app');
const testHelpers = require('../helpers/testHelpers');

// Pruebas de integración para los endpoints básicos de la API
describe('🌐 Basic API Integration Tests', function () {
    this.timeout(15000);
    let authCookie;

    before(async function () {
        console.log('Setting up basic API tests...');
        await testHelpers.cleanTestData();

        // Crear un usuario de prueba y obtener la cookie de autenticación
        const userResult = await testHelpers.createTestUser();
        console.log('Test user created:', userResult.username);

        try {
            // Iniciar sesión y obtener la cookie
            authCookie = await testHelpers.loginAndGetCookie(userResult.username, 'testpassword123');
            console.log('Auth cookie obtained:', authCookie);
            expect(authCookie).to.exist;
        } catch (error) {
            console.error('Failed to get auth cookie:', error.message);
            throw error;
        }
    });

    after(async function () {
        await testHelpers.cleanTestData();
    });

    // Pruebas de endpoints de autenticación
    describe('Authentication Endpoints', function () {

        // Datos de usuario de prueba generados dinámicamente
        before(function () {
            this.testUser = {
                username: `testuser_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                password: 'password123'
            };
        });

        // Prueba de registro de usuario
        it('should register a new user successfully', async function () {
            const res = await request(app)
                .post('/auth/register')
                .send(this.testUser)
                .expect(201); // 201 Created

            expect(res.body).to.have.property('message', 'Usuario registrado con éxito');
        });

        // Prueba de registro con nombre de usuario duplicado
        it('should reject duplicate username registration', async function () {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: this.testUser.username, // Se repite el nombre de usuario para el resto de las pruebas
                    email: 'different@example.com',
                    password: 'testpassword123'
                })
                .expect(400); // 400 Bad Request

            expect(res.body).to.have.property('error', 'El usuario ya existe');
        });

        // Pruebas de inicio de sesión con el usuario recién registrado
        it('should login with valid credentials', async function () {
            const res = await request(app)
                .post('/auth/login')
                .send(this.testUser)
                .expect(200);

            expect(res.body).to.have.property('message', 'Login successful');
            expect(res.body).to.have.property('user');
            expect(res.body.user).to.have.property('username', this.testUser.username);
            expect(res.body.user).to.have.property('id');
        });

        // Prueba de inicio de sesión con credenciales inválidas
        it('should reject login with invalid credentials', async function () {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: this.testUser.username,
                    password: 'wrongpassword'
                })
                .expect(401); // 401 Unauthorized

            expect(res.body).to.have.property('error', 'Credenciales no válidas');
        });
    });

    // Pruebas de gestión de sesiones y protección de rutas
    describe('Session Management', function () {
        it('should check authentication status', async function () {
            const res = await request(app)
                .get('/auth/check')
                .set('Cookie', authCookie)
                .expect(200);

            expect(res.body).to.have.property('authenticated', true);
            expect(res.body.user).to.have.property('username');
        });

        // Prueba de cierre de sesión
        it('should logout successfully', async function () {
            const res = await request(app)
                .post('/auth/logout')
                .set('Cookie', authCookie)
                .expect(200);

            expect(res.body).to.have.property('message', 'Logout successful');
        });
    });

    // Pruebas de protección de rutas
    describe('Route Protection', function () {
        it('should protect API routes from unauthenticated access', async function () {
            const res = await request(app)
                .get('/api/workers')
                .expect(302); // 302 Redirigir al login

            expect(res.header.location).to.equal('/login.html');
        });

        // Prueba de acceso a rutas protegidas con autenticación
        it('should allow access to public routes', async function () {
            await request(app)
                .get('/')
                .expect(200); // La página de inicio debería ser accesible
        });
    });
});