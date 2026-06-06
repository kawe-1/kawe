import os
from typing import Any, Dict, Optional

from services.vector_store_factory import get_vector_store
from ai.settings import get_embeddings, get_llm
from ai.schema import Summary, Quiz, FlashcardDeck, ConceptDeck
from ai.retrieval import retrieve_relevant_chunks


def get_session_vector_store(session_id: str):
    """Load the Chroma vector store for the session if it exists."""
    persist_dir = f"data/vector_stores/{session_id}"
    if not os.path.exists(persist_dir):
        return None
    return get_vector_store(
        embedding_function=get_embeddings(),
        persist_directory=persist_dir
    )


def generate_rag_response(session_id: str, query: str) -> dict[str, Any]:
    """Perform RAG by retrieving relevant chunks and generating an LLM response."""
    vector_store = get_session_vector_store(session_id)
    if not vector_store:
        return {
            "answer": "No source documents have been uploaded to this session yet. Please add some sources to get started.",
            "sources": []
        }

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(query)

    chunks = retrieve_relevant_chunks(
        vector_store=vector_store,
        query_embedding=query_embedding,
        query_text=query,
        top_k=8
    )

    if not chunks:
        return {
            "answer": "I couldn't find any relevant information in the uploaded sources to answer your question.",
            "sources": []
        }

    context = "\n\n".join([f"Source: {doc.metadata.get('source', 'unknown')}\nContent: {doc.page_content}" for doc in chunks])

    from ai.prompts import RAG_SYSTEM_PROMPT, format_rag_prompt
    llm = get_llm()
    messages = [
        ("system", RAG_SYSTEM_PROMPT),
        ("user", format_rag_prompt(context, query))
    ]
    response = llm.invoke(messages)

    # Deduplicate sources
    sources = []
    seen = set()
    for doc in chunks:
        src_name = doc.metadata.get("source", "unknown")
        if src_name not in seen:
            seen.add(src_name)
            sources.append({
                "name": os.path.basename(src_name),
                "source_type": doc.metadata.get("source_type", "unknown")
            })

    return {
        "answer": response.content,
        "sources": sources
    }


def generate_notes(session_id: str, title: str) -> dict[str, Any]:
    """Generate study summary notes from session context."""
    vector_store = get_session_vector_store(session_id)
    if not vector_store:
        raise ValueError("No sources have been ingested for this session yet.")

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(title)

    chunks = retrieve_relevant_chunks(
        vector_store=vector_store,
        query_embedding=query_embedding,
        query_text=title,
        top_k=15
    )

    if not chunks:
        raise ValueError("No context found in session sources.")

    context = "\n\n".join([doc.page_content for doc in chunks])

    from ai.prompts import format_summary_prompt
    llm = get_llm()
    structured_llm = llm.with_structured_output(Summary)
    prompt = format_summary_prompt(context)

    result = structured_llm.invoke(prompt)
    return result.model_dump()


def generate_quiz(session_id: str, title: str, num_questions: int = 5, difficulty: str = "medium") -> dict[str, Any]:
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
        top_k=15
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
        top_k=15
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
        top_k=15
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
