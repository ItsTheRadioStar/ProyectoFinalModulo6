//Función para debugging 
console.log('Dashboard loaded - checking auth status');

// Revisión de autenticación al cargar la página
fetch('/auth/check', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        console.log('Auth check result:', data);
        if (!data.authenticated) {
            alert('Not authenticated - redirecting to login');
            window.location.href = '/login.html';
        }
    })
    .catch(error => {
        console.error('Auth check failed:', error);
    });

// Lógica para manejar la tabla de trabajadores con paginación
let currentPage = 1;
let totalPages = 1;

async function fetchWorkers(page = 1) {
    const response = await fetch(`/api/workers?page=${page}`);
    if (!response.ok) {
        alert('Error al obtener los trabajadores');
        return;
    }
    const data = await response.json();
    if (!data.workers) {
        alert('No se recibieron datos de trabajadores');
        return;
    }
    renderTable(data.workers);
    renderPagination(data.page, data.totalPages);
    currentPage = data.page;
    totalPages = data.totalPages;
}

// Renderizar la tabla de trabajadores con los datos obtenidos de la API
function renderTable(workers) {
    const tbody = document.querySelector('#workersTable tbody');
    tbody.innerHTML = '';
    workers.forEach(worker => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${worker.id}"></td>
            <td>${worker.name}</td>
            <td>${worker.email}</td>
            <td>${worker.job}</td>
            <td>${worker.address}</td>
            <td>${worker.phone_number}</td>
            <td>
                <button class="edit-btn" data-id="${worker.id}">✏️</button>
                <button class="delete-btn" data-id="${worker.id}">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Lógica para manejar el formulario de añadir trabajador con modal
document.getElementById('addWorkerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Obtener datos del formulario y crear objeto
    const newWorker = {
        name: document.getElementById('addName').value,
        email: document.getElementById('addEmail').value,
        job: document.getElementById('addJob').value,
        address: document.getElementById('addAddress').value,
        phone_number: document.getElementById('addPhone').value
    };

    //Llmamado a la API para añadir el trabajador
    try {
        const response = await fetch('/api/workers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newWorker)
        });

        const result = await response.json();

        if (response.ok) {
            $('#addEmployeeModal').modal('hide');
            fetchWorkers(currentPage); // Actualizar la tabla después de añadir
            document.getElementById('addWorkerForm').reset(); //Reiniciar el formulario
        } else {
            alert(`Error al añadir el trabajador: ${result.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al añadir el trabajador');
    }
});

// Lógica para manejar selección de filas
document.getElementById('selectAll').addEventListener('change', function () {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = this.checked;
    });
});

// Lógica para manejar eliminación masiva y simple con modal
let idsToDelete = [];
let singleIdToDelete = null;

// Al hacer clic en el botón de eliminar seleccionados, abrir el modal de confirmación y preparar los IDs
document.getElementById('deleteSelectedBtn').addEventListener('click', function (e) {
    e.preventDefault();

    // Capturar los checkboxes seleccionados en un array
    idsToDelete = Array.from(document.querySelectorAll('.row-checkbox:checked'))
        .map(cb => cb.getAttribute('data-id'));

    singleIdToDelete = null; // Reinicio de variable para eliminación simple

    if (idsToDelete.length === 0) {
        alert('No hay trabajadores seleccionados para eliminar.');
        return;
    }

    // Mostrar el número de registros a eliminar en el modal
    const modalBody = document.querySelector('#deleteEmployeeModal .modal-body');
    modalBody.innerHTML = `
        <p>¿Estás seguro de que deseas borrar ${idsToDelete.length} registro(s)?</p>
        <p class="text-warning"><small>Esta acción no se puede deshacer.</small></p>
    `;

    // Mostrar el modal
    $('#deleteEmployeeModal').modal('show');
});

// Variable para almacenar el ID del trabajador que se está editando y prevenir la edición de múltiples registros a la vez
let currentEditId = null;

// Lógica para manejar botones de edición y eliminación
document.querySelector('#workersTable tbody').addEventListener('click', async function (e) {
    if (e.target.classList.contains('edit-btn')) {
        const id = e.target.getAttribute('data-id');
        currentEditId = id; // Almacenar el ID del trabajador que se está editando

        // Actualizar el título del modal con el nombre del trabajador
        const workerName = e.target.closest('tr').querySelector('td:nth-child(2)').textContent;
        document.querySelector('#editEmployeeModal .modal-title').textContent =
            `Editar Trabajador: ${workerName}`;

        // Llamado a la API para obtener los datos del trabajador y rellenar el formulario
        try {
            const response = await fetch(`/api/workers/${id}`);

            // Verificar que la respuesta sea JSON válida
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but got:', text.substring(0, 100));
                alert('Error: El servidor no devolvió datos JSON válidos');
                return;
            }

            const worker = await response.json();

            // Rellenar el formulario del modal con los datos del trabajador
            document.getElementById('editName').value = worker.name || '';
            document.getElementById('editEmail').value = worker.email || '';
            document.getElementById('editJob').value = worker.job || '';
            document.getElementById('editAddress').value = worker.address || '';
            document.getElementById('editPhone').value = worker.phone_number || '';

            $('#editEmployeeModal').modal('show');
        } catch (error) {
            console.error('Error loading worker data:', error);
            alert('Error al cargar los datos del trabajador');
        }
    }
    // Actualización de variables para eliminación simple
    if (e.target.classList.contains('delete-btn')) {
        singleIdToDelete = e.target.getAttribute('data-id');
        idsToDelete = []; //Reinicio de array para eliminación masiva

        // Actualización del mensaje en el modal para eliminación simple
        const modalBody = document.querySelector('#deleteEmployeeModal .modal-body');
        modalBody.innerHTML = `
        <p>¿Estás seguro de que deseas borrar este registro?</p>
        <p class="text-warning"><small>Esta acción no se puede deshacer.</small></p>
    `;

        $('#deleteEmployeeModal').modal('show');
    }
});

// Cuando el usuario confirma la eliminación en el modal
document.getElementById('confirmDeleteBtn').addEventListener('click', async function (e) {
    e.preventDefault();

    try {
        if (singleIdToDelete) {
            // Llamado a la API para eliminar un solo registro
            const response = await fetch(`/api/workers/${singleIdToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                $('#deleteEmployeeModal').modal('hide');
                fetchWorkers(currentPage); // Actualizar la tabla después de la eliminación
            } else {
                const error = await response.json();
                alert(`Error al eliminar: ${error.message || error.error}`);
            }
            singleIdToDelete = null;

        } else if (idsToDelete.length > 0) {
            // Llamado a la API para eliminar múltiples registros
            const response = await fetch('/api/workers/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: idsToDelete })
            });

            if (response.ok) {
                $('#deleteEmployeeModal').modal('hide');
                fetchWorkers(currentPage); // Actualizar la tabla después de la eliminación
            } else {
                const error = await response.json();
                alert(`Error al eliminar: ${error.message || error.error}`);
            }
            idsToDelete = [];
        }
    } catch (error) {
        console.error('Error de eliminación:', error);
        alert('Error de conexión al eliminar');
    }
});

