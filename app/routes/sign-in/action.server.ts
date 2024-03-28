import { json, type ActionFunctionArgs } from "@remix-run/node";
import { email, parse, string } from "valibot";
import { createServerClient } from "~/supabase/client.server";

const emailSchema = string([email()]);

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const email = parse(emailSchema, formData.get("email"));

	const headers = new Headers();
	const supabase = createServerClient(request, headers);

	const url = new URL(request.url);
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			emailRedirectTo: url.origin,
		},
	});

	if (error !== null) {
		console.error(error);
		return json(
			{
				error: error.message,
				email,
			},
			{
				headers,
				status: 500,
			},
		);
	}

	return json(
		{
			error: null,
			email,
		},
		{ headers },
	);
}
