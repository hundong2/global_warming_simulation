# GitHub Pages 배포

[English](../deployment.md) | **한국어** · [문서](../../README.ko.md#문서)

## 현재 제공 상태

저장소에는 완성된 정적 앱과 배포 워크플로가 포함됩니다. 파일 생성만으로 Pages가 활성화되거나 사이트가 공개되지는 않습니다. 실제 원격 배포 상태는 최신 개발 기록을 확인하세요. 성공적으로 공개한 후 예상 주소는 [GitHub Pages의 Climate Lab](https://hundong2.github.io/global_warming_simulation/)입니다.

## 로컬 미리보기

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview
```

개발 서버는 보통 `http://127.0.0.1:5173`, 미리보기는 4173 포트를 사용합니다. `npm run test:e2e`는 빌드하고 4193 포트의 저장소 하위 경로를 검사합니다. `file://`로 `index.html`을 직접 열지 않습니다.

## 최초 공개

1. 소스를 검토하고 로컬에서 검증합니다. push·공개 배포 전 저장소 소유자의 허가를 받습니다.
2. 구현·잠금 파일·워크플로를 브랜치에 커밋하고 검토한 뒤 승인된 변경을 `main`에 병합합니다.
3. [Settings → Pages](https://github.com/hundong2/global_warming_simulation/settings/pages)의 Build and deployment → Source에서 **GitHub Actions**를 선택합니다. `docs/`는 앱 빌드가 아닌 문서이므로 선택하지 않습니다.
4. Settings → Actions → General에서 저장소가 사용하는 공식 액션을 허용해야 합니다. 저장소·조직 정책이나 보호 환경은 관리자 권한이 필요할 수 있습니다.
5. [Actions → Deploy to GitHub Pages](https://github.com/hundong2/global_warming_simulation/actions/workflows/pages.yml)에서 **Run workflow → main**을 선택해 실행합니다. 이후 `main` push도 같은 워크플로를 실행합니다. Pages 설정 전 실패했다면 설정 후 다시 실행하세요.
6. 빌드 작업은 형식·타입·단위 테스트·빌드 검사·양쪽 브라우저 프로젝트를 통과한 후 `dist/`를 Pages 산출물로 업로드합니다. 배포는 이 작업이 성공해야 하며 `main`에서만 수행합니다.
7. 성공한 배포 결과의 주소를 엽니다. 워크플로 파일이나 로컬 미리보기만으로 공개 완료를 판단하지 않습니다.

GitHub가 `GITHUB_TOKEN`을 제공합니다. 개인 접근 토큰·API 키·사용자 도메인·유료 지도 서비스가 필요하지 않습니다. 검증 권한은 `contents: read`, 배포 작업 권한은 `pages: write`와 `id-token: write`입니다. 환경 검토 요구는 유지됩니다. PR 검증은 사이트를 배포하지 않습니다.

## 하위 경로와 로컬 의존성

Vite는 `base: './'`를 사용합니다. 로컬 지리는 `import.meta.env.BASE_URL`로 읽으며 JS·CSS·아이콘·지리 자료를 같은 사이트에서 제공합니다. 배포 후 앱 자체 자산 외의 외부 요청은 필요하지 않습니다. 출처 링크 클릭은 사용자가 외부 자료로 이동하는 것입니다. 최초 로딩에는 웹 서버가 필요하고 Pages에서는 인터넷이 필요합니다. 오프라인 설치용 서비스 워커 앱은 아닙니다.

URL 해시는 설정을 저장하며 서버 라우팅이 필요하지 않습니다. 로컬 주소를 공유해도 외부 방문자가 접속할 수 있게 되지는 않습니다. 공개된 사이트에서 링크를 생성하세요.

## 문제 해결

| 증상              | 확인 사항                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| 예상 주소에서 404 | Pages 원본이 GitHub Actions인지, 성공 실행이 있는지, `/global_warming_simulation/`을 포함했는지 확인합니다. |
| 배포 권한 오류    | Pages 활성화·Actions 정책·`github-pages` 환경 보호·main 브랜치 허용을 확인합니다.                           |
| 빈 지구본         | WebGL 지원과 로컬 자산 로딩 실패를 확인합니다. 다른 기능은 유지되며 3D 재시도 버튼을 사용합니다.            |
| 자산 로딩 실패    | HTML만이 아닌 `dist/` 전체를 배포합니다. `src/`나 `docs/`를 배포하지 않습니다.                              |
| 애니메이션 정지   | 재생·회전은 직접 선택해야 시작합니다. 숨긴 탭·대화상자는 재생/렌더링을 중단합니다.                          |
| 검증이 배포 차단  | 실패 단계와 업로드된 실패 스크린샷·추적을 확인하고 수정한 후 재시도합니다.                                  |

공식 참고: [GitHub 사용자 지정 Pages 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite 정적 배포](https://vite.dev/guide/static-deploy.html#github-pages).
