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

export interface AllMatchesResult {
    upcomings: MatchItem[];
    lives: MatchItem[];
    completes: MatchItem[];
}

export async function get_allMatches(event_id: number, event_name: string): Promise<AllMatchesResult> {
    let browser: Browser | null = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        const url = `https://www.vlr.gg/event/matches/${event_id}/${event_name}/?series_id=all&group=all`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await autoScroll(page);

        const { upcomings, lives, completes } = await page.evaluate(() => {
            const eventName = document.querySelector(`h1.wf-title`)?.textContent?.trim() || '';
            const elements = document.querySelectorAll('a.wf-module-item.match-item');
            const upcomings: MatchItem[] = [];
            const lives: MatchItem[] = [];
            const completes: MatchItem[] = [];

            elements.forEach((element) => {
                const href = element.getAttribute('href') || '';
                let match_id = '';
                if (href) {
                    const match = href.match(/\/(\d+)\//);
                    match_id = match ? match[1] : '';
                }
                const teamElements = element.querySelectorAll('.match-item-vs-team-name');
                const team1 = teamElements[0]?.textContent?.trim() || '';
                const team2 = teamElements[1]?.textContent?.trim() || '';
                let upcomingTime = '';
                let status = '';
                const etaElement = element.querySelector('.match-item-eta');

                if (etaElement) {
                    const mlElement = etaElement.querySelector('.ml');
                    if (mlElement) {
                        const mlEtaElement = mlElement.querySelector('.ml-eta');
                        const mlStatusElement = mlElement.querySelector('.ml-status');
                        upcomingTime = mlEtaElement?.textContent?.trim() || '';
                        status = mlStatusElement?.textContent?.trim() || '';
                    }
                }

                const eventElement = element.querySelector('.match-item-event.text-of');
                let eventSeries = eventElement?.textContent?.trim() || '';

                if (eventSeries.includes('\t')) {
                    const parts = eventSeries.split('\t').filter(part => part.trim() !== '');
                    if (parts.length >= 2) {
                        eventSeries = `${parts[1].trim()}: ${parts[0].trim()}`;
                    } else if (parts.length === 1) {
                        eventSeries = parts[0].trim();
                    }
                } else {
                    eventSeries = eventSeries.replace(/\s+/g, ' ').trim();
                }

                let winner: "team1" | "team2" | undefined = undefined;
                if (status.toLowerCase() === 'completed') {
                    // team1, team2 영역에서 js-spoiler fa fa-caret-right 아이콘 위치 확인
                    const team1Parent = teamElements[0]?.parentElement;
                    const team2Parent = teamElements[1]?.parentElement;
                    if (team1Parent && team1Parent.querySelector('i.js-spoiler.fa.fa-caret-right')) {
                        winner = "team1";
                    } else if (team2Parent && team2Parent.querySelector('i.js-spoiler.fa.fa-caret-right')) {
                        winner = "team2";
                    }
                }

                const matchItem: MatchItem = {
                    href,
                    match_id,
                    team1,
                    team2,
                    upcomingTime,
                    eventSeries,
                    eventName,
                    status,
                    winner
                };

                if (status.toLowerCase() === 'upcoming') {
                    upcomings.push(matchItem);
                } else if (status.toLowerCase() === 'live') {
                    lives.push(matchItem);
                } else if (status.toLowerCase() === 'completed') {
                    completes.push(matchItem);
                }
            });
            return { upcomings, lives, completes };
        });
        return { upcomings, lives, completes };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export async function get_upcomings(event_id: number, event_name: string): Promise<MatchItem[]> {
    const all = await get_allMatches(event_id, event_name);
    return all.upcomings;
}

export async function get_lives(event_id: number, event_name: string): Promise<MatchItem[]> {
    const all = await get_allMatches(event_id, event_name);
    return all.lives;
}

export async function get_completes(event_id: number, event_name: string): Promise<MatchItem[]> {
    const all = await get_allMatches(event_id, event_name);
    return all.completes;
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
