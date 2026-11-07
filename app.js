(() => {
  "use strict";
  const STORAGE_KEY = "daymark-pr4-concept-preview-v1";
  const $ = id => document.getElementById(id);
  const elements = {
    form: $("taskForm"), input: $("taskInput"), list: $("taskList"),
    empty: $("emptyState"), progressText: $("progressText"),
    progressPercent: $("progressPercent"), progressBar: $("progressBar"),
    progressFill: $("progressFill"), allCount: $("allCount"),
    activeCount: $("activeCount"), doneCount: $("doneCount"),
    remaining: $("remainingText"), clearDone: $("clearDone"),
    date: $("todayDate")
  };
  let tasks = loadTasks();
  let filter = "all";

  function loadTasks() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored.filter(task =>
        task && typeof task.id === "string" &&
        typeof task.text === "string" && typeof task.done === "boolean"
      ).map(task => ({ id: task.id, text: task.text.slice(0, 120), done: task.done }));
    } catch (error) {
      console.warn("Daymark could not read saved tasks.", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Daymark could not save tasks.", error);
      return false;
    }
  }

  function makeId() {
    return window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function updateSummary() {
    const completed = tasks.filter(task => task.done).length;
    const active = tasks.length - completed;
    const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
    elements.progressText.textContent = `${completed} of ${tasks.length} completed`;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressBar.setAttribute("aria-valuenow", String(percent));
    elements.allCount.textContent = tasks.length;
    elements.activeCount.textContent = active;
    elements.doneCount.textContent = completed;
    elements.remaining.textContent = tasks.length
      ? active === 0 ? "Everything on your list is complete" : `${active} ${active === 1 ? "task" : "tasks"} left for today`
      : "Nothing on your list yet";
    elements.clearDone.disabled = completed === 0;
  }

  function render() {
    elements.list.replaceChildren();
    const visibleTasks = tasks.filter(task =>
      filter === "all" || (filter === "active" && !task.done) || (filter === "done" && task.done)
    );
    elements.empty.hidden = visibleTasks.length > 0;
    elements.empty.querySelector("h3").textContent = tasks.length === 0
      ? "A clear space to begin" : filter === "active" ? "You're all caught up" : filter === "done" ? "Nothing completed yet" : "No tasks to show";
    elements.empty.querySelector("p").textContent = tasks.length === 0
      ? "Add one task you'd like to move forward today."
      : filter === "active" ? "There are no unfinished tasks in this list."
      : filter === "done" ? "Completed tasks will appear here." : "Try a different filter.";

    visibleTasks.forEach(task => {
      const item = makeElement("li", `task-item${task.done ? " is-done" : ""}`);
      const label = makeElement("label", "task-label");
      const checkbox = makeElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", `Mark ${task.text} ${task.done ? "not complete" : "complete"}`);
      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        saveTasks();
        render();
      });
      const mark = makeElement("span", "custom-check");
      const text = makeElement("span", "task-text", task.text);
      label.append(checkbox, mark, text);
      const remove = makeElement("button", "remove-task", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove task: ${task.text}`);
      remove.addEventListener("click", () => {
        tasks = tasks.filter(item => item.id !== task.id);
        saveTasks();
        render();
      });
      item.append(label, remove);
      elements.list.append(item);
    });
    updateSummary();
  }

  elements.form.addEventListener("submit", event => {
    event.preventDefault();
    const text = elements.input.value.trim();
    if (!text) {
      elements.input.focus();
      return;
    }
    tasks.push({ id: makeId(), text, done: false });
    saveTasks();
    elements.input.value = "";
    render();
    elements.input.focus();
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(tab => {
        const selected = tab.dataset.filter === filter;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-pressed", String(selected));
      });
      render();
    });
  });

  elements.clearDone.addEventListener("click", () => {
    const completed = tasks.filter(task => task.done).length;
    if (!completed) return;
    tasks = tasks.filter(task => !task.done);
    saveTasks();
    render();
  });

  elements.date.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric"
  }).format(new Date());
  render();
})();