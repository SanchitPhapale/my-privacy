// Socket.IO connection - connect to backend server
const SOCKET_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3600"
        : "https://my-privacy-backend.onrender.com";

const API_URL = SOCKET_URL;

let socketConnected = false;

// User state
let currentUser = null;
let selectedMessageId = null;
let replyingTo = null;
let isEditing = false;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let isChatVisible = true;

// DOM Elements
const joinScreen = document.getElementById("join-screen");
const joinForm = document.getElementById("join-form");
const nameInput = document.getElementById("name");

const usernameInput = document.getElementById("username");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("toggle-password");
const joinError = document.getElementById("join-error");
const connectionStatus = document.getElementById("connection-status");

// ==============================
// Login Mobile Keyboard Support
// ==============================

const loginInputs = [nameInput, usernameInput, phoneInput, passwordInput];

loginInputs.forEach((input) => {
  input.addEventListener("focus", () => {
    setTimeout(() => {
      input.scrollIntoView({
        behavior: "smooth",

        block: "center",
      });
    }, 300);
  });
});

// Show connecting status
if (connectionStatus) {
  connectionStatus.textContent = "Connecting to server...";
  connectionStatus.style.color = "var(--warning)";
}

const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
});

// Connection status handlers
socket.on("connect", () => {
  socketConnected = true;
  console.log("Connected to server");
  if (connectionStatus) {
    connectionStatus.textContent = "Connected";
    connectionStatus.style.color = "var(--accent)";
    setTimeout(() => {
      connectionStatus.textContent = "";
    }, 2000);
  }
  if (joinError) joinError.classList.add("hidden");
});

socket.on("disconnect", () => {
  socketConnected = false;
  console.log("Disconnected from server");
  if (connectionStatus) {
    connectionStatus.textContent = "Disconnected - Reconnecting...";
    connectionStatus.style.color = "var(--warning)";
  }
});

socket.on("connect_error", (error) => {
  socketConnected = false;
  console.error("Connection error:", error);
  if (connectionStatus) {
    connectionStatus.textContent =
      "Cannot connect to chat server. Backend not running?";
    connectionStatus.style.color = "var(--danger)";
  }
});

const chatScreen = document.getElementById("chat-screen");
const messagesContainer = document.getElementById("messages-container");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const messageInput = document.getElementById("message-input");

// Mobile keyboard fix

messageInput.addEventListener("input", function () {
  if (this.value.length === 1) {
    this.value = this.value.charAt(0).toUpperCase();
  }
});

const sendBtn = document.getElementById("send-btn");
const fileBtn = document.getElementById("file-btn");
const fileInput = document.getElementById("file-input");
const voiceBtn = document.getElementById("voice-btn");
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");
const emojiGrid = document.querySelector(".emoji-grid");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const sidebarClose = document.getElementById("sidebar-close");
const membersList = document.getElementById("members-list");
const onlineCount = document.getElementById("online-count");
const clockElement = document.getElementById("clock");
const searchToggle = document.getElementById("search-toggle");
const searchBar = document.getElementById("search-bar");
const searchInput = document.getElementById("search-input");
const searchClose = document.getElementById("search-close");
const scrollBottomBtn = document.getElementById("scroll-bottom");
const typingIndicator = document.getElementById("typing-indicator");
const typingText = document.getElementById("typing-text");
const replyPreview = document.getElementById("reply-preview");
const replyName = document.getElementById("reply-name");
const replyText = document.getElementById("reply-text");
const replyClose = document.getElementById("reply-close");
const leaveBtn = document.getElementById("leave-room");
const overlay = document.getElementById("overlay");
const contextMenu = document.getElementById("context-menu");

const themeToggle = document.getElementById("theme-toggle");
const headerThemeToggle = document.getElementById("header-theme-toggle");

const voiceModal = document.getElementById("voice-modal");
const voiceTimer = document.getElementById("voice-timer");
const voiceCancelBtn = document.getElementById("voice-cancel");
const voiceSendBtn = document.getElementById("voice-send");

const filePreviewModal = document.getElementById("file-preview-modal");
const filePreviewName = document.getElementById("file-preview-name");
const filePreviewBody = document.getElementById("file-preview-body");
const filePreviewClose = document.getElementById("file-preview-close");

const hostPanel = document.getElementById("host-panel");
const hostPanelClose = document.getElementById("host-panel-close");
const newPasswordInput = document.getElementById("new-password");
const changePasswordBtn = document.getElementById("change-password-btn");
const clearMessagesBtn = document.getElementById("clear-messages-btn");

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

initTheme();

if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
if (headerThemeToggle) headerThemeToggle.addEventListener("click", toggleTheme);

function updateClock() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateClock, 1000);
updateClock();

setInterval(updateClock, 1000);
updateClock();

// Join Functionality
togglePasswordBtn.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
});

// ==============================
// Login Next Input Navigation
// ==============================

nameInput.addEventListener("input", function () {
  this.value = this.value.replace(/\b\w/g, function (letter) {
    return letter.toUpperCase();
  });
});

nameInput.addEventListener("input", function () {
  if (this.value.length > 0) {
    this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
  }
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    usernameInput.focus();
  }
});

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    phoneInput.focus();
  }
});

phoneInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    passwordInput.focus();
  }
});

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const username = usernameInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  if (!username) {
    joinError.textContent = "Please enter a username";
    joinError.classList.remove("hidden");
    return;
  }

  if (!phone) {
    joinError.textContent = "Please enter phone number";
    joinError.classList.remove("hidden");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    joinError.textContent = "Please enter a valid 10-digit phone number";
    joinError.classList.remove("hidden");
    return;
  }

  if (!password) {
    joinError.textContent = "Please enter the room password";
    joinError.classList.remove("hidden");
    return;
  }

  if (!socketConnected) {
    joinError.textContent =
      "Not connected to server. Please wait or refresh the page.";
    joinError.classList.remove("hidden");
    return;
  }

  socket.emit("join-room", { name, username, phone, password }, (response) => {
    if (response && response.success) {
      currentUser = response.user;
      joinScreen.classList.add("hidden");
      chatScreen.classList.remove("hidden");

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      loadExistingMessages(response.messages);

      if (currentUser.isHost) {
        initHostPanel();
      }
    } else {
      joinError.textContent = response ? response.error : "Failed to join room";
      joinError.classList.remove("hidden");
    }
  });
});

