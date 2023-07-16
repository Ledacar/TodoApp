import {v4 as uuid} from 'uuid';
'use strict';

// FIXME: Al final la aplicación no debería requerir de esta variable
const TEST_DATA = [
  {
    id: uuid(),
    content: 'Complete Todo App on Frontend Mentor',
    checked: false,
  },
  {
    id: uuid(),
    content: 'Pick up groceries',
    checked: false,
  },
  {
    id: uuid(),
    content: 'Read for 1 hour',
    checked: false,
  },
  {
    id: uuid(),
    content: '10 minutes meditation',
    checked: false,
  },
  {
    id: uuid(),
    content: 'Jog around the park 3x',
    checked: false,
  },
  {
    id: uuid(),
    content: 'Complete online JavaScript course',
    checked: true,
  },
];

const docStyles = document.head.querySelector('link[rel=stylesheet]'); // Elemento HTML que representa la hoja de estilos del documento.
const themeToggle = document.querySelector('.header__theme-toggle'); // Elemento HTML que representa el botón para cambiar el tema de la aplicación.
const formElement = document.querySelector('.header__form'); // Elemento HTML que representa el formulario para agregar nuevas tareas.
const inputElement = document.querySelector('.header__input'); // Elemento HTML que representa el campo de entrada de texto para agregar nuevas tareas.
const taskListElement = document.querySelector('.tasks__list'); // Elemento HTML que representa la lista de tareas.
const taskFooterElement = document.querySelector('.tasks__footer'); // Elemento HTML que representa el pie de página de la lista de tareas.
const taskFilterElement = document.querySelector('.tasks__filter'); // Elemento HTML que representa el filtro para mostrar tareas completadas o pendientes.
const taskAmountElement = document.querySelector('.tasks__amount'); // Elemento HTML que representa el contador de tareas pendientes.
const taskInstructionElement = document.querySelector('.task__instruction'); // Elemento HTML que representa las instrucciones para agregar nuevas tareas.

class Task {
  constructor(content, id = '', checked = false) {
    this.content = content;
    this.id = id === '' ? (Date.now() + '').slice(-10) : id;
    this.checked = checked;
  }

  changeChecked() {
    this.checked = !this.checked;
  }
}

class App {
  #colorTheme; // Tema de color actual de la aplicación
  #tasks = []; // Lista de tareas
  #draggableElementOrder = null; // Orden de los elementos arrastrables
  #draggableElementHeight = 0; // Altura de los elementos arrastrables

  constructor() {
    // Crea elemento css para tema oscuro
    const darkThemeElement = document.createElement('link');
    darkThemeElement.rel = 'stylesheet';
    darkThemeElement.href = './dark-theme.css';
    darkThemeElement.media = '(prefers-color-scheme: dark)';
    docStyles.after(darkThemeElement);

    // Carga el tema de localstorage o por defecto si no encuentra
    this._getColorTheme();
    // Carga tareas de localstorage o de datos de prueba si no encuentra
    this._getTasks();

    // Agrega listener a los respectivos eventos de los elementos interactivos
    themeToggle.addEventListener('click', this._changeColorTheme.bind(this));
    formElement.addEventListener('submit', this._newTask.bind(this));
    taskListElement.addEventListener('change', this._checkTask.bind(this));
    taskListElement.addEventListener('click', this._deleteTask.bind(this));
    taskFooterElement.addEventListener(
      'click',
      this._deleteCompleted.bind(this)
    );
    taskFilterElement.addEventListener('change', this._filterTasks.bind(this));
  }

  _getColorTheme() {
    // Obtiene el tema de localstorage o auto si no encuentra
    const data = localStorage.getItem('color-theme');
    this.#colorTheme = data || 'auto';
    this._applyColorTheme();
  }

