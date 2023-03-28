import { PGEssay, PGJSON } from "@/types";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";

loadEnvConfig("");

const generateEmbeddings = async (essays:{description: String, text: String, title: String}[] ) => {
  const configuration = new Configuration({ apiKey: process.env.OPENIAI_API_KEY });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  for (let i = 0; i < essays.length; i++) {
    const section = essays[i]; 

    const { text, title, description }:any = section;

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: description
    });

    const [{ embedding }] = embeddingResponse.data.data;

    const { data, error } = await supabase
      .from("roles")
      .insert({
        role_text:text,
        role_title: title,
        role_description:description, 
        embedding
      })
      .select("*");

    if (error) {
      console.log("error", error);
    } else {
      console.log("saved", i);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return Promise.resolve();
};

(async () => {
  const book: PGJSON = JSON.parse(fs.readFileSync("scripts/pg.json", "utf8"));

  await generateEmbeddings(book.essays);
})();
