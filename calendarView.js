import { listRecords } from "./db.js";
import { icon } from "./icons.js";

export function createCalendarView(root) {
  root.innerHTML = `
    <div class="calendarBackdrop" data-calendar-backdrop>
      <div class="calendarPanel">
        <div class="calendarHeader">
          <div class="calendarNav">
            <button class="calendarNavBtn" data-cal-prev-year>«</button>
            <button class="calendarNavBtn" data-cal-prev>‹</button>
          </div>
          <div class="calendarTitle" data-cal-title></div>
          <div class="calendarNav">
            <button class="calendarNavBtn" data-cal-next>›</button>
            <button class="calendarNavBtn" data-cal-next-year>»</button>
          </div>
        </div>
        <div class="calendarGrid" data-cal-grid></div>
      </div>
    </div>
    <div class="calendarDetailOverlay" data-cal-detail-overlay>
      <div class="calendarDetailPanel">
        <div class="calendarDetailHeader">
          <div class="calendarDetailTitle" data-cal-detail-title></div>
          <button class="calendarDetailClose" data-cal-detail-close type="button">${icon("close")}</button>
        </div>
        <div class="calendarDetailList" data-cal-detail-list></div>
      </div>
    </div>
  `;

  const backdropEl = root.querySelector("[data-calendar-backdrop]");
  const titleEl = root.querySelector("[data-cal-title]");
  const gridEl = root.querySelector("[data-cal-grid]");
  const detailOverlayEl = root.querySelector("[data-cal-detail-overlay]");
  const detailTitleEl = root.querySelector("[data-cal-detail-title]");
  const detailListEl = root.querySelector("[data-cal-detail-list]");
  const detailCloseBtn = root.querySelector("[data-cal-detail-close]");

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let records = [];
  let stampDates = new Set();

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getTodayKey() {
    return formatDateKey(new Date());
  }

  async function loadRecords() {
    records = await listRecords();
    stampDates = new Set();
    for (const record of records) {
      if (record.createdAt) {
        const date = new Date(record.createdAt);
        stampDates.add(formatDateKey(date));
      }
    }
  }

  function renderCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const todayKey = getTodayKey();

    let html = "";
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    for (const day of weekdays) {
      html += `<div class="calendarWeekday">${day}</div>`;
    }

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dateKey = formatDateKey(new Date(year, month - 1, day));
      html += `<div class="calendarDay otherMonth">${day}</div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(new Date(year, month, day));
      const hasStamp = stampDates.has(dateKey);
      const isToday = dateKey === todayKey;
      let classes = "calendarDay";
      if (hasStamp) classes += " hasStamp";
      if (isToday) classes += " today";
      html += `<div class="${classes}" data-cal-day="${dateKey}">${day}</div>`;
    }

    const remainingCells = 42 - (startDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      html += `<div class="calendarDay otherMonth">${day}</div>`;
    }

    gridEl.innerHTML = html;
    titleEl.textContent = `${year}年${month + 1}月`;
  }

  function showDetail(dateKey) {
    const date = new Date(dateKey);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    detailTitleEl.textContent = `${month}月${day}日 打卡记录`;

    const dayRecords = records.filter(record => {
      if (!record.createdAt) return false;
      return formatDateKey(new Date(record.createdAt)) === dateKey;
    });

    if (dayRecords.length === 0) {
      detailListEl.innerHTML = `<div class="calendarDetailEmpty">当日无打卡记录</div>`;
    } else {
      detailListEl.innerHTML = dayRecords.map(record => {
        const location = record.address || record.province || record.country || "未知地点";
        return `
          <div class="calendarDetailItem">
            <div class="calendarDetailItemTitle">${escapeHtml(record.title || "未命名")}</div>
            <div class="calendarDetailItemLocation">📍 ${escapeHtml(location)}</div>
          </div>
        `;
      }).join("");
    }

    detailOverlayEl.classList.add("isOpen");
  }

  function closeDetail() {
    detailOverlayEl.classList.remove("isOpen");
  }

  function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  }

  function changeYear(delta) {
    currentYear += delta;
    renderCalendar(currentYear, currentMonth);
  }

  function bind() {
    backdropEl.addEventListener("click", (e) => {
      if (e.target === backdropEl) {
        close();
      }
    });

    root.querySelector("[data-cal-prev]").addEventListener("click", () => changeMonth(-1));
    root.querySelector("[data-cal-next]").addEventListener("click", () => changeMonth(1));
    root.querySelector("[data-cal-prev-year]").addEventListener("click", () => changeYear(-1));
    root.querySelector("[data-cal-next-year]").addEventListener("click", () => changeYear(1));

    gridEl.addEventListener("click", (e) => {
      const dayEl = e.target.closest("[data-cal-day]");
      if (dayEl) {
        const dateKey = dayEl.getAttribute("data-cal-day");
        if (stampDates.has(dateKey)) {
          showDetail(dateKey);
        }
      }
    });

    detailCloseBtn.addEventListener("click", closeDetail);
    detailOverlayEl.addEventListener("click", (e) => {
      if (e.target === detailOverlayEl) {
        closeDetail();
      }
    });
  }

  bind();

  async function open() {
    await loadRecords();
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderCalendar(currentYear, currentMonth);
    backdropEl.classList.add("isOpen");
  }

  function close() {
    backdropEl.classList.remove("isOpen");
    closeDetail();
  }

  return {
    open,
    close,
    async refresh() {
      await loadRecords();
      renderCalendar(currentYear, currentMonth);
    }
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}