import './style.css';
import {
  DEFAULT,
  SCENARIOS,
  decodeSettings,
  encodeSettings,
  evaluate,
  normalize,
  type Settings,
  type Layer,
  type ScenarioId,
  type Enso,
} from './simulation/climate';
import { Globe, loadGeography } from './render/globe';
import { actions, icon, layerDetails, sources } from './ui/content';
import { layerDetail } from './ui/details';
import { createLandQuery, type LandQuery } from './simulation/geography';
import {
  buildStormSeason,
  sampleStormSeason,
  type StormSeason,
} from './simulation/weather';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
let state = decodeSettings(location.hash);
let globe: Globe | undefined;
let activeTab = 'lab';
let playing = false;
let interval: ReturnType<typeof setInterval> | undefined;
let speed = 1;
let loading = false;
let landQuery: LandQuery = () => true;
let season: StormSeason = {
  tracks: [],
  candidateCount: 0,
  mode: state.stormMode,
};
let seasonKey = '';
let weatherPlaying = false;
let weatherInterval: ReturnType<typeof setInterval> | undefined;
let checked = new Set<string>();
try {
  const stored: unknown = JSON.parse(
    localStorage.getItem('climate-lab-actions-v1') ?? '[]',
  );
  if (Array.isArray(stored))
    checked = new Set(
      stored.filter(
        (id): id is string =>
          typeof id === 'string' && actions.some((a) => a.id === id),
      ),
    );
} catch {
  /* Storage is optional. */
}

