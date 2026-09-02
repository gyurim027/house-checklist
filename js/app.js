// 04_checklist 앱 로직 (순수 JS, 빌드 도구 없음, file:// 실행 대상)

const STORAGE_KEY = 'houseChecklist_v1';

let store = { inspections: [], currentInspectionId: null };
const uiState = { openCategories: new Set(['category01']) };
let confirmModalCallback = null;
let toastTimer = null;

// ---------- 유틸 ----------

function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

function generateId() {
  return 'inspection_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function stripNumberPrefix(title) {
  return title.replace(/^\d+\.\s*/, '');
}

function buildEmptyFollowUps() {
  return {
    mold: false, leak: false, noise: false, managementFee: false,
    parking: false, internet: false, heatingCooling: false,
    repair: false, other: false, otherText: ''
  };
}

function buildEmptyChecklist() {
  const result = {};
  CHECKLIST_CATEGORIES.forEach((cat) => {
    const items = {};
    cat.sections.forEach((sec) => sec.items.forEach((item) => { items[item.id] = false; }));
    result[cat.id] = { items, memo: '' };
  });
  return result;
}

function countCheckedItems(inspection) {
  let count = 0;
  CHECKLIST_CATEGORIES.forEach((cat) => {
    cat.sections.forEach((sec) => sec.items.forEach((item) => {
      if (inspection.checklist[cat.id].items[item.id]) count++;
    }));
  });
  return count;
}

const debouncedSave = debounce(() => saveInspection(), 500);

// ---------- localStorage ----------

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { inspections: [], currentInspectionId: null };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.inspections)) return { inspections: [], currentInspectionId: null };
    return parsed;
  } catch (e) {
    return { inspections: [], currentInspectionId: null };
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    return false;
  }
}

function getCurrentInspection() {
  return store.inspections.find((i) => i.id === store.currentInspectionId) || null;
}

// ---------- CRUD ----------

function createInspection(propertyData) {
  const now = new Date().toISOString();
  const inspection = {
    id: generateId(),
    property: Object.assign({ buildingName: '', roadAddress: '', jibunAddress: '' }, propertyData || {}),
    visit: { date: todayDateString(), time: '', realtor: '', price: '', monthlyRent: '', managementFee: '' },
    checklist: buildEmptyChecklist(),
    noiseLevel: '',
    evaluation: { pros: ['', '', ''], cons: ['', '', ''], followUps: buildEmptyFollowUps() },
    finalDecision: '',
    summary: '',
    createdAt: now,
    updatedAt: now
  };
  store.inspections.push(inspection);
  store.currentInspectionId = inspection.id;
  persist();
  showInspectionView();
  renderInspection();
  renderSavedInspections();
}

function loadInspection(id) {
  store.currentInspectionId = id;
  persist();
  showInspectionView();
  renderInspection();
  renderSavedInspections();
  document.getElementById('saved-inspections-list').hidden = true;
}

function saveInspection(opts) {
  opts = opts || {};
  const manual = !!opts.manual;
  const inspection = getCurrentInspection();
  const hasAddress = inspection && (inspection.property.roadAddress || inspection.property.jibunAddress || inspection.property.buildingName);

  if (manual && !hasAddress) {
    showToast('먼저 확인할 집의 주소를 선택해주세요.');
    return;
  }
  if (!inspection) return;

  inspection.updatedAt = new Date().toISOString();
  showSaveStatus('saving');
  const ok = persist();
  if (ok) {
    showSaveStatus('saved');
    renderSavedInspections();
    updateCompletionBanner();
    if (manual) showToast('체크리스트가 저장되었습니다.');
  } else {
    showSaveStatus('error');
  }
}

function deleteInspection(id) {
  store.inspections = store.inspections.filter((i) => i.id !== id);
  if (store.currentInspectionId === id) store.currentInspectionId = null;
  persist();
  renderSavedInspections();
  if (!getCurrentInspection()) {
    showEmptyState();
  } else {
    renderInspection();
  }
}

