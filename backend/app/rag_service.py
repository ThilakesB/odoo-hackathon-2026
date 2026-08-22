import os
from typing import List, Dict, Any
import chromadb

# Initialize ChromaDB Client
_chroma_client = None
_collection = None

# Default Dayflow Knowledge Base Documents
KNOWLEDGE_DOCUMENTS = [
    {
        "id": "policy_leave_01",
        "title": "Annual & Paid Time Off (PTO) Policy",
        "category": "Leave Management",
        "text": """Employees receive 18 days of Paid Time Off (PTO) per calendar year.
PTO requests must be submitted at least 24 hours in advance for single days and 1 week in advance for 3+ consecutive days.
Unused PTO can be carried over up to a maximum of 5 days into the following year.
Leave approvals are managed by department managers and HR administrators through the Dayflow Portal."""
    },
    {
        "id": "policy_leave_02",
        "title": "Sick & Medical Leave Guidelines",
        "category": "Leave Management",
        "text": """Employees are entitled to 12 days of paid Sick Leave annually.
For sick leaves extending beyond 2 consecutive days, a certified medical certificate from a registered practitioner is required upon return.
Half-day sick leave is supported for medical consultations or morning/afternoon recovery."""
    },
    {
        "id": "policy_attendance_01",
        "title": "Working Hours, Attendance & Check-In Standards",
        "category": "Attendance & Shifts",
        "text": """Standard working hours are 9:00 AM to 6:00 PM (Monday through Friday) with a 1-hour lunch break.
Employees must record daily check-in and check-out times via the Dayflow Quick Clock or web punch widget.
A 15-minute grace period is granted up to 9:15 AM. Work hours less than 4 hours are classified as Half Day, while full presence requires 8+ hours."""
    },
    {
        "id": "policy_payroll_01",
        "title": "Payroll, Salary Disbursement & Deductions",
        "category": "Payroll & Benefits",
        "text": """Salaries are disbursed monthly on the last business day of each calendar month.
Salary consists of Basic Pay, House Rent Allowance (HRA - 60% of allowances), and Special Allowances (40%).
Standard deductions include Provident Fund (PF), Health Insurance premiums, and Tax Deducted at Source (TDS) calculated per current income tax slabs.
Official PDF Payslips are available in the portal immediately following disbursement."""
    },
    {
        "id": "policy_remote_01",
        "title": "Hybrid & Remote Work Protocols",
        "category": "Workplace Guidelines",
        "text": """Employees on Hybrid schedules are expected in office 2-3 designated days per week.
Remote workers must remain reachable during core collaboration hours (10:00 AM - 4:00 PM).
Work from home requires ensuring stable internet connectivity and adherence to company data privacy standards."""
    },
    {
        "id": "policy_benefits_01",
        "title": "Employee Wellness & Healthcare Benefits",
        "category": "Benefits & Insurance",
        "text": """Comprehensive group health and medical insurance covers employees and immediate dependents up to ₹5,00,000 per year.
Annual health check-ups and confidential mental wellness counseling sessions are provided free of cost through company partner clinics."""
    }
]

def get_chroma_collection():
    global _chroma_client, _collection
    if _collection is not None:
        return _collection

    try:
        # Create persistent or in-memory chroma client
        chroma_path = os.path.join(os.path.dirname(__file__), "..", "chroma_data")
        _chroma_client = chromadb.PersistentClient(path=chroma_path)
        _collection = _chroma_client.get_or_create_collection(
            name="dayflow_hr_knowledge",
            metadata={"description": "Dayflow HRMS Knowledge Base and Policies"}
        )

        # Ingest documents if empty
        if _collection.count() == 0:
            ids = [doc["id"] for doc in KNOWLEDGE_DOCUMENTS]
            documents = [f"{doc['title']}\n{doc['text']}" for doc in KNOWLEDGE_DOCUMENTS]
            metadatas = [
                {"title": doc["title"], "category": doc["category"], "doc_id": doc["id"]}
                for doc in KNOWLEDGE_DOCUMENTS
            ]
            _collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            print(f"[RAGService] Seeded ChromaDB collection with {len(ids)} policy documents.")
        return _collection
    except Exception as e:
        print(f"[RAGService] ChromaDB initialization error: {e}")
        return None

# Pre-initialize collection
get_chroma_collection()


class RAGService:
    @classmethod
    def retrieve_relevant_chunks(cls, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Embeds user query and queries ChromaDB for top-k relevant HR policy chunks.
        Returns: List of dicts with title, category, text, score/distance.
        """
        collection = get_chroma_collection()
        if not collection:
            # Fallback to simple keyword match if ChromaDB fails
            query_lower = query.lower()
            matches = []
            for doc in KNOWLEDGE_DOCUMENTS:
                if any(word in doc["text"].lower() or word in doc["title"].lower() for word in query_lower.split()):
                    matches.append({
                        "title": doc["title"],
                        "category": doc["category"],
                        "text": doc["text"],
                        "source": f"Dayflow HR Policy • {doc['category']}",
                        "score": 0.85
                    })
            return matches[:top_k] or [{
                "title": KNOWLEDGE_DOCUMENTS[0]["title"],
                "category": KNOWLEDGE_DOCUMENTS[0]["category"],
                "text": KNOWLEDGE_DOCUMENTS[0]["text"],
                "source": "Dayflow HR Policy Overview",
                "score": 0.70
            }]

        try:
            results = collection.query(
                query_texts=[query],
                n_results=min(top_k, collection.count())
            )

            chunks = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else []
                distances = results["distances"][0] if results.get("distances") else []

                for i in range(len(docs)):
                    meta = metas[i] if i < len(metas) else {}
                    dist = distances[i] if i < len(distances) else 0.5
                    chunks.append({
                        "title": meta.get("title", "Company Policy"),
                        "category": meta.get("category", "General"),
                        "text": docs[i],
                        "source": f"Dayflow HR • {meta.get('title', 'Policy')}",
                        "score": round(max(0.0, 1.0 - dist), 2)
                    })
            return chunks
        except Exception as e:
            print(f"[RAGService] Retrieval error: {e}")
            return []
