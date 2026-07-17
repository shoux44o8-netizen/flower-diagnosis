"use strict";

/* =====================================================
   SETTINGS
===================================================== */

const searchParams =
  new URLSearchParams(window.location.search);

const isTestMode =
  searchParams.get("mode") === "test";

const ADMIN_API_URL =
  isTestMode
    ? "/api/admin-test"
    : "/api/admin";

const ADMIN_PIN_SESSION_KEY =
  "weddingLotteryAdminPin";

const HOLD_DURATION_MS = 3000;

const AUTO_REFRESH_INTERVAL_MS =
  15000;

const CELEBRATION_DURATION_MS =
  3500;


/* =====================================================
   ELEMENTS
===================================================== */

const loginCard =
  document.getElementById("loginCard");

const adminDashboard =
  document.getElementById("adminDashboard");

const adminPinInput =
  document.getElementById("adminPin");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");

const eventName =
  document.getElementById("eventName");

const statusBadge =
  document.getElementById("statusBadge");

const startsAt =
  document.getElementById("startsAt");

const endsAt =
  document.getElementById("endsAt");

const drawStatus =
  document.getElementById("drawStatus");

const participantCount =
  document.getElementById(
    "participantCount"
  );

const sandersoniaCount =
  document.getElementById(
    "sandersoniaCount"
  );

const refreshButton =
  document.getElementById("refreshButton");

const statusMessage =
  document.getElementById("statusMessage");

const drawCard =
  document.getElementById("drawCard");

const drawButton =
  document.getElementById("drawButton");

const drawMainText =
  drawButton?.querySelector(
    ".draw-main-text"
  );

const drawSubText =
  drawButton?.querySelector(
    ".draw-sub-text"
  );

const drawMessage =
  document.getElementById("drawMessage");

const emptyWinnerMessage =
  document.getElementById(
    "emptyWinnerMessage"
  );

const winnersContainer =
  document.getElementById("winners");

const resetRehearsalButton =
  document.getElementById(
    "resetRehearsalButton"
  );

const logoutButton =
  document.getElementById("logoutButton");

const celebrationOverlay =
  document.getElementById(
    "celebrationOverlay"
  );

const modeLabel =
  document.getElementById(
    "modeLabel"
  );

const subtitle =
  document.querySelector(
    ".admin-subtitle"
  );


/* =====================================================
   STATE
===================================================== */

let currentPin = "";

let latestStatus = null;

let autoRefreshTimer = null;

let holdTimer = null;

let holdAnimationFrame = null;

let holdStartedAt = 0;

let drawIsRunning = false;

let statusIsLoading = false;


/* =====================================================
   COMMON UTILITIES
===================================================== */

function setMessage(
  element,
  text,
  type = ""
) {
  if (!element) {
    return;
  }

  element.textContent = text;

  element.className =
    `message ${type}`.trim();
}


function formatJapanDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  ).format(date);
}


function safelyGetErrorMessage(
  error,
  fallback
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}


/* =====================================================
   ADMIN API
===================================================== */

async function callAdminApi(action) {
  const response =
    await fetch(
      ADMIN_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        cache: "no-store",

        body: JSON.stringify({
          pin: currentPin,
          action
        })
      }
    );

  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "管理サーバーから正しい応答を受け取れませんでした。"
    );
  }

  if (
    !response.ok ||
    !result.ok
  ) {
    const error =
      new Error(
        result.message ||
        "管理操作に失敗しました。"
      );

    error.code =
      result.code ||
      "ADMIN_ERROR";

    throw error;
  }

  return result;
}


/* =====================================================
   EVENT STATUS
===================================================== */

function getEventState(event) {
  const now = new Date();

  const start =
    event.starts_at
      ? new Date(event.starts_at)
      : null;

  const end =
    event.ends_at
      ? new Date(event.ends_at)
      : null;

  if (event.draw_finished) {
    return {
      label: "抽選完了",
      className: "closed",
      canDraw: false
    };
  }

  if (!event.is_open) {
    return {
      label: "受付終了",
      className: "closed",
      canDraw: false
    };
  }

  if (
    start &&
    now < start
  ) {
    return {
      label: "本番開始前",
      className: "waiting",
      canDraw: false
    };
  }

  if (
    end &&
    now >= end
  ) {
    return {
      label: "最終締切後",
      className: "closed",

      /*
        最終締切後でも、
        抽選が未実施なら手動抽選可能です。
      */
      canDraw: true
    };
  }

  return {
    label: "本番受付中",
    className: "open",
    canDraw: true
  };
}


