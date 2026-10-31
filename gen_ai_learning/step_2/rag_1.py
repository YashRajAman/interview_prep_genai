from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_core.tools import tool
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


# 1. PDF Reader and Documenter
def create_doc_from_pdf(pdf_path: str) -> Document:
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    print(f"Total docs = {len(docs)}")
    return docs

def split_documents(docs: Document) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", ""]
    )
    return splitter.split_documents(docs)

documents = create_doc_from_pdf('THE-TWELVE-MONTHS.pdf')

documents = split_documents(documents)

print(documents[0]) 

print("========================================")

print(documents[1])