$('#app').innerHTML = `
  <a class="skip" href="#main">본문으로 이동</a>
  <header class="header"><a class="brand" href="#" aria-label="Climate Lab 처음으로"><span class="brand-mark">${icon('globe', 28)}</span><span>CLIMATE<span class="brand-light">LAB</span><small>기후를 이해하는 작은 실험실</small></span></a>
    <nav aria-label="주 메뉴"><button data-tab="lab" aria-current="page">지구 실험실</button><button data-tab="impacts">기후와 우리</button><button data-tab="actions">함께하는 실천</button></nav>
    <button class="quiet source-button" id="sources-open">${icon('info', 17)} 모델 · 출처</button>
  </header>
  <main id="main">
  <section id="view-lab" class="view" aria-label="지구 실험실">
    <div class="intro"><div><p class="eyebrow"><span class="status-dot"></span> ONE PLANET. MANY POSSIBLE FUTURES.</p><h1>같은 지구, <span>다른 미래.</span></h1><p>온도를 바꾸고, 연결된 변화를 발견하세요. 우리의 선택이 만들어 갈 내일을 함께 살펴봐요.</p></div><button class="outlined" id="share">${icon('share', 16)} 실험 공유</button></div>
    <div class="workspace">
      <aside class="settings-panel" aria-label="시뮬레이션 설정">
        <div class="panel-heading"><span class="eyebrow">01 / SCENARIO</span><button class="icon-button" id="reset" aria-label="모든 실험 설정 초기화" title="초기화">${icon('reset', 17)}</button></div>
        <h2>어떤 미래를 그려볼까요?</h2><p class="subtle small">온실가스 배출 경로를 선택해 보세요.</p>
        <div class="scenario-list" aria-label="배출 시나리오">
          ${Object.entries(SCENARIOS)
            .map(
              ([id, s]) =>
                `<button class="scenario" data-scenario="${id}" aria-pressed="false"><span class="radio-dot"></span><span><strong>${s.name}</strong><small>${s.ssp} · 사회경제 경로</small></span><b>+${s.target.toFixed(1)}°</b></button>`,
            )
            .join('')}
        </div>
        <div class="temperature-control"><label for="target">세기말 지구 온도 <span id="custom-label" class="pill">경로 기준</span></label><div class="temperature-value"><output id="target-value" for="target">+2.7</output><span>°C</span></div><input id="target" type="range" min="1.5" max="4.4" step="0.1" aria-describedby="target-help"/><div class="range-ticks"><span>+1.5°C</span><span>+4.4°C</span></div><p id="target-help" class="micro">1850–1900년 대비 · 직접 조절하면 사용자 실험으로 전환됩니다.</p></div>
        <div class="enso-control"><label for="enso">태평양의 자연 변동</label><select id="enso"><option value="neutral">중립 · 평상시 패턴</option><option value="nino">엘니뇨 · 동태평양이 따뜻해짐</option><option value="nina">라니냐 · 동태평양이 차가워짐</option></select><p class="micro">엘니뇨·라니냐는 장기 온난화와 별개의 자연 변동이에요.</p></div>
        <div class="setting-note">${icon('info', 17)}<span>교육용 시나리오입니다.<br/>실시간 관측이나 미래 예보가 아니에요.</span></div>
      </aside>
      <section class="earth-panel" aria-label="지구본 시각화">
        <div class="earth-toolbar"><span class="earth-label"><span class="status-dot"></span> EARTH EXPLORER</span><span id="layer-tag">해양 온도</span></div>
        <div class="layer-tabs" aria-label="지구본 표시 레이어">${(['temperature', 'sea', 'ice', 'cyclone'] as Layer[]).map((layer, i) => `<button data-layer="${layer}" aria-pressed="false">${icon(['sun', 'wave', 'ice', 'cycle'][i], 16)} ${layerDetails[layer].tag}</button>`).join('')}</div>
        <div id="globe" class="globe"></div><div class="globe-loader" id="globe-status" role="status">지구를 준비하고 있어요…</div>
        <div id="globe-error" class="globe-error" hidden><p id="globe-error-message"></p><button id="retry" class="outlined">3D 화면 다시 시작</button><small>수치·설명·실천 메뉴는 계속 이용할 수 있어요.</small></div>
        <div class="camera-controls"><button class="icon-button" id="zoom-in" aria-label="지구본 확대">+</button><button class="icon-button" id="zoom-out" aria-label="지구본 축소">−</button><button class="icon-button" id="camera-reset" aria-label="카메라 초기화">${icon('reset', 17)}</button></div>
        <div class="globe-bottom"><div class="region-buttons" aria-label="지구본 이동"><button data-region="asia">아시아</button><button data-region="pacific">태평양</button><button data-region="arctic">북극</button></div><label class="rotate-label"><input type="checkbox" id="rotate"/> 자동 회전</label></div>
        <div class="map-legend"><div class="legend-gradient" id="legend-gradient"></div><div class="legend-labels"><span id="legend-low">−3°C</span><span id="legend-title">교육용 해수면 온도</span><span id="legend-high">35°C</span></div></div>
        <p class="drag-hint">드래그하여 회전 · 스크롤하여 확대 · 지구본 선택 후 방향키</p>
      </section>
      <aside class="metrics-panel" aria-label="현재 연도의 기후 지표">
        <p class="eyebrow">02 / THE BIG PICTURE</p><h2><span data-year>2050</span>년의 지구</h2>
        <div class="metric metric-warm"><div>${icon('sun', 18)} 지구 평균 기온 변화</div><strong id="warming">+1.8<small>°C</small></strong><p>1850–1900년 대비 · 교육용 시간 보간</p></div>
        <div class="metric"><div>${icon('wave', 18)} 평균 해수면 상승</div><strong id="sea-value">0.24–0.30<small>m</small></strong><p>1995–2014년 대비 · <span id="sea-method">시간 보간</span></p></div>
        <div class="metric"><div>${icon('ice', 18)} 빙하 질량 손실</div><strong id="ice-value">14<small>%</small></strong><p>2015년 대비 · 빙상 제외 · <span id="ice-method">교육용 보간</span></p><div class="ice-meter"><i id="ice-meter"></i></div></div>
        <button class="impact-link" data-tab="impacts">우리 삶에는 어떤 변화가? ${icon('arrow', 18)}</button>
      </aside>
    </div>
    <section id="weather-panel" class="weather-panel" hidden aria-label="태풍 이동 실험">
      <div class="weather-heading"><div><p class="eyebrow">30 DAYS IN THE WESTERN PACIFIC</p><h2>바다에서 태어나, 바람을 따라</h2></div><span class="pill" id="weather-count"></span></div>
      <div class="weather-controls"><button id="weather-play" class="outlined" aria-label="태풍 이동 재생"></button><label for="weatherDay">날씨 시간 <output id="weather-day"></output><input id="weatherDay" type="range" min="0" max="30" step="0.1"/></label><button id="weather-reset" class="quiet">처음부터</button></div>
      <div class="weather-key"><span>흰 구름 · 눈과 나선형 비구름</span><span>금빛 선 · 지나온 경로</span><span>기후 연도와 별도의 30일 실험</span></div>
      <div id="storm-list" class="storm-list"></div>
      <div class="weather-settings"><div><label for="stormMode">태풍 수 실험</label><select id="stormMode"><option value="stress">가상 극한 실험 · 따뜻할수록 후보 증가</option><option value="reference">비교 실험 · 후보 수 고정</option></select><p id="storm-mode-help" class="micro"></p></div><div><label for="trackVariability">경로 굴곡 <output id="track-variability"></output></label><input id="trackVariability" type="range" min="0" max="100" step="5"/><p class="micro">조향 바람의 흔들림을 가정합니다. 극한 실험에서는 온난화에 따라 굴곡도 강조합니다. 실제 미래 경로의 전망은 아닙니다.</p></div></div>
      <p class="weather-note">온난화가 전 세계 태풍 수를 반드시 늘리지는 않습니다. 강한 태풍의 비중·강수 증가에 관한 연구와 별개로, 이 실험의 후보 수·경로·구름 크기는 교육용 가정입니다. 태풍끼리의 상호작용은 계산하지 않습니다.</p>
    </section>
    <div id="layer-detail"></div>
    <div class="timeline"><button class="play-button" id="play" aria-label="시간 재생">${icon('play', 17)}</button><div class="timeline-year"><output id="year-value" for="year">2050</output><span>YEAR / 연도</span></div><div class="timeline-track"><label class="sr-only" for="year">실험 연도</label><input type="range" id="year" min="2020" max="2100" step="1"/><div class="range-ticks"><span>2020</span><span>2040</span><span>2060</span><span>2080</span><span>2100</span></div></div><select id="speed" aria-label="시간 재생 속도"><option value="1">1× 속도</option><option value="2">2× 속도</option><option value="5">5× 속도</option></select></div>
    <div class="explainer-row"><article class="layer-explainer"><span class="eyebrow">OBSERVE & UNDERSTAND</span><h2 id="layer-title"></h2><p id="layer-description"></p><div id="layer-extra"></div></article><article class="question-card"><span class="small accent">작은 실험 제안</span><h3 id="experiment-title">태평양의 색은 어떻게 달라질까요?</h3><p id="experiment-text">엘니뇨와 라니냐를 번갈아 선택하고 태평양으로 이동해 보세요. 동쪽 바다의 온도 차이를 발견할 수 있어요.</p><button class="text-button" id="experiment">태평양 살펴보기 ${icon('arrow', 17)}</button></article></div>
    <section class="cyclone-lab" id="cyclone-lab" hidden><div><p class="eyebrow">TROPICAL CYCLONE / 생성 조건 실험</p><h2>따뜻한 바다에 조건을 더하면</h2><p>서태평양 동경 140°의 생성 조건 점수입니다. 위의 이동 실험은 여러 가상 후보를 따로 생성하며 실제 발생 확률·연간 발생 수를 예측하지 않습니다.</p><strong class="cyclone-result" id="cyclone-score"></strong><p id="cyclone-explanation"></p></div><div class="cyclone-sliders"><label for="shear">연직 바람 시어 <output id="shear-value"></output><small>높이에 따른 바람 차이 · 강할수록 조직화 방해</small></label><input id="shear" type="range" min="0" max="30" step="1"/><label for="humidity">상대 습도 <output id="humidity-value"></output></label><input id="humidity" type="range" min="20" max="100" step="1"/><label for="latitude">북위 <output id="latitude-value"></output><small>적도 부근에서는 회전을 만드는 효과가 약해요.</small></label><input id="latitude" type="range" min="0" max="30" step="1"/></div></section>
  </section>
  <section id="view-impacts" class="view" aria-label="기후와 우리" hidden>
    <div class="intro"><div><p class="eyebrow">CONNECTED CLIMATE, CONNECTED LIVES</p><h1>기후의 변화가 <span>삶의 변화로.</span></h1><p>강수, 해안, 건강의 연결을 읽어 보세요. 같은 온도에서도 노출과 대비에 따라 결과가 달라집니다.</p></div><button class="outlined" data-tab="lab">실험 설정으로 ${icon('arrow', 17)}</button></div>
    <div class="impact-context"><span><b data-year>2050</b>년 · <span id="impact-scenario"></span> · 온난화 <b id="impact-temp"></b></span><span class="pill">연구 참고값 + 교육용 지표</span></div>
    <div class="impact-grid"><article class="impact-card"><span class="feature-icon">${icon('rain', 26)}</span><span class="source-tag">IPCC AR6 · 육지 전 세계 평균</span><h2>극한 강수는 얼마나 잦아질까요?</h2><div class="big-number" id="rain-value"></div><p>산업화 이전에 10년에 한 번 발생하던 극한 강수의 상대 빈도입니다. <strong>홍수 발생률과는 다릅니다.</strong></p><div class="comparison-bar"><span>산업화 이전</span><i style="--bar:33.33%;--bar-color:#607779"></i><b>1.0배</b></div><div class="comparison-bar"><span>선택한 온도</span><i id="rain-bar"></i><b id="rain-ratio"></b></div><p class="micro">1·1.5·2·4°C 참고값 사이를 선형 보간합니다. 4°C 초과는 4°C 값으로 제한합니다. 확률을 선형 외삽하지 않습니다.</p></article>
    <article class="impact-card"><span class="feature-icon blue">${icon('wave', 26)}</span><span class="source-tag">개념 모델 · 발생 확률 아님</span><h2>풍수해에 대비한다면</h2><div class="big-number" id="flood-value"></div><p>극한 강수와 해수면을 조합한 가상 해안 위험 점수입니다. 배수·방재와 노출 저감을 가정해 비교합니다.</p><label for="adaptation">지역의 대비 수준 <output id="adaptation-value"></output></label><input id="adaptation" type="range" min="0" max="100" step="5"/><div class="range-ticks"><span>낮음</span><span>높음</span></div><p class="micro">대비는 피해·노출 지표를 줄이며 지구 온도나 해수면을 낮추지 않습니다. 지역별 지형·인구·하천·방재 자료는 포함하지 않습니다.</p></article></div>
    <article class="health-panel"><div><span class="source-tag">WHO의 기후·건강 관계 설명에 기반한 개념 실험</span><h2>기온이 오르면 감염병도 늘어날까요?</h2><p>매개체가 활동하기 좋은 온도에는 범위가 있습니다. 이 그래프는 <strong>가상의 매개체 환경 적합도</strong>를 보여 줍니다. 감염병 발생률·환자 수가 아니며, 수치 식은 특정 질병에 맞춘 연구 모형이 아닙니다.</p><p>실제 전파는 강수, 물과 위생, 매개체 종, 면역, 이동과 방역에도 영향을 받습니다. 이미 더운 지역에서는 이 단순 모형의 적합도가 낮아질 수도 있어요.</p><span class="micro">기준 기온은 지역 관측이 아닌 가상 지역의 설정값입니다. 대비 수준은 가상의 노출 저감으로 반영됩니다.</span></div><div id="health-chart" class="health-chart" aria-label="가상 지역별 매개체 환경 적합도"></div></article>
    <section class="scenario-comparison"><p class="eyebrow">COMPARE THE POSSIBILITIES</p><h2>다른 선택, 나란히 비교하기</h2><p>현재 선택한 <span data-year></span>년을 기준으로 비교합니다. 세기말 목표 온도는 경로별 연구 대표값입니다.</p><div class="table-scroll"><table><caption class="sr-only">배출 경로별 현재 연도 시나리오 비교</caption><thead><tr><th>배출 경로</th><th>세기말 목표</th><th>선택 연도 온난화</th><th>해수면 상승</th><th>빙하 질량 손실</th><th>극한 강수 빈도</th></tr></thead><tbody id="comparison-table"></tbody></table></div><p class="micro">해수면: 1995–2014년 대비. 빙하: 2015년 대비, 빙상 제외. 중간 연도는 교육용 보간. 각 행은 같은 대비 수준을 사용합니다.</p></section>
  </section>
  <section id="view-actions" class="view" aria-label="함께하는 실천" hidden>
    <div class="intro"><div><p class="eyebrow">A BETTER FUTURE STARTS WITH US</p><h1>작은 실천이 모여, <span>다른 내일로.</span></h1><p>내가 할 수 있는 일부터 하나씩. 일상의 선택과 공동체의 변화를 함께 만들어 가요.</p></div><div class="action-count"><strong id="action-count">0 / 6</strong><span>나의 실천 계획</span></div></div>
    <div class="action-note">${icon('leaf', 22)}<p>지속할 수 있는 실천을 골라 보세요. 체크는 이 브라우저에만 저장됩니다.<br/><span>개인의 행동과 함께 에너지·교통·산업의 구조적 변화가 필요합니다. 체크 수를 탄소 감축량으로 환산하지 않습니다.</span></p></div>
    <div class="actions-grid">${actions.map((a, i) => `<article class="action-card"><div class="action-card-top"><span class="feature-icon">${icon(a.icon, 27)}</span><span>0${i + 1} / ${a.category}</span></div><h2>${a.title}</h2><p>${a.text}</p><label class="action-check"><input type="checkbox" data-action="${a.id}" ${checked.has(a.id) ? 'checked' : ''}/><span>${a.task}</span></label></article>`).join('')}</div>
    <div class="action-footer"><p>실천 아이디어: <a href="https://www.un.org/en/node/143154" target="_blank" rel="noopener noreferrer">UN ActNow ${icon('arrow', 15)}</a></p><button class="quiet" id="clear-actions">실천 계획 초기화</button></div>
  </section>
  </main>
  <footer><span><b>CLIMATE LAB</b> 하나뿐인 지구를 이해하는 시간.</span><div><button class="text-button" id="footer-sources">모델과 한계</button><a href="https://github.com/hundong2/global_warming_simulation" target="_blank" rel="noopener noreferrer">GitHub ↗</a><span>교육용 · 공개된 과학을 바탕으로</span></div></footer>
  <dialog id="sources-dialog" aria-labelledby="sources-title"><div class="dialog-heading"><div><p class="eyebrow">SCIENCE & TRANSPARENCY</p><h2 id="sources-title">모델, 근거, 그리고 한계</h2></div><button id="sources-close" class="icon-button" aria-label="모델과 출처 닫기">×</button></div><p>이 실험실은 연구 결과를 탐색하는 교육 도구입니다. 기후 모형·기상 예보·침수 지도·질병 예측을 직접 실행하지 않습니다.</p><div class="model-summary"><h3>무엇을 계산하나요?</h3><p><strong>온도·해수면:</strong> IPCC의 세기말 시나리오 대표값과 해수면 가능성 높은 범위를 사용합니다. 2020년 온난화 +1.2°C·해수면 +0.08 m는 교육용 시작 가정입니다. 연도 사이 값과 사용자 온도에 대응하는 해수면은 자체 보간입니다.</p><p><strong>빙하:</strong> Rounce et al.의 1.5°C·4°C 종점 사이를 보간하고, 2015–2100년은 선형 변화로 표현합니다. 4°C 초과는 4°C 참고값으로 제한합니다. 오차는 95% 신뢰구간이며 IPCC 해수면 범위와 의미가 다릅니다. 지구본 기호의 크기와 해안선 밝기는 실제 규모가 아닙니다.</p><p><strong>태풍:</strong> 해수면 온도·시어·습도·위도에 따른 자체 제작 0–100점입니다. 눈·눈벽·비구름과 가상 이동 경로를 30일 동안 표현합니다. 육지·차가운 바다에서 약해집니다. 실제 발생 수·풍속·경로·확률을 예측하지 않습니다. 온난화가 모든 해역의 태풍 수를 늘린다는 의미가 아닙니다.</p><p><strong>풍수해·건강:</strong> 대비 실험과 가상 매개체 온도 적합도는 보정되지 않은 개념 식입니다. 실제 재해·감염병 발생률 자료는 제공하지 않습니다. 연구 근거가 있는 극한 강수의 상대 빈도를 따로 표시합니다.</p></div><h3>주요 자료</h3><ul class="source-list">${sources.map(([title, url, text]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${title} ↗</a><p>${text}</p></li>`).join('')}</ul><p class="micro">지도: Natural Earth v5.1.2, public domain · 앱 실행 시 외부 데이터를 요청하지 않습니다. 소스와 전체 식은 저장소의 영어·한국어 문서에 기록되어 있습니다.</p><button id="export" class="outlined">현재 실험을 JSON으로 저장 ${icon('share', 16)}</button></dialog>
  <dialog id="share-dialog" aria-labelledby="share-title"><div class="dialog-heading"><h2 id="share-title">같은 설정으로 함께 실험해요</h2><button class="icon-button" id="share-close" aria-label="공유 창 닫기">×</button></div><p>이 주소에 온도·연도·레이어·생성 조건·날씨 시간·경로 설정·대비 수준이 담겨 있어요. 같은 배포 주소에서 열면 같은 설정이 적용됩니다.</p><label for="share-url">실험 주소</label><input id="share-url" type="text" readonly/><button id="copy-link" class="outlined">링크 복사</button><p class="micro" id="share-local-note"></p></dialog>
  <div id="toast" role="status" class="toast" hidden></div>
