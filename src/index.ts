import { PORT } from "../config.json"
import express from "express";
import { get_upcomings, get_completes, get_lives, get_allMatches, get_players_in_match, get_match_roster, get_match_ratings, get_player_recent_agents } from "./module/scrapper";

const app = express();

process.on('uncaughtException', (err) => {
	console.log(err);
});

process.on('unhandledRejection', (err) => {
	console.log(err);
});

app.get("/health", async (req, res) => {
    res.json({ ok: true });
});

app.get("/get_allMatches", async (req, res) => {
    const event_id = Number(req.query.event_id);
    const event_name = decodeURIComponent(String(req.query.event_name));

    if(Number.isNaN(event_id)){
        res.status(500).end("event_id query required");
        return;
    }

    if(event_name == "undefined"){
        res.status(500).end("event_name query required");
        return;
    }

    const match = await get_allMatches(event_id, event_name);
    res.json(match);
})

app.get("/get_upcomings", async (req, res) => {
    const event_id = Number(req.query.event_id);
    const event_name = decodeURIComponent(String(req.query.event_name));

    if(Number.isNaN(event_id)){
        res.status(500).end("event_id query required");
        return;
    }

    if(event_name == "undefined"){
        res.status(500).end("event_name query required");
        return;
    }

    const match = await get_upcomings(event_id, event_name);
    res.json(match);
})

app.get("/get_lives", async (req, res) => {
    const event_id = Number(req.query.event_id);
    const event_name = decodeURIComponent(String(req.query.event_name));

    if(Number.isNaN(event_id)){
        res.status(500).end("event_id query required");
        return;
    }

    if(event_name == "undefined"){
        res.status(500).end("event_name query required");
        return;
    }

    const match = await get_lives(event_id, event_name);
    res.json(match);
})

app.get("/get_completes", async (req, res) => {
    const event_id = Number(req.query.event_id);
    const event_name = decodeURIComponent(String(req.query.event_name));

    if(Number.isNaN(event_id)){
        res.status(500).end("event_id query required");
        return;
    }

    if(event_name == "undefined"){
        res.status(500).end("event_name query required");
        return;
    }

    const match = await get_completes(event_id, event_name);
    res.json(match);
})

app.get("/get_players", async (req, res) => {
    const match_id = Number(req.query.match_id);
    const players = await get_players_in_match(match_id);
    res.json(players);
})

// ─── valtico(발락티코)용 엔드포인트 ───────────────────────────────────────

app.get("/get_match_roster", async (req, res) => {
    const match_id = Number(req.query.match_id);

    if(Number.isNaN(match_id)){
        res.status(500).end("match_id query required");
        return;
    }

    try{
        const roster = await get_match_roster(match_id);
        res.json(roster);
    }catch(error){
        console.error(error);
        res.status(500).end("failed to fetch match roster");
    }
})

app.get("/get_match_ratings", async (req, res) => {
    const match_id = Number(req.query.match_id);

    if(Number.isNaN(match_id)){
        res.status(500).end("match_id query required");
        return;
    }

    try{
        const ratings = await get_match_ratings(match_id);
        res.json(ratings);
    }catch(error){
        console.error(error);
        res.status(500).end("failed to fetch match ratings");
    }
})

app.get("/get_player_recent_agents", async (req, res) => {
    const player_id = Number(req.query.player_id);
    const timespanParam = String(req.query.timespan ?? "90d");
    const validTimespans = ["30d", "60d", "90d", "all"] as const;
    const timespan = (validTimespans as readonly string[]).includes(timespanParam)
        ? timespanParam as typeof validTimespans[number]
        : "90d";

    if(Number.isNaN(player_id)){
        res.status(500).end("player_id query required");
        return;
    }

    try{
        const agents = await get_player_recent_agents(player_id, timespan);
        res.json(agents);
    }catch(error){
        console.error(error);
        res.status(500).end("failed to fetch player recent agents");
    }
})

app.listen(PORT, () => {
    console.log(`server is now running at PORT : ${PORT}`)
})