function loadExistingMessages(messages) {
  messagesDiv.innerHTML = "";
  messages.forEach((msg) => displayMessage(msg, false));
  scrollToBottom();
}

// Message Input
messageInput.addEventListener("input", () => {
  adjustTextareaHeight();
  updateSendButton();

  if (messageInput.value.trim()) {
    socket.emit("typing-start");
  } else {
    socket.emit("typing-stop");
  }
});

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});
function adjustTextareaHeight() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
}

function updateSendButton() {
  sendBtn.disabled = isEditing ? false : !messageInput.value.trim();
}

document.addEventListener("visibilitychange", () => {
  isChatVisible = !document.hidden;
});

// Send Message
function sendMessage() {
  const content = messageInput.value.trim();
  if (!content && !isEditing) return;

  if (isEditing && selectedMessageId) {
    socket.emit(
      "edit-message",
      {
        messageId: selectedMessageId,
        content: content,
      },
      (response) => {
        if (response.success) {
          cancelEdit();
        }
      },
    );
    return;
  }

  const messageData = {
    content: content,
    type: "text",
    replyTo: replyingTo
      ? {
          id: replyingTo.id,
          username: replyingTo.username,
          content: replyingTo.content,
        }
      : null,
  };

  socket.emit("send-message", messageData);

  messageInput.value = "";
  messageInput.focus();
  messageInput.style.height = "auto";
  updateSendButton();

  if (replyingTo) {
    cancelReply();
  }

  socket.emit("typing-stop");

  // WhatsApp style
  requestAnimationFrame(() => {
    messageInput.focus();

    scrollToBottom(true);
  });
}

sendBtn.addEventListener("click", sendMessage);

// Receive Message
// Receive Message
socket.on("new-message", (message) => {
  displayMessage(message, true);

  // Don't notify for your own messages
  if (message.userId === currentUser.id) return;

  // Only notify when the page is not visible
  if (!isChatVisible && Notification.permission === "granted") {
    let body = "New message";

    if (message.type === "text") {
      body = message.content;
    } else if (message.type === "file") {
      if (message.file?.mimetype?.startsWith("image/")) {
        body = "📷 Image";
      } else if (message.file?.mimetype?.startsWith("audio/")) {
        body = "🎤 Voice message";
      } else {
        body = "📄 File";
      }
    }

    const notification = new Notification(message.name, {
      body: body,

      icon: "/favicon.ico",

      tag: "my-privacy-chat",
    });

    notification.onclick = () => {
      window.focus();

      notification.close();
    };
  }
});