  _setСolorTheme() {
    localStorage.setItem('color-theme', this.#colorTheme);
  }

  _applyColorTheme() {
    // Aplica el tema claro u oscuro a la aplicación
    const darkThemeMediaMap = {
      auto: '(prefers-color-scheme: dark)',
      light: 'not all',
      dark: 'all',
    };
    const darkThemeStyles = document.head.querySelector(
      'link[rel=stylesheet][href$="dark-theme.css"]'
    );
    darkThemeStyles.media = darkThemeMediaMap[this.#colorTheme];
  }

  _changeColorTheme() {
    // TODO: Cambia el tema de la app de claro y oscuro o viceversa.
    // Asignacion GABY.
    // Hint: Usa los métodos _setСolorTheme() y _applyColorTheme() para guardar y aplicar el tema escogido.
    // Hint: Valida si el tema escogido es auto (sistema) con window.matchMedia('(prefers-color-scheme: dark)')
    const themeOptions = {
      auto: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark',
      light: 'dark',
      dark: 'light',
    };
    
    this.#colorTheme = this.#colorTheme === 'auto' ? themeOptions.auto : themeOptions[this.#colorTheme];
    this._setСolorTheme();
    this._applyColorTheme();
  }


  _getTasks() {
    // Carga las tareas de localstorage o de datos de prueba si no encuentra
    let data = JSON.parse(localStorage.getItem('tasks'));
    if (!data) data = TEST_DATA;
    data.forEach((item, index) => {
      const task = new Task(item.content, item.id, item.checked);
      this.#tasks.push(task);
      this._renderTask(task, index);
    });
    this._setTasks();
    this._toggleFilter();
    this._renderActiveAmount(); // Para ver los filtros hay que completar esta funcion, sino comentariar esta linea
  }

  _setTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.#tasks));
  }

  _renderTask(task, order) {
    // Renderiza una tarea

    // Crea un nuevo elemento y agrega atributos
    const li = document.createElement('li');
    li.classList.add('tasks__item');
    li.draggable = true;
    li.dataset.order = order;
    // Instancia plantilla html de contenido
    li.innerHTML = `
      <input class="tasks__input" type="checkbox" name="task-item" id="${
        task.id
      }" ${task.checked ? 'checked' : ''}>
      <label class="tasks__text" for="${task.id}" tabindex="0">${
      task.content
    }</label>
      <button class="tasks__delete" type="button">
        <span class="visually-hidden">Delete task</span>
      </button>
    `;

    // agrega elemento a la lista, de primero
    taskListElement.prepend(li);

    // Agrega listeners de drag and drop
    li.addEventListener('dragstart', this._handleDragStart.bind(this));
    li.addEventListener('dragend', this._handleDragEnd.bind(this));
    li.addEventListener('dragover', this._handleDragOver.bind(this));
    li.addEventListener('dragleave', this._handleDragLeave.bind(this));
    li.addEventListener('drop', this._handleDragDrop.bind(this));
  }

  _toggleFilter() {
    // Muestra los botones de filtro si hay tareas, los oculta si no hay
    // Esta función debe llamarse siempre que cambie la cantidad de tareas
    if (this.#tasks.length === 0) {
      taskFooterElement.classList.add('tasks__footer--hidden');
      taskFilterElement.classList.add('filter--hidden');
      taskInstructionElement.classList.add('task__instruction--hidden');
    } else {
      taskFooterElement.classList.remove('tasks__footer--hidden');
      taskFilterElement.classList.remove('filter--hidden');
      taskInstructionElement.classList.remove('task__instruction--hidden');
    }
  }

  _renderActiveAmount() {
    // Renderiza la cantidad de tareas. Se debe llamar siempre que cambie la cantidad de tareas activas.
    let activeTasks = 0;
    // TODO: Mostrar tareas activas. Si se elimina una tarea, ya no cuenta como activa.
    // Asignacion GABY.
    this.#tasks.forEach(taskChecked => {
      if (!taskChecked.checked) {
        activeTasks++;
      }
    });
    taskAmountElement.textContent = `${activeTasks} items left`;
  }

  _filterTasks(evt) {
    // TODO: Implementar filtrado de tareas por sus estados disponibles (activa, completada o todas).
    // Asignacion DARLING.
    const selectedFilter = evt.target.value;

    taskListElement.innerHTML = '';
    
    if (selectedFilter === 'completed') {
      for (let i = 0; i < this.#tasks.length; i++) {
        if (this.#tasks[i].checked) {
          this._renderTask(this.#tasks[i], i);
        }
      }
    } else if (selectedFilter === 'active') {
      for (let i = 0; i < this.#tasks.length; i++) {
        if (!this.#tasks[i].checked) {
          this._renderTask(this.#tasks[i], i);
        }
      }
    } else {
      for (let i = 0; i < this.#tasks.length; i++) {
        this._renderTask(this.#tasks[i], i);
      }
    }
}

  _newTask(evt) {
    // TODO: Implementar agregado de nueva tarea
    // Asignacion DAVID.
    // Tomar en cuenta renderizado, actualizado en localstorage, mostrado de filtros y actualizado de cantidad de tareas activas
    evt.preventDefault()
     if(inputElement.value.trim().length > 0){
      const taskNew = new Task(inputElement.value,uuid(),false);
      this.#tasks.push(taskNew);
      this._renderTask(taskNew); 
    }

    inputElement.value = "";
    this._setTasks();
    this._toggleFilter();
    this._renderActiveAmount();    
  }

  _checkTask(evt) {
    // TODO: Implementar marcar tarea como completada
    // Asignacion ASHLY.
    // Tomar en cuenta cambio de estado en tarea, actualizado en localstorage, mostrado de filtros y actualizado de cantidad de tareas activas
    const idTodo = evt.target.closest('[id]');
    for (let i = 0; i < this.#tasks.length; i++) {
      if (this.#tasks[i].id === idTodo.getAttribute('id')) {
        this.#tasks[i].checked = !this.#tasks[i].checked;
        break;
      }
    }

    this._setTasks();
    this._toggleFilter();
    this._renderActiveAmount();
  }

  _deleteTask(evt) {
    // TODO: Implementar eliminar tarea.
    // Asignacion ASHLY.
    // Tomar en cuenta renderizado, actualización de localstorage, mostrado u ocultado de filtros y actualizado de cantidad de tareas activas
    const btnDelete = evt.target.closest('.tasks__delete');
    const emtTask = btnDelete.closest('li');
    const idTask = emtTask.dataset.order;
    if (idTask !== -1) {
      this.#tasks = this.#tasks.filter((task, index) => {
        return index !== parseInt(idTask);
      });
    }
    emtTask.remove();
    this._setTasks();
    this._toggleFilter();
    this._renderActiveAmount();
  }

  _deleteCompleted(evt) {
    // TODO: Implementar eliminación de todas las tareas completadas
    // Asignacion DARLING.
    // Tomar en cuenta renderizado, actualización de localstorage, mostrado u ocultado de filtros y actualizado de cantidad de tareas activas
    this.#tasks = this.#tasks.filter(task => !task.checked);
    taskListElement.innerHTML = '';
    this.#tasks.forEach((task, index) => this._renderTask(task, index));
    this._setTasks();
  }

  _handleDragStart(evt) {
    this.#draggableElementOrder = evt.target.dataset.order;
    this.#draggableElementHeight = evt.target.offsetHeight;
    taskListElement.style.height = taskListElement.offsetHeight + 'px';
    setTimeout(() => {
      evt.target.style.display = 'none';
    }, 0);
    taskListElement.style.height =
      taskListElement.offsetHeight - this.#draggableElementHeight + 'px';
  }

  _handleDragEnd(evt) {
    evt.target.style.display = 'flex';
    taskListElement.style.height =
      taskListElement.offsetHeight + this.#draggableElementHeight + 'px';
  }

  _handleDragOver(evt) {
    evt.preventDefault();
    if (evt.target.parentElement.classList.contains('tasks__item'))
      evt.target.parentElement.classList.add('tasks__item--dragged-over');
    if (evt.target.classList.contains('tasks__item'))
      evt.target.classList.add('tasks__item--dragged-over');
  }

  _handleDragLeave(evt) {
    if (evt.target.parentElement.classList.contains('tasks__item'))
      evt.target.parentElement.classList.remove('tasks__item--dragged-over');
    if (evt.target.classList.contains('tasks__item'))
      evt.target.classList.remove('tasks__item--dragged-over');
  }

  _handleDragDrop(evt) {
    this._handleDragLeave(evt);
    if (evt.target.parentElement.classList.contains('tasks__item')) {
      const target = evt.target.parentElement.dataset.order;
      this._changeTasksOrder(target);
    }
  }

  _changeTasksOrder(target) {
    const current = this.#draggableElementOrder;
    const currentTask = this.#tasks[current];

    this.#tasks.splice(current, 1);
    this.#tasks.splice(target, 0, currentTask);

    taskListElement.innerHTML = '';
    this.#tasks.forEach((task, index) => this._renderTask(task, index));
    this._setTasks();
  }
}

const app = new App();