// Manejo del formulario de edición (añadir solamente una vez el listener)
document.getElementById('editWorkerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Se verifica que haya un ID válido para editar, usando la variable global en lugar de obtenerlo del botón
    if (!currentEditId) {
        alert('No se pudo encontrar el ID del trabajador a editar');
        return;
    }

    // Obtener datos del formulario y crear objeto
    const updatedWorker = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        job: document.getElementById('editJob').value,
        address: document.getElementById('editAddress').value,
        phone_number: document.getElementById('editPhone').value
    };

    // Llamado a la API para actualizar el trabajador
    try {
        const response = await fetch(`/api/workers/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedWorker)
        });

        // Manejo de errores para parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();

            if (response.ok) {
                $('#editEmployeeModal').modal('hide');
                fetchWorkers(currentPage);
                currentEditId = null; // Resetear el ID después de la edición
            } else {
                alert(`Error al actualizar: ${result.message || result.error}`);
            }
        } else {
            // Manejo del caso donde la respuesta no es JSON
            const text = await response.text();
            console.error('Expected JSON but got:', text);
            alert('Error: El servidor no devolvió una respuesta JSON válida');
        }
    } catch (error) {
        console.error('Error updating worker:', error);
        alert('Error de conexión al actualizar el trabajador');
    }
});

// Resetear currentEditId cuando se cierra el modal de edición
$('#editEmployeeModal').on('hidden.bs.modal', function () {
    currentEditId = null;
});

// Lógica para manejar la paginación
function renderPagination(page, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Botón Anterior
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Anterior';
    prevBtn.disabled = page === 1;
    prevBtn.onclick = () => fetchWorkers(page - 1);
    pagination.appendChild(prevBtn);

    // Info de página
    const pageInfo = document.createElement('span');
    pageInfo.textContent = ` Página ${page} de ${totalPages} `;
    pagination.appendChild(pageInfo);

    // Botón Siguiente
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Siguiente';
    nextBtn.disabled = page === totalPages;
    nextBtn.onclick = () => fetchWorkers(page + 1);
    pagination.appendChild(nextBtn);
}

// Lógica para manejar el cierre de sesión
document.getElementById('logoutBtn').addEventListener('click', async function () {
    try {
        const response = await fetch('/auth/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = '/login.html';
        } else {
            alert('Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al cerrar sesión');
    }
});

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchWorkers();
});