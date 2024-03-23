import { useLoaderData } from "@remix-run/react";
import epubjs, { Contents, Rendition } from "epubjs";
import { useEffect, useRef, useState } from "react";
import { action } from "./action.server";
import { loader } from "./loader.server";
import { useSummarizer, type Summarizer } from "./use-summarizer";

export { loader, action };

export default function Page() {
	const { epubUrl } = useLoaderData<typeof loader>();
	const summarizer = useSummarizer();
	const [summarizeShown, setSummarizeShown] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const readerRef = useRef<HTMLDivElement>(null);
	const renditionRef = useRef<Rendition | null>(null);
	const selectionRef = useRef<Selection | null>(null);

	function clearSelection() {
		selectionRef.current?.empty();
		selectionRef.current = null;
		setSummarizeShown(false);
	}

	useEffect(() => {
		const readerEl = readerRef.current;
		if (readerEl === null) {
			return;
		}

		const rendition = epubjs(epubUrl).renderTo(readerEl, {
			height: "100%",
			width: "100%",
			allowScriptedContent: true,
		});

		renditionRef.current = rendition;
		rendition.display();

		rendition.hooks.content.register((contents: Contents) => {
			contents.document.addEventListener("selectionchange", function () {
				const selection = this.getSelection();
				selectionRef.current = selection;
				setSummarizeShown(selection !== null && selection.toString().length >= 500);
			});
		});

		rendition.on("relocated", clearSelection);

		return () => {
			rendition.destroy();
			renditionRef.current = null;
			clearSelection();
		};
	}, [epubUrl]);

	function goToPrevious() {
		renditionRef.current?.prev();
	}

	function goToNext() {
		renditionRef.current?.next();
	}

	function summarizeSelection() {
		if (summarizer.pending || selectionRef.current === null) {
			return;
		}

		summarizer.summarize(selectionRef.current.toString());
		setDialogOpen(true);
		clearSelection();
	}

	function closeDialog() {
		setDialogOpen(false);
	}

	return (
		<>
			<div className="flex h-screen items-center justify-center gap-8 p-8">
				<button onClick={goToPrevious}>Previous</button>
				<div ref={readerRef} className="h-[500px] w-[500px] border border-black" />
				<button onClick={goToNext}>Next</button>
			</div>
			<button
				aria-hidden={!summarizeShown}
				className="absolute bottom-6 right-6 flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-primary to-primary-light px-6 text-on-primary transition-opacity duration-300 aria-hidden:opacity-0"
				onClick={summarizeSelection}
			>
				Summarize with AI
			</button>
			<SummaryDialog
				pending={summarizer.pending}
				data={summarizer.data}
				open={dialogOpen}
				onClose={closeDialog}
			/>
		</>
	);
}

type SummaryDialogProps = {
	pending: boolean;
	data: Summarizer["data"];
	open: boolean;
	onClose: () => void;
};

function SummaryDialog({ pending, data, open, onClose }: SummaryDialogProps) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (ref.current === null) {
			return;
		}

		if (open) {
			ref.current.showModal();
		} else {
			ref.current.close();
		}
	}, [open]);

	return (
		<dialog ref={ref} className="w-[500px] p-6">
			<SummaryDialogContent pending={pending} data={data} />

			{/* eslint-disable-next-line jsx-a11y/no-autofocus */}
			<button autoFocus onClick={onClose} className="mx-auto mt-6 block">
				Close
			</button>
		</dialog>
	);
}

type SummaryDialogContentProps = {
	pending: boolean;
	data: Summarizer["data"];
};

function SummaryDialogContent({ pending, data }: SummaryDialogContentProps) {
	if (pending) {
		return <p>Loading...</p>;
	}

	if (data === undefined) {
		return null;
	}

	const { summary, error } = data;

	if (error) {
		return <p>Error: {error}</p>;
	}

	return <p>Summary: {summary}</p>;
}