`;

function setText(id: string, text: string) {
  $(id).textContent = text;
}
function toast(text: string) {
  setText('#toast', text);
  $('#toast').hidden = false;
  setTimeout(() => {
    $('#toast').hidden = true;
  }, 4500);
}
function updateMotion() {
  globe?.setMotion(
    $('#rotate') instanceof HTMLInputElement &&
      $<HTMLInputElement>('#rotate').checked,
  );
  globe?.setActive(
    activeTab === 'lab' &&
      !$<HTMLDialogElement>('#sources-dialog').open &&
      !$<HTMLDialogElement>('#share-dialog').open,
  );
}
function refreshWeather() {
  const key = JSON.stringify({
    ...state,
    weatherDay: 0,
    layer: '',
    adaptation: 0,
  });
  if (key !== seasonKey) {
    season = buildStormSeason(state, landQuery);
    seasonKey = key;
  }
  const snapshot = sampleStormSeason(season, state.weatherDay);
  globe?.updateWeather(snapshot);
  $<HTMLInputElement>('#weatherDay').value = String(state.weatherDay);
  setText('#weather-day', `${state.weatherDay.toFixed(1)} / 30일`);
  setText(
    '#weather-count',
    `활성 ${snapshot.storms.length}개 · 후보 ${snapshot.candidateCount}개`,
  );
  $('#weather-count').dataset.candidates = String(snapshot.candidateCount);
  $('#storm-list').innerHTML = snapshot.storms.length
    ? snapshot.storms
        .map(
          (storm) =>
            `<span class="storm-chip"><b>T${String(storm.id + 1).padStart(2, '0')}</b> ${storm.stage}<i style="--strength:${Math.round(storm.intensity * 100)}%"></i><small>가상 발달 ${Math.round(storm.intensity * 100)}/100</small></span>`,
        )
        .join('')
    : '<p class="micro">현재 활성 태풍이 없습니다. 시간을 이동하거나 생성 조건을 바꿔 보세요.</p>';
}
function setWeatherPlaying(value: boolean) {
  if (value && playing) setPlaying(false);
  clearInterval(weatherInterval);
  weatherPlaying = value;
  $('#weather-play').innerHTML =
    `${icon(value ? 'pause' : 'play', 16)} ${value ? '이동 일시정지' : '이동 재생'}`;
  $('#weather-play').setAttribute(
    'aria-label',
    value ? '태풍 이동 일시정지' : '태풍 이동 재생',
  );
  if (!value) return;
  if (state.weatherDay >= 30) state.weatherDay = 0;
  let last = performance.now();
  weatherInterval = setInterval(() => {
    const now = performance.now();
    state.weatherDay = Math.min(
      30,
      state.weatherDay + Math.min(0.15, (now - last) / 1000),
    );
    last = now;
    refreshWeather();
    if (state.weatherDay >= 30) setWeatherPlaying(false);
  }, 65);
}
function setPlaying(value: boolean) {
  setWeatherPlaying(false);
  playing = value;
  clearInterval(interval);
  $('#play').innerHTML = icon(value ? 'pause' : 'play', 17);
  $('#play').setAttribute('aria-label', value ? '시간 일시정지' : '시간 재생');
  if (value)
    interval = setInterval(() => {
      state.year = Math.min(2100, state.year + 1);
      refresh();
      if (state.year === 2100) setPlaying(false);
    }, 800 / speed);
  updateMotion();
}
function showTab(tab: string) {
  activeTab = tab;
  setPlaying(false);
  document.querySelectorAll<HTMLElement>('.view').forEach((view) => {
    view.hidden = view.id !== `view-${tab}`;
  });
  document.querySelectorAll<HTMLElement>('nav [data-tab]').forEach((button) => {
    if (button.dataset.tab === tab) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  updateMotion();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function refresh() {
  state = normalize(state);
  const m = evaluate(state);
  for (const id of [
    'target',
    'year',
    'enso',
    'shear',
    'humidity',
    'latitude',
    'adaptation',
    'stormMode',
    'trackVariability',
  ] as const)
    $<HTMLInputElement | HTMLSelectElement>(`#${id}`).value = String(state[id]);
  document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => {
    el.textContent = String(state.year);
  });
  document
    .querySelectorAll<HTMLElement>('[data-scenario]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.scenario === state.scenario),
      ),
    );
  document
    .querySelectorAll<HTMLElement>('[data-layer]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.layer === state.layer),
      ),
    );
  setText('#target-value', `+${state.target.toFixed(1)}`);
  setText(
    '#custom-label',
    state.scenario === 'custom' ? '사용자 실험' : '경로 기준',
  );
  setText('#year-value', String(state.year));
  $('#warming').innerHTML = `+${m.warming.toFixed(2)}<small>°C</small>`;
  $('#sea-value').innerHTML =
    `${m.sea[0].toFixed(2)}–${m.sea[1].toFixed(2)}<small>m</small>`;
  setText(
    '#sea-method',
    state.year === 2100 && state.scenario !== 'custom'
      ? 'IPCC 가능성 높은 범위'
      : '교육용 보간 범위',
  );
  $('#ice-value').innerHTML = `${m.glacierLoss.toFixed(1)}<small>%</small>`;
  $('#ice-meter').style.width = `${100 - m.glacierLoss}%`;
  setText(
    '#ice-method',
    state.year === 2100 && (state.target === 1.5 || state.target === 4)
      ? '연구 종점'
      : '교육용 보간',
  );
  const d = layerDetails[state.layer];
  setText('#layer-tag', d.tag);
  setText('#layer-title', d.title);
  setText('#layer-description', d.text);
  setText('#legend-title', d.legend);
  setText('#legend-low', d.low);
  setText('#legend-high', d.high);
  $('#legend-gradient').hidden = state.layer !== 'temperature';
  const anomalyView = state.layer === 'temperature' && state.enso !== 'neutral';
  $('#legend-gradient').classList.toggle('anomaly', anomalyView);
  if (anomalyView) {
    const phase = state.enso === 'nino' ? '엘니뇨' : '라니냐';
    setText('#layer-tag', `${phase} · 수온 편차`);
    setText('#legend-title', '평상시 대비 수온 편차 · 개념');
    setText('#legend-low', '−2°C');
    setText('#legend-high', '+2°C');
    setText(
      '#layer-description',
      `${phase}에 따른 평상시 대비 수온 편차를 보여 줍니다. 주황은 더 따뜻한 곳, 파랑은 더 차가운 곳입니다. 실제 관측값이 아닌 개념 패턴이며 장기 온난화와 별개입니다. 중립을 선택하면 전체 표층 수온으로 돌아갑니다.`,
    );
  }
  $('#cyclone-lab').hidden = state.layer !== 'cyclone';
  $('#layer-extra').innerHTML = '';
  $('#layer-detail').innerHTML = layerDetail(state);
  $('#weather-panel').hidden = state.layer !== 'cyclone';
  setText('#track-variability', String(state.trackVariability));
  setText(
    '#storm-mode-help',
    state.stormMode === 'stress'
      ? '온도에 따라 30일 동안 최대 12개 후보를 배치하는 가상 설정입니다. 관측된 발생률이 아닙니다.'
      : '동일한 4개 후보로 온도와 생성 조건의 영향을 비교합니다. 실제 기후 전망이 아닙니다.',
  );
  const experiment =
    state.layer === 'cyclone'
      ? [
          '시어가 강해지면 어떻게 될까요?',
          '바람 시어를 최대로 올려 보세요. 바다가 따뜻해도 태풍의 소용돌이가 유지되기 어려워져요.',
          '생성 조건으로 이동',
        ]
      : state.layer === 'ice'
        ? [
            '감축하는 미래에는 얼마나 남을까요?',
            '2100년으로 이동하고 강한 감축과 매우 높은 배출을 번갈아 비교해 보세요.',
            '2100년 비교하기',
          ]
        : state.layer === 'sea'
          ? [
              '해안의 대비도 중요할까요?',
              '기후와 우리 메뉴에서 대비 수준을 바꾸고 위험 점수를 비교해 보세요.',
              '풍수해 비교하기',
            ]
          : [
              '태평양의 색은 어떻게 달라질까요?',
              '엘니뇨와 라니냐를 번갈아 선택하고 태평양으로 이동해 보세요. 동쪽 바다의 온도 차이를 발견할 수 있어요.',
              '태평양 살펴보기',
            ];
  setText('#experiment-title', experiment[0]);
  setText('#experiment-text', experiment[1]);
  $('#experiment').innerHTML = `${experiment[2]} ${icon('arrow', 17)}`;
  setText('#shear-value', `${state.shear} m/s`);
  setText('#humidity-value', `${state.humidity}%`);
  setText('#latitude-value', `${state.latitude}°`);
  setText('#cyclone-score', `생성 환경 ${m.cyclone.toFixed(0)} / 100점`);
  setText(
    '#cyclone-explanation',
    `가상 표층 수온 ${m.sst.toFixed(1)}°C · ${state.latitude < 5 ? '적도 부근: 회전 조건 부족' : m.sst < 26.5 ? '수온 조건 부족' : m.cyclone < 20 ? '조직화에 불리한 환경' : '생성에 유리한 조건이 일부 충족됨'} · 발생 확률 아님`,
  );
  setText(
    '#impact-scenario',
    state.scenario === 'custom'
      ? '사용자 실험'
      : SCENARIOS[state.scenario].name,
  );
  setText('#impact-temp', `+${m.warming.toFixed(2)}°C`);
  $('#rain-value').innerHTML = `${m.rain.toFixed(2)}<small>배</small>`;
  setText('#rain-ratio', `${m.rain.toFixed(2)}배`);
  $('#rain-bar').style.setProperty('--bar', `${(m.rain / 3) * 100}%`);
  $('#flood-value').innerHTML = `${m.flood.toFixed(0)}<small>/ 100점</small>`;
  setText('#adaptation-value', `${state.adaptation} / 100`);
  $('#health-chart').innerHTML = [
    '서늘한 가상 지역',
    '온화한 가상 지역',
    '따뜻한 가상 지역',
    '더운 가상 지역',
  ]
    .map(
      (name, i) =>
        `<div class="health-row"><div><strong>${name}</strong><span>${[19, 24, 29, 32][i]}°C 기준 → ${m.vectorTemperatures[i].toFixed(1)}°C</span><b>${m.vectors[i].toFixed(0)}<small>/100점</small></b></div><div class="health-track"><i style="width:${m.vectors[i]}%"></i></div></div>`,
    )
    .join('');
  $('#comparison-table').innerHTML = Object.entries(SCENARIOS)
    .map(([id, scenario]) => {
      const r = evaluate({ ...state, scenario: id as ScenarioId });
      return `<tr><th>${scenario.name}<small>${scenario.ssp}</small></th><td>+${scenario.target.toFixed(1)}°C</td><td>+${r.warming.toFixed(2)}°C</td><td>${r.sea[0].toFixed(2)}–${r.sea[1].toFixed(2)} m</td><td>${r.glacierLoss.toFixed(1)}%</td><td>${r.rain.toFixed(2)}배</td></tr>`;
    })
    .join('');
  globe?.update(state);
  refreshWeather();
  if (state.year === 2100 && playing) setPlaying(false);
}
async function startGlobe() {
  if (loading) return;
  loading = true;
  $('#globe-error').hidden = true;
  $('#globe-status').hidden = false;
  globe?.dispose();
  globe = undefined;
  try {
    const geography = await loadGeography();
    landQuery = createLandQuery(geography);
    seasonKey = '';
    globe = new Globe(
      $('#globe'),
      geography,
      state,
      (message) => {
        setPlaying(false);
        $('#globe-error').hidden = false;
        setText('#globe-error-message', message);
      },
      () => {
        $('#globe-error').hidden = true;
      },
    );
    refreshWeather();
    updateMotion();
  } catch (error) {
    $('#globe-error').hidden = false;
    setText(
      '#globe-error-message',
      `3D 화면을 열 수 없습니다. ${error instanceof Error && error.message.includes('지리') ? error.message : '이 브라우저의 그래픽 지원을 확인해 주세요.'}`,
    );
  } finally {
    loading = false;
    $('#globe-status').hidden = true;
  }
}
document
  .querySelectorAll<HTMLElement>('[data-tab]')
  .forEach((button) =>
    button.addEventListener('click', () => showTab(button.dataset.tab!)),
  );
