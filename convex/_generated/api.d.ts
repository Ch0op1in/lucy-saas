/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as crons from "../crons.js";
import type * as modules_lib_constants from "../modules/lib/constants.js";
import type * as modules_lib_env from "../modules/lib/env.js";
import type * as modules_lib_logger from "../modules/lib/logger.js";
import type * as modules_lib_portfolio from "../modules/lib/portfolio.js";
import type * as modules_notifications_constants from "../modules/notifications/constants.js";
import type * as modules_notifications_mutations from "../modules/notifications/mutations.js";
import type * as modules_notifications_queries from "../modules/notifications/queries.js";
import type * as modules_prices_ingest from "../modules/prices/ingest.js";
import type * as modules_rules_mutations from "../modules/rules/mutations.js";
import type * as modules_rules_queries from "../modules/rules/queries.js";
import type * as notifications from "../notifications.js";
import type * as portfolio from "../portfolio.js";
import type * as prices from "../prices.js";
import type * as pricesNode from "../pricesNode.js";
import type * as rules from "../rules.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  crons: typeof crons;
  "modules/lib/constants": typeof modules_lib_constants;
  "modules/lib/env": typeof modules_lib_env;
  "modules/lib/logger": typeof modules_lib_logger;
  "modules/lib/portfolio": typeof modules_lib_portfolio;
  "modules/notifications/constants": typeof modules_notifications_constants;
  "modules/notifications/mutations": typeof modules_notifications_mutations;
  "modules/notifications/queries": typeof modules_notifications_queries;
  "modules/prices/ingest": typeof modules_prices_ingest;
  "modules/rules/mutations": typeof modules_rules_mutations;
  "modules/rules/queries": typeof modules_rules_queries;
  notifications: typeof notifications;
  portfolio: typeof portfolio;
  prices: typeof prices;
  pricesNode: typeof pricesNode;
  rules: typeof rules;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
