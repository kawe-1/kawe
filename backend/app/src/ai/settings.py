import os
from functools import lru_cache

from dotenv import load_dotenv
from langchain_core.vectorstores import VectorStore

load_dotenv()

from langchain.chat_models import init_chat_model

MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "google_genai")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-3.1-flash-lite")


def extract_gemini_text(content) -> str:
    # If response.content is a list of blocks
    if isinstance(content, list):
        return "".join(
            block.get("text", "") for block in content if block.get("type") == "text"
        )
    return content


def get_llm():
    if MODEL_PROVIDER == "huggingface":
        from langchain_huggingface import (
            ChatHuggingFace,
            HuggingFaceEndpoint,
        )

        llm = HuggingFaceEndpoint(
            repo_id=MODEL_NAME,
        )

        return ChatHuggingFace(llm=llm)

    return init_chat_model(
        MODEL_NAME,
        model_provider=MODEL_PROVIDER,
    )


@lru_cache(maxsize=1)
def get_embeddings():
    # Swap out the local executor for the API-based endpoint executor
    from langchain_huggingface import HuggingFaceEndpointEmbeddings

    hf_token = os.getenv("HF_Token") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if hf_token:
        os.environ["HUGGINGFACEHUB_API_TOKEN"] = hf_token

    # This hits Hugging Face's free infrastructure instead of your local machine
    return HuggingFaceEndpointEmbeddings(
        model="BAAI/bge-small-en-v1.5",
        task="feature-extraction",  # Required for embedding models on the API
    )


def get_session_vector_store(session_id: str, **kwargs) -> VectorStore:
    """Return a LangChain vector store instance for the selected provider."""
    provider = (os.getenv("VECTOR_DB_PROVIDER", "") or "chroma").strip().lower()
    embedding_function = get_embeddings()

    if provider == "chroma":
        persist_dir = f"data/vector_stores/{session_id}"
        from langchain_chroma import Chroma

        # If the directory doesn't exist, Chroma creates it.
        # If it does exist, it automatically opens and appends to it.
        return Chroma(
            collection_name=f"session_{session_id}",
            embedding_function=embedding_function,
            persist_directory=persist_dir,
        )

    if provider == "qdrant":
        from langchain_qdrant import Qdrant

        return Qdrant(embedding_function=embedding_function, **kwargs)

    if provider == "weaviate":
        from langchain_weaviate import Weaviate

        return Weaviate(embedding_function=embedding_function, **kwargs)

    if provider == "milvus":
        from langchain_milvus import Milvus

        return Milvus(embedding_function=embedding_function, **kwargs)

    raise ValueError(
        f"Unsupported VECTOR_DB_PROVIDER '{provider}'. "
        "Supported providers are: chroma, qdrant, weaviate, milvus."
    )
