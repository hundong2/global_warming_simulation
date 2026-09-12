# 출처, 가정, 라이선스

[English](../sources.md) | **한국어** · [문서](../../README.ko.md#문서)

2026-09-11–12 확인. 모든 수치 연결과 생략 사항은 [모델 안내](climate-model.md)에 있습니다. 이 사이트는 선택한 참고 수치와 자체 그래픽을 포함하며 논문을 재배포하거나 해당 연구 모델을 실행한다고 주장하지 않습니다. 출처는 정적 참고 자료이며 실시간 자료가 아닙니다.

| 일차 출처                                                                                                                                                                                                                          | 앱 사용 범위와 한계                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [IPCC AR6 WGI 정책결정자를 위한 요약 (2021)](https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/) · [공식 PDF](https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_SPM_final.pdf)                    | 표 SPM.1 기온 최적 추정값, B.5.3 해수면 가능성 높은 범위. 기준과 시간 범위를 분리합니다. 사용자·연간 보간은 자체 제작입니다.                                                |
| [IPCC AR6 WGI 그림 SPM.6](https://www.ipcc.ch/report/ar6/wg1/figures/summary-for-policymakers/figure-spm-6/)                                                                                                                       | 산업화 이전 10년 빈도 극한 강수의 전 세계 육지 상대 빈도. 지역 홍수 발생률이 아니며 보간·상한은 자체 처리입니다.                                                            |
| [Rounce et al., Science 379, 78–83 (2023), DOI 10.1126/science.abo1324](https://doi.org/10.1126/science.abo1324) · [저자 소속 기관 PDF](https://climatechange.umaine.edu/wp-content/uploads/sites/439/2023/01/science.abo1324.pdf) | 1.5°C·4°C에서 2015년 대비 2100년 전 세계 빙하 질량 손실, 빙상 제외. ± 값은 앙상블 중앙값의 95% 신뢰구간입니다. 지역 기호·중간 온도·연도는 자체 제작입니다.                  |
| [NOAA PSL: ENSO](https://psl.noaa.gov/enso/) · [NOAA PMEL: 라니냐](https://www.pmel.noaa.gov/elnino/what-is-la-nina)                                                                                                               | 중·동부 적도 태평양의 따뜻하거나 차가운 변화 방향. 가상 수온장과 진폭은 관측이나 운영 ENSO 지수가 아닙니다.                                                                 |
| [NOAA Ocean Service: 허리케인 생성](https://oceanservice.noaa.gov/facts/how-hurricanes-form.html) · [NOAA AOML: 허리케인 FAQ](https://www.aoml.noaa.gov/hrd-faq/)                                                                  | 따뜻한 물과 깊이, 시어, 수분, 코리올리 효과. 눈·눈벽·나선형 비구름 구조를 구름 표현에 참고합니다. 점수·차단값·구름 형태·축척은 자체 제작이며 따뜻한 층의 깊이는 생략합니다. |
| [NOAA GFDL: 온난화와 허리케인](https://www.gfdl.noaa.gov/global-warming-and-hurricanes/)                                                                                                                                           | 빈도·강도·강수·불확실성을 구분합니다. 실제 태풍 개수·경로·피해를 예측하지 않습니다. 극한 모드의 후보 수와 경로 섭동은 이 출처의 결과가 아닌 자체 가정입니다.                |
| [WHO: 기후변화와 건강](https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health) · [WHO: 매개체 전파 질환](https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases)                               | 기후는 여러 경로로 건강에 영향을 줍니다. 자체 온도 적합도 곡선은 질병별 보정이나 역학 예측이 없습니다.                                                                      |
| [UN ActNow: 건강한 지구를 위한 행동](https://www.un.org/en/node/143154) · [가정 에너지](https://www.un.org/en/actnow/home-energy)                                                                                                  | 일상 실천 아이디어를 바꾸어 설명했습니다. 체크 개수는 탄소 상쇄나 측정한 배출 감축량이 아닙니다.                                                                            |

태풍 구조와 조향을 2026-09-12 다시 확인했습니다. [NOAA AOML: 태풍 구조](https://www.aoml.noaa.gov/general/graphics/lib/storm.html), [NHC: 해양 안전과 전향](https://www.nhc.noaa.gov/prepare/marine.php)을 참고했습니다. 정성적 설명의 근거이며 자체 계수·생략한 상호작용·확대 그림은 [날씨 모델](weather-model.md)에 기록합니다.

## 로컬 지리

- 파일: `public/data/countries.geojson`, 248,548 바이트.
- 원본: [Natural Earth v5.1.2, 1:110m 국가 지도](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson).
- 배포 조건: [퍼블릭 도메인](https://www.naturalearthdata.com/about/terms-of-use/).
- 이 사본은 인접 Orbital Lab에서 출처를 기록한 Natural Earth 자산을 가져왔습니다. 그곳에서 사용하지 않는 국가 속성을 제거했으며 지리 좌표와 폴리곤은 유지합니다. 로컬에서 렌더링하고 지도 서비스를 요청하지 않습니다.
- SHA-256: `e4578a878f5be98ca4b5796a750bb976e76d27ac8260058fa5cc44fe30143b27`. 검증 스크립트가 이 자산을 고정하므로 자료 변경은 검토·기록해야 합니다.
- 경계는 원본을 따르며 영토 분쟁에 대한 입장을 나타내지 않습니다. 해상도는 필지 단위나 해안 침수 분석을 지원하지 못하며 작은 섬은 생략될 수 있습니다.

## 기술 참고 자료

- [Three.js 문서](https://threejs.org/docs/) — 장면·텍스처·카메라·렌더러.
- [Vite 정적 배포](https://vite.dev/guide/static-deploy.html#github-pages) — 빌드와 기본 경로.
- [GitHub Pages 사용자 지정 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — Pages 산출물과 배포 권한.
- [Playwright 문서](https://playwright.dev/docs/intro) — 데스크톱·모바일 브라우저 검증.

## 라이선스와 자산

기존 [Apache License 2.0](../../LICENSE)을 변경하지 않습니다. Three.js는 MIT이며 의존성 고지는 설치 패키지와 해당하는 생성 배포물에 유지됩니다. Natural Earth는 퍼블릭 도메인입니다. SVG 아이콘·로고·지도 색·빙하 그림·별·절차적 태풍 구름과 경로·해안 단면은 코드로 자체 제작했습니다. 외부 사진·글꼴 파일·AI 생성 이미지는 필요하지 않습니다. 참고 논문의 저작권은 원저자에게 있으며 일부 수치와 재서술한 개념만 사용합니다.

## 해석 경계

실시간 기후 관측·보정된 예측·실제 홍수/감염병 발생률·지역 취약성 지도·개인 의료 조언·수치화된 개인 탄소 절감량을 제공하지 않습니다. 확장 전 [모델 안내](climate-model.md)를 읽으세요. 확인 날짜는 검토 시점을 뜻하며 이전에 발표된 전망이 최신 과학이라는 주장이 아닙니다.