// ---------- 주소 ----------

function searchAddress() {
  if (typeof daum === 'undefined' || !daum.Postcode) {
    showToast('주소 검색 서비스를 불러오지 못했습니다.');
    return;
  }
  new daum.Postcode({
    oncomplete: function (data) {
      selectAddress(normalizeAddressResult(data));
    }
  }).open();
}

function normalizeAddressResult(data) {
  return {
    buildingName: data.buildingName || '',
    roadAddress: data.roadAddress || data.autoRoadAddress || '',
    jibunAddress: data.jibunAddress || data.autoJibunAddress || data.address || ''
  };
}

function selectAddress(addressData) {
  const current = getCurrentInspection();
  if (!current) {
    createInspection(addressData);
    return;
  }
  const hasExistingAddress = current.property.roadAddress || current.property.jibunAddress || current.property.buildingName;
  const applyChange = () => {
    current.property = addressData;
    saveInspection();
    renderInspection();
  };
  if (hasExistingAddress) {
    showConfirmModal('다른 주소를 선택하시겠습니까?\n현재 작성 중인 내용은 유지됩니다.', applyChange);
  } else {
    applyChange();
  }
}

// ---------- 체크리스트 상호작용 ----------

function toggleChecklist(categoryId) {
  const isOpen = uiState.openCategories.has(categoryId);
  if (isOpen) uiState.openCategories.delete(categoryId); else uiState.openCategories.add(categoryId);
  const body = document.querySelector(`[data-category-body="${categoryId}"]`);
  const header = document.querySelector(`.category-header[data-category="${categoryId}"]`);
  if (body) body.hidden = isOpen;
  if (header) header.classList.toggle('open', !isOpen);
}

function updateChecklist(categoryId, itemId, checked) {
  const inspection = getCurrentInspection();
  if (!inspection) return;
  inspection.checklist[categoryId].items[itemId] = checked;
  saveInspection();
  updateProgress();
}

function updateNoiseLevel(value) {
  const inspection = getCurrentInspection();
  if (!inspection) return;
  inspection.noiseLevel = value;
  saveInspection();
}

function updateMemo(categoryId, value) {
  const inspection = getCurrentInspection();
  if (!inspection) return;
  inspection.checklist[categoryId].memo = value;
  showSaveStatus('saving');
  debouncedSave();
}

function updateEvaluation(kind, payload) {
  const inspection = getCurrentInspection();
  if (!inspection) return;
  switch (kind) {
    case 'pros':
      inspection.evaluation.pros[payload.index] = payload.value;
      showSaveStatus('saving');
      debouncedSave();
      break;
    case 'cons':
      inspection.evaluation.cons[payload.index] = payload.value;
      showSaveStatus('saving');
      debouncedSave();
      break;
    case 'followUp':
      inspection.evaluation.followUps[payload.key] = payload.checked;
      saveInspection();
      if (payload.key === 'other') {
        document.getElementById('followup-other-text').hidden = !payload.checked;
      }
      break;
    case 'otherText':
      inspection.evaluation.followUps.otherText = payload.value;
      showSaveStatus('saving');
      debouncedSave();
      break;
  }
}

function updateFinalDecision(value) {
  const inspection = getCurrentInspection();
  if (!inspection) return;
  inspection.finalDecision = value;
  saveInspection();
}

function updateSummary(value) {
  const inspection = getCurrentInspection();
  if (!inspection) return;
  inspection.summary = value;
  showSaveStatus('saving');
  debouncedSave();
}

function updateVisitField(field, value, options) {
  options = options || {};
  const inspection = getCurrentInspection();
  if (!inspection) return;
  inspection.visit[field] = value;
  if (options.immediate) {
    saveInspection();
  } else {
    showSaveStatus('saving');
    debouncedSave();
  }
}