function displayMessage(message, animate = true) {
  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${message.userId === currentUser.id ? "own" : "other"}`;
  wrapper.dataset.messageId = message.id;

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${message.userId === currentUser.id ? "own" : "other"}`;

  // =======================
  // Deleted Message
  // =======================

  if (message.deleted || message.isDeleted) {
    msgDiv.classList.add("deleted");

    const deletedDiv = document.createElement("div");

    deletedDiv.className = "message-content";

    if (message.deletedBy === "user" && message.userId === currentUser.id) {
      deletedDiv.textContent = "You deleted this message";
    } else if (message.deletedBy === "host") {
      deletedDiv.textContent = "This message was deleted by the host";
    } else {
      deletedDiv.textContent = "This message was deleted";
    }

    msgDiv.appendChild(deletedDiv);

    wrapper.appendChild(msgDiv);

    messagesDiv.appendChild(wrapper);

    return;
  }

  // Swipe Reply Icon
  const swipeReplyIcon = document.createElement("div");

  swipeReplyIcon.className = "swipe-reply-icon";

  swipeReplyIcon.innerHTML = `
<svg viewBox="0 0 24 24" width="18" height="18">
<path
fill="currentColor"
d="M10 9V5L3 12l7 7v-4.2c6.2 0 10.2 2.1 11 7.2-.2-7-4.4-12.2-11-13z"/>
</svg>
`;

  msgDiv.appendChild(swipeReplyIcon);

  // Reply preview
  if (message.replyTo) {
    const replyDiv = document.createElement("div");

    replyDiv.className = "message-reply";

    replyDiv.innerHTML = `
        <div class="reply-sender">${escapeHtml(message.replyTo.username)}</div>
        <div class="reply-text">
            ${escapeHtml(message.replyTo.content.substring(0, 50))}
            ${message.replyTo.content.length > 50 ? "..." : ""}
        </div>
    `;

    // Jump to original message when clicked
    replyDiv.addEventListener("click", (e) => {
      e.stopPropagation();

      const target = document.querySelector(
        `[data-message-id="${message.replyTo.id}"]`,
      );

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",

        block: "center",
      });

      target.classList.add("message-jump-highlight");

      setTimeout(() => {
        target.classList.remove("message-jump-highlight");
      }, 2000);
    });

    msgDiv.appendChild(replyDiv);
  }

  // Sender name
  if (message.userId !== currentUser.id) {
    const senderDiv = document.createElement("div");
    senderDiv.className = "message-sender";
    senderDiv.textContent = message.name || message.username;
    msgDiv.appendChild(senderDiv);
  }

  // Content
  if (message.type === "file" && message.file) {
    if (message.file.mimetype && message.file.mimetype.startsWith("image/")) {
      const imgDiv = document.createElement("div");
      imgDiv.className = "message-file";
      const img = document.createElement("img");
      img.className = "message-image";
      img.src = message.file.url;
      img.alt = "Image";
      img.onclick = () => previewFile(message.file);
      imgDiv.appendChild(img);
      msgDiv.appendChild(imgDiv);
    } else if (
      message.file.mimetype &&
      message.file.mimetype.startsWith("audio/")
    ) {
      const voiceDiv = document.createElement("div");
      voiceDiv.className = "message-voice";

      voiceDiv.innerHTML = `

<div class="voice-player">

    <button class="voice-play-btn">

        <svg class="voice-icon" viewBox="0 0 24 24" width="20" height="20">

            <path d="M8 5v14l11-7z" fill="currentColor"/>

        </svg>

    </button>

    <div class="voice-progress">

        <div class="voice-progress-fill"></div>

    </div>

    <span class="voice-current-time">

        0:00

    </span>

    <span class="voice-total-time">

        ${message.file.duration || "0:00"}

    </span>

</div>

`;

      voiceDiv.dataset.audio = message.file.url;

      msgDiv.appendChild(voiceDiv);

      const playBtn = voiceDiv.querySelector(".voice-play-btn");

      playBtn.addEventListener("click", () => {
        playAudio(playBtn);
      });
    } else {
      const docDiv = document.createElement("div");
      docDiv.className = "message-document";
      docDiv.onclick = () => previewFile(message.file);
      docDiv.innerHTML = `
                <svg viewBox="0 0 24 24" width="32" height="32">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" fill="currentColor"/>
                </svg>
                <div class="message-document-info">
                    <div class="message-document-name">${escapeHtml(message.file.originalName)}</div>
                    <div class="message-document-size">${formatFileSize(message.file.size)}</div>
                </div>
            `;
      msgDiv.appendChild(docDiv);
    }
  } else {
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = message.content;
    msgDiv.appendChild(contentDiv);
  }

  // Meta info
  const metaDiv = document.createElement("div");
  metaDiv.className = "message-meta";

  const timeSpan = document.createElement("span");
  timeSpan.className = "message-time";
  timeSpan.textContent = formatTime(message.timestamp);
  metaDiv.appendChild(timeSpan);

  const reactionDiv = document.createElement("div");
  reactionDiv.className = "message-reactions";
  reactionDiv.dataset.messageId = message.id;
  msgDiv.appendChild(reactionDiv);

  msgDiv.appendChild(metaDiv);
  wrapper.appendChild(msgDiv);

  // Context menu
  msgDiv.addEventListener("contextmenu", (e) => showContextMenu(e, message));
  let pressTimer;

  msgDiv.addEventListener("touchstart", (e) => {
    pressTimer = setTimeout(() => {
      // Vibrate when context menu opens
      if ("vibrate" in navigator) {
        navigator.vibrate(20);
      }

      showContextMenu(e, message);
    }, 500);
  });

  msgDiv.addEventListener("touchend", () => {
    clearTimeout(pressTimer);
  });

  msgDiv.addEventListener("touchmove", () => {
    clearTimeout(pressTimer);
  });

  msgDiv.addEventListener("touchcancel", () => {
    clearTimeout(pressTimer);
  });
  // ==========================
  // Swipe To Reply
  // ==========================

  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  msgDiv.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;

    isSwiping = true;

    msgDiv.style.transition = "none";
  });

  msgDiv.addEventListener("pointermove", (e) => {
    if (!isSwiping) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Ignore vertical scrolling
    if (Math.abs(dy) > Math.abs(dx)) return;

    // Only swipe right
    if (dx <= 0) return;

    // Max swipe distance
    const distance = Math.min(dx, 90);

    msgDiv.style.transform = `translateX(${distance}px)`;

    swipeReplyIcon.style.opacity = distance / 70;

    swipeReplyIcon.style.transform = `translateY(-50%) scale(${0.6 + distance / 200})`;
  });

  msgDiv.addEventListener("pointerup", () => {
    isSwiping = false;

    const moved =
      parseFloat(msgDiv.style.transform.replace(/[^\d.]/g, "")) || 0;

    msgDiv.style.transition = "transform .18s ease";
    msgDiv.style.transform = "translateX(0)";

    swipeReplyIcon.style.opacity = "0";
    swipeReplyIcon.style.transform = "translateY(-50%) scale(.6)";

    // Trigger reply
    // Trigger reply
    if (moved >= 70) {
      // Small vibration (Android only)
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      replyingTo = message;

      replyPreview.classList.remove("hidden");

      replyName.textContent = message.name;

      if (message.type === "file") {
        if (message.file?.mimetype?.startsWith("image/")) {
          replyText.textContent = "📷 Photo";
        } else if (message.file?.mimetype?.startsWith("audio/")) {
          replyText.textContent = "🎤 Voice message";
        } else {
          replyText.textContent = "📄 File";
        }
      } else {
        replyText.textContent = message.content;
      }

      messageInput.focus();
    }
  });

  msgDiv.addEventListener("pointercancel", () => {
    isSwiping = false;

    msgDiv.style.transition = "transform .18s ease";

    msgDiv.style.transform = "translateX(0)";

    swipeReplyIcon.style.opacity = "0";

    swipeReplyIcon.style.transform = "translateY(-50%) scale(.6)";
  });

  messagesDiv.appendChild(wrapper);

  scrollToBottom();

  if (animate && message.userId !== currentUser.id) {
    showNotification(
      `${message.name || message.username}: ${message.content.substring(0, 30)}`,
    );
  }
}

// Message Events
socket.on("message-edited", (data) => {
  const wrapper = messagesDiv.querySelector(
    `[data-message-id="${data.messageId}"]`,
  );
  if (wrapper) {
    const content = wrapper.querySelector(".message-content");
    if (content) {
      content.textContent = data.content;
    }
    const meta = wrapper.querySelector(".message-meta");
    if (meta && !wrapper.querySelector(".message-edited")) {
      const edited = document.createElement("span");
      edited.className = "message-edited";
      edited.textContent = "edited";
      meta.insertBefore(edited, meta.firstChild);
    }
  }
});

socket.on("message-deleted", (data) => {
  const wrapper = messagesDiv.querySelector(
    `[data-message-id="${data.messageId}"]`,
  );

  if (!wrapper) return;

  const bubble = wrapper.querySelector(".message");

  if (!bubble) return;

  // Mark as deleted
  bubble.classList.add("deleted");

  // Remove image, voice and document UI
  wrapper
    .querySelectorAll(".message-file, .message-voice, .message-document")
    .forEach((el) => el.remove());

  // Find existing message-content
  let content = bubble.querySelector(".message-content");

  // If there isn't one (image, voice, file), create it
  if (!content) {
    content = document.createElement("div");
    content.className = "message-content";

    const time = bubble.querySelector(".message-time");

    if (time) {
      bubble.insertBefore(content, time);
    } else {
      bubble.appendChild(content);
    }
  }

  // Set deleted message text
  if (data.deletedForUserId === currentUser.id && data.deletedBy !== "host") {
    content.textContent = "You deleted this message";
  } else if (data.deletedBy === "host") {
    content.textContent = "This message was deleted by the host";
  } else {
    content.textContent = "This message was deleted";
  }

  // Disable interaction
  bubble.style.pointerEvents = "none";
});