/* =====================================================
   WINNERS
===================================================== */

function renderWinners(winners) {
  if (
    !winnersContainer ||
    !emptyWinnerMessage
  ) {
    return;
  }

  winnersContainer.innerHTML = "";

  if (
    !Array.isArray(winners) ||
    winners.length === 0
  ) {
    emptyWinnerMessage.classList.remove(
      "hidden"
    );

    return;
  }

  emptyWinnerMessage.classList.add(
    "hidden"
  );

  const sortedWinners =
    [...winners].sort(
      (a, b) =>
        Number(a.winner_number) -
        Number(b.winner_number)
    );

  sortedWinners.forEach(
    (winner) => {
      const item =
        document.createElement("div");

      item.className = "winner";

      const number =
        document.createElement("span");

      number.className =
        "winner-number";

      number.textContent =
        String(
          winner.winner_number ?? "—"
        );

      const name =
        document.createElement("span");

      name.className =
        "winner-name";

      name.textContent =
        winner.guest_name ||
        "お名前未登録";

      item.appendChild(number);
      item.appendChild(name);

      winnersContainer.appendChild(item);
    }
  );
}


/* =====================================================
   DRAW BUTTON
===================================================== */

function setDrawButtonReady() {
  if (
    !drawButton ||
    !drawMainText ||
    !drawSubText
  ) {
    return;
  }

  drawButton.disabled = false;

  drawMainText.textContent =
    "3秒長押しで抽選";

  drawSubText.textContent =
    "受付終了と抽選を同時に実行します";
}


function setDrawButtonDisabled(
  mainText,
  subText
) {
  if (
    !drawButton ||
    !drawMainText ||
    !drawSubText
  ) {
    return;
  }

  drawButton.disabled = true;

  drawMainText.textContent =
    mainText;

  drawSubText.textContent =
    subText;
}


function updateDrawButtonState(result) {
  if (
    !result ||
    !result.event
  ) {
    setDrawButtonDisabled(
      "状況を確認できません",
      "最新情報へ更新してください"
    );

    return;
  }

  const event =
    result.event;

  const eventState =
    getEventState(event);

  const sandersoniaTotal =
    Number(
      result.sandersoniaCount || 0
    );

  if (event.draw_finished) {
    setDrawButtonDisabled(
      "抽選は完了しています",
      "再抽選はできません"
    );

    return;
  }

  if (
    eventState.label ===
    "本番開始前"
  ) {
    setDrawButtonDisabled(
      "本番開始前です",
      "2026年9月19日10:00から受付開始"
    );

    return;
  }

  if (!event.is_open) {
    setDrawButtonDisabled(
      "受付は終了しています",
      "抽選状態を確認してください"
    );

    return;
  }

  if (
    sandersoniaTotal === 0
  ) {
    setDrawButtonDisabled(
      "抽選対象者がいません",
      "サンダーソニアの参加者をお待ちください"
    );

    return;
  }

  setDrawButtonReady();
}


/* =====================================================
   RENDER STATUS
===================================================== */

function renderStatus(result) {
  latestStatus = result;

  const event = result.event;

  eventName.textContent =
    event.name || "—";

  participantCount.textContent =
    String(
      result.totalParticipants ?? 0
    );

  sandersoniaCount.textContent =
    String(
      result.sandersoniaCount ?? 0
    );

  startsAt.textContent =
    formatJapanDateTime(
      event.starts_at
    );

  endsAt.textContent =
    formatJapanDateTime(
      event.ends_at
    );

  drawStatus.textContent =
    event.draw_finished
      ? "抽選完了・再抽選不可"
      : "未抽選";

  const eventState =
    getEventState(event);

  statusBadge.textContent =
    eventState.label;

  statusBadge.className =
    `status-badge ${eventState.className}`;

  renderWinners(
    result.winners
  );

  updateDrawButtonState(result);

  loginCard.classList.add(
    "hidden"
  );

  adminDashboard.classList.remove(
    "hidden"
  );
}


