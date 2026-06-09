import os
from typing import Any

from ai.retrieval import retrieve_relevant_chunks
from ai.schema import ConceptDeck, FlashcardDeck, Quiz
from ai.settings import (
    extract_gemini_text,
    get_embeddings,
    get_llm,
    get_session_vector_store,
)


def generate_rag_response(session_id: str, query: str) -> dict[str, Any]:
    """Perform RAG by retrieving relevant chunks and generating an LLM response."""
    vector_store = get_session_vector_store(session_id)
    if not vector_store:
        return {
            "answer": "No source documents have been uploaded to this session yet. Please add some sources to get started.",
            "sources": [],
        }

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(query)

    chunks = retrieve_relevant_chunks(
        vector_store=vector_store,
        query_embedding=query_embedding,
        query_text=query,
        top_k=8,
    )

    if not chunks:
        return {
            "answer": "I couldn't find any relevant information in the uploaded sources to answer your question.",
            "sources": [],
        }

    context = "\n\n".join(
        [
            f"Source: {doc.metadata.get('source', 'unknown')}\nContent: {doc.page_content}"
            for doc in chunks
        ]
    )

    from ai.prompts import RAG_SYSTEM_PROMPT, format_rag_prompt

    llm = get_llm()
    messages = [
        ("system", RAG_SYSTEM_PROMPT),
        ("user", format_rag_prompt(context, query)),
    ]
    response = llm.invoke(messages)

    # Deduplicate sources
    sources = []
    seen = set()
    for doc in chunks:
        src_name = doc.metadata.get("source", "unknown")
        if src_name not in seen:
            seen.add(src_name)
            sources.append(
                {
                    "name": os.path.basename(src_name),
                    "source_type": doc.metadata.get("source_type", "unknown"),
                }
            )

    return {"answer": extract_gemini_text(response.content), "sources": sources}


_LANG_INSTRUCTIONS = {
    "english": "Respond in clear, natural English.",
    "french": "Réponds en français naturel et clair.",
    "pidgin": "Respond in Nigerian Pidgin English — warm, casual, and natural. E.g. 'Wetin you dey ask about...'",
    "yoruba": "Dahun ni ede Yoruba.",
    "hausa": "Amsa cikin Hausa.",
    "igbo": "Zaghachi n'asụsụ Igbo.",
}


