// Cambia esta URL si tu API usa otro puerto o ruta
const API_URL = 'http://localhost:3000/api/productos';

const formulario = document.getElementById('formProducto');
const inputNombre = document.getElementById('nombre');
const inputPrecio = document.getElementById('precio');
const inputCategoria = document.getElementById('categoria');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const tituloFormulario = document.getElementById('tituloFormulario');
const panelFormulario = document.getElementById('panelFormulario');
const tabla = document.getElementById('listaProductos');
const buscador = document.getElementById('buscador');
const resumen = document.getElementById('resumen');
const btnCargar = document.getElementById('btnCargar');
const dialogo = document.getElementById('dialogoEliminar');
const textoEliminar = document.getElementById('textoEliminar');
const btnSiEliminar = document.getElementById('btnSiEliminar');
const btnNoEliminar = document.getElementById('btnNoEliminar');
const contenedorAvisos = document.getElementById('avisos');
const lienzo = document.getElementById('miGrafica');
const selectorTipo = document.getElementById('tipoGrafica');
const mensajeGrafica = document.getElementById('mensajeGrafica');

const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
});

let productos = [];
let idEnEdicion = null;
let productoPorEliminar = null;
let grafica = null;

/* ---------- Avisos ---------- */

function mostrarAviso(mensaje, tipo = 'exito') {
    const aviso = document.createElement('div');
    aviso.className = `aviso ${tipo}`;
    aviso.textContent = mensaje;
    contenedorAvisos.appendChild(aviso);
    setTimeout(() => aviso.remove(), 3500);
}

/* ---------- Comunicación con la API ---------- */

async function pedir(url, opciones) {
    const respuesta = await fetch(url, opciones);
    if (!respuesta.ok) {
        throw new Error(`El servidor respondió con el código ${respuesta.status}`);
    }
    return respuesta.json().catch(() => ({}));
}

async function cargarProductos(idResaltado = null) {
    try {
        productos = await pedir(API_URL);
        dibujarTabla(idResaltado);
        dibujarGrafica();
    } catch (error) {
        console.error(error);
        tabla.innerHTML = '';
        const fila = tabla.insertRow();
        const celda = fila.insertCell();
        celda.colSpan = 5;
        celda.className = 'vacio';
        celda.textContent = 'No se pudo cargar la lista. Revisa que el servidor esté encendido.';
        resumen.textContent = '';
        mostrarAviso('No se pudo conectar con el servidor', 'error');
    }
}

/* ---------- Tabla ---------- */

function crearCelda(fila, texto, clase) {
    const celda = fila.insertCell();
    celda.textContent = texto;
    if (clase) celda.className = clase;
    return celda;
}

function dibujarTabla(idResaltado = null) {
    const termino = buscador.value.trim().toLowerCase();
    const visibles = productos.filter(p =>
        String(p.nombre).toLowerCase().includes(termino) ||
        String(p.categoria).toLowerCase().includes(termino)
    );

    tabla.innerHTML = '';

    if (visibles.length === 0) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();
        celda.colSpan = 5;
        celda.className = 'vacio';
        celda.textContent = productos.length === 0
            ? 'Todavía no hay productos. Agrega el primero con el formulario.'
            : 'Ningún producto coincide con tu búsqueda.';
    }

    visibles.forEach(producto => {
        const fila = tabla.insertRow();
        if (producto.id === idResaltado) fila.classList.add('resaltada');

        crearCelda(fila, producto.id, 'id');
        crearCelda(fila, producto.nombre);
        crearCelda(fila, formatoMoneda.format(Number(producto.precio)), 'precio');

        const celdaCategoria = fila.insertCell();
        const etiqueta = document.createElement('span');
        etiqueta.className = 'categoria';
        etiqueta.textContent = producto.categoria;
        celdaCategoria.appendChild(etiqueta);

        const celdaAcciones = fila.insertCell();
        celdaAcciones.className = 'acciones';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => iniciarEdicion(producto));

        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn-eliminar';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.addEventListener('click', () => pedirConfirmacion(producto));

        celdaAcciones.append(btnEditar, btnEliminar);
    });

    const total = productos.length;
    resumen.textContent = total === 0
        ? ''
        : `${visibles.length} de ${total} ${total === 1 ? 'producto' : 'productos'}`;
}

/* ---------- Agregar y editar ---------- */

function iniciarEdicion(producto) {
    idEnEdicion = producto.id;
    inputNombre.value = producto.nombre;
    inputPrecio.value = producto.precio;
    inputCategoria.value = producto.categoria;

    tituloFormulario.textContent = `Editar producto #${producto.id}`;
    btnGuardar.textContent = 'Guardar cambios';
    btnCancelar.hidden = false;
    panelFormulario.classList.add('editando');

    panelFormulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputNombre.focus();
}

