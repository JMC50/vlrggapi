import { PORT } from "../config.json"
import express from "express";
import { get_eventMatches } from "./module/scrapper";

const app = express();

app.get("/get_eventMatches", async (req, res) => {
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

    const match = await get_eventMatches(event_id, event_name);
    res.json(match);
})

app.listen(PORT, () => {
    console.log(`server is now running at PORT : ${PORT}`)
})