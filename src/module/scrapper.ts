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
    winner: "team1" | "team2" | undefined;
}

async function fetchAllMatches(event_id: number, event_name: string): Promise<MatchItem[]> {
    let browser: Browser | null = null;
    try{
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        const url = `https://www.vlr.gg/event/matches/${event_id}/${event_name}/?series_id=all&group=all`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await autoScroll(page);

        const matchItems = await page.evaluate(() => {
            const eventName = document.querySelector(`h1.wf-title`)?.textContent?.trim() || '';
            const elements = document.querySelectorAll('a.wf-module-item.match-item');
            const items: MatchItem[] = [];
            elements.forEach((element) => {
                const href = element.getAttribute('href') || '';
                let match_id = '';
                if(href){
                    const match = href.match(/\/(\d+)\//);
                    match_id = match ? match[1] : '';
                }
                const teamElements = element.querySelectorAll('.match-item-vs-team-name');
                const team1 = teamElements[0]?.textContent?.trim() || '';
                const team2 = teamElements[1]?.textContent?.trim() || '';
                let upcomingTime = '';
                let status = '';
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

                const eventElement = element.querySelector('.match-item-event.text-of');
                let eventSeries = eventElement?.textContent?.trim() || '';

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

                items.push({ 
                    href, 
                    match_id,
                    team1, 
                    team2, 
                    upcomingTime, 
                    eventSeries,
                    eventName,
                    status,
                    winner: undefined
                });
            });
            return items;
        });
        return matchItems;
    }finally{
        if(browser){
            await browser.close();
        }
    }
}

export async function get_upcomings(event_id: number, event_name: string): Promise<MatchItem[]> {
    const all = await fetchAllMatches(event_id, event_name);
    return all.filter(m => m.status.toLowerCase() === "upcoming");
}

export async function get_lives(event_id: number, event_name: string): Promise<MatchItem[]> {
    const all = await fetchAllMatches(event_id, event_name);
    return all.filter(m => m.status.toLowerCase() === "live");
}

export async function get_completes(event_id: number, event_name: string): Promise<MatchItem[]> {
    let browser: Browser | null = null;
    try{
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        const url = `https://www.vlr.gg/event/matches/${event_id}/${event_name}/?series_id=all&group=all`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await autoScroll(page);

        const matchItems = await page.evaluate(() => {
            const eventName = document.querySelector(`h1.wf-title`)?.textContent?.trim() || '';
            const elements = document.querySelectorAll('a.wf-module-item.match-item');
            const items: MatchItem[] = [];
            elements.forEach((element) => {
                const href = element.getAttribute('href') || '';
                let match_id = '';
                if(href){
                    const match = href.match(/\/(\d+)\//);
                    match_id = match ? match[1] : '';
                }

                const teamElements = element.querySelectorAll('.match-item-vs-team-name');
                const team1 = teamElements[0]?.textContent?.trim() || '';
                const team2 = teamElements[1]?.textContent?.trim() || '';
                let upcomingTime = '';
                let status = '';
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

                const eventElement = element.querySelector('.match-item-event.text-of');
                let eventSeries = eventElement?.textContent?.trim() || '';
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

                let winner: "team1" | "team2" | undefined = undefined;
                if(status.toLowerCase() === "completed"){
                    // team1, team2 영역에서 js-spoiler fa fa-caret-right 아이콘 위치 확인
                    const team1Parent = teamElements[0]?.parentElement;
                    const team2Parent = teamElements[1]?.parentElement;
                    if(team1Parent && team1Parent.querySelector('i.js-spoiler.fa.fa-caret-right')) {
                        winner = "team1";
                    }else if(team2Parent && team2Parent.querySelector('i.js-spoiler.fa.fa-caret-right')) {
                        winner = "team2";
                    }
                }

                items.push({ 
                    href, 
                    match_id,
                    team1, 
                    team2, 
                    upcomingTime, 
                    eventSeries,
                    eventName,
                    status,
                    winner
                });
            });
            return items.filter(m => m.status.toLowerCase() === "completed");
        });
        return matchItems;
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
