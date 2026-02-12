import { PORT } from "../config.json"
import express from "express";
import { get_upcomings, get_completes, get_lives, get_allMatches, get_players_in_match } from "./module/scrapper";

const app = express();

process.on('uncaughtException', (err) => {
	console.log(err);
});

process.on('unhandledRejection', (err) => {
	console.log(err);
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
    console.log(players)
    res.json(players);
})

app.listen(PORT, () => {
    console.log(`server is now running at PORT : ${PORT}`)
})