socket.on("messages-cleared", () => {
  messagesDiv.innerHTML = "";
  showSystemMessage("All messages have been cleared", "warning");
});

socket.on("reaction-updated", (data) => {
  console.log("REACTION UPDATE:", data.reactions);
  console.log("REACTION UPDATE", data);
  const wrapper = messagesDiv.querySelector(
    `[data-message-id="${data.messageId}"]`,
  );

  if (!wrapper) return;

  const reactionBox = wrapper.querySelector(".message-reactions");

  if (!reactionBox) return;

  reactionBox.innerHTML = "";
  if (!data.reactions) return;
  if (Object.keys(data.reactions).length === 0) {
    return;
  }

  console.log(data.reactions);

  Object.entries(data.reactions).forEach(([emoji, users]) => {
    const badge = document.createElement("span");

    badge.className = "reaction-badge";

    badge.textContent = users.length > 1 ? `${emoji} ${users.length}` : emoji;

    badge.title = users.map((u) => u.name).join(", ");

    reactionBox.appendChild(badge);
  });
});

// Context Menu
function showContextMenu(e, message) {
  e.preventDefault();

  selectedMessageId = message.id;

  const isOwn = message.userId === currentUser.id;
  const isHost = currentUser.isHost;

  const editBtn = contextMenu.querySelector('[data-action="edit"]');
  const deleteBtn = contextMenu.querySelector('[data-action="delete"]');
  const deleteAllBtn = contextMenu.querySelector('[data-action="delete-all"]');

  editBtn.style.display =
    (isOwn || isHost) && message.type === "text" ? "flex" : "none";
  deleteBtn.style.display = isOwn ? "flex" : "none";
  deleteAllBtn.style.display = isHost ? "flex" : "none";

  let x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  let y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  const menuWidth = 180;
  const menuHeight = contextMenu.offsetHeight || 220;

  let left = e.clientX;
  let top = e.clientY;

  // Keep inside right edge
  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 10;
  }

  // If there isn't enough room below, open above
  if (top + menuHeight > window.innerHeight - 90) {
    top = top - menuHeight;
  } else {
    top += 5;
  }

  contextMenu.style.left = left + "px";
  contextMenu.style.top = top + "px";
  contextMenu.classList.remove("hidden");

  setTimeout(() => {
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      contextMenu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
      contextMenu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
    }
  }, 0);
}

document.addEventListener("click", () => {
  contextMenu.classList.add("hidden");
});

contextMenu.querySelectorAll(".context-item").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const action = btn.dataset.action;
    handleMessageAction(action);
  });
});

function handleMessageAction(action) {
  contextMenu.classList.add("hidden");

  switch (action) {
    case "reply":
      const msgWrapper = messagesDiv.querySelector(
        `[data-message-id="${selectedMessageId}"]`,
      );
      const msg = msgWrapper?.querySelector(".message");
      if (msgWrapper && msg) {
        const content =
          msg.querySelector(".message-content")?.textContent || "(file)";
        const sender =
          msg.querySelector(".message-sender")?.textContent || currentUser.name;
        replyingTo = {
          id: selectedMessageId,
          username: sender,
          content: content,
        };
        replyName.textContent = sender;
        replyText.textContent = content.substring(0, 50);
        replyPreview.classList.remove("hidden");
        messageInput.focus();
      }
      break;

    case "copy":
      const msgToCopy = messagesDiv.querySelector(
        `[data-message-id="${selectedMessageId}"]`,
      );
      const contentToCopy =
        msgToCopy?.querySelector(".message-content")?.textContent;
      if (contentToCopy) {
        navigator.clipboard.writeText(contentToCopy);
        showToast("Message copied");
      }
      break;

    case "edit":
      isEditing = true;
      const msgToEdit = messagesDiv.querySelector(
        `[data-message-id="${selectedMessageId}"]`,
      );
      const contentToEdit =
        msgToEdit?.querySelector(".message-content")?.textContent;
      messageInput.value = contentToEdit || "";
      messageInput.focus();
      updateSendButton();
      break;

    case "delete":
      socket.emit("delete-message", { messageId: selectedMessageId });
      break;

    case "delete-all":
      if (currentUser.isHost) {
        socket.emit("delete-message", { messageId: selectedMessageId });
      }
      break;
  }
}

replyClose.addEventListener("click", cancelReply);

function cancelReply() {
  replyingTo = null;
  replyPreview.classList.add("hidden");
}

function cancelEdit() {
  isEditing = false;
  selectedMessageId = null;
  messageInput.value = "";
  messageInput.focus();
  messageInput.style.height = "auto";
  updateSendButton();
}

// File Upload
fileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (file.size > 50 * 1024 * 1024) {
    showToast("File too large (max 50MB)");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    socket.emit("send-message", {
      content: "",
      type: "file",
      file: data,
    });

    showToast("File sent");
  } catch (err) {
    showToast("Failed to upload file");
    console.error(err);
  }

  fileInput.value = "";
});

