from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2

app = Flask(__name__)
CORS(app)

# Store uploaded PDF texts and names in memory
uploaded_texts = []
uploaded_names = []

def extract_text_from_pdf(file):
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + " "
    return text.strip()
# Conceptual new Flask API endpoint to replace /upload
@app.route('/compare-texts', methods=['POST'])
def compare_texts():
    data = request.json
    all_texts = data.get('texts', [])

    if len(all_texts) < 2:
        return jsonify({"error": "Need at least two texts for comparison"}), 400

    new_text = all_texts[-1]
    comparison_texts = all_texts[:-1]

    # Compute similarity
    vectorizer = TfidfVectorizer()
    # Fit on all texts
    tfidf_matrix = vectorizer.fit_transform(all_texts) 
    
    # The last vector is the new document
    new_doc_vector = tfidf_matrix[-1]
    
    # Calculate similarity with all others
    similarity_scores = []
    for i in range(len(comparison_texts)):
        score = cosine_similarity(tfidf_matrix[i:i+1], new_doc_vector)[0][0]
        similarity_scores.append(round(score, 4))

    return jsonify({"scores": similarity_scores})
if __name__ == '__main__':
    app.run(debug=True)