def generate_conversation_response(
    session_id: str,
    query: str,
    language: str = "english",
    history: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Generate a conversational, voice-friendly RAG response.
    Respects the chosen language and keeps answers short and natural
    since they will be read aloud by TTS.
    """
    lang_key = language.lower()
    lang_instr = _LANG_INSTRUCTIONS.get(lang_key, _LANG_INSTRUCTIONS["english"])

    system_prompt = (
        f"You are Kawe, a friendly and encouraging study assistant. {lang_instr}\n\n"
        "You are having a spoken voice conversation with a student about their study materials. "
        "Keep responses warm, conversational, and concise — 2 to 4 sentences maximum — "
        "because your words will be read aloud. Avoid markdown, bullet points, numbered lists, "
        "or any formatting. Just speak naturally."
    )

    vector_store = get_session_vector_store(session_id)
    context = ""
    if vector_store:
        embeddings = get_embeddings()
        query_embedding = embeddings.embed_query(query)
        chunks = retrieve_relevant_chunks(
            vector_store=vector_store,
            query_embedding=query_embedding,
            query_text=query,
            top_k=5,
        )
        if chunks:
            context = "\n\n".join(doc.page_content for doc in chunks)

    llm = get_llm()
    messages: list = [("system", system_prompt)]

    # Include last 6 turns of history for continuity
    for turn in (history or [])[-6:]:
        role = "assistant" if turn.get("role") == "assistant" else "user"
        messages.append((role, turn.get("message", "")))

    # Attach retrieved context to the current user turn
    user_content = query
    if context:
        user_content = (
            f"[Relevant notes excerpt]\n{context[:1200]}\n\n"
            f"[Student's question]\n{query}"
        )
    messages.append(("user", user_content))

    response = llm.invoke(messages)
    return {"answer": response.content, "language": language}


def generate_notes(session_id: str, title: str) -> dict[str, Any]:
    """Generate structured study notes from session context documents."""
    vector_store = get_session_vector_store(session_id)
    if not vector_store:
        raise ValueError("No sources have been ingested for this session yet.")

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(title)

    chunks = retrieve_relevant_chunks(
        vector_store=vector_store,
        query_embedding=query_embedding,
        query_text=title,
        top_k=15,  # Fetch plenty of raw material for complete note-taking
    )

    if not chunks:
        raise ValueError("No context found in session sources.")

    context = "\n\n".join(
        [
            f"Source identity: {doc.metadata.get('source', 'unknown')}\nContent: {doc.page_content}"
            for doc in chunks
        ]
    )

    # FIX: Swapped from raw Summary to matching Notes layout
    from ai.prompts import format_notes_prompt
    from ai.schema import Notes

    llm = get_llm()
    structured_llm = llm.with_structured_output(Notes)
    prompt = format_notes_prompt(context)

    result = structured_llm.invoke(prompt)
    return result.model_dump()


def generate_quiz(
    session_id: str, title: str, num_questions: int = 5, difficulty: str = "medium"
) -> dict[str, Any]:
    """Generate interactive multiple choice questions from session context."""
    vector_store = get_session_vector_store(session_id)
    if not vector_store:
        raise ValueError("No sources have been ingested for this session yet.")

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(title)

    chunks = retrieve_relevant_chunks(
        vector_store=vector_store,
        query_embedding=query_embedding,
        query_text=title,
        top_k=15,
    )

    if not chunks:
        raise ValueError("No context found in session sources.")

    context = "\n\n".join([doc.page_content for doc in chunks])

    from ai.prompts import format_quiz_prompt

    llm = get_llm()
    structured_llm = llm.with_structured_output(Quiz)
    prompt = format_quiz_prompt(context, question_count=num_questions)
    if difficulty:
        prompt += f"\nDifficulty Level: {difficulty}. Ensure the questions match this difficulty."

    result = structured_llm.invoke(prompt)
    return result.model_dump()


def generate_flashcards(session_id: str, title: str) -> dict[str, Any]:
    """Generate revision flashcard deck from session context."""
    vector_store = get_session_vector_store(session_id)
    if not vector_store:
        raise ValueError("No sources have been ingested for this session yet.")

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(title)

    chunks = retrieve_relevant_chunks(
        vector_store=vector_store,
        query_embedding=query_embedding,
        query_text=title,
        top_k=15,
    )

    if not chunks:
        raise ValueError("No context found in session sources.")

    context = "\n\n".join([doc.page_content for doc in chunks])

    from ai.prompts import format_flashcard_prompt

    llm = get_llm()
    structured_llm = llm.with_structured_output(FlashcardDeck)
    prompt = format_flashcard_prompt(context)

    result = structured_llm.invoke(prompt)
    return result.model_dump()


def generate_concepts(session_id: str, title: str) -> dict[str, Any]:
    """Generate concept simplifications from session context."""
    vector_store = get_session_vector_store(session_id)
    if not vector_store:
        raise ValueError("No sources have been ingested for this session yet.")

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(title)

    chunks = retrieve_relevant_chunks(
        vector_store=vector_store,
        query_embedding=query_embedding,
        query_text=title,
        top_k=15,
    )

    if not chunks:
        raise ValueError("No context found in session sources.")

    context = "\n\n".join([doc.page_content for doc in chunks])

    from ai.prompts import format_concept_prompt

    llm = get_llm()
    structured_llm = llm.with_structured_output(ConceptDeck)
    prompt = format_concept_prompt(context)

    result = structured_llm.invoke(prompt)
    return result.model_dump()
