class OutputValidator:
    """
    Validates extracted structural data. Detects duplicate numbers, missing numbers, etc.
    """
    
    @staticmethod
    def validate(extraction_result):
        questions = extraction_result.get("questions", [])
        warnings = extraction_result.get("warnings", [])
        
        if not questions:
            warnings.append("No questions detected. The PDF may be an image or incorrectly formatted.")
            return extraction_result
            
        seen_numbers = set()
        expected_next = 1
        
        for q in questions:
            q_num = q["question_number"]
            
            if q_num in seen_numbers:
                warnings.append(f"Duplicate question number detected: {q_num}")
                q["confidence"] = "Low"
                if "warnings" not in q: q["warnings"] = []
                q.setdefault("warnings", []).append("Duplicate question number")
            
            if q_num != expected_next and q_num not in seen_numbers:
                warnings.append(f"Skipped or missing numbering near Question {q_num}. Expected {expected_next}.")
                q["confidence"] = "Medium"
                q.setdefault("warnings", []).append("Skipped numbering")
                
            seen_numbers.add(q_num)
            expected_next = q_num + 1
            
            # Formatting checks
            if len(q["question_text"]) < 5:
                q["confidence"] = "Low"
                q.setdefault("warnings", []).append("Malformed question text (too short)")
                
        return extraction_result