document.querySelectorAll<HTMLElement>('[data-scenario]').forEach((button) =>
  button.addEventListener('click', () => {
    setPlaying(false);
    state.scenario = button.dataset.scenario as ScenarioId;
    refresh();
  }),
);
document.querySelectorAll<HTMLElement>('[data-layer]').forEach((button) =>
  button.addEventListener('click', () => {
    setWeatherPlaying(false);
    state.layer = button.dataset.layer as Layer;
    refresh();
    if (state.layer === 'cyclone') {
      globe?.focus('asia');
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
        setWeatherPlaying(true);
    }
  }),
);
document
  .querySelectorAll<HTMLElement>('[data-region]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      globe?.focus(button.dataset.region as 'asia' | 'pacific' | 'arctic'),
    ),
  );
for (const id of [
  'target',
  'year',
  'shear',
  'humidity',
  'latitude',
  'adaptation',
  'trackVariability',
] as const)
  $(`#${id}`).addEventListener('input', () => {
    setPlaying(false);
    state[id] = Number($<HTMLInputElement>(`#${id}`).value);
    if (id === 'target') state.scenario = 'custom';
    refresh();
  });
$('#enso').addEventListener('change', () => {
  setWeatherPlaying(false);
  state.enso = $<HTMLSelectElement>('#enso').value as Enso;
  refresh();
});
$('#stormMode').addEventListener('change', () => {
  setPlaying(false);
  state.stormMode = $<HTMLSelectElement>('#stormMode')
    .value as Settings['stormMode'];
  refresh();
});
$('#weather-play').addEventListener('click', () => {
  const next = !weatherPlaying;
  setPlaying(false);
  setWeatherPlaying(next);
});
$('#weatherDay').addEventListener('input', () => {
  setPlaying(false);
  state.weatherDay = Number($<HTMLInputElement>('#weatherDay').value);
  refreshWeather();
});
$('#weather-reset').addEventListener('click', () => {
  setWeatherPlaying(false);
  state.weatherDay = 0;
  refreshWeather();
});
$('#reset').addEventListener('click', () => {
  setPlaying(false);
  state = { ...DEFAULT };
  $<HTMLInputElement>('#rotate').checked = false;
  speed = 1;
  $<HTMLSelectElement>('#speed').value = '1';
  globe?.focus('asia');
  history.replaceState(null, '', location.pathname + location.search);
  refresh();
  updateMotion();
});
$('.brand').addEventListener('click', (e) => {
  e.preventDefault();
  showTab('lab');
});
$('#play').addEventListener('click', () => {
  if (!playing && state.year === 2100) {
    state.year = 2020;
    refresh();
  }
  setPlaying(!playing);
});
$('#speed').addEventListener('change', () => {
  speed = Number($<HTMLSelectElement>('#speed').value);
  if (playing) setPlaying(true);
});
$('#rotate').addEventListener('change', updateMotion);
$('#camera-reset').addEventListener('click', () => globe?.focus('asia'));
$('#zoom-in').addEventListener('click', () => globe?.zoom(-0.3));
$('#zoom-out').addEventListener('click', () => globe?.zoom(0.3));
$('#retry').addEventListener('click', startGlobe);
$('#experiment').addEventListener('click', () => {
  if (state.layer === 'sea') showTab('impacts');
  else if (state.layer === 'ice') {
    state.year = 2100;
    refresh();
  } else if (state.layer === 'cyclone')
    $('#cyclone-lab').scrollIntoView({ behavior: 'instant' });
  else {
    globe?.focus('pacific');
    $('#enso').focus();
  }
});
function openDialog(id: string) {
  setPlaying(false);
  $<HTMLDialogElement>(id).showModal();
  updateMotion();
}
for (const id of ['#sources-open', '#footer-sources'])
  $(id).addEventListener('click', () => openDialog('#sources-dialog'));
