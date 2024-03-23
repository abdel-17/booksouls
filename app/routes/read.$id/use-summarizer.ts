import { useFetcher } from "@remix-run/react";
import type { action } from "./action.server";

export function useSummarizer() {
	const fetcher = useFetcher<typeof action>();
	return {
		data: fetcher.data,
		pending: fetcher.state === "submitting",
		summarize: (text: string) => {
			fetcher.submit(text, {
				method: "post",
				encType: "text/plain",
			});
		},
	};
}

export type Summarizer = ReturnType<typeof useSummarizer>;