/* =====================================================
   LOGIN AND STATUS LOADING
===================================================== */

async function loadStatus(options = {}) {
  const {
    silent = false
  } = options;

  if (statusIsLoading) {
    return;
  }

  const inputPin =
    adminPinInput.value.trim();

  if (inputPin) {
    currentPin = inputPin;
  }

  if (!currentPin) {
    setMessage(
      loginMessage,
      "管理PINを入力してください。",
      "error"
    );

    return;
  }

  statusIsLoading = true;

  loginButton.disabled = true;
  refreshButton.disabled = true;

  if (!silent) {
    setMessage(
      loginMessage,
      "管理情報を確認しています。"
    );

    setMessage(
      statusMessage,
      "最新状況を取得しています。"
    );
  }

  try {
    const result =
      await callAdminApi("status");

    sessionStorage.setItem(
      ADMIN_PIN_SESSION_KEY,
      currentPin
    );

    renderStatus(result);

    if (!silent) {
      setMessage(
        loginMessage,
        "",
        "success"
      );

      setMessage(
        statusMessage,
        "最新の情報です。",
        "success"
      );
    }

    startAutoRefresh();
  } catch (error) {
    if (
      error.code ===
      "INVALID_PIN"
    ) {
      currentPin = "";

      sessionStorage.removeItem(
        ADMIN_PIN_SESSION_KEY
      );

      adminDashboard.classList.add(
        "hidden"
      );

      loginCard.classList.remove(
        "hidden"
      );

      adminPinInput.focus();
    }

    if (!silent) {
      setMessage(
        loginMessage,
        safelyGetErrorMessage(
          error,
          "管理情報を取得できませんでした。"
        ),
        "error"
      );

      setMessage(
        statusMessage,
        safelyGetErrorMessage(
          error,
          "管理情報を取得できませんでした。"
        ),
        "error"
      );
    }
  } finally {
    statusIsLoading = false;

    loginButton.disabled = false;
    refreshButton.disabled = false;
  }
}


/* =====================================================
   AUTO REFRESH
===================================================== */

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    window.clearInterval(
      autoRefreshTimer
    );

    autoRefreshTimer = null;
  }
}


function startAutoRefresh() {
  stopAutoRefresh();

  autoRefreshTimer =
    window.setInterval(
      () => {
        if (
          currentPin &&
          document.visibilityState ===
            "visible" &&
          !drawIsRunning
        ) {
          loadStatus({
            silent: true
          });
        }
      },
      AUTO_REFRESH_INTERVAL_MS
    );
}


/* =====================================================
   LONG PRESS
===================================================== */

function resetHoldProgress() {
  if (holdTimer) {
    window.clearTimeout(
      holdTimer
    );

    holdTimer = null;
  }

  if (holdAnimationFrame) {
    window.cancelAnimationFrame(
      holdAnimationFrame
    );

    holdAnimationFrame = null;
  }

  holdStartedAt = 0;

  drawButton.style.setProperty(
    "--hold-progress",
    "0%"
  );
}


function updateHoldProgress() {
  if (!holdStartedAt) {
    return;
  }

  const elapsed =
    performance.now() -
    holdStartedAt;

  const progress =
    Math.min(
      elapsed /
      HOLD_DURATION_MS,
      1
    );

  drawButton.style.setProperty(
    "--hold-progress",
    `${progress * 100}%`
  );

  if (progress < 1) {
    holdAnimationFrame =
      window.requestAnimationFrame(
        updateHoldProgress
      );
  }
}


function startDrawHold(event) {
  if (
    drawIsRunning ||
    drawButton.disabled
  ) {
    return;
  }

  event.preventDefault();

  resetHoldProgress();

  holdStartedAt =
    performance.now();

  updateHoldProgress();

  setMessage(
    drawMessage,
    "そのまま長押ししてください。"
  );

  holdTimer =
    window.setTimeout(
      executeDraw,
      HOLD_DURATION_MS
    );
}


function cancelDrawHold() {
  if (drawIsRunning) {
    return;
  }

  if (holdStartedAt) {
    setMessage(
      drawMessage,
      "長押しが途中で解除されました。"
    );
  }

  resetHoldProgress();
}


/* =====================================================
   DRAW
===================================================== */

