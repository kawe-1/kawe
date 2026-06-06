import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

from langchain.chat_models import init_chat_model

MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "google")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")


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
    from langchain_huggingface import HuggingFaceEmbeddings
    
    hf_token = os.getenv("HF_Token") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if hf_token:
        os.environ["HUGGINGFACEHUB_API_TOKEN"] = hf_token
        
    return HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
