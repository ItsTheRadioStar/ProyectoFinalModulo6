const mysql = require('mysql2/promise');
const request = require('supertest');
const app = require('../../app');

const testHelpers = {
    // Confirmación de conexión a la base de datos de prueba
    async ensureTestDatabase() {
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });
            await connection.end();
            console.log('✅ Test database connection successful');
            return true;
        } catch (error) {
            console.error('❌ Test database connection failed:', error.message);
            throw error;
        }
    },

    // Limpieza de datos de prueba
    async cleanTestData() {
        try {
            const workersDb = require('../../config/crudDatabase');
            const authDb = require('../../config/loginDatabase');

            // Limpiar datos de prueba en la tabla workers
            await workersDb.promise().execute("DELETE FROM workers WHERE name LIKE 'Test%' OR email LIKE 'test%@example.com'");

            // Limpiar datos de prueba en la tabla users
            await authDb.execute("DELETE FROM users WHERE username LIKE 'testuser%' OR email LIKE 'test%@example.com'");

            console.log('✅ Test data cleaned');
        } catch (error) {
            console.log('Note: Could not clean test data (tables might not exist yet):', error.message);
        }
    },

    // Crear un usuario de prueba y devolver sus credenciales
    async createTestUser() {
        const username = `testuser_${Date.now()}`;
        const email = `test_${Date.now()}@example.com`;

        console.log('Creating test user:', { username, email });

        const res = await request(app)
            .post('/auth/register')
            .send({
                username: username,
                email: email,
                password: 'testpassword123'
            });

        console.log('Registration response status:', res.status);
        console.log('Registration response body:', res.body);

        if (res.status !== 201) {
            throw new Error(`Registration failed: ${res.body.error}`);
        }

        return { username, email, response: res };
    },

    // Iniciar sesión y devolver la cookie de sesión
    async loginAndGetCookie(username = 'testuser', password = 'testpassword123') {
        const loginRes = await request(app)
            .post('/auth/login')
            .send({ username, password });

        console.log('Login response status:', loginRes.status);
        console.log('Login response headers:', loginRes.headers);
        console.log('Login response body:', loginRes.body);

        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${loginRes.body.error}`);
        }

        const cookies = loginRes.headers['set-cookie'];
        console.log('Auth cookies received:', cookies);

        if (!cookies || cookies.length === 0) {
            throw new Error('No session cookie received from login');
        }

        return cookies;
    },

    // Crear un trabajador de prueba usando la cookie de autenticación
    async createTestWorker(authCookie, workerData = {}) {
        const defaultData = {
            name: `Test Worker ${Date.now()}`,
            email: `worker_${Date.now()}@example.com`,
            job: 'Software Tester',
            address: '123 Test Street',
            phone_number: '555-0123'
        };

        const workerRes = await request(app)
            .post('/api/workers')
            .set('Cookie', authCookie)
            .send({ ...defaultData, ...workerData });

        return workerRes;
    }
};

module.exports = testHelpers;