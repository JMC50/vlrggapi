import puppeteer, { Browser, Page } from 'puppeteer';

export interface MatchItem {
    href: string;
    match_id: string;
    team1: string;
    team2: string;
    upcomingTime: string;
    eventSeries: string;
    eventName: string;
    status: string;
}

export async function get_eventMatches(event_id: number, event_name: string): Promise<MatchItem[]> {
    let browser: Browser | null = null;
    
    try{
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // 브라우저 콘솔 로그를 Node.js 콘솔로 전달
        // page.on('console', msg => console.log('브라우저 로그:', msg.text()));
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        const url = `https://www.vlr.gg/event/matches/${event_id}/${event_name}/?series_id=all&group=all`;
        
        console.log(`크롤링 시작: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await autoScroll(page);
        
        console.log('매치 아이템 추출 시작...');
        
        const matchItems = await page.evaluate(() => {
            const eventName = document.querySelector(`h1.wf-title`)?.textContent?.trim() || '';

            const elements = document.querySelectorAll('a.wf-module-item.match-item');
            console.log(`총 ${elements.length}개의 매치 요소를 찾았습니다.`);
            const items: MatchItem[] = [];
            
            elements.forEach((element, index) => {
                const href = element.getAttribute('href') || '';
                
                // match_id 추출 (href에서 첫 번째 숫자)
                let match_id = '';
                if (href) {
                    const match = href.match(/\/(\d+)\//);
                    match_id = match ? match[1] : '';
                }
                
                // 팀 정보 추출
                const teamElements = element.querySelectorAll('.match-item-vs-team-name');
                const team1 = teamElements[0]?.textContent?.trim() || '';
                const team2 = teamElements[1]?.textContent?.trim() || '';
                
                // upcoming 시간 추출 (정확한 선택자 사용)
                let upcomingTime = '';
                let status = '';
                
                // match-item-eta > ml > ml-eta
                const etaElement = element.querySelector('.match-item-eta');
                if(etaElement){
                    const mlElement = etaElement.querySelector('.ml');
                    if(mlElement){
                        const mlEtaElement = mlElement.querySelector('.ml-eta');
                        const mlStatusElement = mlElement.querySelector('.ml-status');
                        
                        upcomingTime = mlEtaElement?.textContent?.trim() || '';
                        status = mlStatusElement?.textContent?.trim() || '';
                    }
                }
                
                // 이벤트 시리즈 추출 (match-item-event text-of) - \t 제거
                const eventElement = element.querySelector('.match-item-event.text-of');
                let eventSeries = eventElement?.textContent?.trim() || '';
                
                // \t로 분리하고 순서를 바꿔서 콜론 추가
                if(eventSeries.includes('\t')){
                    const parts = eventSeries.split('\t').filter(part => part.trim() !== '');
                    if(parts.length >= 2){
                        eventSeries = `${parts[1].trim()}: ${parts[0].trim()}`;
                    }else if(parts.length === 1){
                        eventSeries = parts[0].trim();
                    }
                }else{
                    eventSeries = eventSeries.replace(/\s+/g, ' ').trim();
                }
                
                // console.log(`매치 ${index + 1}: ${team1} vs ${team2}, 이벤트: ${eventSeries}, 상태: ${status}, 시간: ${upcomingTime}`);
            
                items.push({ 
                    href, 
                    match_id,
                    team1, 
                    team2, 
                    upcomingTime, 
                    eventSeries,
                    eventName,
                    status
                });
            });
            
            return items;
        });
        
        console.log(`총 ${matchItems.length}개의 매치를 찾았습니다.`);
        return matchItems;

    }catch(error){
        console.error('크롤링 중 오류 발생:', error);
        throw error;
    }finally{
        if(browser){
            await browser.close();
        }
    }
}

// 자동 스크롤 함수
async function autoScroll(page: Page): Promise<void> {
    await page.evaluate(() => {
        return new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                
                // 스크롤이 끝에 도달했거나 충분히 스크롤했으면 중단
                if(totalHeight >= scrollHeight || totalHeight > 10000){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    
    // 스크롤 후 잠시 대기하여 동적 콘텐츠 로딩
    await new Promise(resolve => setTimeout(resolve, 2000));
}
