// simple localStorage-based message board (demo)
const LS_KEY = "demo_messages_v1";
const messagesEl = document.getElementById("messages");
const postForm = document.getElementById("postForm");
const authorInput = document.getElementById("author");
const contentInput = document.getElementById("content");
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const clearAllBtn = document.getElementById("clearAll");

// HTML escape to prevent XSS when rendering
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nowIso() {
  return new Date().toISOString();
}

function loadMessages() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMessages(msgs) {
  localStorage.setItem(LS_KEY, JSON.stringify(msgs));
}

function renderAll() {
  const msgs = loadMessages()
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  messagesEl.innerHTML = "";
  if (msgs.length === 0) {
    messagesEl.innerHTML = "<div class='meta'>投稿はまだありません。</div>";
    return;
  }
  msgs.forEach((m) => {
    const el = document.createElement("div");
    el.className = "message";
    const meta = document.createElement("div");
    meta.className = "meta";
    const name = m.author ? escapeHtml(m.author) : "名無し";
    const time = new Date(m.created_at).toLocaleString();
    meta.innerHTML = `<span>${name} — ${time}</span>`;
    const actions = document.createElement("span");
    actions.className = "actions";
    actions.innerHTML = `<button data-id="${m.id}" class="editBtn" type="button">編集</button>
                         <button data-id="${m.id}" class="delBtn" type="button">削除</button>`;
    meta.appendChild(actions);
    const content = document.createElement("div");
    content.className = "content";
    content.innerHTML = escapeHtml(m.content);
    el.appendChild(meta);
    el.appendChild(content);
    messagesEl.appendChild(el);
  });

  // attach handlers
  document.querySelectorAll(".delBtn").forEach((b) => {
    b.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      if (!confirm("本当に削除しますか？")) return;
      const msgs = loadMessages().filter((x) => x.id !== id);
      saveMessages(msgs);
      renderAll();
    });
  });
  document.querySelectorAll(".editBtn").forEach((b) => {
    b.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const msgs = loadMessages();
      const item = msgs.find((x) => x.id === id);
      if (!item) return alert("投稿が見つかりません");
      const newContent = prompt("投稿を編集:", item.content);
      if (newContent === null) return;
      item.content = newContent.slice(0, 1000);
      item.author =
        prompt("名前（空欄なら変更なし）:", item.author) || item.author;
      item.edited_at = nowIso();
      saveMessages(msgs);
      renderAll();
    });
  });
}

// utilities
function genId() {
  return crypto
    .getRandomValues(new Uint8Array(12))
    .reduce((s, b) => s + (b & 0xff).toString(16).padStart(2, "0"), "");
}

// submit
postForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const content = contentInput.value.trim();
  const author = authorInput.value.trim() || null;
  if (!content) return;
  submitBtn.disabled = true;
  const msgs = loadMessages();
  const item = {
    id: genId(),
    author,
    content,
    created_at: nowIso(),
  };
  msgs.push(item);
  saveMessages(msgs);
  contentInput.value = "";
  authorInput.value = "";
  renderAll();
  submitBtn.disabled = false;
});

clearBtn.addEventListener("click", () => {
  authorInput.value = "";
  contentInput.value = "";
});

exportBtn.addEventListener("click", () => {
  const data = localStorage.getItem(LS_KEY) || "[]";
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "messages.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("ローカルの全投稿を削除します。よろしいですか？")) return;
  localStorage.removeItem(LS_KEY);
  renderAll();
});

// init
renderAll();
