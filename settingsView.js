import { clearAll, exportJson, importJson } from "./db.js"
import { icon } from "./icons.js"

export function createSettingsView(root, { toast, navigate }) {
  root.innerHTML = `
    <div class="page">
      <div class="pageBody">
        <div class="panel" style="display:flex; flex-direction:column; gap:14px">
          <div class="panelTitle">
            <div>
              <h1>设置</h1>
              <p>数据仅保存在本机浏览器（IndexedDB），不上传服务器</p>
            </div>
          </div>

          <div class="panel" style="box-shadow:none; background:rgba(244,246,251,.55)">
            <div class="panelTitle" style="margin-bottom:8px">
              <div>
                <h1 style="font-size:12px">数据导出</h1>
                <p>用于备份或迁移到另一台设备</p>
              </div>
            </div>
            <div class="footerGroup" style="justify-content:space-between">
              <button class="btn btnPrimary" data-json-export type="button">${icon("export")}导出 JSON</button>
              <div class="fine">图片将以内嵌方式导出，文件可能较大</div>
            </div>
          </div>

          <div class="panel" style="box-shadow:none; background:rgba(244,246,251,.55)">
            <div class="panelTitle" style="margin-bottom:8px">
              <div>
                <h1 style="font-size:12px">数据导入</h1>
                <p>从导出的 JSON 恢复；可选择合并或覆盖</p>
              </div>
            </div>
            <div class="footerGroup" style="justify-content:space-between">
              <div class="footerGroup">
                <select data-import-mode>
                  <option value="merge">合并（推荐）</option>
                  <option value="replace">覆盖</option>
                </select>
                <label class="btn" style="cursor:pointer">
                  ${icon("image")}选择文件
                  <input data-json-file type="file" accept="application/json" style="display:none" />
                </label>
              </div>
              <button class="btn" data-json-import type="button">导入</button>
            </div>
            <div class="fine" data-import-name style="margin-top:8px"></div>
          </div>

          <div class="panel" style="box-shadow:none; background:rgba(244,246,251,.55)">
            <div class="panelTitle" style="margin-bottom:8px">
              <div>
                <h1 style="font-size:12px">清空本地数据</h1>
                <p>不可恢复，请谨慎</p>
              </div>
            </div>
            <div class="footerGroup" style="justify-content:space-between">
              <button class="btn btnDanger" data-clear type="button">${icon("trash")}清空</button>
              <div class="fine">建议先导出备份</div>
            </div>
          </div>

          <div class="fine" style="line-height:1.65">
            隐私说明：本应用不包含登录、不收集个人信息、不向服务器发送记录与图片。你添加的坐标与文字、图片仅存储在浏览器本地数据库中；清理浏览器数据可能导致记录被删除。
          </div>
        </div>
      </div>
      <div class="pageFooter">
        <div class="fine">若导入/导出失败，尝试换用桌面浏览器操作</div>
        <button class="btn" type="button" data-back>${icon("pin")}返回地图</button>
      </div>
    </div>
  `

  const exportBtn = root.querySelector("[data-json-export]")
  const fileEl = root.querySelector("[data-json-file]")
  const importBtn = root.querySelector("[data-json-import]")
  const importNameEl = root.querySelector("[data-import-name]")
  const modeEl = root.querySelector("[data-import-mode]")
  const clearBtn = root.querySelector("[data-clear]")
  const backBtn = root.querySelector("[data-back]")

  let pendingFile = null

  exportBtn.addEventListener("click", async () => {
    try {
      const data = await exportJson()
      const blob = new Blob([JSON.stringify(data)], { type: "application/json;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `stamp-atlas-backup-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 800)
      toast("已开始导出")
    } catch (_) {
      toast("导出失败")
    }
  })

  fileEl.addEventListener("change", () => {
    pendingFile = fileEl.files?.[0] ?? null
    importNameEl.textContent = pendingFile ? `已选择：${pendingFile.name}` : ""
  })

  importBtn.addEventListener("click", async () => {
    if (!pendingFile) {
      toast("请先选择 JSON 文件")
      return
    }
    importBtn.disabled = true
    try {
      const text = await pendingFile.text()
      const data = JSON.parse(text)
      await importJson(data, { mode: modeEl.value || "merge" })
      toast("导入完成")
      pendingFile = null
      fileEl.value = ""
      importNameEl.textContent = ""
    } catch (_) {
      toast("导入失败：请确认文件来源")
    } finally {
      importBtn.disabled = false
    }
  })

  clearBtn.addEventListener("click", async () => {
    const ok = confirm("确定要清空本地所有记录与图片吗？此操作不可恢复。")
    if (!ok) return
    clearBtn.disabled = true
    try {
      await clearAll()
      toast("已清空")
    } catch (_) {
      toast("清空失败")
    } finally {
      clearBtn.disabled = false
    }
  })

  backBtn.addEventListener("click", () => navigate("map"))

  return {
    async onShow() {
    },
  }
}

