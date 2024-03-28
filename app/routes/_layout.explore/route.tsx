import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Loader2Icon, Search } from "lucide-react";
import { useEffect, useId } from "react";
import { toast, Toaster } from "sonner";
import SearchBooks from "~/assets/search-books.svg?react";
import SearchNotFound from "~/assets/search-not-found.svg?react";
import type { BookSearchResults } from "~/supabase/helpers/search.server";
import { action } from "./action.server";

export { action };

export default function Explore() {
	const actionData = useActionData<typeof action>();
	return (
		<main>
			<div className="px-8 pt-16">
				<SearchForm query={actionData?.query} />
				<div aria-live="polite">
					<SearchResults results={actionData?.results} />
				</div>
			</div>
			<div className="line-gradient" />
			<ErrorToaster error={actionData?.error} />
		</main>
	);
}

function SearchForm({ query }: { query: string | undefined }) {
	const descriptionId = useId();
	return (
		<Form method="post">
			<div className="mx-auto flex w-[600px] max-w-full border-2 border-primary focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-current">
				<input
					type="text"
					name="query"
					defaultValue={query}
					placeholder="Search..."
					required
					aria-label="Search"
					aria-describedby={descriptionId}
					className="w-full bg-transparent px-3 placeholder:text-primary/60 focus:outline-none"
				/>
				<SearchSubmit />
			</div>
			<p id={descriptionId} className="mx-auto mt-3 w-[400px] text-center">
				Our <strong className="font-medium">AI-Powered Search</strong> helps you discover books
				matching your description
			</p>
		</Form>
	);
}

function SearchSubmit() {
	const navigation = useNavigation();
	const submitting = navigation.state === "submitting";
	return (
		<button
			type="submit"
			tabIndex={-1}
			aria-disabled={submitting}
			aria-label={submitting ? "Searching" : "Search"}
			className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-on-primary"
		>
			{submitting ? <Loader2Icon className="animate-spin" /> : <Search />}
		</button>
	);
}

function SearchResults({ results }: { results: BookSearchResults | null | undefined }) {
	if (results == null) {
		return <SearchResultsPlaceholder />;
	}

	if (results.length === 0) {
		return <EmptySearchResults />;
	}

	return <SearchResultsList results={results} />;
}

function SearchResultsPlaceholder() {
	return (
		<SearchBooks
			role="img"
			aria-label="A woman searching for books"
			className="mx-auto mt-12 h-auto w-[500px] max-w-full"
		/>
	);
}

function EmptySearchResults() {
	const headerId = useId();
	return (
		<section aria-labelledby={headerId} className="pt-12">
			<h1 id={headerId} className="text-center text-2xl font-medium text-[#DE2A4C]">
				No Search Results Found!
			</h1>
			<SearchNotFound
				role="img"
				aria-label="No results found"
				className="mx-auto mt-8 h-auto w-[500px] max-w-full"
			/>
		</section>
	);
}

function SearchResultsList({ results }: { results: BookSearchResults }) {
	const headerId = useId();
	return (
		<section aria-labelledby={headerId} className="mx-auto max-w-3xl py-12">
			<h1 id={headerId} className="text-2xl font-medium">
				{results.length} Results Found
			</h1>
			<ul className="flex flex-col gap-8 pt-8">
				{results.map((book) => (
					<li key={book.id} className="flex gap-8">
						<img
							alt=""
							src={book.image}
							className="h-[180px] w-[120px] shrink-0 rounded object-cover shadow-md"
						/>
						<div>
							<h2 className="text-xl font-medium">{book.title}</h2>
							<p className="mt-1">{book.genres.join(", ")}</p>
							<p className="mt-5 text-on-background/75">{book.shortDescription}</p>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}

function ErrorToaster({ error }: { error: boolean | undefined }) {
	const navigation = useNavigation();
	const idle = navigation.state === "idle";

	useEffect(() => {
		if (!idle || !error) {
			return;
		}

		toast.error("Failed to load search results");
	}, [idle, error]);

	return <Toaster richColors closeButton />;
}
