export const countries = [
  "中国", "日本", "韩国", "美国", "英国", "法国", "德国", "意大利", 
  "西班牙", "加拿大", "澳大利亚", "泰国", "越南", "新加坡", "马来西亚",
  "印度尼西亚", "印度", "俄罗斯", "荷兰", "瑞士", "瑞典", "挪威",
  "丹麦", "芬兰", "比利时", "奥地利", "葡萄牙", "希腊", "土耳其",
  "埃及", "南非", "巴西", "阿根廷", "墨西哥", "其他"
]

export const provinces = [
  "北京市", "天津市", "河北省", "山西省", "内蒙古自治区",
  "辽宁省", "吉林省", "黑龙江省",
  "上海市", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省",
  "河南省", "湖北省", "湖南省",
  "广东省", "广西壮族自治区", "海南省",
  "重庆市", "四川省", "贵州省", "云南省", "西藏自治区",
  "陕西省", "甘肃省", "青海省", "宁夏回族自治区", "新疆维吾尔自治区",
  "香港特别行政区", "澳门特别行政区", "台湾省"
]

export function createPokeballIcon(size = 32) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  const center = size / 2
  const outerRadius = size / 2 - 1
  
  // 像素大小
  const pixelSize = Math.max(2, Math.floor(size / 12))
  
  // 绘制像素风格的红白球
  for (let y = 0; y < size; y += pixelSize) {
    for (let x = 0; x < size; x += pixelSize) {
      const dx = x - center
      const dy = y - center
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance <= outerRadius) {
        // 上半部分 - 红色
        ctx.fillStyle = dy < 0 ? "#FF4757" : "#FFFFFF"
        ctx.fillRect(x, y, pixelSize, pixelSize)
      }
    }
  }
  
  // 黑色分割线（像素风格）
  const lineY = center
  ctx.fillStyle = "#333333"
  ctx.fillRect(0, lineY - pixelSize / 2, size, pixelSize)
  
  // 中心按钮（像素风格）
  const buttonSize = Math.floor(size * 0.3)
  
  // 按钮外圈 - 黑色
  ctx.fillStyle = "#333333"
  ctx.beginPath()
  ctx.arc(center, center, buttonSize / 2 + 1, 0, Math.PI * 2)
  ctx.fill()
  
  // 按钮内圈 - 白色
  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.arc(center, center, buttonSize / 2 - 1, 0, Math.PI * 2)
  ctx.fill()
  
  // 按钮中心 - 浅灰
  ctx.fillStyle = "#CCCCCC"
  ctx.beginPath()
  ctx.arc(center, center, buttonSize / 4, 0, Math.PI * 2)
  ctx.fill()
  
  // 轮廓线（像素风格黑色边框）
  ctx.strokeStyle = "#333333"
  ctx.lineWidth = pixelSize
  ctx.beginPath()
  ctx.arc(center, center, outerRadius - pixelSize / 2, 0, Math.PI * 2)
  ctx.stroke()
  
  return canvas.toDataURL("image/png")
}

export function createMasterballIcon(size = 32) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  const center = size / 2
  const outerRadius = size / 2 - 1
  
  // 像素大小
  const pixelSize = Math.max(2, Math.floor(size / 12))
  
  // 绘制像素风格的大师球（紫色、粉色、白色）
  for (let y = 0; y < size; y += pixelSize) {
    for (let x = 0; x < size; x += pixelSize) {
      const dx = x - center
      const dy = y - center
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance <= outerRadius) {
        // 上半部分 - 紫色，下半部分 - 白色
        ctx.fillStyle = dy < 0 ? "#7B2CBF" : "#FFFFFF"
        ctx.fillRect(x, y, pixelSize, pixelSize)
      }
    }
  }
  
  // 黑色分割线（像素风格）
  const lineY = center
  ctx.fillStyle = "#333333"
  ctx.fillRect(0, lineY - pixelSize / 2, size, pixelSize)
  
  // 中心按钮（像素风格）
  const buttonSize = Math.floor(size * 0.3)
  
  // 按钮外圈 - 黑色
  ctx.fillStyle = "#333333"
  ctx.beginPath()
  ctx.arc(center, center, buttonSize / 2 + 1, 0, Math.PI * 2)
  ctx.fill()
  
  // 按钮内圈 - 白色
  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.arc(center, center, buttonSize / 2 - 1, 0, Math.PI * 2)
  ctx.fill()
  
  // 按钮中心 - 浅紫
  ctx.fillStyle = "#9B59B6"
  ctx.beginPath()
  ctx.arc(center, center, buttonSize / 4, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制粉色装饰圆点（大师球特征）
  const dotRadius = Math.floor(size * 0.12)
  const dotOffset = Math.floor(size * 0.22)
  
  ctx.fillStyle = "#FF6B9D"
  ctx.beginPath()
  ctx.arc(center - dotOffset, center - dotOffset / 2, dotRadius, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(center + dotOffset, center - dotOffset / 2, dotRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 粉色圆点边框
  ctx.strokeStyle = "#333333"
  ctx.lineWidth = pixelSize / 2
  ctx.beginPath()
  ctx.arc(center - dotOffset, center - dotOffset / 2, dotRadius - pixelSize / 2, 0, Math.PI * 2)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(center + dotOffset, center - dotOffset / 2, dotRadius - pixelSize / 2, 0, Math.PI * 2)
  ctx.stroke()
  
  // 轮廓线（像素风格黑色边框）
  ctx.strokeStyle = "#333333"
  ctx.lineWidth = pixelSize
  ctx.beginPath()
  ctx.arc(center, center, outerRadius - pixelSize / 2, 0, Math.PI * 2)
  ctx.stroke()
  
  return canvas.toDataURL("image/png")
}

// 保留旧函数名作为别名
export function createStampIcon(size = 32, color = "#FF4757") {
  return createPokeballIcon(size)
}

export function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  a[6] = (a[6] & 0x0f) | 0x40
  a[8] = (a[8] & 0x3f) | 0x80
  const hex = [...a].map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function fmtTime(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function fmtDate(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function debounce(fn, wait = 200) {
  let t = null
  return (...args) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

export async function fileToImageBitmap(file) {
  const blobUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = blobUrl
    })
    const bitmap = await createImageBitmap(img)
    return bitmap
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export async function compressImage(file, { max = 1600, quality = 0.86 } = {}) {
  const bitmap = await fileToImageBitmap(file)
  const w0 = bitmap.width
  const h0 = bitmap.height
  const s = Math.min(1, max / Math.max(w0, h0))
  if (s === 1 && file.size <= 1_800_000) return file
  const w = Math.max(1, Math.round(w0 * s))
  const h = Math.max(1, Math.round(h0 * s))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" })
}

export function wrapLines(ctx, text, maxWidth) {
  const t = (text ?? "").trim()
  if (!t) return []
  const chunks = t.split(/\s+/)
  const lines = []
  let cur = ""
  for (const c of chunks) {
    const next = cur ? `${cur} ${c}` : c
    if (ctx.measureText(next).width <= maxWidth) {
      cur = next
    } else {
      if (cur) lines.push(cur)
      if (ctx.measureText(c).width <= maxWidth) {
        cur = c
      } else {
        let s = ""
        for (const ch of c) {
          const n2 = s + ch
          if (ctx.measureText(n2).width <= maxWidth) {
            s = n2
          } else {
            if (s) lines.push(s)
            s = ch
          }
        }
        cur = s
      }
    }
  }
  if (cur) lines.push(cur)
  return lines
}
