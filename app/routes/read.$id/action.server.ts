import { textGeneration } from "@huggingface/inference";
import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
	try {
		const input = await request.text();
		const output = await textGeneration({
			accessToken: process.env.HF_API_KEY,
			model: "booksouls/long-t5-tglobal-base",
			inputs: input,
		});

		return {
			summary: output.generated_text,
			error: null,
		};
	} catch (error) {
		console.error(error);
		return {
			summary: null,
			error: "Failed to summarize the text. Please try again.",
		};
	}
}
