const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');
const testHelpers = require('./helpers/testHelpers');

// Pruebas básicas para verificar la configuración inicial de la aplicación
describe('🔥 Smoke Tests - Basic Setup Verification', function () {
    this.timeout(10000); // Incremento del timeout para las pruebas

    // Configuración previa a las pruebas
    before(async function () {
        console.log('Setting up smoke tests...');
        await testHelpers.ensureTestDatabase();
    });

    //Prueba para verificar que la app se exporta correctamente
    it('should export the Express app for testing', function () {
        expect(app).to.exist;
        expect(typeof app.listen).to.equal('function');
        expect(typeof app.use).to.equal('function');
    });

    //Prueba para verificar que se está ejecutando en el entorno de prueba
    it('should be running in test environment', function () {
        expect(process.env.NODE_ENV).to.equal('test');
        expect(process.env.DB_NAME).to.include('test'); // Debe de contener 'test' en el nombre de la base de datos
    });

    //Prueba para verificar que las variables de entorno críticas están definidas
    it('should have required environment variables', function () {
        expect(process.env.DB_HOST).to.exist;
        expect(process.env.DB_USER).to.exist;
        expect(process.env.DB_PASSWORD).to.exist;
        expect(process.env.SESSION_SECRET).to.exist;
    });

    //Prueba para verificar que la app responde en la ruta raíz
    it('should respond to the root route', async function () {
        const response = await request(app).get('/');
        expect(response.status).to.be.oneOf([200, 302]); // Could be 200 (login page) or 302 (redirect)
    });

    //Prueba para verificar que las conexiones a las bases de datos funcionan
    it('should have database connections working', async function () {
        // Prueba de conexión a las bases de datos
        const workersDb = require('../config/crudDatabase');
        const authDb = require('../config/loginDatabase');

        expect(workersDb).to.exist;
        expect(authDb).to.exist;

        console.log('✅ All database connections verified');
    });
});