function updateProgress() {
  const inspection = getCurrentInspection();
  if (!inspection) return;
  const total = getTotalChecklistItemCount();
  let totalChecked = 0;

  CHECKLIST_CATEGORIES.forEach((cat) => {
    const catTotal = cat.sections.reduce((s, sec) => s + sec.items.length, 0);
    let catChecked = 0;
    cat.sections.forEach((sec) => sec.items.forEach((item) => {
      if (inspection.checklist[cat.id].items[item.id]) catChecked++;
    }));
    totalChecked += catChecked;
    const badge = document.querySelector(`[data-category-count="${cat.id}"]`);
    if (badge) badge.textContent = `${catChecked} / ${catTotal}`;
  });

  const pct = total === 0 ? 0 : Math.round((totalChecked / total) * 100);
  document.getElementById('progress-text').textContent = `현재 ${totalChecked} / ${total}개 확인`;
  document.getElementById('progress-bar-fill').style.width = pct + '%';
  updateCompletionBanner();
}

function updateCompletionBanner() {
  const inspection = getCurrentInspection();
  const banner = document.getElementById('completion-banner');
  if (!inspection || !inspection.finalDecision) {
    banner.hidden = true;
    return;
  }
  const total = getTotalChecklistItemCount();
  const checked = countCheckedItems(inspection);
  banner.hidden = false;
  banner.innerHTML = `점검 기록 저장 완료<br>총 ${checked} / ${total}개 항목 확인`;
}

