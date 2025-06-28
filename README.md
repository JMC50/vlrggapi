# VLR.gg API

VLR.gg 웹사이트에서 Valorant 이벤트 매치 정보를 스크래핑하는 TypeScript 라이브러리입니다. Puppeteer를 사용하여 동적 콘텐츠와 스크롤 기능을 완벽하게 지원합니다.

## 기능

- VLR.gg 이벤트 페이지에서 매치 정보 스크래핑
- Puppeteer를 사용한 실제 브라우저 시뮬레이션
- 자동 스크롤을 통한 모든 페이지 콘텐츠 로딩
- 팀명, 스코어, 시간, 상태 등 상세 정보 추출
- JavaScript로 로딩되는 동적 콘텐츠 지원

## 설치

```bash
npm install
```

## 의존성

- **Puppeteer**: 웹 브라우저 자동화 및 스크래핑
- **@types/puppeteer**: TypeScript 타입 정의
- **Express**: 웹 서버 (선택사항)

## 사용법

### get_upcomings 함수

```typescript
import { get_upcomings, MatchItem } from './src/module/scrapper';

async function example() {
    const eventId = 1234; // VLR.gg 이벤트 ID
    const eventName = 'vct-champions-2024'; // 이벤트 이름 (URL 슬러그)
    
    console.log('Starting scraping...');
    const matches = await get_upcomings(eventId, eventName);
    
    console.log(`Found ${matches.length} matches`);
    
    matches.forEach(match => {
        console.log(`Match: ${match.teams?.join(' vs ')}`);
        console.log(`Score: ${match.score}`);
        console.log(`Time: ${match.time}`);
        console.log(`Status: ${match.status}`);
        console.log(`URL: ${match.href}`);
    });
}
```

### MatchItem 인터페이스

```typescript
interface MatchItem {
    href: string;           // 매치 상세 페이지 URL
    text: string;           // 매치 텍스트 정보
    matchInfo: string;      // 매치 기본 정보
    teams?: string[];       // 참가 팀명 배열
    score?: string;         // 스코어 정보
    time?: string;          // 매치 시간
    status?: string;        // 매치 상태 (Live, Upcoming, Completed 등)
    eventName?: string;     // 이벤트명
}
```

## 테스트

```bash
# TypeScript 컴파일
npx tsc

# 테스트 실행
node dist/test_scrapper.js
```

## 주요 개선사항 (Puppeteer 버전)

1. **실제 브라우저 시뮬레이션**: Puppeteer를 사용하여 실제 Chrome 브라우저처럼 동작
2. **동적 콘텐츠 지원**: JavaScript로 로딩되는 콘텐츠를 완벽하게 처리
3. **자동 스크롤**: 페이지 끝까지 스크롤하여 모든 매치 정보를 로딩
4. **정확한 데이터 추출**: DOM 쿼리 선택자를 사용하여 더 정확한 정보 추출
5. **로딩 상태 감지**: 페이지 로딩 완료를 기다려 안정적인 스크래핑

## 스크래핑 과정

1. **브라우저 시작**: Headless Chrome 브라우저를 시작
2. **페이지 로딩**: VLR.gg 이벤트 페이지로 이동
3. **스크롤 처리**: 페이지 끝까지 스크롤하여 모든 콘텐츠 로딩
4. **데이터 추출**: `a.wf-module-item.match-item` 클래스를 가진 요소들에서 정보 추출
5. **브라우저 종료**: 작업 완료 후 브라우저 자동 종료

## 주의사항

1. **이벤트 ID와 이름**: VLR.gg 사이트에서 실제 이벤트의 ID와 URL 슬러그를 사용해야 합니다.
2. **처리 시간**: Puppeteer를 사용하므로 HTTP 요청보다 처리 시간이 더 걸릴 수 있습니다.
3. **메모리 사용량**: 브라우저 인스턴스를 사용하므로 메모리 사용량이 증가할 수 있습니다.
4. **웹사이트 변경**: VLR.gg 사이트 구조가 변경될 경우 선택자를 업데이트해야 할 수 있습니다.

## 예시 URL 구조

VLR.gg 이벤트 URL: `https://www.vlr.gg/event/matches/{event_id}/{event_name}/?series_id=all&group=all`

예시:
- `https://www.vlr.gg/event/matches/1234/vct-champions-2024/?series_id=all&group=all`

## 라이센스

ISC 