function terminarEdicion() {
    idEnEdicion = null;
    formulario.reset();
    tituloFormulario.textContent = 'Agregar producto';
    btnGuardar.textContent = 'Agregar producto';
    btnCancelar.hidden = true;
    panelFormulario.classList.remove('editando');
}

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const datos = {
        nombre: inputNombre.value.trim(),
        precio: parseFloat(inputPrecio.value),
        categoria: inputCategoria.value.trim()
    };

    if (!datos.nombre || !datos.categoria || Number.isNaN(datos.precio) || datos.precio < 0) {
        mostrarAviso('Completa nombre, precio y categoría con valores válidos', 'error');
        return;
    }

    const editando = idEnEdicion !== null;
    const url = editando ? `${API_URL}/${idEnEdicion}` : API_URL;

    btnGuardar.disabled = true;

    try {
        const resultado = await pedir(url, {
            method: editando ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const idResaltado = editando ? idEnEdicion : (resultado.id ?? null);
        mostrarAviso(editando ? 'Producto actualizado' : 'Producto agregado');
        terminarEdicion();
        await cargarProductos(idResaltado);
    } catch (error) {
        console.error(error);
        mostrarAviso(editando ? 'No se pudo actualizar el producto' : 'No se pudo agregar el producto', 'error');
    } finally {
        btnGuardar.disabled = false;
    }
});

btnCancelar.addEventListener('click', terminarEdicion);

/* ---------- Eliminar ---------- */

function pedirConfirmacion(producto) {
    productoPorEliminar = producto;
    textoEliminar.textContent = `Se eliminará "${producto.nombre}" de la base de datos. Esta acción no se puede deshacer.`;
    dialogo.showModal();
}

btnNoEliminar.addEventListener('click', () => {
    productoPorEliminar = null;
    dialogo.close();
});

btnSiEliminar.addEventListener('click', async () => {
    if (!productoPorEliminar) return;
    const { id, nombre } = productoPorEliminar;

    btnSiEliminar.disabled = true;

    try {
        await pedir(`${API_URL}/${id}`, { method: 'DELETE' });
        mostrarAviso(`"${nombre}" eliminado`);
        if (idEnEdicion === id) terminarEdicion();
        await cargarProductos();
    } catch (error) {
        console.error(error);
        mostrarAviso('No se pudo eliminar el producto', 'error');
    } finally {
        btnSiEliminar.disabled = false;
        productoPorEliminar = null;
        dialogo.close();
    }
});


/* ---------- Gráfica (Chart.js) ---------- */

function generarColores(cantidad) {
    // Tonos entre frambuesa y ciruela, repartidos según cuántos productos hay
    return Array.from({ length: cantidad }, (_, i) => {
        const tono = 330 - (i * 70) / Math.max(cantidad - 1, 1);
        return `hsl(${tono}, 55%, ${48 + (i % 3) * 6}%)`;
    });
}

function dibujarGrafica() {
    if (typeof Chart === 'undefined') {
        mensajeGrafica.textContent = 'No se pudo cargar Chart.js. Revisa tu conexión a internet.';
        return;
    }

    if (grafica) grafica.destroy();

    if (productos.length === 0) {
        mensajeGrafica.textContent = 'Agrega productos para ver la gráfica.';
        return;
    }
    mensajeGrafica.textContent = '';

    // Arreglos separados: etiquetas (nombres) y valores (precios)
    const nombres = productos.map(p => p.nombre);
    const precios = productos.map(p => Number(p.precio));
    const tipo = selectorTipo.value;
    const colores = generarColores(productos.length);

    grafica = new Chart(lienzo, {
        type: tipo,
        data: {
            labels: nombres,
            datasets: [{
                label: 'Precio (MXN)',
                data: precios,
                backgroundColor: tipo === 'pie' ? colores : '#b8326f',
                borderColor: '#ffffff',
                borderWidth: tipo === 'pie' ? 2 : 0,
                borderRadius: tipo === 'bar' ? 6 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: tipo === 'pie', position: 'right' },
                tooltip: {
                    callbacks: {
                        label: (contexto) => ` ${formatoMoneda.format(contexto.parsed.y ?? contexto.parsed)}`
                    }
                }
            },
            scales: tipo === 'bar' ? {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (valor) => formatoMoneda.format(valor) }
                }
            } : {}
        }
    });
}

selectorTipo.addEventListener('change', dibujarGrafica);

/* ---------- Otros eventos ---------- */

buscador.addEventListener('input', () => dibujarTabla());
btnCargar.addEventListener('click', () => cargarProductos());

cargarProductos();