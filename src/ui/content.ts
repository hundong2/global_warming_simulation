export const sources = [
  [
    'IPCC AR6 · 기온과 해수면',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/',
    '세기말 온도는 2081–2100 평균 / 1850–1900 대비. 해수면은 2100년 / 1995–2014 대비.',
  ],
  [
    'IPCC AR6 · 극한 강수',
    'https://www.ipcc.ch/report/ar6/wg1/figures/summary-for-policymakers/figure-spm-6/',
    '산업화 이전 10년에 한 번 발생하던 육지 극한 강수의 온난화 수준별 상대 빈도.',
  ],
  [
    'Rounce et al. (2023) · 빙하',
    'https://doi.org/10.1126/science.abo1324',
    '2100년 전 세계 빙하 질량 손실: 1.5°C에서 26 ± 6%, 4°C에서 41 ± 11%, 2015년 대비. 빙상 제외.',
  ],
  [
    'NOAA · 엘니뇨·라니냐',
    'https://psl.noaa.gov/enso/',
    '열대 태평양의 자연 변동. 장기 온난화와 별도 조작하며 현재 ENSO 관측값을 제공하지 않습니다.',
  ],
  [
    'NOAA · 태풍의 생성',
    'https://oceanservice.noaa.gov/facts/how-hurricanes-form.html',
    '따뜻한 바다, 수분, 약한 연직 바람 시어, 회전 조건을 함께 고려합니다.',
  ],
  [
    'NOAA GFDL · 온난화와 태풍',
    'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/',
    '온난화에 따른 강도·강수 증가와 전 세계 태풍 발생 수의 변화를 구분합니다.',
  ],
  [
    'WHO · 기후와 건강',
    'https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health',
    '기후와 매개체·수인성 감염 위험의 관계. 실제 환자 발생은 방역·의료·노출 등에도 좌우됩니다.',
  ],
  [
    'UN ActNow · 일상 속 실천',
    'https://www.un.org/en/node/143154',
    '에너지, 이동, 식생활, 소비와 공동체에서 할 수 있는 실천.',
  ],
] as const;
export const actions = [
  {
    id: 'energy',
    icon: 'sun',
    category: '집에서',
    title: '쓰지 않는 에너지 줄이기',
    text: '빈 방의 불을 끄고, 냉난방을 적정하게 조절해요. 오래 쓰는 조명은 효율이 높은 제품으로 바꿔요.',
    task: '오늘 사용하지 않는 조명 끄기',
  },
  {
    id: 'travel',
    icon: 'arrow',
    category: '이동할 때',
    title: '가까운 길은 가볍게',
    text: '가능한 거리는 걷거나 자전거를 타요. 대중교통과 함께 타기를 일상의 선택지로 만들어 봐요.',
    task: '이번 주 한 번 대중교통 이용하기',
  },
  {
    id: 'food',
    icon: 'leaf',
    category: '식탁에서',
    title: '한 끼의 선택 바꾸기',
    text: '채소 중심의 식사를 늘리고, 먹을 만큼 준비해요. 남은 음식을 활용하면 음식물 쓰레기도 줄어들어요.',
    task: '남은 재료로 한 끼 준비하기',
  },
  {
    id: 'reuse',
    icon: 'cycle',
    category: '물건을 살 때',
    title: '새것보다 오래 쓰기',
    text: '구입하기 전에 수리·빌리기·중고를 생각해요. 필요한 물건을 골라 오래 쓰는 것도 실천이에요.',
    task: '새로 사기 전 수리 가능성 확인하기',
  },
  {
    id: 'community',
    icon: 'people',
    category: '함께할 때',
    title: '우리 동네의 변화 만들기',
    text: '학교와 직장에서 에너지 절약이나 이동 개선을 제안해요. 공공 교통과 깨끗한 에너지를 위한 정책에 관심을 가져요.',
    task: '주변 사람과 기후 실험 결과 나누기',
  },
  {
    id: 'learn',
    icon: 'globe',
    category: '배울 때',
    title: '알아보고, 이야기하기',
    text: '기후 정보를 출처와 함께 살펴봐요. 이 실험실에서 서로 다른 미래를 비교하고 함께 할 일을 정해 봐요.',
    task: '한 가지 기후 정보의 출처 읽기',
  },
];
export const layerDetails = {
  temperature: {
    title: '바다의 온도를 읽어 보세요',
    text: '색은 위도와 온난화, 엘니뇨·라니냐를 반영한 교육용 표층 수온입니다. 실제 관측 지도는 아닙니다.',
    legend: '교육용 해수면 온도',
    low: '−3°C',
    high: '35°C',
    tag: '해양 온도',
  },
  sea: {
    title: '조금 높아진 바다, 달라지는 해안',
    text: '밝은 해안선은 해수면 상승을 강조한 기호입니다. 지역별 침수 면적은 계산하지 않습니다. 아래 단면은 가상의 해안입니다.',
    legend: '밝은 선 · 해안 변화의 개념 표현',
    low: '',
    high: '',
    tag: '해수면',
  },
  ice: {
    title: '사라지는 빙하의 시간을 살펴보세요',
    text: '흰 입체 기호는 대표 빙하 지역입니다. 크기는 전 세계 평균 질량의 개념 표현이며 개별 빙하의 예측 면적이 아닙니다. 극지 빙상은 고정합니다.',
    legend: '흰 기호 · 남아 있는 빙하 질량의 개념 표현',
    low: '',
    high: '',
    tag: '빙하',
  },
  cyclone: {
    title: '태풍은 어떻게 만들어질까요?',
    text: '서태평양의 가상 실험입니다. 따뜻한 바다만으로 태풍이 생기지 않습니다. 바람 시어·습도·위도를 바꿔 생성 조건을 비교하세요.',
    legend: '나선 · 생성 환경의 개념 표현',
    low: '',
    high: '',
    tag: '태풍',
  },
};
export function icon(name: string, size = 20) {
  const paths: Record<string, string> = {
    globe:
      '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
    wave: '<path d="M2 8q3-4 6 0t6 0t8 0M2 14q3-4 6 0t6 0t8 0M2 20q3-4 6 0t6 0t8 0"/>',
    ice: '<path d="m3 19 6-14 4 8 3-5 6 11ZM7 10l3 3 2-2M14 12l3 3 2-1"/>',
    cycle:
      '<path d="M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
    leaf: '<path d="M20 3C7 2 2 9 6 16s15 3 14-13ZM5 21l11-13"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    people:
      '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
    share: '<path d="M12 16V2m-5 5 5-5 5 5M4 12v9h16v-9"/>',
    play: '<path d="m8 4 12 8-12 8Z"/>',
    pause: '<path d="M8 4v16M16 4v16"/>',
    reset: '<path d="M3 11a9 9 0 1 1 3 8M3 4v7h7"/>',
    rain: '<path d="M5 13a5 5 0 1 1 1-10 6 6 0 0 1 11 2 4 4 0 1 1 2 8ZM7 17l-1 3m6-3-1 3m6-3-1 3"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.globe}</svg>`;
}
