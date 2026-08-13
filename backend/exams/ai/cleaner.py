import re

class TextCleaner:
    """
    Standardizes and cleans raw extracted text before heuristic processing.
    """
    
    @staticmethod
    def clean(raw_text):
        """
        Removes excessive whitespace and unprintable characters.
        """
        # Remove multiple spaces/newlines
        text = re.sub(r'\r\n', '\n', raw_text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Trim whitespace from lines
        lines = [line.strip() for line in text.split('\n')]
        
        # Remove empty lines at start and end
        while lines and not lines[0]:
            lines.pop(0)
        while lines and not lines[-1]:
            lines.pop()
            
        return "\n".join(lines)
