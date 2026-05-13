import { addImage, deleteImage, deleteRecord, getImages, listRecords, putRecord } from "./db.js"
import { compressImage, debounce, fmtTime, fmtDate, createPokeballIcon, countries, provinces } from "./utils.js"
import { icon } from "./icons.js";

export function createMapView(root, { toast, navigate }) {
  root.innerHTML = `
    <div class="mapLayout">
      <div id="map"></div>
      <div class="mapSearch">
        <input class="mapSearchInput" data-map-search placeholder="搜索地点" />
        <div class="mapSearchResults" data-map-results></div>
      </div>
      <div class="sideDock">
        <button class="dockBtn" data-open-records type="button" title="Records">${icon("records")}</button>
      </div>
      <div class="recordsBackdrop" data-records-backdrop></div>
      <div class="recordsPanel" data-records-panel aria-hidden="true">
        <div class="recordsHeader">
          <div class="metaLine">
          <div class="hTitle">盖章记录</div>
          <div class="hint">点击地图添加标记</div>
          </div>
          <div class="recordsHeaderActions">
            <button class="btn btnTight" data-sort type="button" title="时间排序">${icon("sort")}<span data-sort-label></span></button>
            <select class="selectTight" data-group title="分类">
              <option value="none">不分类</option>
              <option value="country">国家</option>
              <option value="province">省份</option>
            </select>
            <button class="btn btnTight" data-close-records type="button" title="关闭">${icon("close")}</button>
          </div>
        </div>
        <div class="recordsFilters">
          <input class="search" data-records-search placeholder="搜索记录" />
        </div>
        <div class="list recordsList" data-records-list role="list"></div>
      </div>
      <div class="drawerBackdrop"></div>
      <div class="drawer" aria-hidden="true">
        <div class="drawerGrip"></div>
        <div class="kv" data-kv></div>
        <div class="formGrid">
          <div class="field">
            <div class="label">标题</div>
            <input class="input" data-title maxlength="60" placeholder="例如：苏州博物馆" />
          </div>
          <div class="field">
            <div class="label">国家</div>
            <select class="input" data-country></select>
          </div>
        </div>
        <div class="field" data-province-field>
          <div class="label">省份/地区</div>
          <select class="input" data-province></select>
        </div>
        <div class="field">
          <div class="label">文字记录</div>
          <textarea class="textarea" data-note placeholder="克制记录，留给记忆空间"></textarea>
        </div>
        <div class="field">
          <div class="label">盖章图片</div>
          <div class="actions">
            <label class="btn" style="cursor:pointer">
              ${icon("image")}上传
              <input data-files type="file" accept="image/*" multiple style="display:none" />
            </label>
            <button class="btn" data-locate type="button" title="定位">${icon("locate")}定位</button>
            <button class="btn" data-share-single type="button" title="生成分享图">${icon("export")}生成分享图</button>
          </div>
          <div class="imgGrid" data-imgs></div>
        </div>
        <div class="actions">
          <button class="btn btnDanger" data-delete type="button">${icon("trash")}删除</button>
          <div class="footerGroup">
            <button class="btn" data-close type="button">${icon("close")}关闭</button>
            <button class="btn btnPrimary" data-save type="button">保存</button>
          </div>
        </div>
      </div>
      <div class="stampOverlay" data-stamp-overlay aria-hidden="true">
        <div class="stampCard">
          <div class="stampFx" data-stamp-fx></div>
          <div class="stampMsg">今天又收集新章啦！✨</div>
          <label class="stampMute" data-stamp-mute">
            <input class="stampCheck" type="checkbox" data-mute-check />
            <span>今天不再提醒</span>
          </label>
          <div class="stampActions">
            <button class="btn btnTight" data-stamp-close type="button">${icon("close")}关闭</button>
          </div>
        </div>
      </div>
      <div class="sharePreviewOverlay" data-share-overlay aria-hidden="true">
        <div class="sharePreviewCard">
          <div class="sharePreviewTitle">分享图预览</div>
          <div class="sharePreviewImage" data-share-preview>
            <img alt="" />
          </div>
          <div class="sharePreviewActions">
            <button class="btn" data-share-close type="button">${icon("close")}关闭</button>
            <button class="btn btnPrimary" data-share-download type="button">${icon("export")}保存图片</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const mapSearchEl = root.querySelector("[data-map-search]");
  const mapResultsEl = root.querySelector("[data-map-results]");
  const openRecordsBtn = root.querySelector("[data-open-records]");
  const recordsBackdropEl = root.querySelector("[data-records-backdrop]");
  const recordsPanelEl = root.querySelector("[data-records-panel]");
  const recordsListEl = root.querySelector("[data-records-list]");
  const recordsSearchEl = root.querySelector("[data-records-search]");
  const sortBtn = root.querySelector("[data-sort]");
  const sortLabelEl = root.querySelector("[data-sort-label]");
  const groupEl = root.querySelector("[data-group]");
  const closeRecordsBtn = root.querySelector("[data-close-records]");

  const backdropEl = root.querySelector(".drawerBackdrop");
  const drawerEl = root.querySelector(".drawer");
  const titleEl = root.querySelector("[data-title]");
  const noteEl = root.querySelector("[data-note]");
  const countryEl = root.querySelector("[data-country]");
  const provinceEl = root.querySelector("[data-province]");
  const provinceFieldEl = root.querySelector("[data-province-field]");
  const filesEl = root.querySelector("[data-files]");
  const imgsEl = root.querySelector("[data-imgs]");
  const kvEl = root.querySelector("[data-kv]");
  const saveBtn = root.querySelector("[data-save]");
  const closeBtn = root.querySelector("[data-close]");
  const deleteBtn = root.querySelector("[data-delete]");
  const locateBtn = root.querySelector("[data-locate]");
  const shareSingleBtn = root.querySelector("[data-share-single]");

  const stampOverlayEl = root.querySelector("[data-stamp-overlay]");
  const stampFxEl = root.querySelector("[data-stamp-fx]");
  const stampMuteEl = root.querySelector("[data-stamp-mute]");
  const muteCheckEl = root.querySelector("[data-mute-check]");
  const stampCloseBtn = root.querySelector("[data-stamp-close]");

  const shareOverlayEl = root.querySelector("[data-share-overlay]");
  const sharePreviewImg = root.querySelector("[data-share-preview] img");
  const shareCloseBtn = root.querySelector("[data-share-close]");
  const shareDownloadBtn = root.querySelector("[data-share-download]");

  let map = null;
  let geocoder = null;
  let geolocation = null;
  let localSearch = null;
  let records = [];
  let activeId = null;
  let markers = new Map();
  let thumbUrls = new Map();
  let drawerOpen = false;
  let recordsOpen = false;
  let sortDir = "desc";
  let collapsedGroups = new Set();
  let stampIcon = null;
  let currentShareCanvas = null;
  let currentShareRecord = null;

  function setDrawer(open) {
    drawerOpen = open;
    drawerEl.classList.toggle("isOpen", open);
    backdropEl.classList.toggle("isOpen", open);
    drawerEl.setAttribute("aria-hidden", String(!open));
    if (!open) {
      activeId = null;
      filesEl.value = "";
    }
  }

  function setRecordsPanel(open) {
    recordsOpen = open;
    recordsPanelEl.classList.toggle("isOpen", open);
    recordsBackdropEl.classList.toggle("isOpen", open);
    recordsPanelEl.setAttribute("aria-hidden", String(!open));
  }

  function setSharePreview(open) {
    shareOverlayEl.classList.toggle("isOn", open);
    shareOverlayEl.setAttribute("aria-hidden", String(!open));
  }

  function revokeThumbs() {
    for (const arr of thumbUrls.values()) {
      for (const u of arr) URL.revokeObjectURL(u);
    }
    thumbUrls.clear();
  }

  function setSortLabel() {
    sortLabelEl.textContent = sortDir === "desc" ? "新→旧" : "旧→新";
  }

  async function refreshRecordsPanel() {
    revokeThumbs();
    records = await listRecords();
    const q = (recordsSearchEl.value || "").trim();
    let show0 = q ? records.filter((r) => 
      (r.title || "").includes(q) || (r.note || "").includes(q) || (r.address || "").includes(q)
    ) : records;

    const mode = groupEl.value || "none";
    if (mode === "province") {
      show0 = show0.filter((r) => (r.country || "") === "中国");
    }

    const show = show0.slice().sort((a, b) => {
      const d = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "asc" ? d : -d;
    });

    if (mode === "country" || mode === "province") {
      const groups = new Map();
      for (const r of show) {
        let keyRaw = mode === "country" ? r.country : r.province;
        const key = (keyRaw || "").trim() || "未归类";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      }
      const keys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
      recordsListEl.innerHTML = keys
        .map((key) => {
          const open = !collapsedGroups.has(key);
          const items = groups.get(key) || [];
          return `
            <div class="group">
              <button class="groupHead" type="button" data-group-toggle="${escapeAttr(key)}">
                <span class="groupName">${escapeHtml(key)}</span>
                <span class="groupMeta">${items.length}</span>
              </button>
              <div class="groupBody ${open ? "isOpen" : ""}" data-group-body="${escapeAttr(key)}">
                ${items.map((r) => rowHtml(r)).join("")}
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      recordsListEl.innerHTML = show.map((r) => rowHtml(r)).join("");
    }

    const rows = Array.from(recordsListEl.querySelectorAll("[data-id]"));
    for (const row of rows) {
      const id = row.getAttribute("data-id");
      const r = show.find((x) => x.id === id);
      if (!r) continue;
      const imgs = await getImages(r.id);
      const thumbs = imgs.slice(0, 2).map((it) => URL.createObjectURL(it.blob));
      thumbUrls.set(r.id, thumbs);
      const box = row.querySelector(`[data-thumbs="${r.id}"]`);
      if (box) box.innerHTML = thumbs.map((u) => `<img class="thumb" src="${u}" alt="" />`).join("");
    }
  }

  async function ensureMap() {
    if (map) return;
    if (!window.BMap) throw new Error("百度地图脚本未加载");

    stampIcon = createPokeballIcon(32);

    map = new BMap.Map("map");
    const point = new BMap.Point(116.404, 39.915);
    map.centerAndZoom(point, 11);
    map.enableScrollWheelZoom(true);
    map.enableContinuousZoom(true);

    const scaleControl = new BMap.ScaleControl({ 
      anchor: BMAP_ANCHOR_BOTTOM_LEFT, 
      offset: new BMap.Size(18, 210) 
    });
    map.addControl(scaleControl);

    const navigationControl = new BMap.NavigationControl({
      anchor: BMAP_ANCHOR_TOP_RIGHT,
      offset: new BMap.Size(18, 86),
      type: BMAP_NAVIGATION_CONTROL_SMALL,
    });
    map.addControl(navigationControl);

    geocoder = new BMap.Geocoder();
    
    localSearch = new BMap.LocalSearch(map, {
      renderOptions: { map: map, autoViewport: true },
      onSearchComplete: function (results) {
        if (localSearch.getStatus() === BMAP_STATUS_SUCCESS) {
          const pois = [];
          for (let i = 0; i < results.getCurrentNumPois(); i++) {
            pois.push(results.getPoi(i));
          }
          renderSearchResults(pois);
        } else {
          renderSearchResults([]);
          toast("未找到结果");
        }
      },
    });
    
    geolocation = new BMap.Geolocation();

    map.addEventListener("click", function(e) {
      if (drawerOpen) return;
      
      const lng = e.point.lng;
      const lat = e.point.lat;
      const now = new Date();
      const defaultTitle = `未命名 ${fmtDate(now.toISOString())}`;
      
      putRecord({
        lng,
        lat,
        title: defaultTitle,
        note: "",
        address: "",
        country: "",
        province: "",
        city: "",
        imageIds: [],
        theme: "purple",
        firstSavedAt: "",
        createdAt: now.toISOString(),
      }).then(rec => {
        placeMarker(rec);
        fillAddress(rec.id, lng, lat);
        openRecord(rec.id);
        refreshRecordsPanel();
      }).catch(err => {
        console.error("添加标记失败:", err);
        toast("添加标记失败");
      });
    });
  }

  function placeMarker(rec) {
    if (!map) return;
    const exist = markers.get(rec.id);
    if (exist) return;
    
    try {
      const point = new BMap.Point(rec.lng, rec.lat);
      const markerIcon = new BMap.Icon(stampIcon, new BMap.Size(32, 32), {
        anchor: new BMap.Size(16, 16)
      });
      
      const marker = new BMap.Marker(point, { icon: markerIcon });
      map.addOverlay(marker);
      
      marker.addEventListener("click", function(e) {
        e.domEvent.stopPropagation();
        openRecord(rec.id);
      });
      
      markers.set(rec.id, marker);
    } catch (err) {
      console.error("创建标记失败:", err);
    }
  }

  async function syncMarkers() {
    if (!map) return;
    for (const [id, m] of Array.from(markers.entries())) {
      map.removeOverlay(m);
      markers.delete(id);
    }
    for (const r of records) placeMarker(r);
  }

  async function fillAddress(id, lng, lat) {
    if (!geocoder) return;
    try {
      const point = new BMap.Point(lng, lat);
      geocoder.getLocation(point, async function(result) {
        const rec = await getById(id);
        if (!rec) return;
        
        let country = "";
        let province = "";
        let city = "";
        let district = "";
        let addressText = "";
        let displayArea = "";
        
        if (result && result.addressComponents) {
          const ac = result.addressComponents;
          country = ac.country || "";
          province = ac.province || "";
          city = ac.city || "";
          district = ac.district || "";
          addressText = result.address || "";
          
          if (country === "中国") {
            displayArea = [province, city, district].filter(Boolean).join(" · ");
          } else if (country) {
            displayArea = country;
          }
        }
        
        const next = {
          ...rec,
          address: addressText,
          country: country,
          province: province,
          city: city,
        };
        await putRecord(next);
        records = records.map((r) => (r.id === next.id ? next : r));
        await refreshRecordsPanel();
        
        if (activeId === id) {
          const locationDisplay = addressText || displayArea || "未知地点";
          kvEl.innerHTML = `
            <span>${fmtTime(rec.createdAt)}</span>
            <span class="dot"></span>
            <span>${escapeHtml(locationDisplay)}</span>
          `;
        }
      });
    } catch (err) {
      console.error("获取地址失败:", err);
    }
  }

  async function getById(id) {
    const r = records.find((x) => x.id === id);
    if (r) return r;
    await refreshRecordsPanel();
    return records.find((x) => x.id === id);
  }

  async function openRecord(id) {
    activeId = id;
    const r = await getById(id);
    if (!r) return;
    titleEl.value = r.title || "";
    noteEl.value = r.note || "";
    countryEl.value = r.country || "";
    provinceEl.value = r.province || "";
    updateProvinceVisibility();
    
    let locationDisplay = "";
    if (r.address) {
      locationDisplay = r.address;
    } else if (r.country === "中国") {
      const area = [r.province, r.city].filter(Boolean).join(" · ");
      locationDisplay = area || "未知地点";
    } else if (r.country) {
      locationDisplay = r.country;
    } else {
      locationDisplay = "未知地点";
    }
    
    kvEl.innerHTML = `
      <span>${fmtTime(r.createdAt)}</span>
      <span class="dot"></span>
      <span>${escapeHtml(locationDisplay)}</span>
    `;
    await renderImages(r.id);
    setDrawer(true);
    if (map) {
      const point = new BMap.Point(r.lng, r.lat);
      map.panTo(point);
    }
  }

  async function renderImages(recordId) {
    imgsEl.innerHTML = "";
    const imgs = await getImages(recordId);
    imgsEl.innerHTML = `
      ${imgs.map((it) => {
        const u = URL.createObjectURL(it.blob);
        return `
          <div class="imgCell" data-img="${it.id}">
            <img src="${u}" alt="" />
            <button class="imgDel" type="button" data-img-del="${it.id}">${icon("close")}</button>
          </div>
        `;
      }).join("")}
    `;
    imgsEl.querySelectorAll("[data-img-del]").forEach((b) => {
      b.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const imgId = b.getAttribute("data-img-del");
        await deleteImage(imgId);
        const rec = await getById(recordId);
        if (rec) {
          rec.imageIds = (rec.imageIds || []).filter((x) => x !== imgId);
          await putRecord(rec);
        }
        await renderImages(recordId);
        await refreshRecordsPanel();
        toast("已移除图片");
      });
    });
    imgsEl.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", () => {
        const src = img.getAttribute("src");
        if (src) URL.revokeObjectURL(src);
      });
    });
  }

  async function generateSingleShareImage(record) {
    const images = await getImages(record.id);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 收集内容信息以计算画布高度
    const imgCount = Math.min(images.length, 4);
    const scaleFactor = imgCount >= 2 ? 1/3 : 1;
    
    // 预处理：获取所有图片尺寸
    const processedImages = [];
    for (let i = 0; i < imgCount; i++) {
      const imgData = images[i];
      const imgBitmap = await createImageBitmap(imgData.blob);
      const scaledWidth = Math.floor(600 * scaleFactor);
      const imgHeight = Math.min(Math.floor(350 * scaleFactor), Math.floor(imgBitmap.height * (scaledWidth / imgBitmap.width)));
      processedImages.push({ imgBitmap, scaledWidth, imgHeight });
    }
    
    // 计算各区域高度
    const titleAreaHeight = 200;
    const dividerHeight = 20;
    const titleAreaEnd = 140 + titleAreaHeight;
    const dividerY = titleAreaEnd;
    const imagesStartY = dividerY + dividerHeight + 10;
    const imagesTotalHeight = processedImages.reduce((sum, img) => sum + img.imgHeight + 30, 0) - 30;
    const imagesEndY = imagesStartY + imagesTotalHeight;
    
    // 计算文字区域高度（自适应）
    let noteAreaHeight = 0;
    if (record.note) {
      const lines = wrapText(ctx, record.note, 600, 28);
      const lineCount = Math.min(lines.length, 5);
      noteAreaHeight = 40 + lineCount * 32 + 30; // padding-top + lines + padding-bottom
    }
    const noteAreaY = imagesEndY + 20;
    const noteAreaEnd = noteAreaY + noteAreaHeight;
    
    // 底部栏高度
    const footerHeight = 100;
    const footerY = noteAreaEnd + 20;
    const canvasHeight = footerY + footerHeight + 20;
    
    // 设置画布尺寸
    canvas.width = 800;
    canvas.height = Math.max(canvasHeight, 1200);
    
    // 1. 宝可梦风格背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, canvasHeight);
    
    // 添加像素风格边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 794, canvasHeight - 6);
    
    // 背景网格装饰（像素风格）
    ctx.fillStyle = '#F8F9FA';
    for (let x = 0; x < 800; x += 40) {
      for (let y = 0; y < canvasHeight; y += 40) {
        if ((x / 40 + y / 40) % 2 === 0) {
          ctx.fillRect(x, y, 40, 40);
        }
      }
    }
    
    // 2. 绘制顶部3个宝可梦角色：妙蛙种子、小火龙、杰尼龟
    drawBulbasaur(ctx, 200, 80);
    drawCharmander(ctx, 400, 80);
    drawSquirtle(ctx, 600, 80);
    
    // 3. 标题区域
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(50, 140, 700, titleAreaHeight);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 140, 700, titleAreaHeight);
    
    // 标题文字
    ctx.fillStyle = '#FF4757';
    ctx.font = 'bold 44px "Courier New", monospace, "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawPixelText(ctx, record.title || '未命名', 400, 200);
    
    // 地址和日期
    ctx.fillStyle = '#333333';
    ctx.font = '18px "Courier New", monospace, "Microsoft YaHei"';
    const locationText = [record.country, record.province, record.city, record.address].filter(Boolean).join(' · ');
    drawPixelText(ctx, locationText || '旅行印章', 400, 250);
    drawPixelText(ctx, fmtTime(record.createdAt), 400, 285);
    
    // 4. 分割线（像素风格）
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 50; x < 750; x += 20) {
      ctx.moveTo(x, dividerY);
      ctx.lineTo(x + 10, dividerY);
    }
    ctx.stroke();
    
    // 5. 图片区域
    let currentY = imagesStartY;
    for (let i = 0; i < processedImages.length; i++) {
      const { imgBitmap, scaledWidth, imgHeight } = processedImages[i];
      
      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = imgBitmap.width;
      imgCanvas.height = imgBitmap.height;
      const imgCtx = imgCanvas.getContext('2d');
      imgCtx.drawImage(imgBitmap, 0, 0);
      
      const imgX = imgCount >= 2 ? 100 + (600 - scaledWidth) / 2 : 100;
      
      // 像素风格相框
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(imgX - 8, currentY - 8, scaledWidth + 16, imgHeight + 16);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 4;
      ctx.strokeRect(imgX - 4, currentY - 4, scaledWidth + 8, imgHeight + 8);
      
      ctx.drawImage(imgCanvas, imgX, currentY, scaledWidth, imgHeight);
      
      currentY += imgHeight + 30;
    }
    
    // 6. 笔记区域（自适应高度）
    if (record.note) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(80, noteAreaY, 640, noteAreaHeight);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, noteAreaY, 640, noteAreaHeight);
      
      ctx.fillStyle = '#55647A';
      ctx.font = '24px "Courier New", monospace, "Microsoft YaHei"';
      ctx.textAlign = 'left';
      
      const lines = wrapText(ctx, record.note, 600, 28);
      let textY = noteAreaY + 40;
      for (const line of lines.slice(0, 5)) {
        drawPixelText(ctx, line, 100, textY, true);
        textY += 32;
      }
    }
    
    // 7. 底部宝可梦风格栏
    ctx.fillStyle = '#FF4757';
    ctx.fillRect(0, footerY, 800, footerHeight);
    
    // 底部像素装饰
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, footerY + 3, 794, footerHeight - 6);
    
    // 底部文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px "Courier New", monospace, "Microsoft YaHei"';
    ctx.textAlign = 'center';
    drawPixelText(ctx, '去盖章！GO GO GO', 400, footerY + footerHeight / 2);
    
    currentShareCanvas = canvas;
    currentShareRecord = record;
    sharePreviewImg.src = canvas.toDataURL('image/png');
    setSharePreview(true);
  }
  
  // 绘制像素文字的辅助函数
  function drawPixelText(ctx, text, x, y, leftAlign = false) {
    ctx.save();
    if (!leftAlign) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    } else {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
    
    // 像素风格描边效果
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    
    ctx.restore();
  }
  
  // 绘制妙蛙种子
  function drawBulbasaur(ctx, centerX, centerY) {
    const pixel = 4;
    
    // 身体 - 绿色
    ctx.fillStyle = '#78C850';
    drawPixelRect(ctx, centerX - 6*pixel, centerY - 2*pixel, 12*pixel, 10*pixel);
    
    // 头 - 绿色
    drawPixelRect(ctx, centerX - 5*pixel, centerY - 6*pixel, 10*pixel, 6*pixel);
    
    // 眼睛 - 白色和黑色
    ctx.fillStyle = '#FFFFFF';
    drawPixelRect(ctx, centerX - 4*pixel, centerY - 5*pixel, 2*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 2*pixel, centerY - 5*pixel, 2*pixel, 2*pixel);
    ctx.fillStyle = '#000000';
    drawPixelRect(ctx, centerX - 3*pixel, centerY - 4*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX + 3*pixel, centerY - 4*pixel, 1*pixel, 1*pixel);
    
    // 背上的种子 - 深绿色
    ctx.fillStyle = '#5E9E3C';
    drawPixelRect(ctx, centerX - 2*pixel, centerY - 8*pixel, 4*pixel, 3*pixel);
  }
  
  // 绘制小火龙
  function drawCharmander(ctx, centerX, centerY) {
    const pixel = 4;
    
    // 身体 - 橙色
    ctx.fillStyle = '#F08030';
    drawPixelRect(ctx, centerX - 5*pixel, centerY - 2*pixel, 10*pixel, 10*pixel);
    
    // 头 - 橙色
    drawPixelRect(ctx, centerX - 4*pixel, centerY - 6*pixel, 8*pixel, 6*pixel);
    
    // 眼睛 - 白色和黑色
    ctx.fillStyle = '#FFFFFF';
    drawPixelRect(ctx, centerX - 3*pixel, centerY - 5*pixel, 2*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY - 5*pixel, 2*pixel, 2*pixel);
    ctx.fillStyle = '#000000';
    drawPixelRect(ctx, centerX - 2*pixel, centerY - 4*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX + 2*pixel, centerY - 4*pixel, 1*pixel, 1*pixel);
    
    // 尾巴火焰 - 黄色和红色
    ctx.fillStyle = '#FFD700';
    drawPixelRect(ctx, centerX + 5*pixel, centerY - 1*pixel, 2*pixel, 4*pixel);
    ctx.fillStyle = '#FF4757';
    drawPixelRect(ctx, centerX + 6*pixel, centerY - 2*pixel, 1*pixel, 3*pixel);
  }
  
  // 绘制杰尼龟
  function drawSquirtle(ctx, centerX, centerY) {
    const pixel = 4;
    
    // 龟壳 - 棕色
    ctx.fillStyle = '#A0826D';
    drawPixelRect(ctx, centerX - 6*pixel, centerY - 4*pixel, 12*pixel, 12*pixel);
    
    // 壳纹 - 深棕色
    ctx.fillStyle = '#806050';
    drawPixelRect(ctx, centerX - 1*pixel, centerY - 3*pixel, 2*pixel, 10*pixel);
    drawPixelRect(ctx, centerX - 5*pixel, centerY - 1*pixel, 10*pixel, 2*pixel);
    
    // 头 - 蓝色
    ctx.fillStyle = '#6890F0';
    drawPixelRect(ctx, centerX - 4*pixel, centerY - 7*pixel, 8*pixel, 5*pixel);
    
    // 眼睛 - 白色和黑色
    ctx.fillStyle = '#FFFFFF';
    drawPixelRect(ctx, centerX - 3*pixel, centerY - 6*pixel, 2*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY - 6*pixel, 2*pixel, 2*pixel);
    ctx.fillStyle = '#000000';
    drawPixelRect(ctx, centerX - 2*pixel, centerY - 5*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX + 2*pixel, centerY - 5*pixel, 1*pixel, 1*pixel);
  }
  
  // 像素绘制辅助函数
  function drawPixelRect(ctx, x, y, w, h) {
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = char;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function downloadShareImage() {
    if (!currentShareCanvas || !currentShareRecord) return;
    
    const link = document.createElement('a');
    link.download = `印章_${currentShareRecord.title || '未命名'}_${fmtDate(currentShareRecord.createdAt)}.png`;
    link.href = currentShareCanvas.toDataURL('image/png');
    link.click();
    toast('分享图已保存');
  }

  async function onSave() {
    if (!activeId) return;
    const r = await getById(activeId);
    if (!r) return;
    const firstSavedAt = r.firstSavedAt || new Date().toISOString();
    
    const next = await putRecord({
      ...r,
      title: titleEl.value.trim() || "未命名",
      note: noteEl.value || "",
      country: countryEl.value || "",
      province: provinceEl.value || "",
      firstSavedAt,
    });
    records = records.map((x) => (x.id === next.id ? next : x));
    await refreshRecordsPanel();
    await runStampCelebration();
  }

  async function onDelete() {
    if (!activeId) return;
    const id = activeId;
    await deleteRecord(id);
    const m = markers.get(id);
    if (m && map) map.removeOverlay(m);
    markers.delete(id);
    setDrawer(false);
    toast('已删除记录');
    await refreshRecordsPanel();
  }

  async function onUpload(files) {
    if (!activeId) return;
    const r = await getById(activeId);
    if (!r) return;
    const arr = Array.from(files || []);
    if (!arr.length) return;
    saveBtn.disabled = true;
    try {
      for (const f of arr) {
        if (!f.type.startsWith('image/')) continue;
        const cf = await compressImage(f);
        const img = await addImage(r.id, cf, cf.type);
        r.imageIds = [...(r.imageIds || []), img.id];
      }
      await putRecord(r);
      await renderImages(r.id);
      await refreshRecordsPanel();
      toast('图片已添加');
    } finally {
      saveBtn.disabled = false;
      filesEl.value = "";
    }
  }

  async function onLocate() {
    if (!map || !geolocation) return;
    try {
      geolocation.getCurrentPosition(function(result) {
        if (this.getStatus() == BMAP_STATUS_SUCCESS) {
          map.panTo(result.point);
          map.setZoom(14);
          toast('已定位到当前位置');
        } else {
          toast('定位不可用（可能需要 HTTPS 或授权）');
        }
      }, { enableHighAccuracy: true });
    } catch (err) {
      toast('定位不可用（可能需要 HTTPS 或授权）');
    }
  }

  function todayKey() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function loadNoticeState() {
    try {
      const raw = localStorage.getItem('stamp-atlas.notice');
      const v = raw ? JSON.parse(raw) : null;
      const tk = todayKey();
      if (!v || v.date !== tk) return { date: tk, count: 0, muted: false };
      return { date: tk, count: Number(v.count || 0), muted: Boolean(v.muted) };
    } catch (_) {
      return { date: todayKey(), count: 0, muted: false };
    }
  }

  function saveNoticeState(s) {
    localStorage.setItem('stamp-atlas.notice', JSON.stringify(s));
  }

  function showStampOverlay({ showMute }) {
    if (!stampOverlayEl || !stampFxEl || !stampMuteEl || !muteCheckEl) {
      console.warn('Stamp overlay elements not found');
      return;
    }
    stampOverlayEl.classList.add('isOn');
    stampOverlayEl.setAttribute('aria-hidden', 'false');
    stampMuteEl.classList.toggle('isOn', Boolean(showMute));
    muteCheckEl.checked = false;
    stampFxEl.classList.remove('isStamping');
    void stampFxEl.offsetWidth;
    stampFxEl.classList.add('isStamping');
    window.setTimeout(() => {
      if (stampFxEl) stampFxEl.classList.remove('isStamping');
    }, 2000);
  }

  function closeStampOverlay({ persistMute = true } = {}) {
    if (!stampOverlayEl) {
      console.warn('Stamp overlay element not found');
      return;
    }
    const state = loadNoticeState();
    if (persistMute && muteCheckEl && muteCheckEl.checked) {
      state.muted = true;
      saveNoticeState(state);
      toast('已关闭今日提醒');
    }
    stampOverlayEl.classList.remove('isOn');
    stampOverlayEl.setAttribute('aria-hidden', 'true');
  }

  async function runStampCelebration() {
    const state = loadNoticeState();
    if (state.muted) {
      toast('已保存');
      return;
    }
    if (state.count === 0) {
      state.count += 1;
      saveNoticeState(state);
      showStampOverlay({ showMute: true });
    } else {
      toast('已保存');
    }
  }

  function renderSearchResults(pois) {
    if (!pois?.length) {
      mapResultsEl.classList.remove('isOn');
      mapResultsEl.innerHTML = '';
      return;
    }
    mapResultsEl.classList.add('isOn');
    mapResultsEl.innerHTML = `
      ${pois
        .slice(0, 6)
        .map(
          (p, i) => `
            <button class="resultRow" type="button" data-poi="${i}">
              <div class="resultTitle">${escapeHtml(p.title)}</div>
              <div class="resultSub">${escapeHtml(p.address || '')}</div>
            </button>
          `,
        )
        .join('')}
    `;
    mapResultsEl.querySelectorAll('[data-poi]').forEach((b) => {
      b.addEventListener('click', () => {
        const idx = Number(b.getAttribute('data-poi'));
        const p = pois[idx];
        if (!p || !map) return;
        map.centerAndZoom(p.point, 15);
        mapResultsEl.classList.remove('isOn');
      });
    });
  }

  async function searchPlace(keyword) {
    if (!localSearch || !map) return;
    const q = (keyword || '').trim();
    if (!q) {
      renderSearchResults([]);
      return;
    }
    localSearch.search(q);
  }

  function initCountryProvinceSelectors() {
    // 初始化国家下拉框
    countryEl.innerHTML = `<option value="">请选择国家</option>` + 
      countries.map(c => `<option value="${c}">${c}</option>`).join('');
    
    // 初始化省份下拉框
    provinceEl.innerHTML = `<option value="">请选择省份</option>` + 
      provinces.map(p => `<option value="${p}">${p}</option>`).join('');
    
    // 添加国家变化事件
    countryEl.addEventListener('change', () => {
      updateProvinceVisibility();
    });
  }

  function updateProvinceVisibility() {
    const isChina = countryEl.value === "中国";
    provinceFieldEl.style.display = isChina ? "block" : "none";
    if (!isChina) {
      provinceEl.value = "";
    }
  }

  function bind() {
    initCountryProvinceSelectors();
    setSortLabel();
    setRecordsPanel(false);

    openRecordsBtn.addEventListener('click', async () => {
      setRecordsPanel(!recordsOpen);
      if (recordsOpen) await refreshRecordsPanel();
    });
    closeRecordsBtn.addEventListener('click', () => setRecordsPanel(false));
    recordsBackdropEl.addEventListener('click', () => setRecordsPanel(false));

    recordsListEl.addEventListener('click', (e) => {
      const t = e.target;
      const toggle = t.closest?.('[data-group-toggle]');
      if (toggle) {
        const k = toggle.getAttribute('data-group-toggle');
        if (collapsedGroups.has(k)) collapsedGroups.delete(k);
        else collapsedGroups.add(k);
        refreshRecordsPanel();
        return;
      }
      const row = t.closest?.('[data-id]');
      if (!row) return;
      openRecord(row.getAttribute('data-id'));
    });

    sortBtn.addEventListener('click', () => {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
      setSortLabel();
      refreshRecordsPanel();
    });

    groupEl.addEventListener('change', () => {
      collapsedGroups = new Set();
      refreshRecordsPanel();
    });

    recordsSearchEl.addEventListener('input', debounce(refreshRecordsPanel, 180));

    mapSearchEl.addEventListener('input', debounce(() => searchPlace(mapSearchEl.value), 260));
    mapSearchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchPlace(mapSearchEl.value);
      }
      if (e.key === 'Escape') {
        mapResultsEl.classList.remove('isOn');
        mapSearchEl.blur();
      }
    });

    backdropEl.addEventListener('click', () => setDrawer(false));
    closeBtn.addEventListener('click', () => setDrawer(false));
    saveBtn.addEventListener('click', onSave);
    deleteBtn.addEventListener('click', onDelete);
    locateBtn.addEventListener('click', onLocate);
    filesEl.addEventListener('change', () => onUpload(filesEl.files));

    shareSingleBtn.addEventListener('click', async () => {
      const record = await getById(activeId);
      if (record) {
        await generateSingleShareImage(record);
      }
    });

    shareCloseBtn.addEventListener('click', () => setSharePreview(false));
    shareDownloadBtn.addEventListener('click', downloadShareImage);
    shareOverlayEl.addEventListener('click', (e) => {
      if (e.target === shareOverlayEl) setSharePreview(false);
    });

    stampCloseBtn.addEventListener('click', () => closeStampOverlay());
    stampOverlayEl.addEventListener('click', (e) => {
      if (e.target === stampOverlayEl) closeStampOverlay();
    });
  }

  bind();

  return {
    async onShow() {
      await ensureMap();
      await refreshRecordsPanel();
      await syncMarkers();
      if (!drawerOpen) setDrawer(false);
    },
  };
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(s) {
  return String(s ?? '').replaceAll('"', '&quot;');
}

function rowHtml(r) {
  return `
    <div class="row" role="listitem" data-id="${r.id}">
      <div style="min-width:0">
        <div class="rowTitle">${escapeHtml(r.title || '未命名')}</div>
        <div class="rowSub">${escapeHtml(r.address || fmtTime(r.createdAt))}</div>
      </div>
      <div class="rowThumbs" data-thumbs="${r.id}"></div>
    </div>
  `;
}
