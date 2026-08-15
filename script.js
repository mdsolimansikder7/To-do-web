// ============================================
// Firebase setup
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDY55ct2BTyPMB_rTh9H6cwnjj6HmuKKE0",
  authDomain: "my-todo-web-1149f.firebaseapp.com",
  projectId: "my-todo-web-1149f",
  storageBucket: "my-todo-web-1149f.firebasestorage.app",
  messagingSenderId: "879601390497",
  appId: "1:879601390497:web:098402deec783b412b71e0",
  measurementId: "G-LLELX2L6BV",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const todosRef = collection(db, "todos");
const todosQuery = query(todosRef, orderBy("createdAt", "asc"));

// ------- State -------
let todos = []; // synced live from Firestore
let currentFilter = "all";

// ------- DOM Elements -------
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const itemsLeft = document.getElementById("items-left");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");
const progressFill = document.getElementById("progress-fill");
const dateEl = document.getElementById("today-date");

// ------- Today's date (Bangla-friendly) -------
function setDate() {
  const days = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
  const months = [
    "জানু",
    "ফেব্রু",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্ট",
    "অক্টো",
    "নভে",
    "ডিসে",
  ];
  const d = new Date();
  dateEl.textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}
setDate();

// ------- Live sync from Firestore -------
list.innerHTML = '<li class="empty-message">লোড হচ্ছে…</li>';

onSnapshot(
  todosQuery,
  (snapshot) => {
    todos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  },
  (error) => {
    console.error("Firestore error:", error);
    list.innerHTML =
      '<li class="empty-message">ডেটা লোড করা যায়নি। ইন্টারনেট চেক করো।</li>';
  },
);

// ------- Render -------
function render() {
  list.innerHTML = "";

  let filtered = todos;
  if (currentFilter === "active") {
    filtered = todos.filter((t) => !t.completed);
  } else if (currentFilter === "completed") {
    filtered = todos.filter((t) => t.completed);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<li class="empty-message">এই মুহূর্তে কিছু নেই ✦</li>';
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement("li");
      li.dataset.id = todo.id;
      if (todo.completed) li.classList.add("completed");

      li.innerHTML = `
        <span class="check" data-id="${todo.id}" role="checkbox" aria-checked="${todo.completed}" tabindex="0">
          <svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-6"/></svg>
        </span>
        <span class="todo-text">${escapeHTML(todo.text)}</span>
        <button class="delete-btn" data-id="${todo.id}" aria-label="মুছুন">✕</button>
      `;
      list.appendChild(li);
    });
  }

  const remaining = todos.filter((t) => !t.completed).length;
  itemsLeft.textContent = `${remaining}টি বাকি`;

  const total = todos.length;
  const done = total - remaining;
  progressFill.style.width = total === 0 ? "0%" : `${(done / total) * 100}%`;
}

// Prevent basic HTML injection from task text
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ------- Add Todo -------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  try {
    await addDoc(todosRef, {
      text: text,
      completed: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Add failed:", err);
    alert("কাজ যোগ করা যায়নি, আবার চেষ্টা করো।");
  }
});

// ------- Toggle / Delete (event delegation) -------
list.addEventListener("click", async (e) => {
  const checkEl = e.target.closest(".check");
  const deleteEl = e.target.closest(".delete-btn");

  if (checkEl) {
    const id = checkEl.dataset.id;
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      try {
        await updateDoc(doc(db, "todos", id), { completed: !todo.completed });
      } catch (err) {
        console.error("Update failed:", err);
      }
    }
  }

  if (deleteEl) {
    const id = deleteEl.dataset.id;
    const li = deleteEl.closest("li");
    li.classList.add("removing");
    li.addEventListener(
      "animationend",
      async () => {
        try {
          await deleteDoc(doc(db, "todos", id));
        } catch (err) {
          console.error("Delete failed:", err);
        }
      },
      { once: true },
    );
  }
});

// keyboard support for the custom checkbox
list.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.classList.contains("check")
  ) {
    e.preventDefault();
    e.target.click();
  }
});

// ------- Clear Completed -------
clearBtn.addEventListener("click", async () => {
  const completed = todos.filter((t) => t.completed);
  try {
    await Promise.all(completed.map((t) => deleteDoc(doc(db, "todos", t.id))));
  } catch (err) {
    console.error("Clear failed:", err);
  }
});

// ------- Filters -------
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});
