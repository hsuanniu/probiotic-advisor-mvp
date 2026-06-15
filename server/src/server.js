import { app } from "./app.js";

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`AI Probiotic Advisor API running at http://localhost:${port}`);
});
