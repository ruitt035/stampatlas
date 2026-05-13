import { fmtTime, wrapLines } from "./utils.js"
import { getImages } from "./db.js"

const themes = {
  blue: {
    bg: "#F6F9FD",
    bg2: "#EEF3FA",
    stroke: "rgba(201,210,226,.9)",
    text: "rgba(17,24,39,.92)",
    muted: "rgba(85,100,122,.92)",
    ink: "rgba(60,74,95,.9)",
    accent: "rgba(138,166,201,.35)",
  },
  purple: {
    bg: "#F8F7FC",
    bg2: "#F1EFF8",
    stroke: "rgba(201,210,226,.9)",
    text: "rgba(17,24,39,.92)",
    muted: "rgba(85,100,122,.92)",
    ink: "rgba(76,64,103,.9)",
    accent: "rgba(169,160,200,.35)",
  },
}

function pickTheme(name) {
  return themes[name] ?? themes.blue
}

async function imageBitmapFromBlob(blob) {
  const bmp = await createImageBitmap(blob)
  return bmp
}

export async function renderLongImage(records, { scale = 1, theme = "blue" } = {}) {
  const t = pickTheme(theme)
  const W = Math.round(1080 * scale)
  const margin = Math.round(64 * scale)
  const cardPad = Math.round(36 * scale)
  const gap = Math.round(24 * scale)
  const r = Math.round(18 * scale)
  const gridGap = Math.round(14 * scale)
  const imgCols = 3

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  ctx.textBaseline = "top"
  ctx.imageSmoothingQuality = "high"

  const cardW = W - margin * 2
  const imgW = Math.floor((cardW - cardPad * 2 - gridGap * (imgCols - 1)) / imgCols)
  const imgH = imgW

  ctx.font = `${Math.round(26 * scale)}px ${getComputedStyle(document.body).fontFamily}`
  const titleH = Math.round(120 * scale)

  const cards = []
  for (const rec of records) {
    const imgs = await getImages(rec.id)
    const bmpList = []
    for (const it of imgs) {
      try {
        bmpList.push({ id: it.id, bmp: await imageBitmapFromBlob(it.blob) })
      } catch (_) {
      }
    }

    const titleFont = Math.round(28 * scale)
    const metaFont = Math.round(20 * scale)
    const noteFont = Math.round(22 * scale)

    ctx.font = `${titleFont}px ${getComputedStyle(document.body).fontFamily}`
    const titleLines = wrapLines(ctx, rec.title || "未命名", cardW - cardPad * 2)
    const titleHeight = titleLines.length * Math.round(34 * scale)

    ctx.font = `${metaFont}px ${getComputedStyle(document.body).fontFamily}`
    const meta = `${fmtTime(rec.createdAt)} · ${rec.address || `${Number(rec.lng).toFixed(5)}, ${Number(rec.lat).toFixed(5)}`}`
    const metaLines = wrapLines(ctx, meta, cardW - cardPad * 2)
    const metaHeight = metaLines.length * Math.round(26 * scale)

    ctx.font = `${noteFont}px ${getComputedStyle(document.body).fontFamily}`
    const noteLines = wrapLines(ctx, rec.note || "", cardW - cardPad * 2)
    const noteHeight = noteLines.length ? noteLines.length * Math.round(30 * scale) + Math.round(8 * scale) : 0

    const imgCount = bmpList.length
    const imgRows = imgCount ? Math.ceil(imgCount / imgCols) : 0
    const imagesHeight = imgRows ? imgRows * imgH + (imgRows - 1) * gridGap + Math.round(10 * scale) : 0

    const h =
      cardPad +
      titleHeight +
      Math.round(12 * scale) +
      metaHeight +
      (noteHeight ? Math.round(16 * scale) + noteHeight : Math.round(14 * scale)) +
      imagesHeight +
      cardPad

    cards.push({ rec, titleLines, metaLines, noteLines, bmpList, h })
  }

  const totalH = margin + titleH + (cards.length ? cards.reduce((s, c) => s + c.h, 0) + gap * (cards.length - 1) : 0) + margin
  canvas.width = W
  canvas.height = totalH

  const g = ctx.createLinearGradient(0, 0, W, totalH)
  g.addColorStop(0, t.bg)
  g.addColorStop(1, t.bg2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, totalH)

  let y = margin
  ctx.fillStyle = t.ink
  ctx.font = `${Math.round(22 * scale)}px ${getComputedStyle(document.body).fontFamily}`
  ctx.globalAlpha = 0.85
  ctx.fillText("STAMP ATLAS", margin, y + Math.round(6 * scale))
  ctx.globalAlpha = 1

  ctx.fillStyle = t.text
  ctx.font = `${Math.round(34 * scale)}px ${getComputedStyle(document.body).fontFamily}`
  ctx.fillText("旅游盖章收集", margin, y + Math.round(42 * scale))

  ctx.fillStyle = t.muted
  ctx.font = `${Math.round(20 * scale)}px ${getComputedStyle(document.body).fontFamily}`
  ctx.fillText(`导出时间：${fmtTime(new Date().toISOString())}`, margin, y + Math.round(90 * scale))

  ctx.strokeStyle = t.accent
  ctx.lineWidth = Math.max(1, Math.round(2 * scale))
  ctx.beginPath()
  ctx.moveTo(margin, y + titleH)
  ctx.lineTo(W - margin, y + titleH)
  ctx.stroke()

  y += titleH + gap

  for (const c of cards) {
    const x = margin
    roundRect(ctx, x, y, cardW, c.h, r)
    ctx.fillStyle = "rgba(255,255,255,.78)"
    ctx.fill()
    ctx.strokeStyle = t.stroke
    ctx.lineWidth = Math.max(1, Math.round(2 * scale))
    ctx.stroke()

    let cy = y + cardPad
    ctx.fillStyle = t.text
    ctx.font = `${Math.round(28 * scale)}px ${getComputedStyle(document.body).fontFamily}`
    for (const line of c.titleLines) {
      ctx.fillText(line, x + cardPad, cy)
      cy += Math.round(34 * scale)
    }

    cy += Math.round(12 * scale)
    ctx.fillStyle = t.muted
    ctx.font = `${Math.round(20 * scale)}px ${getComputedStyle(document.body).fontFamily}`
    for (const line of c.metaLines) {
      ctx.fillText(line, x + cardPad, cy)
      cy += Math.round(26 * scale)
    }

    cy += Math.round(16 * scale)
    if (c.noteLines.length) {
      ctx.fillStyle = "rgba(17,24,39,.88)"
      ctx.font = `${Math.round(22 * scale)}px ${getComputedStyle(document.body).fontFamily}`
      for (const line of c.noteLines) {
        ctx.fillText(line, x + cardPad, cy)
        cy += Math.round(30 * scale)
      }
      cy += Math.round(10 * scale)
    }

    if (c.bmpList.length) {
      cy += Math.round(10 * scale)
      let ix = x + cardPad
      let iy = cy
      for (let i = 0; i < c.bmpList.length; i++) {
        const { bmp } = c.bmpList[i]
        const col = i % imgCols
        const row = Math.floor(i / imgCols)
        ix = x + cardPad + col * (imgW + gridGap)
        iy = cy + row * (imgH + gridGap)
        roundRect(ctx, ix, iy, imgW, imgH, Math.round(12 * scale))
        ctx.fillStyle = "rgba(244,246,251,.9)"
        ctx.fill()
        ctx.save()
        ctx.clip()
        drawCover(ctx, bmp, ix, iy, imgW, imgH)
        ctx.restore()
        ctx.strokeStyle = t.stroke
        ctx.lineWidth = Math.max(1, Math.round(2 * scale))
        ctx.stroke()
      }
      const rows = Math.ceil(c.bmpList.length / imgCols)
      cy = cy + rows * imgH + (rows - 1) * gridGap
    }

    for (const it of c.bmpList) it.bmp.close?.()

    y += c.h + gap
  }

  return canvas
}

function drawCover(ctx, bmp, x, y, w, h) {
  const s = Math.max(w / bmp.width, h / bmp.height)
  const dw = bmp.width * s
  const dh = bmp.height * s
  const dx = x + (w - dw) / 2
  const dy = y + (h - dh) / 2
  ctx.drawImage(bmp, dx, dy, dw, dh)
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  ctx.lineTo(x + rr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
  ctx.lineTo(x, y + rr)
  ctx.quadraticCurveTo(x, y, x + rr, y)
  ctx.closePath()
}

