import { supabaseAdmin } from "@/utils";

// Move the Supabase endpoint and similarity threshold to a configuration file
const SUPABASE_ENDPOINT = process.env.SUPABASE_ENDPOINT ?? "car_licence_search";
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD ?? "0.01");

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { query, apiKey, matches } = (await req.json()) as {
      query: string;
      apiKey: string;
      matches: number;
    };

    const input = query.replace(/\n/g, " ");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input
      })
    });

    const json = await res.json();
    const embedding = json.data[0].embedding;

    // Validate the matches parameter before passing it to the RPC call
    const maxMatches = 10; // set an arbitrary maximum value
    const validatedMatches = Math.min(matches, maxMatches);

    const { data, error } = await supabaseAdmin
      .rpc(SUPABASE_ENDPOINT, {
        query_embedding: embedding,
        similarity_threshold: SIMILARITY_THRESHOLD,
        match_count: validatedMatches
      });

    if (error) {
      console.error(error);
      return new Response("Error", { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("An error occurred while processing the request.", { status: 500 });
  }
};

export default handler;
