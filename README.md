# VLR.gg API Scraper

VLR.gg 사이트에서 이벤트 매치 정보를 크롤링하는 TypeScript 라이브러리입니다.

## 기능

- VLR.gg 이벤트 페이지에서 매치 정보 자동 크롤링
- 자동 스크롤을 통한 모든 매치 데이터 수집
- 매치별 상세 정보 추출 (팀명, 시간, 상태, 이벤트 정보 등)
- TypeScript 지원

## 설치

```bash
npm install
```

## 사용법

### 기본 사용법

```typescript
import { get_upcomings, MatchItem } from './src/module/scrapper';

async function main() {
  try {
    // event_id와 event_name을 지정하여 매치 정보 크롤링
    const matches = await get_upcomings(2500, 'vct-2025-pacific-stage-2');
    
    console.log(`총 ${matches.length}개의 매치를 찾았습니다.`);
    
    matches.forEach((match, index) => {
      console.log(`매치 ${index + 1}:`);
      console.log(`  ID: ${match.match_id}`);
      console.log(`  팀: ${match.team1} vs ${match.team2}`);
      console.log(`  상태: ${match.status}`);
      console.log(`  시간: ${match.upcomingTime}`);
      console.log(`  이벤트: ${match.eventSeries}`);
      console.log(`  링크: ${match.href}`);
      console.log('---');
    });
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
  }
}

main();
```

### 반환 데이터 구조

```typescript
interface MatchItem {
  href: string;           // 매치 링크
  match_id: string;       // 매치 고유 ID
  team1: string;          // 첫 번째 팀명
  team2: string;          // 두 번째 팀명
  upcomingTime: string;   // 매치 예정 시간 (예: "2h 30m")
  eventSeries: string;    // 이벤트 시리즈 (예: "Week 1: Group Stage")
  eventName: string;      // 이벤트 이름
  status: string;         // 매치 상태 (예: "Live", "Upcoming", "Completed")
}
```

### 예시 출력

```typescript
[
  {
    href: "/508815/boom-esports-vs-talon-vct-2025-pacific-stage-2-w1",
    match_id: "508815",
    team1: "Boom Esports",
    team2: "Talon",
    upcomingTime: "2h 30m",
    eventSeries: "Week 1: Group Stage",
    eventName: "VCT 2025 Pacific Stage 2",
    status: "Live"
  },
  {
    href: "/508816/nrg-vs-cloud9-vct-2025-pacific-stage-2-w1",
    match_id: "508816",
    team1: "NRG",
    team2: "Cloud9",
    upcomingTime: "1d 5h",
    eventSeries: "Week 1: Group Stage",
    eventName: "VCT 2025 Pacific Stage 2",
    status: "Upcoming"
  }
]
```

## API 참조

### `get_upcomings(event_id: number, event_name: string): Promise<MatchItem[]>`

지정된 이벤트의 모든 매치 정보를 크롤링합니다.

#### 매개변수

- `event_id` (number): VLR.gg 이벤트 ID
- `event_name` (string): VLR.gg 이벤트 이름 (URL 슬러그)

#### 반환값

- `Promise<MatchItem[]>`: 매치 정보 배열

#### 예외

- 네트워크 오류
- 페이지 로딩 실패
- 크롤링 중 발생하는 기타 오류

## 기술 스택

- **TypeScript**: 타입 안전성 제공
- **Puppeteer**: 브라우저 자동화 및 웹 크롤링
- **Node.js**: 런타임 환경

## 주의사항

1. **사용량 제한**: VLR.gg의 서버에 과도한 부하를 주지 않도록 적절한 간격을 두고 사용하세요.
2. **웹사이트 변경**: VLR.gg의 HTML 구조가 변경될 경우 크롤링이 실패할 수 있습니다.
3. **법적 고려사항**: 웹 크롤링 시 해당 웹사이트의 이용약관을 준수하세요.

## 변경 이력

### v1.0.0
- 초기 버전
- VLR.gg 이벤트 매치 크롤링 기능
- 자동 스크롤 지원
- TypeScript 타입 정의 