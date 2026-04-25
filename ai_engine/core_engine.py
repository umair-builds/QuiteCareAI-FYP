import re
import os

# Use the directory of this file as the base for resolving paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_vocabulary(file_path):
    """Reads the text file and returns a strict set of allowed words."""
    # Resolve relative paths against this file's directory
    if not os.path.isabs(file_path):
        file_path = os.path.join(BASE_DIR, file_path)

    allowed_words = set()
    try:
        with open(file_path, 'r') as file:
            for line in file:
                word = line.strip().lower()
                # Skip the category headers (like === FULL GRAMMAR ===) and empty lines
                if word and not word.startswith('='):
                    allowed_words.add(word)
        return allowed_words
    except FileNotFoundError:
        print(f"Error: Could not find {file_path}. Make sure it is in the same folder.")
        return set()

def mirror_filter(ai_response, allowed_words):
    """Flags unauthorized words but KEEPS them in the sequence for future recording."""
    clean_text = re.sub(r'[^\w\s]', '', ai_response).lower()
    words = clean_text.split()
    
    # Identify which words are missing from our 900-word dictionary
    missing_words_flagged = [word for word in words if word not in allowed_words]
    
    # Return the full, intact sequence AND the list of missing words to warn the developer
    return words, missing_words_flagged

def extract_missing_words(ai_response, allowed_words):
    """Scouts the sentence for unauthorized words without deleting them."""
    clean_text = re.sub(r'[^\w\s]', '', ai_response).lower()
    words = clean_text.split()
    
    # Return a list of ONLY the words that are not in the allowed list
    missing_words = [word for word in words if word not in allowed_words]
    return missing_words
