import { PORT } from "../config.json"
import express from "express";
import { get_upcomings, get_completes, get_lives } from "./module/scrapper";

const app = express();

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

app.listen(PORT, () => {
    console.log(`server is now running at PORT : ${PORT}`)
})