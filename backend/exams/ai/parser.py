import io
from PyPDF2 import PdfReader

class PDFParser:
    """
    Modular PDF parser designed to extract raw text from PDF files.
    Can be easily swapped with other libraries (pdfplumber, OCR) in the future.
    """
    
    @staticmethod
    def extract_text(file_obj):
        """
        Reads a file-like object and returns raw text and metadata.
        """
        try:
            reader = PdfReader(file_obj)
            num_pages = len(reader.pages)
            raw_text = []
            
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    raw_text.append(text)
            
            return {
                "raw_text": "\n".join(raw_text),
                "num_pages": num_pages
            }
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