function scrollToCategory(targetId) {
  if (targetId === 'evaluation') {
    document.getElementById('evaluation').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (!uiState.openCategories.has(targetId)) {
    uiState.openCategories.add(targetId);
    const body = document.querySelector(`[data-category-body="${targetId}"]`);
    const header = document.querySelector(`.category-header[data-category="${targetId}"]`);
    if (body) body.hidden = false;
    if (header) header.classList.add('open');
  }
  const el = document.querySelector(`.category[data-category="${targetId}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- 렌더링 ----------

function renderCategoryMarkup(cat, index) {
  const isLast = index === CHECKLIST_CATEGORIES.length - 1;
  const nextTarget = isLast ? 'evaluation' : CHECKLIST_CATEGORIES[index + 1].id;
  const nextLabel = isLast ? '현장 평가 작성하기 →' : `다음 · ${stripNumberPrefix(CHECKLIST_CATEGORIES[index + 1].title)} →`;
  const isOpen = uiState.openCategories.has(cat.id);

  const noticeHtml = cat.notice ? `<p class="category-notice">${cat.notice}</p>` : '';

  const sectionsHtml = cat.sections.map((section) => {
    const headingHtml = section.heading ? `<h3 class="section-heading">${section.heading}</h3>` : '';
    const itemsHtml = section.items.map((item) => `
      <label class="check-row" for="${cat.id}-${item.id}">
        <input type="checkbox" id="${cat.id}-${item.id}" data-category="${cat.id}" data-item="${item.id}">
        <span>${item.text}</span>
      </label>`).join('');
    return `${headingHtml}<div class="item-group">${itemsHtml}</div>`;
  }).join('');

  const noiseHtml = cat.hasNoiseLevel ? `
    <div class="radio-group">
      ${cat.noiseLevelOptions.map((opt) => `
        <label class="radio-row">
          <input type="radio" name="noiseLevel" value="${opt}">
          <span>${opt}</span>
        </label>`).join('')}
    </div>` : '';

  const memoHtml = cat.hasMemo ? `<textarea class="memo-textarea" data-memo="${cat.id}" placeholder="메모"></textarea>` : '';

  return `
    <div class="category" data-category="${cat.id}">
      <button type="button" class="category-header${isOpen ? ' open' : ''}" data-category="${cat.id}">
        <span class="chevron">▶</span>
        <span class="category-title">${cat.title}</span>
        <span class="category-count" data-category-count="${cat.id}">0 / 0</span>
      </button>
      <div class="category-body" data-category-body="${cat.id}"${isOpen ? '' : ' hidden'}>
        ${noticeHtml}
        ${sectionsHtml}
        ${noiseHtml}
        ${memoHtml}
        <div class="category-nav">
          <button type="button" class="nav-button" data-scroll-target="${nextTarget}">${nextLabel}</button>
        </div>
      </div>
    </div>`;
}

function buildChecklistDOM() {
  const container = document.getElementById('checklist');
  container.innerHTML = CHECKLIST_CATEGORIES.map((cat, index) => renderCategoryMarkup(cat, index)).join('');
}

function buildEvaluationDOM() {
  const list = document.getElementById('followups-list');
  list.innerHTML = FOLLOW_UP_OPTIONS.map((opt) => `
    <label class="check-row">
      <input type="checkbox" data-followup="${opt.id}">
      <span>${opt.text}</span>
    </label>`).join('');
}

function buildFinalDecisionDOM() {
  const container = document.getElementById('final-decision-options');
  container.innerHTML = FINAL_DECISION_OPTIONS.map((label) => `
    <label class="radio-row">
      <input type="radio" name="finalDecision" value="${label}">
      <span>${label}</span>
    </label>`).join('');
}

function renderInspection() {
  const inspection = getCurrentInspection();
  if (!inspection) return;

  const hasAddress = inspection.property.roadAddress || inspection.property.jibunAddress || inspection.property.buildingName;
  const addressDisplay = document.getElementById('address-display');
  const searchBtn = document.getElementById('btn-search-address');
  const changeBtn = document.getElementById('btn-change-address');

  if (hasAddress) {
    addressDisplay.innerHTML = `
      ${inspection.property.buildingName ? `<p class="address-building">${inspection.property.buildingName}</p>` : ''}
      <p class="address-road">${inspection.property.roadAddress || ''}</p>
      ${inspection.property.jibunAddress ? `<p class="address-jibun">지번: ${inspection.property.jibunAddress}</p>` : ''}`;
    addressDisplay.hidden = false;
    searchBtn.hidden = true;
    changeBtn.hidden = false;
  } else {
    addressDisplay.hidden = true;
    searchBtn.hidden = false;
    changeBtn.hidden = true;
  }

  document.getElementById('input-visit-date').value = inspection.visit.date || '';
  document.getElementById('input-visit-time').value = inspection.visit.time || '';
  document.getElementById('input-realtor').value = inspection.visit.realtor || '';
  document.getElementById('input-price').value = inspection.visit.price || '';
  document.getElementById('input-monthly-rent').value = inspection.visit.monthlyRent || '';
  document.getElementById('input-management-fee').value = inspection.visit.managementFee || '';

  CHECKLIST_CATEGORIES.forEach((cat) => {
    cat.sections.forEach((sec) => sec.items.forEach((item) => {
      const checked = !!inspection.checklist[cat.id].items[item.id];
      const input = document.getElementById(`${cat.id}-${item.id}`);
      if (input) {
        input.checked = checked;
        input.closest('.check-row').classList.toggle('checked', checked);
      }
    }));
    const memoEl = document.querySelector(`[data-memo="${cat.id}"]`);
    if (memoEl) memoEl.value = inspection.checklist[cat.id].memo || '';

    const body = document.querySelector(`[data-category-body="${cat.id}"]`);
    const header = document.querySelector(`.category-header[data-category="${cat.id}"]`);
    if (body && header) {
      const open = uiState.openCategories.has(cat.id);
      body.hidden = !open;
      header.classList.toggle('open', open);
    }
  });

  document.querySelectorAll('input[name="noiseLevel"]').forEach((r) => {
    r.checked = r.value === inspection.noiseLevel;
  });

  inspection.evaluation.pros.forEach((v, i) => {
    const el = document.querySelector(`.pros-input[data-index="${i}"]`);
    if (el) el.value = v || '';
  });
  inspection.evaluation.cons.forEach((v, i) => {
    const el = document.querySelector(`.cons-input[data-index="${i}"]`);
    if (el) el.value = v || '';
  });
  FOLLOW_UP_OPTIONS.forEach((opt) => {
    const cb = document.querySelector(`input[data-followup="${opt.id}"]`);
    if (cb) cb.checked = !!inspection.evaluation.followUps[opt.id];
  });
  document.getElementById('followup-other-text').hidden = !inspection.evaluation.followUps.other;
  document.getElementById('followup-other-text').value = inspection.evaluation.followUps.otherText || '';

  document.querySelectorAll('input[name="finalDecision"]').forEach((r) => {
    r.checked = r.value === inspection.finalDecision;
  });
  document.getElementById('input-summary').value = inspection.summary || '';

  updateProgress();
  showSaveStatus('idle');
}

function renderSavedInspections() {
  const list = document.getElementById('saved-inspections-list');
  const total = getTotalChecklistItemCount();
  const sorted = [...store.inspections].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  list.innerHTML = sorted.map((inspection) => {
    const checked = countCheckedItems(inspection);
    const name = inspection.property.buildingName || inspection.property.roadAddress || '(주소 미입력)';
    const dateLabel = inspection.visit.date || '';
    return `
      <li class="saved-item" data-load-id="${inspection.id}">
        <div class="saved-item-main">
          <p class="saved-item-name">${name}</p>
          <p class="saved-item-meta">${dateLabel} · ${checked} / ${total} 확인</p>
          <p class="saved-item-address">${inspection.property.roadAddress || ''}</p>
        </div>
        <button type="button" class="danger-link" data-delete-id="${inspection.id}">기록 삭제</button>
      </li>`;
  }).join('');

  document.getElementById('btn-toggle-saved').textContent = `최근 체크한 집 (${store.inspections.length})`;
}

function showEmptyState() {
  document.getElementById('empty-state').hidden = false;
  document.getElementById('inspection-view').hidden = true;
  document.getElementById('saved-inspections-list').hidden = store.inspections.length === 0;
}

function showInspectionView() {
  document.getElementById('empty-state').hidden = true;
  document.getElementById('inspection-view').hidden = false;
}

// ---------- 알림 / 모달 ----------

function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

function showSaveStatus(status) {
  const el = document.getElementById('save-status');
  if (!el) return;
  const map = { saving: '저장 중...', saved: '✓ 저장됨', error: '저장하지 못했습니다.', idle: '' };
  el.textContent = map[status] !== undefined ? map[status] : '';
}

function showConfirmModal(message, onConfirm, options) {
  options = options || {};
  document.getElementById('confirm-modal-message').textContent = message;
  document.getElementById('confirm-modal-confirm').textContent = options.confirmLabel || '확인';
  document.getElementById('confirm-modal-cancel').textContent = options.cancelLabel || '취소';
  confirmModalCallback = onConfirm;
  document.getElementById('confirm-modal').hidden = false;
}

function hideConfirmModal() {
  document.getElementById('confirm-modal').hidden = true;
  confirmModalCallback = null;
}

// ---------- 이벤트 바인딩 ----------

function attachStaticEventListeners() {
  document.getElementById('btn-empty-search').addEventListener('click', searchAddress);
  document.getElementById('btn-search-address').addEventListener('click', searchAddress);
  document.getElementById('btn-change-address').addEventListener('click', searchAddress);
  document.getElementById('btn-save').addEventListener('click', () => saveInspection({ manual: true }));
  document.getElementById('btn-new-inspection').addEventListener('click', () => createInspection());
  document.getElementById('btn-toggle-saved').addEventListener('click', () => {
    const list = document.getElementById('saved-inspections-list');
    list.hidden = !list.hidden;
  });

  document.getElementById('input-visit-date').addEventListener('change', (e) => updateVisitField('date', e.target.value, { immediate: true }));
  document.getElementById('input-visit-time').addEventListener('change', (e) => updateVisitField('time', e.target.value, { immediate: true }));
  document.getElementById('input-realtor').addEventListener('input', (e) => updateVisitField('realtor', e.target.value));
  document.getElementById('input-price').addEventListener('input', (e) => updateVisitField('price', e.target.value));
  document.getElementById('input-monthly-rent').addEventListener('input', (e) => updateVisitField('monthlyRent', e.target.value));
  document.getElementById('input-management-fee').addEventListener('input', (e) => updateVisitField('managementFee', e.target.value));

  const checklist = document.getElementById('checklist');
  checklist.addEventListener('click', (e) => {
    const header = e.target.closest('.category-header');
    if (header) { toggleChecklist(header.dataset.category); return; }
    const navBtn = e.target.closest('[data-scroll-target]');
    if (navBtn) { scrollToCategory(navBtn.dataset.scrollTarget); }
  });
  checklist.addEventListener('change', (e) => {
    const target = e.target;
    if (target.matches('input[type="checkbox"][data-category][data-item]')) {
      updateChecklist(target.dataset.category, target.dataset.item, target.checked);
      target.closest('.check-row').classList.toggle('checked', target.checked);
    } else if (target.matches('input[type="radio"][name="noiseLevel"]')) {
      updateNoiseLevel(target.value);
    }
  });
  checklist.addEventListener('input', (e) => {
    const target = e.target;
    if (target.matches('textarea[data-memo]')) {
      updateMemo(target.dataset.memo, target.value);
    }
  });

  document.querySelectorAll('.pros-input').forEach((el) => {
    el.addEventListener('input', (e) => updateEvaluation('pros', { index: Number(e.target.dataset.index), value: e.target.value }));
  });
  document.querySelectorAll('.cons-input').forEach((el) => {
    el.addEventListener('input', (e) => updateEvaluation('cons', { index: Number(e.target.dataset.index), value: e.target.value }));
  });
  document.getElementById('followups-list').addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"][data-followup]');
    if (!cb) return;
    updateEvaluation('followUp', { key: cb.dataset.followup, checked: cb.checked });
  });
  document.getElementById('followup-other-text').addEventListener('input', (e) => updateEvaluation('otherText', { value: e.target.value }));
  document.getElementById('final-decision-options').addEventListener('change', (e) => {
    const radio = e.target.closest('input[type="radio"][name="finalDecision"]');
    if (radio) updateFinalDecision(radio.value);
  });
  document.getElementById('input-summary').addEventListener('input', (e) => updateSummary(e.target.value));

  document.getElementById('saved-inspections-list').addEventListener('click', (e) => {
    const delBtn = e.target.closest('[data-delete-id]');
    if (delBtn) {
      e.stopPropagation();
      showConfirmModal(
        '이 체크 기록을 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.',
        () => deleteInspection(delBtn.dataset.deleteId),
        { confirmLabel: '삭제' }
      );
      return;
    }
    const item = e.target.closest('[data-load-id]');
    if (item) loadInspection(item.dataset.loadId);
  });

  document.getElementById('confirm-modal-confirm').addEventListener('click', () => {
    const cb = confirmModalCallback;
    hideConfirmModal();
    if (cb) cb();
  });
  document.getElementById('confirm-modal-cancel').addEventListener('click', hideConfirmModal);
}

// ---------- 부트스트랩 ----------

function initApp() {
  store = getStore();
  buildChecklistDOM();
  buildEvaluationDOM();
  buildFinalDecisionDOM();
  attachStaticEventListeners();
  renderSavedInspections();

  const current = getCurrentInspection();
  if (current) {
    showInspectionView();
    renderInspection();
  } else {
    showEmptyState();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
