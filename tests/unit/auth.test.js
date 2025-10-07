const { expect } = require('chai');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../../app');

// Pruebas unitarias para la lógica de autenticación y seguridad
describe('🔐 Authentication Unit Tests', function () {

    // Pruebas para la seguridad de las contraseñas y la lógica de validación de entradas
    describe('Password Security', function () {
        it('should hash passwords with bcrypt', async function () {
            const password = 'MySecurePassword123!';
            const hashedPassword = await bcrypt.hash(password, 12);

            expect(hashedPassword).to.be.a('string');
            expect(hashedPassword).to.not.equal(password);
            expect(hashedPassword.length).to.be.greaterThan(50); // Los hashes bcrypt suelen ser largos

            // Verificar que el hash coincide con la contraseña original
            const isMatch = await bcrypt.compare(password, hashedPassword);
            expect(isMatch).to.be.true;

            // Verificar que una contraseña incorrecta no coincide
            const isWrongMatch = await bcrypt.compare('WrongPassword', hashedPassword);
            expect(isWrongMatch).to.be.false;
        });

        it('should use sufficient salt rounds', async function () {
            const password = 'testpassword';
            const startTime = Date.now();
            const hashedPassword = await bcrypt.hash(password, 12); // Mismas rondas de salt que en la app

            expect(hashedPassword).to.exist;

            // Si el hashing es demasiado rápido, las rondas de salt pueden ser insuficientes
            const hashTime = Date.now() - startTime;
            expect(hashTime).to.be.greaterThan(10); //Debe tomar un mínimo de 10ms
        });
    });

    describe('Input Validation Logic', function () {
        it('should validate required fields are present', function () {
            // Casos de prueba con diferentes combinaciones de campos faltantes
            const invalidInputs = [
                { username: '', email: 'test@test.com', password: '123' },
                { username: 'testuser', email: '', password: '123' },
                { username: 'testuser', email: 'test@test.com', password: '' },
                { username: null, email: 'test@test.com', password: '123' },
                { username: 'testuser', email: null, password: '123' },
                { username: undefined, email: 'test@test.com', password: '123' }
            ];

            invalidInputs.forEach(input => {
                // Checar que todos los campos requeridos están presentes y no están vacíos
                const hasUsername = !!input.username; // Se convierte a booleano
                const hasEmail = !!input.email;
                const hasPassword = !!input.password;
                const isValid = hasUsername && hasEmail && hasPassword;

                expect(isValid, `Input should be invalid: ${JSON.stringify(input)}`).to.be.false;
            });

            // Caso de prueba que debería ser válido
            const validInput = { username: 'testuser', email: 'test@test.com', password: 'securepassword' };
            const hasUsername = !!validInput.username;
            const hasEmail = !!validInput.email;
            const hasPassword = !!validInput.password;
            const isValid = hasUsername && hasEmail && hasPassword;

            expect(isValid).to.be.true;
        });

        // Prueba para validar el formato del email
        it('should validate email format', function () {
            const invalidEmails = [
                'notanemail',
                'missing@domain',
                '@missinglocal.com',
                'spaces in@email.com'
            ];

            const validEmails = [
                'test@example.com',
                'user.name@domain.co',
                'user+tag@domain.org'
            ];

            invalidEmails.forEach(email => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                expect(emailRegex.test(email), `Email should be invalid: ${email}`).to.be.false;
            });

            validEmails.forEach(email => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                expect(emailRegex.test(email), `Email should be valid: ${email}`).to.be.true;
            });
        });
    });
});