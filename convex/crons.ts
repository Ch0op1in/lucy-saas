import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refreshBinanceTokenPrices",
  { seconds: 10 },
  internal.pricesNode.refreshFromBinance,
);

export default crons;


