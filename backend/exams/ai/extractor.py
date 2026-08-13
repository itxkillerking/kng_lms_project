import re

class AIExtractor:
    """
    Simulates AI extraction using heuristic Regular Expressions.
    Extracts Questions, Marks, Time Limits, and detects structural elements.
    """
    
    @staticmethod
    def extract(clean_text):
        questions = []
        warnings = []
        
        # Match patterns like: "1.", "Q1:", "Question 1)"
        question_pattern = re.compile(r'^(?:Q(?:uestion)?\s*)?(\d+)[.)\]:]\s+(.*)', re.IGNORECASE)
        # Match marks: "[5 marks]", "(10 pts)", "5 Marks"
        marks_pattern = re.compile(r'\[?\b(\d+)\s*(?:marks?|pts|points)\b\]?', re.IGNORECASE)
        # Match time: "2 mins", "60 seconds"
        time_pattern = re.compile(r'\[?\b(\d+)\s*(?:mins?|minutes?|secs?|seconds?)\b\]?', re.IGNORECASE)
        # Detect sections: "Section A", "Part 1", "MCQs"
        section_pattern = re.compile(r'^(?:Section|Part)\s+[A-Za-z0-9]+|(?:Multiple Choice Questions|MCQs)', re.IGNORECASE)

        lines = clean_text.split('\n')
        current_question = None
        current_section = None
        
        exam_title = "Untitled Imported Exam"
        if lines:
            # Assume first non-empty line might be the title if it doesn't look like a question
            if not question_pattern.match(lines[0]) and not section_pattern.match(lines[0]):
                exam_title = lines[0]

        for i, line in enumerate(lines):
            # Check for section header
            if section_pattern.match(line) and len(line) < 50:
                current_section = line
                continue
                
            q_match = question_pattern.match(line)
            if q_match:
                if current_question:
                    questions.append(current_question)
                
                q_num = int(q_match.group(1))
                q_text = q_match.group(2)
                
                # Check for marks in the same line
                marks = 1
                confidence = "High"
                m_match = marks_pattern.search(q_text)
                if m_match:
                    marks = int(m_match.group(1))
                    # Remove marks text from question body
                    q_text = marks_pattern.sub('', q_text).strip()
                else:
                    # Look ahead 1 line for marks
                    if i + 1 < len(lines):
                        next_line_m = marks_pattern.search(lines[i+1])
                        if next_line_m:
                            marks = int(next_line_m.group(1))
                        else:
                            confidence = "Medium"
                            warnings.append(f"Marks not detected for Q{q_num}. Defaulting to 1.")
                
                # Detect Question Type (Basic heuristic)
                q_type = 'text'
                if re.search(r'\b(?:write a program|code|function|algorithm)\b', q_text, re.IGNORECASE):
                    q_type = 'code'
                elif re.search(r'\b(?:speak|record|audio)\b', q_text, re.IGNORECASE):
                    q_type = 'audio'
                
                current_question = {
                    "question_number": q_num,
                    "question_text": q_text,
                    "marks": marks,
                    "time_limit": None,  # Will parse if found
                    "question_type": q_type,
                    "confidence": confidence,
                    "section": current_section
                }
            elif current_question:
                # Append to current question text
                if not marks_pattern.search(line): # Don't append lines that are just mark annotations
                    current_question["question_text"] += "\n" + line

        if current_question:
            questions.append(current_question)

        return {
            "title": exam_title,
            "questions": questions,
            "warnings": warnings
        }
