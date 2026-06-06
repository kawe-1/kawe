from __future__ import annotations

RAG_SYSTEM_PROMPT = (
    "You are a retrieval-augmented reasoning assistant. Use only the retrieved context "
    "provided in the user query payload. Ground every response in the retrieved content. "
    "Do not hallucinate or invent facts. If the requested answer is not supported by "
    "the retrieved context, state that the information is unavailable."
)

RAG_USER_PROMPT_TEMPLATE = (
    "Retrieve the answer from the provided context and respond to the query below.\n"
    "If the context does not contain enough information, say that the answer cannot be found.\n\n"
    "Context:\n{context}\n\n"
    "Query:\n{query}\n"
)

SUMMARY_PROMPT_TEMPLATE = (
    "Using the retrieved context below, generate a concise study summary. Return valid JSON only.\n\n"
    "Retrieved Context:\n{context}\n\n"
    "Instructions:\n"
    "- Provide a short descriptive title.\n"
    "- Write an overview that captures the main idea.\n"
    "- List 3 to 6 clear key points.\n"
    "- Remain grounded in the retrieved context.\n"
    "- Do not invent new facts.\n"
)

QUIZ_PROMPT_TEMPLATE = (
    "Using the retrieved context below, generate exactly {question_count} multiple-choice questions. Return valid JSON only.\n\n"
    "Retrieved Context:\n{context}\n\n"
    "Instructions:\n"
    "- Create {question_count} questions that require understanding, not rote memorization.\n"
    "- Provide 4 answer choices for each question.\n"
    "- Mark one correct answer and include an explanation.\n"
    "- Avoid duplicate concepts and avoid trivial questions.\n"
    "- Keep everything grounded in the retrieved context.\n"
)

FLASHCARD_PROMPT_TEMPLATE = (
    "Using the retrieved context below, create an active recall flashcard deck. Return valid JSON only.\n\n"
    "Retrieved Context:\n{context}\n\n"
    "Instructions:\n"
    "- Generate concise flashcards that cover core concepts.\n"
    "- Keep each front focused on a single idea.\n"
    "- Keep each back precise and explanatory.\n"
    "- Avoid trivia and needless detail.\n"
    "- Use only information found in the retrieved context.\n"
)


def format_rag_prompt(context: str, query: str) -> str:
    return RAG_USER_PROMPT_TEMPLATE.format(context=context, query=query)


def format_summary_prompt(context: str) -> str:
    return SUMMARY_PROMPT_TEMPLATE.format(context=context)


def format_quiz_prompt(context: str, question_count: int = 4) -> str:
    return QUIZ_PROMPT_TEMPLATE.format(context=context, question_count=question_count)


def format_flashcard_prompt(context: str) -> str:
    return FLASHCARD_PROMPT_TEMPLATE.format(context=context)


CONCEPT_PROMPT_TEMPLATE = (
    "Using the retrieved context below, identify key complex concepts and generate simplified explanations "
    "with relatable analogies. Return valid JSON only.\n\n"
    "Retrieved Context:\n{context}\n\n"
    "Instructions:\n"
    "- Identify 3 to 5 challenging concepts from the context.\n"
    "- For each concept, provide a simplified explanation (like explaining to a 10-year-old).\n"
    "- Include a vivid analogy to help understand the concept.\n"
    "- Keep all concepts strictly grounded in the retrieved context.\n"
)


def format_concept_prompt(context: str) -> str:
    return CONCEPT_PROMPT_TEMPLATE.format(context=context)