function previewFile(file) {
  filePreviewName.textContent = file.originalName;

  if (file.mimetype && file.mimetype.startsWith("image/")) {
    filePreviewBody.innerHTML = `
<img
class="preview-image"
id="preview-image"
src="${file.url}"
alt="${escapeHtml(file.originalName)}">
`;
  } else if (file.mimetype && file.mimetype.startsWith("audio/")) {
    filePreviewBody.innerHTML = `<audio src="${file.url}" controls></audio>`;
  } else {
    filePreviewBody.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <svg viewBox="0 0 24 24" width="48" height="48" style="color: var(--text-secondary);">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" fill="currentColor"/>
                </svg>
                <p style="margin-top: 16px; color: var(--text-secondary);">${escapeHtml(file.originalName)}</p>
                <a href="${file.url}" download="${escapeHtml(file.originalName)}" class="btn" style="display: inline-block; margin-top: 16px; text-decoration: none;">Download</a>
            </div>
        `;
  }

  filePreviewModal.classList.remove("hidden");
  const previewImage = document.getElementById("preview-image");

  if (previewImage) {
    initImageViewer(previewImage);
  }
}

function initImageViewer(img) {
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  let isDragging = false;

  let startX = 0;
  let startY = 0;
  let initialDistance = 0;
  let initialScale = 1;
  let lastTap = 0;

  function updateTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  img.addEventListener("dblclick", () => {
    if (scale === 1) {
      scale = 2;
    } else {
      scale = 1;
      translateX = 0;
      translateY = 0;
    }

    updateTransform();
  });

  img.addEventListener("wheel", (e) => {
    e.preventDefault();

    scale += e.deltaY < 0 ? 0.2 : -0.2;

    scale = Math.max(1, Math.min(scale, 5));

    updateTransform();
  });

  img.addEventListener("mousedown", (e) => {
    if (scale === 1) return;

    isDragging = true;

    startX = e.clientX - translateX;
    startY = e.clientY - translateY;

    img.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;

    updateTransform();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;

    img.style.cursor = "grab";
  });

  // ==========================
  // Mobile Pinch Zoom
  // ==========================

  img.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;

        initialDistance = Math.hypot(dx, dy);
        initialScale = scale;
      }
    },
    { passive: false },
  );

  img.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;

        const currentDistance = Math.hypot(dx, dy);

        scale = initialScale * (currentDistance / initialDistance);

        scale = Math.max(1, Math.min(scale, 5));

        updateTransform();
      }
    },
    { passive: false },
  );

  // ==========================
  // Mobile Double Tap Zoom
  // ==========================

  img.addEventListener("touchend", (e) => {
    if (e.touches.length > 0) return;

    const now = Date.now();

    if (now - lastTap < 300) {
      if (scale === 1) {
        scale = 2;
      } else {
        scale = 1;
        translateX = 0;
        translateY = 0;
      }

      updateTransform();
    }

    lastTap = now;
  });
}

filePreviewClose.addEventListener("click", () => {
  filePreviewModal.classList.add("hidden");
});

filePreviewModal.addEventListener("click", (e) => {
  if (e.target === filePreviewModal) {
    filePreviewModal.classList.add("hidden");
  }
});

// Voice Recording
voiceBtn.addEventListener("click", startRecording);

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.start();
    isRecording = true;
    recordingStartTime = Date.now();

    voiceModal.classList.remove("hidden");
    updateVoiceTimer();

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
    };
  } catch (err) {
    showToast("Microphone not accessible");
    console.error(err);
  }
}

function updateVoiceTimer() {
  if (!isRecording) return;

  const elapsed = Date.now() - recordingStartTime;
  const seconds = Math.floor(elapsed / 1000) % 60;
  const minutes = Math.floor(elapsed / 60000);

  voiceTimer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  recordingTimer = setTimeout(updateVoiceTimer, 100);
}

voiceCancelBtn.addEventListener("click", cancelRecording);
voiceSendBtn.addEventListener("click", sendVoiceMessage);

function cancelRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  isRecording = false;
  recordingStartTime = null;

  clearTimeout(recordingTimer);
  voiceModal.classList.add("hidden");
}

async function sendVoiceMessage() {
  if (!isRecording) return;

  mediaRecorder.stop();

  mediaRecorder.ondataavailable = async (e) => {
    audioChunks.push(e.data);
    const blob = new Blob(audioChunks, { type: "audio/webm" });
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000);

    const formData = new FormData();
    formData.append("file", blob, `voice_${Date.now()}.webm`);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      data.duration = formatDuration(duration);

      socket.emit("send-message", {
        content: "",
        type: "file",
        file: data,
      });
    } catch (err) {
      showToast("Failed to send voice message");
      console.error(err);
    }

    isRecording = false;
    recordingStartTime = null;
    clearTimeout(recordingTimer);
    voiceModal.classList.add("hidden");
    audioChunks = [];
  };
}

let currentAudio = null;
let currentButton = null;

window.playAudio = function (button) {
  const player = button.closest(".voice-player");
  const currentTimeElement = player.querySelector(".voice-current-time");
  const progressFill = player.querySelector(".voice-progress-fill");

  const url = button.closest(".message-voice").dataset.audio;
  const isSameAudio =
    currentAudio &&
    currentAudio.src === new URL(url, window.location.href).href;

  // Pause previous audio
  if (currentAudio && !isSameAudio) {
    currentAudio.pause();

    if (currentButton) {
      currentButton.innerHTML = `
            <svg class="voice-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
        `;
    }
  }

  // Create audio
  if (!isSameAudio) {
    if (currentAudio) {
      currentAudio.pause();
    }

    currentAudio = new Audio(url);
  }

  // Update icon when paused
  currentAudio.onpause = () => {
    button.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
    `;
  };

  // Reset icon when audio ends
  currentAudio.onended = () => {
    button.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
    `;

    currentTimeElement.textContent = "0:00";

    progressFill.style.width = "0%";
  };

  currentAudio.ontimeupdate = () => {
    const current = Math.floor(currentAudio.currentTime);

    const minutes = Math.floor(current / 60);

    const seconds = current % 60;

    currentTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (currentAudio.duration) {
      progressFill.style.width =
        (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
    }
  };

  // Toggle play / pause
  if (currentAudio.paused) {
    currentAudio.play();
  } else {
    currentAudio.pause();

    return;
  }

  // Update icon when playing
  currentAudio.onplay = () => {
    button.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" fill="currentColor"/>
        </svg>
    `;
  };

  currentButton = button;
};

// Emoji Picker
emojiBtn.addEventListener("click", () => {
  emojiPicker.classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
    emojiPicker.classList.add("hidden");
  }
});

