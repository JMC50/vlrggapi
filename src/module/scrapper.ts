import puppeteer, { Browser, Page } from 'puppeteer';

interface MatchItem {
    href: string;
    text: string;
    matchInfo: string;
    teams?: string[];
    score?: string;
    time?: string;
    status?: string;
    eventName?: string;
}

async function get_upcomings(event_id: number, event_name: string): Promise<MatchItem[]> {
    const url = `https://www.vlr.gg/event/matches/${event_id}/${event_name}/?series_id=all&group=all`;
    
    let browser: Browser | null = null;
    
    try {
        console.log('Starting browser...');
        
        // Puppeteer가 자체적으로 Chrome을 다운로드하도록 설정
        const launchOptions: any = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-javascript',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        };
        
        // WSL 환경에서 Chrome 실행 파일 경로 설정 (snap 제외)
        const possibleChromePaths = [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/microsoft-edge',
            '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
            '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'
        ];
        
        for (const chromePath of possibleChromePaths) {
            try {
                const fs = require('fs');
                if (fs.existsSync(chromePath)) {
                    console.log(`Found Chrome at: ${chromePath}`);
                    launchOptions.executablePath = chromePath;
                    break;
                }
            } catch (error) {
                // 파일 존재 확인 실패 시 다음 경로 시도
                continue;
            }
        }
        
        // Chrome을 찾지 못한 경우 Puppeteer가 자체적으로 다운로드하도록 함
        if (!launchOptions.executablePath) {
            console.log('Chrome not found in common paths, Puppeteer will download Chrome automatically...');
        }
        
        browser = await puppeteer.launch(launchOptions);
        
        const page = await browser.newPage();
        
        // User-Agent 설정
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // 뷰포트 설정
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('Navigating to page...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // 페이지 로딩 대기
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 스크롤을 통해 모든 콘텐츠 로딩
        console.log('Scrolling to load all content...');
        await scrollToBottom(page);
        
        // 매치 아이템들 추출
        console.log('Extracting match items...');
        const matchItems = await extractMatchItems(page);
        
        return matchItems;
        
    } catch (error) {
        console.error('Error scraping matches:', error);
        
        // Chrome 설치 안내
        if (error instanceof Error && error.message.includes('Could not find Chrome')) {
            console.log('\nChrome installation required. Please run one of the following:');
            console.log('1. sudo apt update && sudo apt install -y google-chrome-stable');
            console.log('2. sudo apt update && sudo apt install -y chromium-browser');
            console.log('3. Or install Chrome manually from https://www.google.com/chrome/');
        }
        
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function scrollToBottom(page: Page): Promise<void> {
    let previousHeight = 0;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;
    
    while (previousHeight !== currentHeight && scrollAttempts < maxScrollAttempts) {
        previousHeight = currentHeight;
        
        // 페이지 끝까지 스크롤
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        
        // 새로운 콘텐츠 로딩 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 네트워크 요청 완료 대기
        await page.waitForFunction(() => {
            return !document.querySelector('.loading') && 
                   !document.querySelector('[class*="loading"]');
        }, { timeout: 5000 }).catch(() => {
            // 로딩 요소가 없으면 계속 진행
        });
        
        currentHeight = await page.evaluate(() => document.body.scrollHeight);
        scrollAttempts++;
        
        console.log(`Scroll attempt ${scrollAttempts}: ${previousHeight} -> ${currentHeight}`);
    }
    
    // 마지막으로 페이지 상단으로 스크롤
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function extractMatchItems(page: Page): Promise<MatchItem[]> {
    const matchItems = await page.evaluate(() => {
        const items: MatchItem[] = [];
        
        // wf-module-item match-item 클래스를 가진 a 태그들 찾기
        const matchLinks = document.querySelectorAll('a.wf-module-item.match-item');
        
        matchLinks.forEach((link) => {
            const href = (link as HTMLAnchorElement).href;
            const text = link.textContent?.trim() || '';
            
            // 매치 정보 추출
            const matchInfo = extractMatchInfoFromElement(link);
            const teams = extractTeamsFromElement(link);
            const score = extractScoreFromElement(link);
            const time = extractTimeFromElement(link);
            const status = extractStatusFromElement(link);
            const eventName = extractEventNameFromElement(link);
            
            items.push({
                href,
                text,
                matchInfo,
                teams,
                score,
                time,
                status,
                eventName
            });
        });
        
        return items;
    });
    
    return matchItems;
}

function extractMatchInfoFromElement(element: Element): string {
    const matchInfoElement = element.querySelector('.match-item, .wf-module-header');
    return matchInfoElement?.textContent?.trim() || '';
}

function extractTeamsFromElement(element: Element): string[] {
    const teams: string[] = [];
    
    // 팀명을 찾는 다양한 선택자들
    const teamSelectors = [
        '.team',
        '.wf-title',
        '[class*="team"]',
        '.match-item-team'
    ];
    
    teamSelectors.forEach(selector => {
        const teamElements = element.querySelectorAll(selector);
        teamElements.forEach(teamEl => {
            const teamName = teamEl.textContent?.trim();
            if (teamName && teamName.length > 1 && !teams.includes(teamName)) {
                teams.push(teamName);
            }
        });
    });
    
    return teams;
}

function extractScoreFromElement(element: Element): string {
    const scoreSelectors = [
        '.score',
        '.wf-module-header',
        '[class*="score"]',
        '.match-item-score'
    ];
    
    for (const selector of scoreSelectors) {
        const scoreElement = element.querySelector(selector);
        if (scoreElement) {
            const score = scoreElement.textContent?.trim();
            if (score && /[\d-]/.test(score)) {
                return score;
            }
        }
    }
    
    return '';
}

function extractTimeFromElement(element: Element): string {
    const timeSelectors = [
        '.time',
        '.wf-module-subheader',
        '[class*="time"]',
        '.match-item-time'
    ];
    
    for (const selector of timeSelectors) {
        const timeElement = element.querySelector(selector);
        if (timeElement) {
            const time = timeElement.textContent?.trim();
            if (time && (time.includes(':') || time.includes('AM') || time.includes('PM'))) {
                return time;
            }
        }
    }
    
    return '';
}

function extractStatusFromElement(element: Element): string {
    const statusSelectors = [
        '.status',
        '.wf-module-subheader',
        '[class*="status"]',
        '.match-item-status'
    ];
    
    for (const selector of statusSelectors) {
        const statusElement = element.querySelector(selector);
        if (statusElement) {
            const status = statusElement.textContent?.trim();
            if (status && (status.includes('Live') || status.includes('Upcoming') || status.includes('Completed'))) {
                return status;
            }
        }
    }
    
    return '';
}

function extractEventNameFromElement(element: Element): string {
    const eventSelectors = [
        '.event',
        '[class*="event"]',
        '.match-item-event'
    ];
    
    for (const selector of eventSelectors) {
        const eventElement = element.querySelector(selector);
        if (eventElement) {
            return eventElement.textContent?.trim() || '';
        }
    }
    
    return '';
}

// 함수를 export
export { get_upcomings, MatchItem };