"use node";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { resolveOpenAiKey, type EnvCtx } from "./modules/lib/env";

const buildMessage = (args: { aiSection: string }) => {
  return args.aiSection;
};

export const generateNotification = internalAction({
  args: {
    title: v.string(),
    baseMessage: v.string(),
    portfolioSummary: v.object({
      description: v.string(),
    }),
    severity: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("critical"),
    ),
    assetSymbol: v.string(),
    priceTarget: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    console.log("==========================================");
    console.log("[NOTIFICATIONS] AI ACTION DÉMARRÉE");
    console.log("==========================================");
    console.log("Symbol:", args.assetSymbol);
    console.log("Title:", args.title);
    console.log("Severity:", args.severity);
    
    const apiKey = resolveOpenAiKey(ctx as EnvCtx);
    console.log("API Key présente?", apiKey ? `OUI (${apiKey.substring(0, 10)}...)` : "NON - ERREUR!");
    
    let aiSection: string | null = null;

    if (apiKey && apiKey.length > 0) {
      console.log("[NOTIFICATIONS] Appel OpenAI en cours...");
      try {
        const openai = createOpenAI({ apiKey });
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt: [
            "Tu es un assistant financier qui rédige des notifications concises en français.",
            "Analyse les informations fournies et génère un conseil d'une à deux phrases, orienté action.",
            `Message système: ${args.baseMessage}`,
            `Synthèse portefeuille: ${args.portfolioSummary.description}`,
            "Mentionne s'il faut renforcer, alléger ou observer, en restant neutre et sans donner d'ordre direct.",
          ].join("\n"),
          temperature: 0.4,
          maxOutputTokens: 120,
        });

        aiSection = text.trim();
        console.log("[NOTIFICATIONS] Réponse OpenAI reçue:", aiSection || "(VIDE!)");
        console.log("Longueur réponse:", aiSection?.length || 0);
      } catch (error) {
        console.error("==========================================");
        console.error("[NOTIFICATIONS] ERREUR OPENAI!");
        console.error("==========================================");
        console.error("Symbol:", args.assetSymbol);
        console.error("Erreur complète:", error);
        console.error("Type erreur:", error instanceof Error ? error.constructor.name : typeof error);
        console.error("Message:", error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
          console.error("Stack:", error.stack);
        }
        console.error("==========================================");
      }
    } else {
      console.error("==========================================");
      console.error("[NOTIFICATIONS] PAS DE CLÉ API!");
      console.error("==========================================");
      console.error("La variable OPENAI_API_KEY n'est pas définie dans Convex!");
      console.error("Exécute: npx convex env set OPENAI_API_KEY sk-...");
      console.error("==========================================");
    }

    const finalMessage = buildMessage({
      aiSection:
        aiSection && aiSection.length > 0
          ? aiSection
          : "Impossible de générer une recommandation automatique. Réévaluez vos positions manuellement.",
    });

    await ctx.runMutation(internal.notifications.insertGenerated, {
      title: args.title,
      message: finalMessage,
      severity: args.severity,
      assetSymbol: args.assetSymbol,
      priceTarget: args.priceTarget,
      createdAt: args.createdAt,
    });
  },
});