const emojis = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😊",
  "😎",
  "🤔",
  "😅",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "✨",
  "🎉",
  "🙏",
  "👋",
  "😊",
  "🤗",
  "😐",
  "🙄",
  "😥",
  "😢",
  "😭",
  "😮",
  "😱",
  "👻",
  "💀",
  "🤝",
  "🙏",
  "👈",
  "👉",
  "👆",
];

emojiGrid.innerHTML = emojis
  .map((emoji) => `<button class="emoji-item">${emoji}</button>`)
  .join("");

emojiGrid.addEventListener("click", (e) => {
  if (e.target.classList.contains("emoji-item")) {
    messageInput.value += e.target.textContent;
    messageInput.focus();
    updateSendButton();
    emojiPicker.classList.add("hidden");
  }
});

// Typing Indicator
socket.on("typing-update", (data) => {
  if (data.typingUsers.length > 0) {
    typingIndicator.classList.remove("hidden");
    if (data.typingUsers.length === 1) {
      typingText.textContent = `${data.typingUsers[0]} is typing...`;
    } else {
      typingText.textContent = `${data.typingUsers.join(", ")} are typing...`;
    }
  } else {
    typingIndicator.classList.add("hidden");
  }
});

// User Events
socket.on("user-joined", (data) => {
  showSystemMessage(
    `${data.user.name || data.user.username} joined the chat`,
    "join",
  );
  onlineCount.textContent = `${data.onlineCount} online`;
});

socket.on("user-left", (data) => {
  showSystemMessage(
    `${data.user.name || data.user.username} left the chat`,
    "leave",
  );
  onlineCount.textContent = `${data.onlineCount} online`;
});

socket.on("users-update", (data) => {
  renderMembersList(data.users);
  onlineCount.textContent = `${data.onlineCount} online`;
});

socket.on("kicked", (data) => {
  showToast(`You have been removed: ${data.reason}`);
  setTimeout(() => {
    location.reload();
  }, 2000);
});

socket.on("room-closed", (data) => {
  showToast(data.message);

  setTimeout(() => {
    location.reload();
  }, 3000);
});

// 👇 HOST APPROVAL POPUP
// 👇 HOST APPROVAL MODAL
socket.on("join-request", (data) => {
  console.log("🔥 JOIN REQUEST RECEIVED", data);

  if (!currentUser || !currentUser.isHost) return;

  const modal = document.getElementById("joinRequestModal");
  const reqName = document.getElementById("reqName");
  const reqUsername = document.getElementById("reqUsername");

  const acceptBtn = document.getElementById("acceptJoinBtn");
  const rejectBtn = document.getElementById("rejectJoinBtn");

  reqName.textContent = data.name;
  reqUsername.textContent = data.username;

  modal.classList.remove("hidden");

  acceptBtn.onclick = () => {
    socket.emit("approve-user", {
      socketId: data.socketId,
    });

    modal.classList.add("hidden");
  };

  rejectBtn.onclick = () => {
    socket.emit("reject-user", {
      socketId: data.socketId,
    });

    modal.classList.add("hidden");
  };
});
// ==============================
// MEMBER APPROVED BY HOST
// ==============================
socket.on("join-approved", (data) => {
  // Save current user

  console.log("JOIN APPROVED RECEIVED", data);

  currentUser = data.user;

  // Waiting overlay hide (jar future madhe asel tar)
  const waiting = document.getElementById("waiting-overlay");
  if (waiting) {
    waiting.style.display = "none";
  }

  // Join/Login screen hide
  if (typeof joinScreen !== "undefined" && joinScreen) {
    joinScreen.classList.add("hidden");
  }

  // Chat screen show
  if (typeof chatScreen !== "undefined" && chatScreen) {
    chatScreen.classList.remove("hidden");
  }

  // Load old messages
  if (typeof loadExistingMessages === "function") {
    loadExistingMessages(data.messages || []);
  } else if (Array.isArray(data.messages)) {
    messagesDiv.innerHTML = "";
    data.messages.forEach((msg) => {
      if (typeof addMessage === "function") {
        addMessage(msg, false);
      }
    });
  }

  // Update members if function exists
  if (typeof updateMembersList === "function") {
    updateMembersList();
  }

  // Success toast
  if (typeof showToast === "function") {
    showToast("✅ Host approved your request!");
  }
});

