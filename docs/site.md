# 사이트 관리

- 피드는 최신순으로 표시하고 전체·기술·일상·회고 탭을 유지합니다. 글 관리는 저장소 파일로 합니다. 방문자에게는 글 목록과 상세 화면을 제공하는 정적 개인 블로그입니다.
- Node.js 22에서 `npm run build`로 공개 결과물인 `dist/`를 확인합니다. 화면 변경은 `npm run dev`로 미리 봅니다. 예시 글과 공개 글의 경계를 수정했다면 두 빌드의 결과를 확인합니다.
- GitHub Pages의 배포 소스는 GitHub Actions입니다. `main`에 푸시하면 [Pages 워크플로](../.github/workflows/pages.yml)가 `dist/`를 배포합니다.
