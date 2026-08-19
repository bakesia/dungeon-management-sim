# 심연의 주인

PC 웹 전용 데이터 기반 던전 경영 시뮬레이션입니다. 현재 버전은 `v0.1.4`입니다.

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
- 13종 시설의 Tier 해금, 건설, Lv.1~3 업그레이드, 철거, 주민 배치
- 시설 손상·50% 효율·데이터 기반 수리 비용과 범용 손상/복구 Effect
- 배치 및 손상 효율을 반영한 생산, 식량 소비, 유지비 DAY 파이프라인
- Condition / Choice / Effect 기반 이벤트 39종, 5개 연쇄 이벤트와 40%/3일 보정 발생 규칙
- Tier별 확률과 2일 안전 기간을 적용하는 자동 침입 및 방어 판정
- 기여 항목별 방어력 보고, raidPower 기반 약탈·코어·주민·시설 피해, 침입 보상
- 데이터 조건·성장 보상 기반 Tier 1→5 성장, Clear/GameOver와 클리어 후 계속 운영
- 자동 저장 이어하기와 `/game`·종료 화면 새로고침 복원
- 14~17px 중심의 가독성 개선 UI typography
- 범용 Effect 처리와 콘텐츠 참조·중복 레벨 검증
- Dexie autosave와 SAVE_VERSION 1/2 → 3 마이그레이션
- 초기 자원, 고블린 5명, 십자형 시작 던전

실시간 전투 대신 수치 기반 v0.1 전체 루프가 구현되어 있습니다. 설계 기준은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.
