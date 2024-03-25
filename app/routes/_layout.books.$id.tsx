import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import placholder from "~/assets/placeholder.jpeg";
import { IconButton } from "~/components/IconButton";
import { useCarousel } from "~/hooks/carousel";
import { createServerClient, type ServerClient } from "~/supabase/client.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
	const id = Number(params.id);
	const headers = new Headers();
	const supabase = createServerClient(request, headers);
	const book = await getBook(supabase, id);

	if (book === null) {
		throw new Response(null, {
			status: 404,
			statusText: "Book not found",
		});
	}
	return json(
		{
			book,
			similarBooks: Array(8)
				.fill(null)
				.map(() => ({
					title: "Book",
					image: placholder,
					id: Math.random(),
				})),
		},
		{ headers },
	);
}

async function getBook(supabase: ServerClient, id: number) {
	const { data, error } = await supabase
		.from("books")
		.select(
			"id, title, genres, shortDescription:short_description,description,image:image_file_name",
		)
		.eq("id", id)
		.maybeSingle();
	if (error !== null) {
		throw error;
	}

	if (data === null) {
		return null;
	}

	const image = supabase.storage.from("books").getPublicUrl(data.image).data.publicUrl;

	return { ...data, image };
}

export default function Book() {
	const { book, similarBooks } = useLoaderData<typeof loader>();
	return (
		<main>
			<div className="mx-auto max-w-4xl p-9">
				<section className="mt-4 flex gap-6">
					<img
						className="h-[285px] w-[200px] rounded-lg object-cover shadow-md"
						src={book.image}
						alt={book.title}
					/>
					<div className="flex flex-col">
						<h1 className="text-4xl font-medium uppercase">{book.title}</h1>
						<p className="mt-2 text-2xl font-medium text-on-background/75">
							{book.genres.join(", ")}
						</p>
						<p className="mt-5 text-xl text-on-background/75 ">{book.shortDescription}</p>
						<button className="mx-auto mb-2 mt-auto h-12 rounded-xl bg-gradient-to-r from-primary to-primary-light px-8 text-xl font-medium text-on-primary shadow-inner">
							Read Book
						</button>
					</div>
				</section>
				<section className="mt-9">
					<h2 className="text-2xl font-medium">Description</h2>
					<p className="mt-4 text-on-background/75">{book.description}</p>
				</section>
			</div>
			<SimilarBooks books={similarBooks} />
		</main>
	);
}

type Book = { id: number; title: string; image: string };

function SimilarBooks({ books }: { books: Book[] }) {
	const [ref, carousel, selectedIndex] = useCarousel();
	return (
		<section
			aria-label="Similar books slides with 4 books per page"
			aria-live="polite"
			className="mb-9 mt-12"
		>
			<h2 className="text-center text-3xl uppercase">Similar Books</h2>
			<div ref={ref} className="overflow-hidden">
				<div className="flex items-center pb-12 pt-8">
					{books.map((book, i) => (
						<SimilarBooksItem
							key={book.id}
							book={book}
							aria-label={`Slide ${i + 1}`}
							aria-hidden={i < selectedIndex || i >= selectedIndex + 4}
						/>
					))}
				</div>
			</div>
			<div className="flex justify-center gap-20">
				<IconButton
					aria-label="Previous page"
					disabled={selectedIndex === 0}
					onClick={() => carousel?.scrollTo(selectedIndex - 6)}
				>
					<ChevronLeftIcon />
				</IconButton>

				<IconButton
					aria-label="Next page"
					disabled={selectedIndex === books.length - 1}
					onClick={() => carousel?.scrollTo(selectedIndex + 6)}
				>
					<ChevronRightIcon />
				</IconButton>
			</div>
		</section>
	);
}

function SimilarBooksItem({
	book,
	...props
}: {
	book: Book;
	"aria-label": string;
	"aria-hidden": boolean;
}) {
	return (
		<div className="flex shrink-0 basis-[25%] flex-col items-center gap-2" {...props}>
			<img
				src={book.image}
				alt={`Book "${book.title}"`}
				className="h-[285px] w-[200px] rounded-xl object-cover shadow-md"
			/>
			<p className="mt-1 text-center text-2xl">{book.title}</p>
		</div>
	);
}
