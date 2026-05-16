import { icon } from "./icons.js"
import { createMapView } from "./mapView.js"
import { createSettingsView } from "./settingsView.js"
import { createCalendarView } from "./calendarView.js"

const appEl = document.getElementById("app")

appEl.innerHTML = `
  <div class="app">
    <div class="topbar">
      <div class="brand">
        <div class="brandMark"></div>
        <div class="brandName">去盖章！GO GO GO</div>
      </div>
      <div class="nav">
        <button class="btn btnPrimary" data-nav="map" title="地图">${icon("pin")}地图</button>
        <button class="btn" data-nav="calendar" title="日历">${icon("calendar")}日历</button>
        <button class="btn" data-nav="locate" title="定位">${icon("locate")}定位</button>
      </div>
    </div>
    <div class="content">
        <div id="view-map" class="view"></div>
        <div id="view-settings"></div>
        <div id="view-calendar"></div>
        <div id="toast" class="toast"></div>
      </div>
  </div>
`

const toastEl = document.getElementById("toast")
let toastTimer = null

export function toast(msg, { ms = 1800 } = {}) {
  toastEl.textContent = msg
  toastEl.classList.add("isOn")
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove("isOn"), ms)
}

const mapRoot = document.getElementById("view-map")
const settingsRoot = document.getElementById("view-settings")
const calendarRoot = document.getElementById("view-calendar")

const mapView = createMapView(mapRoot, { toast, navigate, openSettings })
const settingsView = createSettingsView(settingsRoot, { toast, onDataCleared: () => {
  mapView.clearAllMarkers()
} })
const calendarView = createCalendarView(calendarRoot)

function setActive(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("isActive"))
  const el = document.getElementById(`view-${name}`)
  if (el) {
    el.classList.add("isActive")
  }
  document.querySelectorAll("[data-nav]").forEach((b) => {
    const on = b.getAttribute("data-nav") === name
    b.classList.toggle("btnPrimary", on)
  })
}

function navigate(name) {
  location.hash = name === "map" ? "#/" : `#/${name}`
}

function openSettings() {
  settingsView.open()
}

async function syncViews(route) {
  setActive("map")
  await mapView.onShow()
}

function handleNavClick(name) {
  if (name === "calendar") {
    calendarView.open()
  } else if (name === "locate") {
    mapView.locateAndAddMarker()
  } else if (name === "map") {
    navigate(name)
  }
}

function routeFromHash() {
  return "map"
}

document.querySelectorAll("[data-nav]").forEach((b) => {
  b.addEventListener("click", () => handleNavClick(b.getAttribute("data-nav")))
})

window.addEventListener("hashchange", () => syncViews(routeFromHash()))

syncViews(routeFromHash())
