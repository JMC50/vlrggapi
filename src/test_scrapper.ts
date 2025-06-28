import { get_upcomings, MatchItem } from './module/scrapper';

export async function testGetUpcomings() {
    try {
        console.log('Testing get_upcomings function with Puppeteer...');
        
        // VLR.gg의 실제 이벤트 ID와 이름으로 테스트
        // 예시: VCT Champions 2024
        const eventId = 2500; // 실제 이벤트 ID로 변경 필요
        const eventName = 'vct-2025-pacific-stage-2'; // 실제 이벤트 이름으로 변경 필요
        
        console.log(`Scraping matches for event: ${eventId}/${eventName}`);
        
        const startTime = Date.now();
        const matches = await get_upcomings(eventId, eventName);
        const endTime = Date.now();
        
        console.log(`\nScraping completed in ${endTime - startTime}ms`);
        console.log(`Found ${matches.length} matches:`);
        
        if (matches.length === 0) {
            console.log('No matches found. This might be due to:');
            console.log('1. Invalid event ID or name');
            console.log('2. No matches available for this event');
            console.log('3. Website structure changes');
            return;
        }
        
        matches.forEach((match, index) => {
            console.log(`\n--- Match ${index + 1} ---`);
            console.log(`URL: ${match.href}`);
            console.log(`Text: ${match.text}`);
            console.log(`Teams: ${match.teams?.join(' vs ') || 'N/A'}`);
            console.log(`Score: ${match.score || 'N/A'}`);
            console.log(`Time: ${match.time || 'N/A'}`);
            console.log(`Status: ${match.status || 'N/A'}`);
            console.log(`Event: ${match.eventName || 'N/A'}`);
            console.log(`Match Info: ${match.matchInfo || 'N/A'}`);
        });
        
        // 통계 정보 출력
        console.log('\n--- Statistics ---');
        console.log(`Total matches: ${matches.length}`);
        
        const statusCounts = matches.reduce((acc, match) => {
            const status = match.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        console.log('Status distribution:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
        });
        
    } catch (error) {
        console.error('Test failed:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
    }
}

// 테스트 실행
testGetUpcomings(); 