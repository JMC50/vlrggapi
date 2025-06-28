import { PORT } from "../config.json"
import express from "express";
import { get_upcomings } from "./module/scrapper";

const app = express();

app.get("/get_upcomings", async (req, res) => {
    const event_id = Number(req.query.event_id);
    const event_name = decodeURIComponent(String(req.query.event_name));

    const match = await get_upcomings(event_id, event_name);
    res.json(match);
})

app.listen(PORT, () => {
    console.log(`server is now running at PORT : ${PORT}`)
})