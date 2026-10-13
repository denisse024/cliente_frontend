// Pega estas dos rutas en tu archivo del servidor (server.js / index.js),
// debajo de tus rutas GET y POST y ANTES de app.listen(...).
//
// Suponen que:
//  - tu conexión a MySQL se llama "db" (mysql o mysql2 con callbacks)
//  - tu tabla se llama "productos" con columnas: id, nombre, precio, categoria
//  - ya usas app.use(express.json()) y app.use(cors())

// EDITAR un producto
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, precio, categoria } = req.body;

    const sql = 'UPDATE productos SET nombre = ?, precio = ?, categoria = ? WHERE id = ?';

    db.query(sql, [nombre, precio, categoria, id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al actualizar el producto' });
        }
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto actualizado', id: Number(id) });
    });
});

// ELIMINAR un producto
app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM productos WHERE id = ?', [id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al eliminar el producto' });
        }
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto eliminado' });
    });
});