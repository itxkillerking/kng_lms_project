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
        
        # Question boundaries: "Question 1", "1.", "Q1:", "Question 1 -", "1 -"
        question_pattern = re.compile(r'^(?:Q(?:uestion)?\s*)?(\d+)(?:[\s.)\]:-]+(.*))?$', re.IGNORECASE)
        
        # Marks patterns
        marks_pattern = re.compile(r'\[?\b(\d+)\s*(?:marks?|pts|points)\b\]?|Marks?:\s*(\d+)', re.IGNORECASE)
        
        # Time patterns: "Time: 2 minutes", "Time limit: 120 seconds", "Allowed time: 5 minutes"
        time_pattern = re.compile(r'(?:Time|Time\s+limit|Allowed\s+time):\s*(\d+)\s*(minutes?|mins?|seconds?|secs?)', re.IGNORECASE)
        
        # Sections
        section_pattern = re.compile(r'^(?:Section|Part)\s+[A-Za-z0-9]+|(?:Multiple Choice Questions|MCQs)', re.IGNORECASE)

        # Noise lines to ignore
        noise_pattern = re.compile(r'^(?:Answer all questions|End of paper|Time allowed|Total marks|Exam duration).*', re.IGNORECASE)

        lines = clean_text.split('\n')
        current_question = None
        current_section = None
        
        exam_title = "Untitled Imported Exam"
        for line in lines:
            line = line.strip()
            if not line or noise_pattern.match(line):
                continue
            if question_pattern.match(line) or section_pattern.match(line):
                break
            exam_title = line
            break

        def classify_question(q_text):
            text_lower = q_text.lower()
            
            # Audio detection
            audio_keywords = [
                'speak', 'record', 'spoken', 'verbally', 'voice response', 
                'orally', 'audio response', 'audio answer', 'speak your answer'
            ]
            if any(re.search(r'\b' + kw + r'\b', text_lower) for kw in audio_keywords):
                return 'audio', 'audio instruction found'
                
            # Code detection
            code_actions = ['write', 'implement', 'create', 'program', 'complete']
            code_nouns = ['program', 'function', 'code', 'query', 'method', 'algorithm']
            code_langs = ['python', 'c', 'c++', 'java', 'javascript', 'typescript', 'sql', 'c#', 'php', 'go', 'kotlin', 'swift']
            
            # Action + noun or language
            has_action = any(re.search(r'\b' + a + r'\b', text_lower) for a in code_actions)
            has_noun = any(re.search(r'\b' + n + r'\b', text_lower) for n in code_nouns)
            has_lang = any(re.search(r'\b' + re.escape(l) + r'\b', text_lower) for l in code_langs)
            
            if has_action and (has_noun or has_lang):
                return 'code', 'programming instruction found'
                
            # Direct code indicators like "write a sql query" or "java method"
            if re.search(r'\b(?:write a\s+(?:python|c\+\+|c|java|sql|javascript|php|go).*?|implement a\s+.*?function)\b', text_lower):
                return 'code', 'direct coding instruction found'

            return 'text', 'fallback'

        def parse_marks_and_time(line, current_marks, current_time):
            m = current_marks
            t = current_time
            
            # Extract time
            t_match = time_pattern.search(line)
            if t_match:
                val = int(t_match.group(1))
                unit = t_match.group(2).lower()
                if unit.startswith('min'):
                    t = val * 60
                else:
                    t = val
                line = time_pattern.sub('', line).strip()
            
            # Extract marks
            m_match = marks_pattern.search(line)
            if m_match:
                m = int(m_match.group(1) or m_match.group(2))
                line = marks_pattern.sub('', line).strip()
                
            return line, m, t

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            if noise_pattern.match(line):
                continue
                
            if section_pattern.match(line) and len(line) < 50:
                current_section = line
                continue
                
            q_match = question_pattern.match(line)
            if q_match:
                if current_question:
                    q_type, q_reason = classify_question(current_question['question_text'])
                    current_question['question_type'] = q_type
                    current_question['confidence_reason'] = q_reason
                    questions.append(current_question)
                
                q_num = int(q_match.group(1))
                q_text = q_match.group(2) or ""
                
                q_text, marks, q_time = parse_marks_and_time(q_text, None, None)
                
                confidence = "High" if marks else "Medium"
                
                current_question = {
                    "question_number": q_num,
                    "question_text": q_text,
                    "marks": marks,
                    "time_limit": q_time,
                    "question_type": "text",  # Re-evaluated at push
                    "confidence": confidence,
                    "section": current_section
                }
            elif current_question:
                # If the line just contains marks or time for the current question
                cleaned_line, new_marks, new_time = parse_marks_and_time(line, current_question["marks"], current_question["time_limit"])
                if new_marks is not None:
                    current_question["marks"] = new_marks
                if new_time is not None:
                    current_question["time_limit"] = new_time
                    
                if cleaned_line:
                    current_question["question_text"] += "\n" + cleaned_line

        if current_question:
            q_type, q_reason = classify_question(current_question['question_text'])
            current_question['question_type'] = q_type
            current_question['confidence_reason'] = q_reason
            questions.append(current_question)
            
        # Clean up any null marks
        for q in questions:
            if q['marks'] is None:
                q['marks'] = 1
                warnings.append(f"Marks not detected for Q{q['question_number']}. Defaulting to 1.")

        return {
            "title": exam_title,
            "questions": questions,
            "warnings": warnings
        }
