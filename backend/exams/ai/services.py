from .parser import PDFParser
from .cleaner import TextCleaner
from .extractor import AIExtractor
from .validator import OutputValidator

class PdfExtractionService:
    @staticmethod
    def process_pdf(file_obj):
        """
        Orchestrates the AI PDF Extraction Pipeline.
        """
        # 1. Parsing
        parse_result = PDFParser.extract_text(file_obj)
        raw_text = parse_result["raw_text"]
        num_pages = parse_result["num_pages"]
        
        # 2. Cleaning
        clean_text = TextCleaner.clean(raw_text)
        
        # 3. Extraction
        extraction_result = AIExtractor.extract(clean_text)
        
        # 4. Validation
        validated_result = OutputValidator.validate(extraction_result)
        
        # 5. Formatting Response
        questions = validated_result.get("questions", [])
        warnings = validated_result.get("warnings", [])
        
        # Calculate statistics
        total_questions = len(questions)
        total_marks = sum(q.get("marks", 0) for q in questions)
        
        confidence_scores = {"High": 3, "Medium": 2, "Low": 1}
        avg_confidence_val = sum(confidence_scores.get(q.get("confidence", "Medium"), 2) for q in questions) / total_questions if total_questions > 0 else 0
        
        if avg_confidence_val > 2.5: avg_conf_str = "High"
        elif avg_confidence_val > 1.5: avg_conf_str = "Medium"
        else: avg_conf_str = "Low"
        
        low_confidence_count = sum(1 for q in questions if q.get("confidence") == "Low")
        
        # Estimated Duration (heuristics: 2 mins per text mark, 5 mins per code question)
        est_duration = 0
        for q in questions:
            if q.get("time_limit"):
                est_duration += q["time_limit"]
            else:
                q_type = q.get("question_type", "text")
                if q_type == "code":
                    est_duration += 300
                else:
                    est_duration += q.get("marks", 1) * 120

        # Return final shaped payload
        return {
            "metadata": {
                "exam_title": validated_result.get("title", "Untitled Imported Exam"),
                "estimated_duration_seconds": est_duration,
                "total_marks": total_marks,
                "number_of_pages": num_pages
            },
            "statistics": {
                "total_questions": total_questions,
                "average_confidence": avg_conf_str,
                "low_confidence_count": low_confidence_count
            },
            "questions": questions,
            "warnings": warnings
        }
