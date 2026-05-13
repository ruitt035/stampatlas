import { listRecords } from "./db.js"
import { renderLongImage } from "./exporter.js"
import { icon } from "./icons.js"

export function createExportView(root, { toast, navigate }) {
  root.innerHTML = `
    <div class="page">
      <div class="pageBody">
        <div class="panel">
          <div class="panelTitle">
            <div>
              <h1>长图导出</h1>
              <p>在手机端下载后，可到相册保存/分享</p>
            </div>
          </div>
          <div class="exportPreview">
            <img data-preview alt="" />
          </div>
        </div>
      </div>
      <div class="pageFooter">
        <div class="footerGroup">
          <div class="fine">倍率</div>
          <select data-scale>
            <option value="1">1x</option>
            <option value="2">2x</option>
          </select>
          <div class="fine">主题</div>
          <select data-theme>
            <option value="blue">淡蓝</option>
            <option value="purple">淡紫</option>
          </select>
        </div>
        <div class="footerGroup">
          <button class="btn" data-rebuild type="button">重新生成</button>
          <button class="btn btnPrimary" data-download type="button">${icon("export")}下载 PNG</button>
        </div>
      </div>
    </div>
  `

  const previewEl = root.querySelector("[data-preview]")
  const scaleEl = root.querySelector("[data-scale]")
  const themeEl = root.querySelector("[data-theme]")
  const rebuildBtn = root.querySelector("[data-rebuild]")
  const downloadBtn = root.querySelector("[data-download]")

  let lastCanvas = null
  let busy = false

  async function rebuild({ silent = false } = {}) {
    if (busy) return
    busy = true
    rebuildBtn.disabled = true
    downloadBtn.disabled = true
    try {
      const records = await listRecords()
      if (!records.length) {
        previewEl.removeAttribute("src")
        toast("还没有记录：先去地图页添加")
        return
      }
      const canvas = await renderLongImage(records, {
        scale: Number(scaleEl.value || 1),
        theme: themeEl.value || "blue",
      })
      lastCanvas = canvas
      previewEl.src = canvas.toDataURL("image/png")
      if (!silent) toast("长图已生成")
    } catch (_) {
      toast("生成失败：请稍后重试")
    } finally {
      busy = false
      rebuildBtn.disabled = false
      downloadBtn.disabled = false
    }
  }

  async function download() {
    if (!lastCanvas) {
      await rebuild({ silent: true })
      if (!lastCanvas) return
    }
    const blob = await new Promise((resolve) => lastCanvas.toBlob(resolve, "image/png"))
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stamp-atlas-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 800)
    toast("已开始下载")
  }

  rebuildBtn.addEventListener("click", () => rebuild())
  downloadBtn.addEventListener("click", download)
  scaleEl.addEventListener("change", () => rebuild({ silent: true }))
  themeEl.addEventListener("change", () => rebuild({ silent: true }))

  return {
    async onShow() {
      await rebuild({ silent: true })
    },
  }
}

