# 심연의 주인

PC 웹 전용 데이터 기반 던전 경영 시뮬레이션입니다. 현재 버전은 `v0.1.2`입니다.

## 실행

```bash
npm install
npm run dev
```

품질 검사는 다음 명령으로 실행합니다.

```bash
npm run lint
npm test
npm run build
```

## 현재 구현

- 시작 화면과 PC 전용 메인 레이아웃
- `/` 시작 화면과 `/game` 게임 화면 라우팅
- Zustand 기반 저장 대상 `GameState`와 엔진 action 연결
- `GameState`에서 렌더링하는 좌표 기반 던전 지도와 4방향 굴착
- 데이터 정의 기반 자원, 시설, 종족, 직업, Tier
- 8종 시설의 건설, Lv.1~3 업그레이드, 철거, 주민 배치
- 배치 효율을 반영한 생산, 식량 소비, 유지비 DAY 파이프라인
- Condition / Choice / Effect 기반 이벤트 12종과 40%/3일 보정 발생 규칙
- 범용 Effect 처리와 콘텐츠 참조·중복 레벨 검증
- Dexie autosave와 SAVE_VERSION 1 → 2 마이그레이션
- 초기 자원, 고블린 5명, 십자형 시작 던전

침입 전투와 Tier 2~5 승급은 후속 개발 단계입니다. 설계 기준은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.
