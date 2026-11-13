# 사이트 관리

- 첫 화면(`/`)은 기술 글을 최신순으로 표시합니다. 전체 글은 `/category/all/`에서 볼 수 있고 기술 글은 `/category/tech/`에서도 열 수 있습니다. 일상과 회고는 각 탭에서 최신순으로 표시합니다. 글 관리는 저장소 파일로 합니다.
- Node.js 22에서 `npm run build`로 공개 결과물인 `dist/`를 확인합니다. 화면 변경은 `npm run dev`로 미리 봅니다. 예시 글과 공개 글의 경계를 수정했다면 두 빌드의 결과를 확인합니다.
- GitHub Pages의 배포 소스는 GitHub Actions입니다. `main`에 푸시하면 [Pages 워크플로](../.github/workflows/pages.yml)가 `dist/`를 배포합니다.
