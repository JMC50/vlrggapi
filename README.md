# VLR.gg API Scraper

VLR.gg 사이트에서 이벤트 매치 정보를 크롤링하는 TypeScript 라이브러리입니다.

## 기능

- VLR.gg 이벤트 페이지에서 매치 정보 자동 크롤링
- 자동 스크롤을 통한 모든 매치 데이터 수집
- 매치별 상세 정보 추출 (팀명, 시간, 상태, 이벤트 정보 등)
- **진행중/예정/완료** 매치 구분 및 API 제공
- **승리팀(winner) 정보 제공** (완료된 매치)
- TypeScript 지원

## 설치

```bash
npm install
```

## 사용법

### 모든 매치 한 번에 가져오기

```typescript
import { get_allMatches, MatchItem, AllMatchesResult } from './src/module/scrapper';

async function main() {
  const event_id = 2500;
  const event_name = 'vct-2025-pacific-stage-2';

  // 모든 매치 한 번에 가져오기
  const { upcomings, lives, completes } = await get_allMatches(event_id, event_name);

  console.log('Upcoming:', upcomings);
  console.log('Live:', lives);
  console.log('Completed:', completes);
}

main();
```

### 반환 타입

```typescript
export interface AllMatchesResult {
  upcomings: MatchItem[];
  lives: MatchItem[];
  completes: MatchItem[];
}

export interface MatchItem {
  href: string;           // 매치 링크
  match_id: string;       // 매치 고유 ID
  team1: string;          // 첫 번째 팀명
  team2: string;          // 두 번째 팀명
  upcomingTime: number;   // 매치까지 남은 시간(분 단위, status가 live면 0)
  eventSeries: string;    // 이벤트 시리즈 (예: "Week 1: Group Stage")
  eventName: string;      // 이벤트 이름
  status: string;         // 매치 상태 (예: "Live", "Upcoming", "Completed")
  winner: "team1" | "team2" | undefined; // 승리팀 (완료된 매치만, 나머지는 undefined)
}
```

### upcomingTime 필드 설명
- 다양한 시간 포맷(예: `2w 3d`, `1mo`, `20h 27m`, `30m`)이 모두 **분(minute) 단위의 숫자**로 변환되어 반환됩니다.
- status가 `live`인 경우 upcomingTime은 항상 0입니다.
- 예시: `2w 3d` → 23760, `1mo` → 43200, `20h 27m` → 1227, `30m` → 30

### winner 필드 설명
- **upcomings, lives**: 항상 `winner: undefined`로 반환됩니다.
- **completes**: status가 Completed인 매치만 반환하며, 승리팀이 team1이면 `winner: "team1"`, team2면 `winner: "team2"`로 반환됩니다.
- 승리팀 판별은 각 팀 영역의 부모 요소에 `<i class="js-spoiler fa fa-caret-right">` 아이콘이 있는지로 결정합니다.

### 예시 출력

```json
{
  "upcomings": [
    {
      "href": "/508816/nrg-vs-cloud9-vct-2025-pacific-stage-2-w1",
      "match_id": "508816",
      "team1": "NRG",
      "team2": "Cloud9",
      "upcomingTime": 1505,
      "eventSeries": "Week 1: Group Stage",
      "eventName": "VCT 2025 Pacific Stage 2",
      "status": "Upcoming",
      "winner": null
    }
  ],
  "lives": [
    {
      "href": "/508817/drx-vs-gen-g-vct-2025-pacific-stage-2-w1",
      "match_id": "508817",
      "team1": "DRX",
      "team2": "Gen.G",
      "upcomingTime": 0,
      "eventSeries": "Week 1: Group Stage",
      "eventName": "VCT 2025 Pacific Stage 2",
      "status": "Live",
      "winner": null
    }
  ],
  "completes": [
    {
      "href": "/508815/boom-esports-vs-talon-vct-2025-pacific-stage-2-w1",
      "match_id": "508815",
      "team1": "Boom Esports",
      "team2": "Talon",
      "upcomingTime": 0,
      "eventSeries": "Week 1: Group Stage",
      "eventName": "VCT 2025 Pacific Stage 2",
      "status": "Completed",
      "winner": "team1"
    }
  ]
}
```

## 기존 함수와의 관계

- `get_upcomings(event_id, event_name)` → `get_allMatches(event_id, event_name).upcomings`
- `get_lives(event_id, event_name)` → `get_allMatches(event_id, event_name).lives`
- `get_completes(event_id, event_name)` → `get_allMatches(event_id, event_name).completes`

## 기술 스택
- **TypeScript**: 타입 안전성 제공
- **Puppeteer**: 브라우저 자동화 및 웹 크롤링
- **Node.js**: 런타임 환경

## 주의사항
1. **사용량 제한**: VLR.gg의 서버에 과도한 부하를 주지 않도록 적절한 간격을 두고 사용하세요.
2. **웹사이트 변경**: VLR.gg의 HTML 구조가 변경될 경우 크롤링이 실패할 수 있습니다.
3. **법적 고려사항**: 웹 크롤링 시 해당 웹사이트의 이용약관을 준수하세요.

## 개발

### 빌드
```bash
npm run build
```

### 테스트
```bash
npm test
```

### 개발 모드
```bash
npm run dev
```

## 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 기여
버그 리포트나 기능 제안은 이슈를 통해 제출해주세요. 풀 리퀘스트도 환영합니다.

## 변경 이력
### v1.3.0
- upcomingTime이 string에서 number(분 단위)로 변경, 다양한 시간 포맷 지원
### v1.2.0
- get_allMatches 함수가 모든 매치를 긁어오고 status별로 반환하도록 구조 변경
- get_upcomings, get_lives, get_completes는 내부적으로 get_allMatches를 사용하도록 변경
### v1.1.0
- get_upcomings, get_lives, get_completes 함수 분리 및 winner 필드 일관성 적용
### v1.0.0
- VLR.gg 이벤트 매치 크롤링 기능
- 자동 스크롤 지원
- TypeScript 타입 정의 