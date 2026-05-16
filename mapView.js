import { addImage, deleteImage, deleteRecord, getImages, listRecords, putRecord } from "./db.js"
import { compressImage, debounce, fmtTime, fmtDate, createPokeballIcon, createMasterballIcon, countries, provinces } from "./utils.js"
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
          <div class="hTitle">盖章记录</div>
          <div class="recordsHeaderActions" data-normal-actions>
            <button class="btn btnTight btnSmall" data-sort type="button" title="时间排序">${icon("sort")}<span data-sort-label></span></button>
            <select class="selectTight selectSmall" data-group title="分类">
              <option value="none">不分类</option>
              <option value="country">国家</option>
              <option value="province">省份</option>
            </select>
            <button class="btn btnTight btnDanger btnSmall" data-batch-delete type="button" title="批量删除">${icon("trash")}批量</button>
            <button class="btn btnTight btnSmall" data-close-records type="button" title="关闭">${icon("close")}</button>
          </div>
          <div class="recordsHeaderActions" data-batch-actions style="display:none">
            <span class="batchCount" data-batch-count>已选 0 项</span>
            <button class="btn btnTight btnDanger" data-delete-selected type="button">${icon("trash")}删除</button>
            <button class="btn btnTight" data-cancel-batch type="button">${icon("close")}取消</button>
          </div>
        </div>
        <div class="statsPanel" data-stats-panel>
          <div class="statsIcon">⭐</div>
          <div class="statsText">总打卡数：<span class="statsCount" data-stats-count>0</span></div>
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
            <button class="btn" data-change-marker type="button">${icon("pin")}更改标记</button>
            <button class="btn" data-close type="button">${icon("close")}关闭</button>
            <button class="btn btnPrimary" data-save type="button">保存</button>
          </div>
        </div>
      </div>
      <div class="markerStyleOverlay" data-marker-overlay>
        <div class="markerStylePanel">
          <div class="markerStyleHeader">
            <div class="markerStyleTitle">选择标记样式</div>
            <button class="markerStyleClose" data-marker-close type="button">${icon("close")}</button>
          </div>
          <div class="markerStyleList">
            <button class="markerStyleItem" data-marker-style="pokeball" type="button">
              <div class="markerStylePreview" data-preview-pokeball></div>
              <div class="markerStyleName">精灵球</div>
            </button>
            <button class="markerStyleItem" data-marker-style="masterball" type="button">
              <div class="markerStylePreview" data-preview-masterball></div>
              <div class="markerStyleName">大师球</div>
            </button>
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

  const normalActionsEl = root.querySelector("[data-normal-actions]");
  const batchActionsEl = root.querySelector("[data-batch-actions]");
  const batchCountEl = root.querySelector("[data-batch-count]");
  const batchDeleteBtn = root.querySelector("[data-batch-delete]");
  const deleteSelectedBtn = root.querySelector("[data-delete-selected]");
  const cancelBatchBtn = root.querySelector("[data-cancel-batch]");
  const statsPanelEl = root.querySelector("[data-stats-panel]");
  const statsCountEl = root.querySelector("[data-stats-count]");

  const changeMarkerBtn = root.querySelector("[data-change-marker]");
  const markerOverlayEl = root.querySelector("[data-marker-overlay]");
  const markerCloseBtn = root.querySelector("[data-marker-close]");
  const markerStyleListEl = root.querySelector(".markerStyleList");

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
  let pokeballIcon = null;
  let masterballIcon = null;
  let currentShareCanvas = null;
  let currentShareRecord = null;
  let batchMode = false;
  let selectedIds = new Set();
  let lastRecordCount = 0;

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
    if (open) {
      updateStats();
    }
  }

  function setSharePreview(open) {
    shareOverlayEl.classList.toggle("isOn", open);
    shareOverlayEl.setAttribute("aria-hidden", String(!open));
  }

  function updateStats() {
    const count = records.length;
    statsCountEl.textContent = count;
    
    // 添加数字跳动动画
    statsCountEl.classList.add('statsBounce');
    setTimeout(() => {
      statsCountEl.classList.remove('statsBounce');
    }, 300);
  }



  function triggerCelebration() {
    const overlay = document.createElement('div');
    overlay.className = 'celebrationOverlay';
    document.body.appendChild(overlay);
    
    // 创建庆祝消息
    const message = document.createElement('div');
    message.className = 'celebrationMessage';
    message.innerHTML = '🎉 收集进度达成！<br>⭐⭐⭐⭐⭐';
    overlay.appendChild(message);
    
    // 创建多个星星
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.className = 'celebrationStar';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 0.5 + 's';
      star.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
      star.style.setProperty('--ty', (Math.random() - 0.5) * 200 + 'px');
      overlay.appendChild(star);
    }
    
    // 3秒后移除
    setTimeout(() => {
      overlay.classList.add('celebrationFade');
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 500);
    }, 3000);
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
                ${items.map((r) => rowHtml(r, batchMode, selectedIds.has(r.id))).join("")}
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      recordsListEl.innerHTML = show.map((r) => rowHtml(r, batchMode, selectedIds.has(r.id))).join("");
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

    pokeballIcon = createPokeballIcon(32);
    masterballIcon = createMasterballIcon(32);

    const previewPokeballEl = root.querySelector("[data-preview-pokeball]");
    const previewMasterballEl = root.querySelector("[data-preview-masterball]");
    if (previewPokeballEl) {
      const img = document.createElement("img");
      img.src = pokeballIcon;
      img.alt = "精灵球";
      previewPokeballEl.appendChild(img);
    }
    if (previewMasterballEl) {
      const img = document.createElement("img");
      img.src = masterballIcon;
      img.alt = "大师球";
      previewMasterballEl.appendChild(img);
    }

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
    if (exist) {
      updateMarkerStyle(rec);
      return;
    }
    
    try {
      const point = new BMap.Point(rec.lng, rec.lat);
      const iconUrl = rec.markerStyle === "masterball" ? masterballIcon : pokeballIcon;
      const markerIcon = new BMap.Icon(iconUrl, new BMap.Size(32, 32), {
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

  function updateMarkerStyle(rec) {
    if (!map) return;
    const marker = markers.get(rec.id);
    if (!marker) return;
    
    const iconUrl = rec.markerStyle === "masterball" ? masterballIcon : pokeballIcon;
    const markerIcon = new BMap.Icon(iconUrl, new BMap.Size(32, 32), {
      anchor: new BMap.Size(16, 16)
    });
    
    marker.setIcon(markerIcon);
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
    const maxImageWidth = 700;
    
    // 预处理：获取所有图片尺寸（保持宽高比，不拉伸）
    const processedImages = [];
    for (let i = 0; i < imgCount; i++) {
      const imgData = images[i];
      const imgBitmap = await createImageBitmap(imgData.blob);
      
      const scaledWidth = Math.min(imgBitmap.width, maxImageWidth * scaleFactor);
      const scaledHeight = Math.floor(imgBitmap.height * (scaledWidth / imgBitmap.width));
      
      processedImages.push({ imgBitmap, scaledWidth, scaledHeight });
    }
    
    // 计算各区域高度
    const titleAreaHeight = 180;
    const imagesStartY = 180 + titleAreaHeight + 20;
    const imagesTotalHeight = processedImages.reduce((sum, img) => sum + img.scaledHeight + 20, 0) - 20;
    const imagesEndY = imagesStartY + imagesTotalHeight;
    
    let noteAreaHeight = 0;
    if (record.note) {
      const lines = wrapText(ctx, record.note, 640, 26);
      const lineCount = Math.min(lines.length, 5);
      noteAreaHeight = lineCount * 30 + 40;
    }
    const noteAreaY = imagesEndY + 20;
    const noteAreaEnd = noteAreaY + noteAreaHeight;
    
    const footerHeight = 80;
    const footerY = noteAreaEnd + 15;
    const canvasHeight = footerY + footerHeight + 15;
    
    canvas.width = 800;
    canvas.height = canvasHeight;
    
    // 渐变背景
    const gradient1 = ctx.createLinearGradient(0, 0, 0, titleAreaHeight + 180);
    gradient1.addColorStop(0, '#FFF0F0');
    gradient1.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, 800, titleAreaHeight + 180);
    
    // 图片区域背景
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, imagesStartY - 10, 800, imagesTotalHeight + 20);
    
    // 文字区域背景
    if (record.note) {
      const gradient2 = ctx.createLinearGradient(0, noteAreaY, 0, noteAreaEnd);
      gradient2.addColorStop(0, '#F0F4FF');
      gradient2.addColorStop(1, '#E8F0FE');
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, noteAreaY, 800, noteAreaHeight);
    }
    
    // 底部栏
    ctx.fillStyle = '#FF4757';
    ctx.fillRect(0, footerY, 800, footerHeight);
    
    // 底部文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Courier New", monospace, "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('去盖章！GO GO GO', 400, footerY + footerHeight / 2);
    
    // 绘制宝可梦角色
    drawBulbasaur(ctx, 200, 70);
    drawCharmander(ctx, 400, 70);
    drawSquirtle(ctx, 600, 70);
    
    // 标题
    ctx.fillStyle = '#FF4757';
    ctx.font = 'bold 36px "Courier New", monospace, "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(record.title || '未命名', 400, 200);
    
    // 地址和日期
    ctx.fillStyle = '#666666';
    ctx.font = '16px "Courier New", monospace, "Microsoft YaHei"';
    const locationText = [record.country, record.province, record.city, record.address].filter(Boolean).join(' · ');
    ctx.fillText(locationText || '旅行印章', 400, 240);
    ctx.fillText(fmtTime(record.createdAt), 400, 270);
    
    // 图片（保持宽高比）
    let currentY = imagesStartY;
    for (let i = 0; i < processedImages.length; i++) {
      const { imgBitmap, scaledWidth, scaledHeight } = processedImages[i];
      
      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = imgBitmap.width;
      imgCanvas.height = imgBitmap.height;
      const imgCtx = imgCanvas.getContext('2d');
      imgCtx.drawImage(imgBitmap, 0, 0);
      
      const imgX = (800 - scaledWidth) / 2;
      
      ctx.drawImage(imgCanvas, imgX, currentY, scaledWidth, scaledHeight);
      
      currentY += scaledHeight + 20;
    }
    
    // 笔记（无边框）
    if (record.note) {
      ctx.fillStyle = '#55647A';
      ctx.font = '20px "Courier New", monospace, "Microsoft YaHei"';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const lines = wrapText(ctx, record.note, 640, 26);
      let textY = noteAreaY + 20;
      for (const line of lines.slice(0, 5)) {
        ctx.fillText(line, 80, textY);
        textY += 30;
      }
    }
    
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
    
    // 身体 - 浅绿色
    ctx.fillStyle = '#7AC863';
    drawPixelRect(ctx, centerX - 5*pixel, centerY + 1*pixel, 10*pixel, 9*pixel);
    
    // 腹部 - 浅黄绿色
    ctx.fillStyle = '#A8E089';
    drawPixelRect(ctx, centerX - 2*pixel, centerY + 2*pixel, 4*pixel, 6*pixel);
    
    // 头 - 浅绿色
    ctx.fillStyle = '#7AC863';
    drawPixelRect(ctx, centerX - 5*pixel, centerY - 5*pixel, 10*pixel, 7*pixel);
    
    // 眼睛眼眶 - 红色
    ctx.fillStyle = '#FF6B6B';
    drawPixelRect(ctx, centerX - 4*pixel, centerY - 4*pixel, 2*pixel, 3*pixel);
    drawPixelRect(ctx, centerX + 2*pixel, centerY - 4*pixel, 2*pixel, 3*pixel);
    
    // 眼睛 - 黑色瞳孔
    ctx.fillStyle = '#000000';
    drawPixelRect(ctx, centerX - 3*pixel, centerY - 3*pixel, 1*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 3*pixel, centerY - 3*pixel, 1*pixel, 2*pixel);
    
    // 嘴巴 - 红色
    ctx.fillStyle = '#FF4757';
    drawPixelRect(ctx, centerX - 2*pixel, centerY + 0*pixel, 4*pixel, 2*pixel);
    
    // 背上的种子/花苞 - 深绿色
    ctx.fillStyle = '#5E9E3C';
    drawPixelRect(ctx, centerX - 3*pixel, centerY - 10*pixel, 6*pixel, 6*pixel);
    
    // 种子纹理
    ctx.fillStyle = '#4A8C33';
    drawPixelRect(ctx, centerX - 1*pixel, centerY - 9*pixel, 2*pixel, 4*pixel);
    
    // 身上的斑点
    ctx.fillStyle = '#5E9E3C';
    drawPixelRect(ctx, centerX + 3*pixel, centerY - 2*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX + 4*pixel, centerY + 1*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX + 4*pixel, centerY + 4*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX - 4*pixel, centerY + 1*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX - 4*pixel, centerY + 4*pixel, 1*pixel, 1*pixel);
    
    // 手臂
    ctx.fillStyle = '#7AC863';
    drawPixelRect(ctx, centerX + 5*pixel, centerY + 1*pixel, 2*pixel, 3*pixel);
    drawPixelRect(ctx, centerX - 7*pixel, centerY + 1*pixel, 2*pixel, 3*pixel);
    
    // 脚
    ctx.fillStyle = '#7AC863';
    drawPixelRect(ctx, centerX - 4*pixel, centerY + 9*pixel, 3*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY + 9*pixel, 3*pixel, 2*pixel);
  }
  
  // 绘制小火龙
  function drawCharmander(ctx, centerX, centerY) {
    const pixel = 4;
    
    // 身体 - 橙色
    ctx.fillStyle = '#F08030';
    drawPixelRect(ctx, centerX - 4*pixel, centerY + 1*pixel, 8*pixel, 9*pixel);
    
    // 腹部 - 黄色
    ctx.fillStyle = '#FDD835';
    drawPixelRect(ctx, centerX - 2*pixel, centerY + 2*pixel, 4*pixel, 6*pixel);
    
    // 头 - 橙色
    ctx.fillStyle = '#F08030';
    drawPixelRect(ctx, centerX - 4*pixel, centerY - 5*pixel, 8*pixel, 7*pixel);
    
    // 眼睛眼眶 - 白色
    ctx.fillStyle = '#FFFFFF';
    drawPixelRect(ctx, centerX - 3*pixel, centerY - 4*pixel, 2*pixel, 3*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY - 4*pixel, 2*pixel, 3*pixel);
    
    // 眼睛 - 蓝色瞳孔
    ctx.fillStyle = '#607D8B';
    drawPixelRect(ctx, centerX - 2*pixel, centerY - 3*pixel, 1*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 2*pixel, centerY - 3*pixel, 1*pixel, 2*pixel);
    
    // 嘴巴 - 红色
    ctx.fillStyle = '#FF4757';
    drawPixelRect(ctx, centerX - 2*pixel, centerY + 0*pixel, 4*pixel, 2*pixel);
    
    // 牙齿 - 白色
    ctx.fillStyle = '#FFFFFF';
    drawPixelRect(ctx, centerX - 3*pixel, centerY + 0*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX - 1*pixel, centerY + 0*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY + 0*pixel, 1*pixel, 1*pixel);
    drawPixelRect(ctx, centerX + 3*pixel, centerY + 0*pixel, 1*pixel, 1*pixel);
    
    // 手臂
    ctx.fillStyle = '#F08030';
    drawPixelRect(ctx, centerX + 4*pixel, centerY + 0*pixel, 2*pixel, 3*pixel);
    drawPixelRect(ctx, centerX - 6*pixel, centerY + 0*pixel, 2*pixel, 3*pixel);
    
    // 脚
    ctx.fillStyle = '#F08030';
    drawPixelRect(ctx, centerX - 4*pixel, centerY + 9*pixel, 3*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY + 9*pixel, 3*pixel, 2*pixel);
    
    // 尾巴
    ctx.fillStyle = '#F08030';
    drawPixelRect(ctx, centerX - 5*pixel, centerY + 4*pixel, 3*pixel, 2*pixel);
    drawPixelRect(ctx, centerX - 8*pixel, centerY + 3*pixel, 3*pixel, 3*pixel);
    
    // 尾巴火焰 - 黄色
    ctx.fillStyle = '#FFD700';
    drawPixelRect(ctx, centerX - 11*pixel, centerY + 0*pixel, 3*pixel, 4*pixel);
    
    // 火焰核心 - 红色
    ctx.fillStyle = '#FF4757';
    drawPixelRect(ctx, centerX - 12*pixel, centerY + 0*pixel, 2*pixel, 3*pixel);
  }
  
  // 绘制杰尼龟
  function drawSquirtle(ctx, centerX, centerY) {
    const pixel = 4;
    
    // 身体 - 蓝色
    ctx.fillStyle = '#6890F0';
    drawPixelRect(ctx, centerX - 4*pixel, centerY + 2*pixel, 8*pixel, 8*pixel);
    
    // 腹部 - 浅米色
    ctx.fillStyle = '#F5E6D3';
    drawPixelRect(ctx, centerX - 2*pixel, centerY + 3*pixel, 4*pixel, 5*pixel);
    
    // 头 - 蓝色
    ctx.fillStyle = '#6890F0';
    drawPixelRect(ctx, centerX - 4*pixel, centerY - 5*pixel, 8*pixel, 7*pixel);
    
    // 眼睛眼眶 - 紫色
    ctx.fillStyle = '#B39DDB';
    drawPixelRect(ctx, centerX - 3*pixel, centerY - 4*pixel, 2*pixel, 3*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY - 4*pixel, 2*pixel, 3*pixel);
    
    // 眼睛 - 黑色瞳孔
    ctx.fillStyle = '#000000';
    drawPixelRect(ctx, centerX - 2*pixel, centerY - 3*pixel, 1*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 2*pixel, centerY - 3*pixel, 1*pixel, 2*pixel);
    
    // 嘴巴 - 微笑
    ctx.fillStyle = '#263238';
    drawPixelRect(ctx, centerX - 2*pixel, centerY + 1*pixel, 4*pixel, 2*pixel);
    
    // 龟壳 - 棕色
    ctx.fillStyle = '#A0826D';
    drawPixelRect(ctx, centerX - 6*pixel, centerY - 1*pixel, 12*pixel, 10*pixel);
    
    // 壳纹 - 深棕色线条
    ctx.fillStyle = '#806050';
    drawPixelRect(ctx, centerX - 1*pixel, centerY - 1*pixel, 2*pixel, 9*pixel);
    drawPixelRect(ctx, centerX - 5*pixel, centerY + 2*pixel, 10*pixel, 2*pixel);
    drawPixelRect(ctx, centerX - 5*pixel, centerY + 5*pixel, 10*pixel, 2*pixel);
    
    // 壳边框
    ctx.fillStyle = '#6D4C41';
    drawPixelRect(ctx, centerX - 6*pixel, centerY - 1*pixel, 12*pixel, 1*pixel);
    drawPixelRect(ctx, centerX - 6*pixel, centerY + 8*pixel, 12*pixel, 1*pixel);
    
    // 手臂
    ctx.fillStyle = '#6890F0';
    drawPixelRect(ctx, centerX + 4*pixel, centerY + 1*pixel, 2*pixel, 3*pixel);
    drawPixelRect(ctx, centerX - 6*pixel, centerY + 1*pixel, 2*pixel, 3*pixel);
    
    // 脚
    ctx.fillStyle = '#6890F0';
    drawPixelRect(ctx, centerX - 4*pixel, centerY + 9*pixel, 3*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 1*pixel, centerY + 9*pixel, 3*pixel, 2*pixel);
    
    // 尾巴 - 卷曲形状
    ctx.fillStyle = '#6890F0';
    drawPixelRect(ctx, centerX + 4*pixel, centerY + 5*pixel, 2*pixel, 3*pixel);
    drawPixelRect(ctx, centerX + 6*pixel, centerY + 3*pixel, 3*pixel, 2*pixel);
    drawPixelRect(ctx, centerX + 6*pixel, centerY + 5*pixel, 2*pixel, 2*pixel);
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
    
    // 更新统计
    updateStats();
    
    // 检查是否达到5个新记录，触发庆祝动画
    const currentCount = records.length;
    if (currentCount > 0 && currentCount % 5 === 0 && currentCount !== lastRecordCount) {
      triggerCelebration();
    }
    lastRecordCount = currentCount;
    
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
      
      // 检查是否点击了编辑按钮或复选框，如果是则不打开详情
      if (t.closest?.('[data-edit]') || t.classList.contains('batchCheckbox')) {
        return;
      }
      
      // 批量模式下不打开详情页
      if (batchMode) {
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

    // 批量删除按钮
    batchDeleteBtn.addEventListener('click', () => {
      setBatchMode(true);
    });

    // 删除选中项
    deleteSelectedBtn.addEventListener('click', async () => {
      if (selectedIds.size === 0) {
        toast('请先选择要删除的记录');
        return;
      }
      if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) {
        return;
      }
      for (const id of selectedIds) {
        await deleteRecord(id);
        const marker = markers.get(id);
        if (marker) {
          map.removeOverlay(marker);
          markers.delete(id);
        }
      }
      toast(`已删除 ${selectedIds.size} 条记录`);
      setBatchMode(false);
      await refreshRecordsPanel();
    });

    // 取消批量选择
    cancelBatchBtn.addEventListener('click', () => {
      setBatchMode(false);
    });

    // 批量模式切换函数
    function setBatchMode(enabled) {
      batchMode = enabled;
      if (!enabled) {
        selectedIds.clear();
      }
      normalActionsEl.style.display = enabled ? 'none' : 'flex';
      batchActionsEl.style.display = enabled ? 'flex' : 'none';
      refreshRecordsPanel();
    }

    // 批量选择 - 复选框点击
    recordsListEl.addEventListener('change', async (e) => {
      if (e.target.classList.contains('batchCheckbox')) {
        const id = e.target.getAttribute('data-checkbox');
        if (e.target.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        batchCountEl.textContent = `已选 ${selectedIds.size} 项`;
      }
    });

    // 快速重命名 - 开始编辑
    async function startEditingTitle(id) {
      const titleEl = recordsListEl.querySelector(`[data-row-title="${id}"]`);
      if (!titleEl) return;

      const record = await getById(id);
      if (!record) return;

      const currentTitle = record.title || '未命名';

      // 隐藏文本，显示输入框
      titleEl.innerHTML = '';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'titleEditInput';
      input.value = currentTitle;
      input.maxLength = 60;
      titleEl.appendChild(input);
      input.focus();
      input.select();

      // 保存函数
      const saveTitle = async () => {
        const newTitle = input.value.trim() || currentTitle;
        if (newTitle !== currentTitle) {
          record.title = newTitle;
          await putRecord(record);

          // 更新地图标记
          const marker = markers.get(id);
          if (marker) {
            marker.setTitle(newTitle);
          }

          toast('标题已更新');
        }
        await refreshRecordsPanel();
      };

      // 回车保存
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveTitle();
        }
        if (e.key === 'Escape') {
          refreshRecordsPanel();
        }
      });

      // 失去焦点保存
      input.addEventListener('blur', saveTitle);
    }

    // 快速重命名 - 编辑按钮点击
    recordsListEl.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn && !batchMode) {
        e.stopPropagation();
        const id = editBtn.getAttribute('data-edit');
        startEditingTitle(id);
      }
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

    changeMarkerBtn.addEventListener('click', () => {
      markerOverlayEl.classList.add('isOn');
    });

    markerCloseBtn.addEventListener('click', () => {
      markerOverlayEl.classList.remove('isOn');
    });

    markerOverlayEl.addEventListener('click', (e) => {
      if (e.target === markerOverlayEl) {
        markerOverlayEl.classList.remove('isOn');
      }
    });

    markerStyleListEl.addEventListener('click', async (e) => {
      const item = e.target.closest('[data-marker-style]');
      if (!item) return;
      
      const style = item.getAttribute('data-marker-style');
      const record = await getById(activeId);
      if (!record) return;
      
      record.markerStyle = style;
      await putRecord(record);
      
      records = records.map((r) => (r.id === record.id ? record : r));
      updateMarkerStyle(record);
      
      markerOverlayEl.classList.remove('isOn');
      toast('标记样式已更新');
    });
  }

  bind();

  async function locateAndAddMarker() {
    await ensureMap();
    if (!map || !geolocation) {
      toast('地图未初始化');
      return;
    }

    try {
      geolocation.getCurrentPosition(async function(result) {
        if (this.getStatus() == BMAP_STATUS_SUCCESS) {
          const point = result.point;
          map.panTo(point);
          map.setZoom(14);

          const now = new Date();
          const defaultTitle = `未命名 ${fmtDate(now.toISOString())}`;

          await putRecord({
            lng: point.lng,
            lat: point.lat,
            title: defaultTitle,
            note: "",
            address: "",
            country: "",
            province: "",
            city: "",
            imageIds: [],
            theme: "purple",
            markerStyle: "pokeball",
            firstSavedAt: "",
            createdAt: now.toISOString(),
          });

          toast('已定位并添加标记');
        } else {
          toast('定位失败（请检查定位权限）');
        }
      }, { enableHighAccuracy: true });
    } catch (err) {
      toast('定位失败（请检查定位权限）');
    }
  }

  return {
    async onShow() {
      await ensureMap();
      await refreshRecordsPanel();
      await syncMarkers();
      if (!drawerOpen) setDrawer(false);
    },
    locateAndAddMarker,
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

function rowHtml(r, isBatchMode = false, isSelected = false) {
  const editIcon = icon("edit");
  const checkbox = isBatchMode 
    ? `<input type="checkbox" class="batchCheckbox" data-checkbox="${r.id}" ${isSelected ? 'checked' : ''} />` 
    : '';
  
  return `
    <div class="row" role="listitem" data-id="${r.id}" data-title="${escapeAttr(r.title || '未命名')}">
      ${checkbox}
      <div style="min-width:0; display:flex; align-items:center; gap:8px; flex:1;">
        <div style="min-width:0; flex:1;">
          <div class="rowTitle" data-row-title="${r.id}">
            ${escapeHtml(r.title || '未命名')}
            <button class="editBtn" data-edit="${r.id}" title="编辑名称" type="button">${editIcon}</button>
          </div>
          <div class="rowSub">${escapeHtml(r.address || fmtTime(r.createdAt))}</div>
        </div>
      </div>
      <div class="rowThumbs" data-thumbs="${r.id}"></div>
    </div>
  `;
}
