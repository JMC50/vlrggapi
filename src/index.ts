import { PORT } from "../config.json"
import express from "express";
import { testGetUpcomings } from "./test_scrapper";

const app = express();

(async() => {
    testGetUpcomings();
})()

app.listen(PORT, () => {
    console.log(`server is now running at PORT : ${PORT}`)
})