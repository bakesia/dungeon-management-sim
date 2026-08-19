# 심연의 주인

PC 웹 전용 데이터 기반 던전 경영 시뮬레이션입니다. 현재 단계는 장기 확장을 위한 v0.1 기반 구축입니다.

## 실행

```bash
npm install
npm run dev
```

품질 검사는 다음 명령으로 실행합니다.

```bash
npm run lint
npm run build
```

## 현재 구현

- 시작 화면과 PC 전용 메인 레이아웃
- `GameState`에서 렌더링하는 좌표 기반 던전 지도
- 데이터 정의 기반 자원, 시설, 종족, 직업, Tier
- 범용 effect 처리기의 기초
- `saveVersion` 검증과 IndexedDB 저장 계층
- 초기 자원, 고블린 5명, 십자형 시작 던전

굴착, 건설, 일일 정산, 이벤트, 침입은 다음 개발 단계에서 엔진에 연결합니다. 설계 기준은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.