async function executeDraw() {
  if (
    drawIsRunning ||
    drawButton.disabled
  ) {
    return;
  }

  drawIsRunning = true;

  resetHoldProgress();

  drawButton.disabled = true;
  refreshButton.disabled = true;

  setMessage(
    drawMessage,
    "受付を締め切り、抽選しています。"
  );

  try {
    const result =
      await callAdminApi("draw");

    renderStatus(result);

    setMessage(
      drawMessage,
      result.message ||
      "抽選を完了しました。",
      "success"
    );

    showCelebration();

    if ("vibrate" in navigator) {
      navigator.vibrate([
        100,
        80,
        180
      ]);
    }
  } catch (error) {
    updateDrawButtonState(
      latestStatus
    );

    setMessage(
      drawMessage,
      safelyGetErrorMessage(
        error,
        "抽選を実行できませんでした。"
      ),
      "error"
    );
  } finally {
    drawIsRunning = false;
    refreshButton.disabled = false;

    resetHoldProgress();
  }
}


/* =====================================================
   CELEBRATION
===================================================== */

function showCelebration() {
  if (!celebrationOverlay) {
    return;
  }

  celebrationOverlay.classList.remove(
    "hidden"
  );

  celebrationOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  window.setTimeout(
    hideCelebration,
    CELEBRATION_DURATION_MS
  );
}


function hideCelebration() {
  if (!celebrationOverlay) {
    return;
  }

  celebrationOverlay.classList.add(
    "hidden"
  );

  celebrationOverlay.setAttribute(
    "aria-hidden",
    "true"
  );
}


/* =====================================================
   LOGOUT
===================================================== */

function logoutAdmin() {
  stopAutoRefresh();
  resetHoldProgress();

  currentPin = "";
  latestStatus = null;

  sessionStorage.removeItem(
    ADMIN_PIN_SESSION_KEY
  );

  adminPinInput.value = "";

  adminDashboard.classList.add(
    "hidden"
  );

  loginCard.classList.remove(
    "hidden"
  );

  setMessage(
    loginMessage,
    "管理画面を閉じました。"
  );

  setMessage(
    statusMessage,
    ""
  );

  setMessage(
    drawMessage,
    ""
  );

  winnersContainer.innerHTML = "";

  emptyWinnerMessage.classList.remove(
    "hidden"
  );

  adminPinInput.focus();
}


/* =====================================================
   EVENT LISTENERS
===================================================== */

loginButton.addEventListener(
  "click",
  () => {
    loadStatus();
  }
);


refreshButton.addEventListener(
  "click",
  () => {
    loadStatus();
  }
);


adminPinInput.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      loadStatus();
    }
  }
);


logoutButton.addEventListener(
  "click",
  logoutAdmin
);


drawButton.addEventListener(
  "pointerdown",
  startDrawHold
);


drawButton.addEventListener(
  "pointerup",
  cancelDrawHold
);


drawButton.addEventListener(
  "pointercancel",
  cancelDrawHold
);


drawButton.addEventListener(
  "pointerleave",
  cancelDrawHold
);


drawButton.addEventListener(
  "contextmenu",
  (event) => {
    event.preventDefault();
  }
);


celebrationOverlay.addEventListener(
  "click",
  hideCelebration
);


document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.visibilityState ===
        "visible" &&
      currentPin &&
      !drawIsRunning
    ) {
      loadStatus({
        silent: true
      });
    }
  }
);


/* =====================================================
   INITIALIZE
===================================================== */

function initializeAdminPage() {
   if (isTestMode) {

  document.title =
    "Wedding Lottery Rehearsal";

  if (modeLabel) {
    modeLabel.textContent =
      "REHEARSAL MODE";
  }

  if (subtitle) {
    subtitle.innerHTML =
      "🟠 リハーサルモード<br>本番データには影響しません";
  }

}
  setDrawButtonDisabled(
    "状況確認後に操作できます",
    "管理PINを入力してください"
  );

  const savedSessionPin =
    sessionStorage.getItem(
      ADMIN_PIN_SESSION_KEY
    );

  if (savedSessionPin) {
    currentPin =
      savedSessionPin;

    adminPinInput.value =
      savedSessionPin;

    loadStatus();
  } else {
    adminPinInput.focus();
  }
}

initializeAdminPage();
