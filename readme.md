# To-dos App

A simple, mobile-style **To-do list app** built with plain **HTML, CSS, and JavaScript** — inspired by the Samsung Notes "To-dos" UI, featuring a dark theme, floating action button, and a full reminder scheduling flow (date, time, repeat, and alarm).

## ✨ Features

- **Task list** — add, complete, and delete to-dos
- **Empty state** — friendly illustration + "No to-dos" message when the list is empty
- **Floating "+" button** — quickly add a new task
- **Schedule reminder screen** — tap any task to set:
  - 📅 Date (via a custom in-app calendar picker)
  - ⏰ Time (scrollable hour / minute / AM-PM wheel picker)
  - 🔁 Repeat (Never, Daily, Weekly, Monthly, Yearly)
  - 🔔 Alarm toggle
- **3-dot menu** — quick access to create a standalone **Reminder** or **Alarm** without first creating a task
- **Persistent storage** — all tasks and reminders are saved in the browser's `localStorage`, so nothing is lost on refresh
- **Custom calendar widget** — built from scratch (no native `<input type="date">`), so it works reliably even inside sandboxed/embedded environments like iframes

## 📁 Project Structure

```
todos-app/
├── index.html   # Page structure/markup
├── style.css    # All styling (dark theme, layout, components)
└── script.js    # App logic (tasks, reminders, calendar, storage)
```

## 🚀 Getting Started

1. Download/clone all three files into the **same folder**.
2. Open `index.html` in any modern browser.
3. That's it — no build step, no dependencies, no server required.

### Optional: Host on GitHub Pages
1. Push the `todos-app` folder to a GitHub repository.
2. Go to **Settings → Pages**, select the branch/folder, and save.
3. Your app will be live at `https://mdsolimansikder7.github.io/To-do-web/`.

## 🛠️ How It Works

- **Data model** — each task is stored as an object:
  ```js
  { id, text, done, reminder }
  ```
  where `reminder` (if set) holds `{ dateISO, hour12, minute, ampm, repeat, alarm }`.
- **Storage** — the entire task array is saved to `localStorage` under the key `todos_app_tasks_v1` every time it changes.
- **Screens** — the app is a single HTML page with two "screens" (List and Schedule Reminder) that slide in/out using CSS transforms, mimicking a native mobile app feel.
- **Calendar** — a lightweight custom month-grid calendar (previous/next navigation + "Today" shortcut) replaces the native date picker for better compatibility.

## 📝 Notes

- Built for learning/practice purposes — beginner-friendly, comment-light code.
- No external libraries or frameworks used — pure vanilla JS.

## 👤 Author

Soliman