for (const id of ['sources', 'share']) {
  $(`#${id}-close`).addEventListener('click', () =>
    $<HTMLDialogElement>(`#${id}-dialog`).close(),
  );
  $(`#${id}-dialog`).addEventListener('close', updateMotion);
}
$('#share').addEventListener('click', () => {
  $<HTMLInputElement>('#share-url').value =
    `${location.origin}${location.pathname}#${encodeSettings(state)}`;
  setText(
    '#share-local-note',
    location.hostname === '127.0.0.1' || location.hostname === 'localhost'
      ? '현재는 로컬 미리보기 주소입니다. 다른 기기에서 공유하려면 GitHub Pages에 배포한 뒤 이 기능을 이용하세요.'
      : '받는 사람의 실천 체크리스트와 카메라 위치는 바뀌지 않습니다.',
  );
  openDialog('#share-dialog');
});
$('#copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(
      $<HTMLInputElement>('#share-url').value,
    );
    toast('실험 링크를 복사했어요.');
  } catch {
    $<HTMLInputElement>('#share-url').select();
    toast('주소를 선택했어요. 복사 기능을 이용해 주세요.');
  }
});
$('#export').addEventListener('click', () => {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          schemaVersion: 1,
          settings: state,
          results: evaluate(state),
          weather: sampleStormSeason(season, state.weatherDay),
          assumptions:
            'Educational interpolation; sea relative to 1995–2014; glacier mass relative to 2015; hazard and vector scores are not incidence probabilities.',
          sources: sources.map(([name, url]) => ({ name, url })),
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `climate-lab-${state.year}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function updateActions() {
  setText('#action-count', `${checked.size} / 6`);
  try {
    localStorage.setItem(
      'climate-lab-actions-v1',
      JSON.stringify([...checked]),
    );
  } catch {
    toast('이 브라우저에서는 저장할 수 없어 이번 화면에서만 유지돼요.');
  }
}
document.querySelectorAll<HTMLInputElement>('[data-action]').forEach((input) =>
  input.addEventListener('change', () => {
    if (input.checked) checked.add(input.dataset.action!);
    else checked.delete(input.dataset.action!);
    updateActions();
  }),
);
$('#clear-actions').addEventListener('click', () => {
  checked.clear();
  document
    .querySelectorAll<HTMLInputElement>('[data-action]')
    .forEach((input) => {
      input.checked = false;
    });
  updateActions();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPlaying(false);
});
window.addEventListener('hashchange', () => {
  setPlaying(false);
  $<HTMLDialogElement>('#share-dialog').close();
  $<HTMLDialogElement>('#sources-dialog').close();
  state = decodeSettings(location.hash);
  showTab('lab');
  refresh();
});
window.addEventListener('pagehide', () => {
  clearInterval(interval);
  clearInterval(weatherInterval);
  globe?.dispose();
});
setText('#action-count', `${checked.size} / 6`);
setWeatherPlaying(false);
refresh();
void startGlobe();
