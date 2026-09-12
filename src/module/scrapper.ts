import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

export interface MatchItem {
    href: string;
    match_id: string;
    team1: string;
    team2: string;
    upcomingTime: number; // 분 단위
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
        
        // 타임아웃을 60초로 증가
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await autoScroll(page);

        const { upcomings, lives, completes } = await page.evaluate(() => {
            function parseTimeToMinutes(timeStr: string): number {
                if (!timeStr) return 0;
                timeStr = timeStr.toLowerCase();
                let total = 0;
                const regex = /(?:(\d+)\s*mo)?\s*(?:(\d+)\s*w)?\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/;
                const match = timeStr.match(regex);
                if (match) {
                    const months = parseInt(match[1] || '0', 10);
                    const weeks = parseInt(match[2] || '0', 10);
                    const days = parseInt(match[3] || '0', 10);
                    const hours = parseInt(match[4] || '0', 10);
                    const minutes = parseInt(match[5] || '0', 10);
                    total += months * 30 * 24 * 60; // 1mo = 30d
                    total += weeks * 7 * 24 * 60;
                    total += days * 24 * 60;
                    total += hours * 60;
                    total += minutes;
                }
                return total;
            }

            const eventName = document.querySelector(`h1.event-header-main-title`)?.textContent?.trim() || '';
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
                let upcomingTimeStr = '';
                let status = '';
                const etaElement = element.querySelector('.match-item-eta');

                if (etaElement) {
                    const mlElement = etaElement.querySelector('.ml');
                    if (mlElement) {
                        const mlEtaElement = mlElement.querySelector('.ml-eta');
                        const mlStatusElement = mlElement.querySelector('.ml-status');
                        upcomingTimeStr = mlEtaElement?.textContent?.trim() || '';
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
                    const team1Parent = teamElements[0]?.parentElement;
                    const team2Parent = teamElements[1]?.parentElement;
                    if (team1Parent && team1Parent.classList.contains('mod-winner')) {
                        winner = "team1";
                    } else if (team2Parent && team2Parent.classList.contains('mod-winner')) {
                        winner = "team2";
                    }
                }

                let upcomingTime: number = 0;
                if (status.toLowerCase() === 'live') {
                    upcomingTime = 0;
                } else {
                    upcomingTime = parseTimeToMinutes(upcomingTimeStr);
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
    } catch (error) {
        console.error(`Attempt failed:`, error);
        throw new Error(`Failed to fetch matches.`);
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
                
                // 스크롤이 끝에 도달했으면 중단
                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    
    // 스크롤 후 잠시 대기하여 동적 콘텐츠 로딩 (기존 2초에서 3초로 증가)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 모든 매치 아이템이 로드될 때까지 기다립니다.
    await page.waitForSelector('a.wf-module-item.match-item', { timeout: 10000 }).catch(() => console.log("Match items not fully loaded or timeout."));
}

export async function get_players_in_match(match_id: number): Promise<string[]> {
    const browser = await puppeteer.launch({
        headless: true, // 최신 버전에서는 "new" 권장
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try{
        const page = await browser.newPage();
        
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            }else{
                req.continue();
            }
        });

        const url = `https://vlr.gg/${match_id}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector(".vm-stats-game", { timeout: 10000 });

        const players = await page.evaluate(() => {
            const elements = document.querySelectorAll(".vm-stats-game td.mod-player");
            const playerList: string[] = [];
            
            elements.forEach(element => {
                const nameElement = element.querySelector(".text-of") as HTMLElement;
                if(nameElement){
                    const name = nameElement.innerText.trim();
                    if(name) playerList.push(name);
                }
            });
            return Array.from(new Set(playerList));
        });

        return players;
    }catch(error){
        console.error("Scraping error:", error);
        return [];
    }finally{
        await browser.close();
    }
}

// ─── valtico(발락티코)용 스크래핑 ───────────────────────────────────────────
// 아래 함수들은 vlr.gg가 이 페이지들을 서버에서 정적으로 렌더링해주는 걸 확인해서
// (실제 fetch로 검증함) puppeteer 없이 가벼운 fetch + cheerio로 처리한다.
// puppeteer(크로미움 기동)보다 훨씬 빠르고, 매치 하나당 최대 20명씩 선수 개인 페이지를
// 순회해야 하는 valtico 특성상 리소스 사용량 차이가 크다.

const VLR_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

async function fetchVlrHtml(url: string): Promise<string> {
    const res = await fetch(url, { headers: { 'User-Agent': VLR_USER_AGENT } });
    if(!res.ok){
        throw new Error(`vlr.gg fetch 실패: ${url} (status ${res.status})`);
    }
    return res.text();
}

function parsePlayerHref(href: string | undefined): { player_id: number; slug: string } | null {
    if(!href) return null;
    const match = href.match(/^\/player\/(\d+)\/([^/?#]+)/);
    if(!match) return null;
    return { player_id: Number(match[1]), slug: match[2] };
}

export interface RosterPlayer {
    player_id: number;
    slug: string;
    name: string;
    team: string;
}

export interface PlayerMatchRating {
    player_id: number;
    rating: number;
}

/**
 * 매치 페이지의 "All Maps" 탭(data-game-id="all")에서 양 팀 로스터를 가져온다.
 * 맵 밴픽이 아직 "TBD"인 경기 시작 전 상태에서도 이 로스터는 채워져 있는 걸 확인함.
 * (맵별 탭에도 같은 로스터가 중복으로 박혀있어서, "all" 탭 컨테이너로 반드시 범위를
 *  좁혀야 함 — 안 그러면 맵 개수만큼 같은 선수가 중복으로 나옴)
 */
export async function get_match_roster(match_id: number): Promise<RosterPlayer[]> {
    const html = await fetchVlrHtml(`https://vlr.gg/${match_id}?game=all`);
    const $ = cheerio.load(html);

    const allMapsContainer = $('.vm-stats-game[data-game-id="all"]');
    const rows = allMapsContainer.length > 0 ? allMapsContainer.find('.ovw-row') : $('.ovw-row');

    const players = new Map<number, RosterPlayer>();

    rows.each((_, row) => {
        const cell = $(row).find('.ovw-cell.mod-player');
        const parsed = parsePlayerHref(cell.find('a[href^="/player/"]').first().attr('href'));
        if(!parsed) return;

        const name = cell.find('.ovw-player-name').first().text().trim();
        const team = cell.find('.ovw-player-tag').first().text().trim();
        if(!name) return;

        players.set(parsed.player_id, { player_id: parsed.player_id, slug: parsed.slug, name, team });
    });

    return [...players.values()];
}

/**
 * 매치의 "All Maps" 탭에서 선수별 전체 경기 rating(2.0, 양쪽 사이드 합산 값)을 가져온다.
 * 경기가 끝나야 값이 채워지므로, 종료된 매치에만 의미있는 결과를 반환한다.
 */
export async function get_match_ratings(match_id: number): Promise<PlayerMatchRating[]> {
    const html = await fetchVlrHtml(`https://vlr.gg/${match_id}?game=all`);
    const $ = cheerio.load(html);

    const allMapsContainer = $('.vm-stats-game[data-game-id="all"]');
    const rows = allMapsContainer.length > 0 ? allMapsContainer.find('.ovw-row') : $('.ovw-row');

    const ratings: PlayerMatchRating[] = [];

    rows.each((_, row) => {
        const parsed = parsePlayerHref($(row).find('.ovw-cell.mod-player a[href^="/player/"]').first().attr('href'));
        if(!parsed) return;

        const ratingText = $(row).find('.ovw-cell[data-col="rating2"] .side.mod-both').first().text().trim();
        if(!ratingText) return;

        const rating = Number(ratingText);
        if(Number.isNaN(rating)) return;

        ratings.push({ player_id: parsed.player_id, rating });
    });

    return ratings;
}

/**
 * 선수가 최근(timespan) 기간 동안 실제로 플레이한 요원 목록(중복 제거)을 가져온다.
 * valtico의 포지션 자격 판정에 씀 — 여기 나온 요원이 하나라도 특정 포지션 소속이면
 * 그 포지션 자격이 있는 걸로 취급한다(agent → position 매핑은 이 함수 밖, 호출부 책임).
 */
export async function get_player_recent_agents(player_id: number, timespan: '30d' | '60d' | '90d' | 'all' = '90d'): Promise<string[]> {
    const html = await fetchVlrHtml(`https://vlr.gg/player/${player_id}/?timespan=${timespan}`);
    const $ = cheerio.load(html);

    const agents = new Set<string>();
    $('table.mod-agent-rows img[alt]').each((_, img) => {
        const alt = $(img).attr('alt')?.trim().toLowerCase();
        if(alt) agents.add(alt);
    });

    return [...agents];
}