socket.on("join-rejected", (data) => {
  joinError.textContent = "❌ Your request was rejected by the host.";

  joinError.classList.remove("hidden");

  setTimeout(() => {
    location.reload();
  }, 5000);
});
// Members List
function renderMembersList(users) {
  membersList.innerHTML = "";

  users.forEach((user) => {
    const item = document.createElement("div");
    item.className = "member-item";

    const avatar = user.isHost
      ? `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="25" height="25" viewBox="0 0 20 20" style="color: rgb(28, 32, 51);"><path fill="currentColor" d="M8 2.5a.5.5 0 0 0-1 0V4h-.5A2.5 2.5 0 0 0 4 6.5V7H2.5a.5.5 0 0 0 0 1H4v1.5H2.5a.5.5 0 0 0 0 1H4V12H2.5a.5.5 0 0 0 0 1H4v.5A2.5 2.5 0 0 0 6.5 16H7v1.5a.5.5 0 0 0 1 0V16h1.5v1.5a.5.5 0 0 0 1 0V16H12v1.5a.5.5 0 0 0 1 0V16h.5a2.5 2.5 0 0 0 2.5-2.5V13h1.5a.5.5 0 0 0 0-1H16v-1.5h1.5a.5.5 0 0 0 0-1H16V8h1.5a.5.5 0 0 0 0-1H16v-.5A2.5 2.5 0 0 0 13.5 4H13V2.5a.5.5 0 0 0-1 0V4h-1.5V2.5a.5.5 0 0 0-1 0V4H8zm2.986 5.04L10.57 9h1.529a.4.4 0 0 1 .307.656l-2.658 3.19c-.293.35-.856.05-.726-.388L9.455 11H7.9a.4.4 0 0 1-.307-.657l2.668-3.188c.29-.348.85-.051.726.385"></path></svg>
  `
      : (user.name || user.username).charAt(0).toUpperCase();

    item.innerHTML = `
    <div class="member-avatar">
        ${avatar}
    </div>
            <div class="member-info">
                <div class="member-name">
    ${escapeHtml(user.name || user.username)}
    ${user.isHost ? `<span class="host-badge">DEVELOPER</span>` : ""}
</div>
${
  currentUser.isHost
    ? `<div class="member-phone">${escapeHtml(user.phone || "No Number")}</div>`
    : ""
}

                <div class="member-status">
                    <span style="color: var(--accent);">Online</span> • ${formatTime(user.joinTime)}
                </div>
            </div>
        `;

    if (currentUser.isHost && user.id !== currentUser.id) {
      // ----------------- REMOVE BUTTON -----------------
      const kickBtn = document.createElement("button");
      kickBtn.className = "icon-btn";
      kickBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
    </svg>
  `;

      kickBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        showConfirmModal({
          icon: "👤",

          title: "Remove Member",

          message: `Remove ${user.name || user.username} from the room?`,

          confirmText: "Remove",

          confirmColor: "#ef4444",

          onConfirm: () => {
            socket.emit(
              "kick-user",
              {
                socketId: user.socketId,
                reason: "Removed by host",
              },
              (response) => {
                if (response?.success) {
                  showToast("User removed");
                }
              },
            );
          },
        });
      });

      item.appendChild(kickBtn);

      // ----------------- BAN BUTTON -----------------
      const banBtn = document.createElement("button");
      banBtn.className = "icon-btn";
      banBtn.textContent = "🚫";

      banBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        showConfirmModal({
          icon: "🚫",

          title: "Ban Member",

          message: `${user.name || user.username} will be permanently banned.\n\nThis user cannot join again with the same username.`,

          confirmText: "Ban",

          confirmColor: "#dc2626",

          onConfirm: () => {
            socket.emit(
              "ban-user",
              {
                socketId: user.socketId,
              },
              (response) => {
                if (response?.success) {
                  showToast("User banned");
                } else {
                  showToast(response?.error || "Ban failed");
                }
              },
            );
          },
        });
      });

      item.appendChild(banBtn);
    }

    membersList.appendChild(item);
  });
}

// Sidebar
// Sidebar Toggle
menuToggle.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
    overlay.classList.add("hidden");
  } else {
    sidebar.classList.add("open");
    overlay.classList.remove("hidden");
  }
});

sidebarClose.addEventListener("click", () => {
  sidebar.classList.remove("open");
  overlay.classList.add("hidden");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  hostPanel.classList.remove("open");
  overlay.classList.add("hidden");
});

// Search
searchToggle.addEventListener("click", () => {
  searchBar.classList.toggle("hidden");
  if (!searchBar.classList.contains("hidden")) {
    searchInput.focus();
  }
});

searchClose.addEventListener("click", () => {
  searchBar.classList.add("hidden");
  searchInput.value = "";
  clearSearchHighlight();
});

document.addEventListener("click", (e) => {
  if (
    searchBar &&
    !searchBar.contains(e.target) &&
    !searchToggle.contains(e.target)
  ) {
    searchBar.classList.add("hidden");
  }
});

searchInput.addEventListener(
  "input",
  debounce(() => {
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
      searchMessages(query);
    } else {
      clearSearchHighlight();
    }
  }, 300),
);

function searchMessages(query) {
  clearSearchHighlight();

  const messages = messagesDiv.querySelectorAll(".message-content");

  let firstMatch = null;

  messages.forEach((msg) => {
    if (msg.textContent.toLowerCase().includes(query)) {
      msg.innerHTML = highlightText(msg.textContent, query);

      const wrapper = msg.closest(".message-wrapper");

      wrapper?.classList.add("highlighted");

      if (!firstMatch) {
        firstMatch = wrapper;
      }
    }
  });

  // Scroll to first matched message
  if (firstMatch) {
    const messagesContainer = document.querySelector(".messages-container");

    messagesContainer.scrollTo({
      top:
        firstMatch.offsetTop -
        messagesContainer.clientHeight / 2 +
        firstMatch.clientHeight / 2,

      behavior: "smooth",
    });

    firstMatch.classList.add("search-focus");

    setTimeout(() => {
      firstMatch.classList.remove("search-focus");
    }, 1500);
  }
}

function highlightText(text, query) {
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function clearSearchHighlight() {
  const marks = messagesDiv.querySelectorAll("mark");
  marks.forEach((mark) => {
    mark.outerHTML = mark.textContent;
  });
  messagesDiv.querySelectorAll(".highlighted").forEach((el) => {
    el.classList.remove("highlighted");
  });
}

// Scroll to Bottom
messagesContainer.addEventListener("scroll", () => {
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer;

  if (scrollHeight - scrollTop > clientHeight + 100) {
    scrollBottomBtn.classList.remove("hidden");
  } else {
    scrollBottomBtn.classList.add("hidden");
  }

  // 📱 WhatsApp keyboard close on scroll
  if (
    document.body.classList.contains("keyboard-open") &&
    Math.abs(messagesContainer.scrollTop) > 10
  ) {
    messageInput.blur();
  }
});

scrollBottomBtn.addEventListener("click", scrollToBottom);

function scrollToBottom(force = false) {
  requestAnimationFrame(() => {
    const distance =
      messagesContainer.scrollHeight -
      messagesContainer.scrollTop -
      messagesContainer.clientHeight;

    if (force || distance < 300) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,

        behavior: "smooth",
      });
    }
  });
}

// Host Panel
function initHostPanel() {
  const hostBtn = document.createElement("button");
  hostBtn.id = "host-toggle";
  hostBtn.className = "icon-btn";
  hostBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
        </svg>
    `;
  document.querySelector(".header-right").appendChild(hostBtn);

  hostBtn.addEventListener("click", () => {
    hostPanel.classList.add("open");
    overlay.classList.remove("hidden");
  });
}

hostPanelClose.addEventListener("click", () => {
  hostPanel.classList.remove("open");
  overlay.classList.add("hidden");
});

changePasswordBtn.addEventListener("click", () => {
  const newPassword = newPasswordInput.value;
  if (!newPassword) {
    showToast("Enter a new password");
    return;
  }

  socket.emit("change-password", { newPassword }, (response) => {
    if (response.success) {
      showToast("Password updated");
      newPasswordInput.value = "";
    }
  });
});

clearMessagesBtn.addEventListener("click", () => {
  if (confirm("Clear all messages for everyone? This cannot be undone.")) {
    socket.emit("clear-messages", {}, (response) => {
      if (response.success) {
        showToast("Messages cleared");
      }
    });
  }
});

// Leave Room
leaveBtn.addEventListener("click", () => {
  const isHost = currentUser?.isHost;

  showConfirmModal({
    icon: isHost ? "🚪" : "👋",

    title: isHost ? "Close Room" : "Leave Room",

    message: isHost
      ? "Closing the room will disconnect every member.\n\nDo you want to continue?"
      : "Are you sure you want to leave this room?",

    confirmText: isHost ? "Close Room" : "Leave",

    confirmColor: "#ef4444",

    onConfirm: () => {
      socket.disconnect();

      location.reload();
    },
  });
});
// Utility Functions
function formatTime(date) {
  const d = new Date(date);

  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showSystemMessage(text, type = "") {
  const div = document.createElement("div");
  div.className = `system-message ${type}`;
  div.textContent = text;
  messagesDiv.appendChild(div);
  scrollToBottom();
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2000);
}

function showConfirmModal({
  icon = "⚠️",
  title = "Confirmation",
  message = "Are you sure?",
  confirmText = "Confirm",
  confirmColor = "#ef4444",
  onConfirm = () => {},
}) {
  const modal = document.getElementById("confirmModal");

  const iconEl = document.getElementById("confirmIcon");
  const titleEl = document.getElementById("confirmTitle");
  const messageEl = document.getElementById("confirmMessage");

  const cancelBtn = document.getElementById("confirmCancel");
  const okBtn = document.getElementById("confirmOk");

  iconEl.textContent = icon;
  titleEl.textContent = title;
  messageEl.textContent = message;

  okBtn.textContent = confirmText;
  okBtn.style.background = confirmColor;

  modal.classList.remove("hidden");

  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  okBtn.onclick = () => {
    modal.classList.add("hidden");

    onConfirm();
  };
}

function showNotification(message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("PrivateChat Room", {
      body: message,
    });
  } else if ("Notification" in window && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

// Disconnect Handling
socket.on("disconnect", () => {
  showToast("Connection lost. Reconnecting...");
});

socket.on("connect", () => {
  if (currentUser) {
    showToast("Connected");
  }
});

window.addEventListener("beforeunload", () => {
  socket.disconnect();
});

// ==============================
// Browser Back Protection
// ==============================

const leaveRoomModal = document.getElementById("leaveModal");
const stayRoomBtn = document.getElementById("stayBtn");
const confirmLeaveBtn = document.getElementById("leaveBtn");

let allowBrowserLeave = false;

// Create one history entry
history.pushState({ page: "chat" }, "", location.href);

window.addEventListener("popstate", function () {
  if (allowBrowserLeave) return;

  // Show popup
  leaveRoomModal.classList.remove("hidden");

  // Keep user on current page
  history.pushState({ page: "chat" }, "", location.href);
});

stayRoomBtn.addEventListener("click", () => {
  leaveRoomModal.classList.add("hidden");
});

confirmLeaveBtn.addEventListener("click", () => {
  allowBrowserLeave = true;

  leaveRoomModal.classList.add("hidden");

  // Disconnect from socket
  socket.disconnect();

  // Go to Join Screen
  location.reload();
});

// =============================
// WhatsApp Keyboard Detection
// =============================
const inputArea = document.querySelector(".input-area");

function handleKeyboard() {
  if (!window.visualViewport) return;

  const keyboardHeight = window.innerHeight - window.visualViewport.height;

  const keyboardOpen = keyboardHeight > 120;

  document.body.classList.toggle("keyboard-open", keyboardOpen);

  if (keyboardOpen) {
    inputArea.style.bottom = keyboardHeight + "px";

    messagesContainer.style.paddingBottom =
      keyboardHeight + inputArea.offsetHeight + 20 + "px";

    scrollToBottom();
  } else {
    inputArea.style.bottom = "0px";

    messagesContainer.style.paddingBottom = inputArea.offsetHeight + 20 + "px";
  }
}

window.visualViewport?.addEventListener("resize", handleKeyboard);

window.addEventListener("orientationchange", handleKeyboard);

handleKeyboard();

messageInput.addEventListener("focus", () => {
  requestAnimationFrame(() => {
    scrollToBottom(true);
  });
});

contextMenu.addEventListener("click", (e) => {
  const btn = e.target.closest(".reaction-btn");

  if (!btn) return;

  console.log("Message:", selectedMessageId);
  console.log("Emoji:", btn.textContent);

  socket.emit("toggle-reaction", {
    messageId: selectedMessageId,
    emoji: btn.textContent,
  });

  contextMenu.classList.add("hidden");
});

// ==============================
// Login - Close keyboard on outside tap
// ==============================

document.addEventListener("touchstart", (e) => {
  const active = document.activeElement;

  if (
    active &&
    (active === nameInput ||
      active === usernameInput ||
      active === phoneInput ||
      active === passwordInput) &&
    !e.target.closest("input") &&
    !e.target.closest("textarea")
  ) {
    active.blur();
  }
});

// ==============================
// Dynamic Chat Bottom Padding
// ==============================

function updateChatPadding() {

    const inputArea = document.querySelector(".input-area");
    const messagesContainer = document.querySelector(".messages-container");

    if (!inputArea || !messagesContainer) return;

    const height = inputArea.offsetHeight;

    messagesContainer.style.paddingBottom =
        (height + 12) + "px";

}

window.addEventListener("load", updateChatPadding);

// Only update on orientation change
window.addEventListener("orientationchange", () => {

    setTimeout(updateChatPadding,300);

});

// Mobile keyboard support
if (window.visualViewport) {

    window.visualViewport.addEventListener("resize", () => {

        requestAnimationFrame(() => {

            updateChatPadding();

            scrollToBottom();

        });

    });

}

function scrollToBottom() {

    requestAnimationFrame(() => {

        messagesContainer.scrollTo({

            top: messagesContainer.scrollHeight,

            behavior:"smooth"

        });

    });

}
