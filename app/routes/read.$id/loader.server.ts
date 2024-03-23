import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { createServerClient, type ServerClient } from "~/supabase/client.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
	const headers = new Headers();
	const supabase = createServerClient(request, headers);
	const id = String(params.id);
	const epubUrl = await getEpubUrl(supabase, id);

	if (epubUrl === null) {
		throw new Response(null, {
			status: 404,
			statusText: "Book not found",
			headers,
		});
	}

	return json({ epubUrl }, { headers });
}

async function getEpubUrl(supabase: ServerClient, id: string) {
	const { data, error } = await supabase
		.from("books")
		.select("epubFileName:epub_file_name")
		.eq("id", id)
		.maybeSingle();

	if (error !== null) {
		throw error;
	}

	if (data === null) {
		return null;
	}

	return supabase.storage.from("books").getPublicUrl(data.epubFileName).data.publicUrl;
}
