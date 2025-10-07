const express = require('express');
const path = require('path');
const db_con = require('../config/crudDatabase');
const router = express.Router();


//Endpoints para manejar conexiones CRUD a la base de datos 'workers' 

//GET para obtener todos los trabajadores con paginación
router.get('/workers', async (req, res) => {
    // Get page number from query, default to 1
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    try {
        // Conteo para información de paginación
        const [countRows] = await db_con.promise().query('SELECT COUNT(*) as count FROM workers');
        const total = countRows[0].count;
        const totalPages = Math.ceil(total / limit);

        // Obtener resultados paginados
        const selectSQL = `SELECT * FROM workers LIMIT ? OFFSET ?`;
        const [rows] = await db_con.promise().query(selectSQL, [limit, offset]);

        res.json({
            workers: rows,
            page,
            totalPages,
            total
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET para obtener un trabajador por ID
router.get('/workers/:id', async (req, res) => {
    const id = req.params.id;

    // Validación básica del ID
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    try {
        const selectSQL = `SELECT * FROM workers WHERE id = ?`;
        const [rows] = await db_con.promise().query(selectSQL, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Trabajador no encontrado" });
        }

        // Regresar el registro encontrado como JSON
        res.json(rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


//POST
//Comentado el código previo a debugging
/*router.post('/workers', async (req, res) => {
    const { name, email, job, address, phone_number } = req.body;
    try {
        const checkSQL = `SELECT id FROM workers WHERE name = ?`;
        const [rows] = await db_con.promise().query(checkSQL, [name]);
        if (rows.length > 0) {
            return res.status(400).json({ message: "Ya existe un registro con ese nombre. Por favor, intenta con otro." });
        }
        const insertSQL = `INSERT INTO workers (name, email, job, address, phone_number) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db_con.promise().query(insertSQL, [name, email, job, address, phone_number]);
        res.json({ message: "Registro insertado con éxito." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});*/
router.post('/workers', async (req, res) => {
    console.log('POST /api/workers - Request received');
    console.log('Request body:', req.body);
    console.log('Session:', req.session);

    const { name, email, job, address, phone_number } = req.body;
    try {
        console.log('Attempting database insert...');
        const checkSQL = `SELECT id FROM workers WHERE name = ?`;
        const [rows] = await db_con.promise().query(checkSQL, [name]);

        if (rows.length > 0) {
            console.log('Duplicate name found');
            return res.status(400).json({ message: "Ya existe un registro con ese nombre. Por favor, intenta con otro." });
        }

        const insertSQL = `INSERT INTO workers (name, email, job, address, phone_number) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db_con.promise().query(insertSQL, [name, email, job, address, phone_number]);

        console.log('Insert successful, result:', result);
        res.json({ message: "Registro insertado con éxito." });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

//PUT
router.put('/workers/:id', async (req, res) => {
    const id = req.params.id;
    const { name, email, job, address, phone_number } = req.body;
    try {
        const updateSQL = `UPDATE workers SET name = ?, email = ?, job = ?, address = ?, phone_number = ? WHERE id = ?`;
        const [result] = await db_con.promise().query(updateSQL, [name, email, job, address, phone_number, id]);
        res.json({ message: "Registro actualizado con éxito", result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//DELETE
router.delete('/workers/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const deleteSQL = `DELETE FROM workers WHERE id = ?`;
        const [result] = await db_con.promise().query(deleteSQL, [id]);
        res.json({ message: "Registro eliminado con éxito", result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//DELETE MASIVO
router.post('/workers/bulk-delete', async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No hay IDs marcadas para su eliminación." });
    }

    try {
        // Crear una cadena de placeholders para la consulta SQL
        const placeholders = ids.map(() => '?').join(',');
        const deleteSQL = `DELETE FROM workers WHERE id IN (${placeholders})`;

        const [result] = await db_con.promise().query(deleteSQL, ids);
        res.json({ message: `${result.affectedRows} registros eliminados con éxito` });
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;